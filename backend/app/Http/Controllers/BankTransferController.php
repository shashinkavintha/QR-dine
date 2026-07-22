<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Mail\BankTransferUploaded;
use App\Mail\BankTransferStatusChanged;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Models\TenantSubscription;

class BankTransferController extends Controller
{
    // Tenant: Upload Bank Slip
    public function uploadSlip(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'slip' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120', // 5MB max
        ]);

        $user = $request->user();
        $plan = Plan::findOrFail($request->plan_id);

        if ($request->hasFile('slip')) {
            $path = $request->file('slip')->store('bank_slips', config('filesystems.default'));
            
            // Calculate prorated amount
            $discountAmount = 0;
            if ($user && $user->plan_status === 'active' && $user->plan_expires_at) {
                $endsAt = \Carbon\Carbon::parse($user->plan_expires_at);
                if ($endsAt->isFuture()) {
                    $remainingDays = now()->diffInDays($endsAt);
                    $oldPlan = $user->plan;
                    if ($oldPlan) {
                        $oldPlanPrice = $oldPlan->price;
                        $oldPlanDuration = $oldPlan->duration_months ?: 1;
                        $perDayValue = $oldPlanPrice / ($oldPlanDuration * 30);
                        $discountAmount = $remainingDays * $perDayValue;
                        $discountAmount = min($discountAmount, $oldPlanPrice);
                        $discountAmount = round($discountAmount);
                    }
                }
            }
            $amountToPay = max(0, $plan->price - $discountAmount);

            // Create pending transaction
            $transaction = Transaction::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'transaction_id' => 'BT-' . strtoupper(Str::random(10)),
                'amount' => number_format($amountToPay, 2, '.', ''),
                'status' => 'pending',
                'date' => now()->toDateString(),
                'payment_method' => 'bank_transfer',
                'payment_slip_path' => $path,
                'plan_id' => $plan->id,
            ]);

            // Try to notify Super Admin
            try {
                $superAdmin = User::where('role', 'super_admin')->first();
                if ($superAdmin) {
                    Mail::to($superAdmin->email)->send(new BankTransferUploaded($transaction));
                }
            } catch (\Exception $e) {
                // Ignore email errors for now so it doesn't block the upload
            }

            return response()->json([
                'success' => true,
                'message' => 'Bank slip uploaded successfully. Please wait for admin approval.',
                'transaction' => $transaction
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Slip upload failed.'], 400);
    }

    // Super Admin: Get Pending Transfers
    public function getPendingTransfers()
    {
        $transactions = Transaction::with('user')
            ->where('payment_method', 'bank_transfer')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['transactions' => $transactions]);
    }

    // Super Admin: Approve Transfer
    public function approveTransfer($id)
    {
        $transaction = Transaction::findOrFail($id);
        
        if ($transaction->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaction is not pending.'], 400);
        }

        DB::beginTransaction();
        try {
            $transaction->status = 'completed';
            $transaction->save();

            $plan = Plan::find($transaction->plan_id);
            if ($plan) {
                $duration = $plan->duration_months ?? 1;
                $endsAt = now()->addMonths($duration);

                // Mark any old active subscriptions as upgraded
                TenantSubscription::where('tenant_id', $transaction->user_id)
                    ->where('status', 'active')
                    ->update(['status' => 'upgraded']);

                // Create new subscription record
                TenantSubscription::create([
                    'tenant_id' => $transaction->user_id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'ends_at' => $endsAt
                ]);

                // Update User table plan fields
                $user = User::find($transaction->user_id);
                if ($user) {
                    $user->plan_id = $plan->id;
                    $user->plan_status = 'active';
                    $user->plan_expires_at = $endsAt;
                    $user->save();
                }
            }

            DB::commit();

            // Notify User
            try {
                Mail::to($transaction->user->email)->send(new BankTransferStatusChanged($transaction));
            } catch (\Exception $e) {
                // Ignore email errors
            }

            return response()->json(['success' => true, 'message' => 'Transfer approved and subscription activated.']);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error approving transfer: ' . $e->getMessage()], 500);
        }
    }

    // Super Admin: Reject Transfer
    public function rejectTransfer($id)
    {
        $transaction = Transaction::findOrFail($id);
        
        if ($transaction->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Transaction is not pending.'], 400);
        }

        $transaction->status = 'failed';
        $transaction->save();

        // Notify User
        try {
            Mail::to($transaction->user->email)->send(new BankTransferStatusChanged($transaction));
        } catch (\Exception $e) {
            // Ignore email errors
        }

        return response()->json(['success' => true, 'message' => 'Transfer rejected.']);
    }
}
