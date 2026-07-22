<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\PackagePurchasedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * Get all available plans
     */
    public function getPlans()
    {
        $plans = Plan::orderBy('price', 'asc')->get();
        return response()->json($plans);
    }

    /**
     * Get billing status for the authenticated tenant (user)
     */
    public function getStatus(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $response = [];

        // 1. Check for active paid subscription
        $activeSubscription = TenantSubscription::where('tenant_id', $user->id)
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($activeSubscription) {
            $response = [
                'tenant_id' => $user->id,
                'type' => 'paid',
                'plan_name' => $activeSubscription->plan ? $activeSubscription->plan->name : 'Paid Package',
                'plan_price' => $activeSubscription->plan ? $activeSubscription->plan->price : 0,
                'expire_date' => $activeSubscription->ends_at->format('Y-m-d')
            ];
        } else if ($user->trial_ends_at && $user->trial_ends_at > now()) {
            // 2. Check for active trial
            $response = [
                'tenant_id' => $user->id,
                'type' => 'trial',
                'expire_date' => $user->trial_ends_at->format('Y-m-d')
            ];
        } else {
            // 3. Otherwise expired
            $response = [
                'tenant_id' => $user->id,
                'type' => 'expired'
            ];
        }

        // 4. Check for latest bank transfer transaction
        $latestTransaction = \App\Models\Transaction::where('user_id', $user->id)
            ->where('payment_method', 'bank_transfer')
            ->orderBy('created_at', 'desc')
            ->first();
            
        if ($latestTransaction && in_array($latestTransaction->status, ['pending', 'failed'])) {
            $response['transaction_status'] = $latestTransaction->status === 'failed' ? 'rejected' : $latestTransaction->status;
        }

        return response()->json($response);
    }

    public function generatePayHereHash(Request $request)
    {
        $request->validate([
            'order_id' => 'required',
            'amount' => 'required|numeric',
            'currency' => 'required|string',
            // We need to know which plan they are buying to do the math, 
            // but the frontend currently only sends order_id, amount, currency.
            // Let's assume the frontend will send 'plan_id' too. Wait, if it doesn't,
            // we can look up the plan by the amount.
        ]);

        $merchantId = \App\Models\SystemSetting::where('key', 'payhere_merchant_id')->value('value') ?: env('PAYHERE_MERCHANT_ID');
        $merchantSecret = \App\Models\SystemSetting::where('key', 'payhere_secret')->value('value') ?: env('PAYHERE_SECRET');
        $payhereEnv = \App\Models\SystemSetting::where('key', 'payhere_env')->value('value') ?: 'sandbox';

        if (!$merchantId || !$merchantSecret) {
            return response()->json(['error' => 'PayHere credentials not configured'], 500);
        }

        $user = auth('api')->user();
        $orderId = $request->order_id;
        $newPlanPrice = (float) $request->amount;
        $currency = $request->currency;

        // --- PRORATION LOGIC ---
        $discountAmount = 0;
        $remainingDays = 0;
        
        if ($user && $user->plan_status === 'active' && $user->plan_expires_at) {
            $endsAt = \Carbon\Carbon::parse($user->plan_expires_at);
            
            if ($endsAt->isFuture()) {
                $remainingDays = now()->diffInDays($endsAt);
                
                // Get the old plan
                $oldPlan = $user->plan; // Assuming relation exists
                if ($oldPlan) {
                    $oldPlanPrice = $oldPlan->price;
                    $oldPlanDuration = $oldPlan->duration_months ?: 1;
                    // Standardize month to 30 days
                    $perDayValue = $oldPlanPrice / ($oldPlanDuration * 30);
                    $discountAmount = $remainingDays * $perDayValue;
                    // Ensure discount does not exceed the total price of the old plan
                    $discountAmount = min($discountAmount, $oldPlanPrice);
                    $discountAmount = round($discountAmount);
                }
            }
        }

        $amountToPay = $newPlanPrice - $discountAmount;
        $amountToPay = max(0, $amountToPay);

        $amount = number_format($amountToPay, 2, '.', '');

        $merchantSecret = trim($merchantSecret);
        $merchantId = trim($merchantId);

        $hashedSecret = strtoupper(md5($merchantSecret));
        $hash = strtoupper(md5($merchantId . $orderId . $amount . $currency . $hashedSecret));

        \Illuminate\Support\Facades\Log::info("PayHere Hash Generation (Prorated):", [
            'merchant_id' => $merchantId,
            'order_id' => $orderId,
            'original_amount' => $newPlanPrice,
            'discount' => $discountAmount,
            'final_amount' => $amount,
            'currency' => $currency,
            'secret' => $merchantSecret,
            'generated_hash' => $hash
        ]);

        $notifyUrl = env('PAYHERE_NOTIFY_URL') ?: (env('APP_URL', 'http://127.0.0.1:8000') . '/api/billing/payhere/webhook');

        // Create a Pending Transaction for this attempt
        \App\Models\Transaction::create([
            'user_id' => $user->id,
            'transaction_id' => $orderId,
            'amount' => $amountToPay,
            'status' => 'Pending',
            'date' => now(),
        ]);

        return response()->json([
            'hash' => $hash,
            'merchant_id' => $merchantId,
            'formatted_amount' => $amount, // Final payable
            'original_price' => $newPlanPrice,
            'discount' => $discountAmount,
            'env' => $payhereEnv,
            'notify_url' => $notifyUrl
        ]);
    }

    /**
     * Handle PayHere Webhook Callback
     */
    public function payhereWebhook(Request $request)
    {
        $merchantId = $request->input('merchant_id');
        $orderId = $request->input('order_id');
        $payhereAmount = $request->input('payhere_amount');
        $payhereCurrency = $request->input('payhere_currency');
        $statusCode = $request->input('status_code');
        $md5sig = $request->input('md5sig');

        $merchantSecret = trim(\App\Models\SystemSetting::where('key', 'payhere_secret')->value('value') ?: env('PAYHERE_SECRET'));
        $hashedSecret = strtoupper(md5($merchantSecret));
        
        $localMd5sig = strtoupper(md5($merchantId . $orderId . $payhereAmount . $payhereCurrency . $statusCode . $hashedSecret));

        if ($localMd5sig === $md5sig && $statusCode == 2) {
            // Payment success!
            // order_id format: SUB_{tenant_id}_{plan_id}_{timestamp} OR SUB-{tenant_id}-{plan_id}-{timestamp}
            
            $isUnderscoreFormat = strpos($orderId, '_') !== false;
            $parts = $isUnderscoreFormat ? explode('_', $orderId) : explode('-', $orderId);
            
            if (count($parts) >= 3) {
                $transaction = \App\Models\Transaction::where('transaction_id', $orderId)->first();
                
                $tenantId = null;
                $planId = null;

                if ($isUnderscoreFormat && count($parts) >= 4) {
                    // format: SUB_{tenant_id}_{plan_id}_{timestamp}
                    $tenantId = $parts[1];
                    $planId = $parts[2];
                } else if (!$isUnderscoreFormat && count($parts) >= 12) {
                    // Fallback for hyphens with UUIDs
                    $tenantId = implode('-', array_slice($parts, 1, 5));
                    $planId = implode('-', array_slice($parts, 6, 5));
                } else {
                    // Old hyphen format without UUIDs?
                    $tenantId = $parts[1];
                    $planId = $parts[2];
                }
                
                $plan = Plan::find($planId);

                if ($transaction) {
                    $transaction->status = 'Succeeded';
                    $transaction->save();
                    
                    if (!$tenantId) {
                        $tenantId = $transaction->user_id;
                    }
                    if (!$plan) {
                        // Fallback: try to guess by price if planId wasn't parsed properly
                        // (Only works if no proration discount was applied, but better than nothing)
                        $plan = Plan::where('price', $transaction->amount)->first();
                    }
                }

                if ($tenantId && $plan) {
                    $duration = $plan->duration_months ?? 1;
                    
                    // Mark any old active subscriptions as upgraded
                    TenantSubscription::where('tenant_id', $tenantId)
                        ->where('status', 'active')
                        ->update(['status' => 'upgraded']);

                    TenantSubscription::create([
                        'tenant_id' => $tenantId,
                        'plan_id' => $plan->id,
                        'status' => 'active',
                        'ends_at' => now()->addMonths($duration)
                    ]);
                    
                    // Update User table plan fields
                    $user = User::find($tenantId);
                    if ($user) {
                        $user->plan_id = $plan->id;
                        $user->plan_status = 'active';
                        $user->plan_expires_at = now()->addMonths($duration);
                        $user->save();

                        // Send Email
                        $this->sendPackagePurchasedEmail($user, $plan, $user->plan_expires_at);
                    }
                    
                    Log::info("PayHere webhook: Successfully subscribed user $tenantId to plan {$plan->id}.");
                } else {
                    Log::error("PayHere webhook error: Could not resolve tenant or plan from orderId: $orderId");
                }
            }
            
            return response()->json(['status' => 'success']);
        }
        
        Log::error("PayHere webhook failed. Local MD5: $localMd5sig, Received MD5: $md5sig, Status: $statusCode");
        return response()->json(['status' => 'error'], 400);
    }

    /**
     * Send package purchased email using default SMTP settings (.env)
     */
    protected function sendPackagePurchasedEmail($user, $plan, $expiresAt)
    {
        try {
            Mail::to($user->email)->send(new PackagePurchasedMail($user, $plan, $expiresAt));
            Log::info("Purchase email sent to {$user->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send purchase email to {$user->email}: " . $e->getMessage());
        }
    }

    /**
     * Simulate PayHere Webhook (For Local Development Only)
     */
    public function simulatePayhereWebhook(Request $request)
    {
        if (env('APP_ENV') !== 'local') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $orderId = $request->input('order_id');
        
        $isUnderscoreFormat = strpos($orderId, '_') !== false;
        $parts = $isUnderscoreFormat ? explode('_', $orderId) : explode('-', $orderId);
        
        if (count($parts) >= 3) {
            $transaction = \App\Models\Transaction::where('transaction_id', $orderId)->first();
            
            $tenantId = null;
            $planId = null;

            if ($isUnderscoreFormat && count($parts) >= 4) {
                $tenantId = $parts[1];
                $planId = $parts[2];
            } else if (!$isUnderscoreFormat && count($parts) >= 12) {
                $tenantId = implode('-', array_slice($parts, 1, 5));
                $planId = implode('-', array_slice($parts, 6, 5));
            } else {
                $tenantId = $parts[1];
                $planId = $parts[2];
            }
            
            $plan = \App\Models\Plan::find($planId);

            if ($transaction) {
                $transaction->status = 'Succeeded';
                $transaction->save();
                
                if (!$tenantId) {
                    $tenantId = $transaction->user_id;
                }
                if (!$plan) {
                    $plan = \App\Models\Plan::where('price', $transaction->amount)->first();
                }
            }

            if ($tenantId && $plan) {
                $duration = $plan->duration_months ?? 1;
                
                \App\Models\TenantSubscription::where('tenant_id', $tenantId)
                    ->where('status', 'active')
                    ->update(['status' => 'upgraded']);

                \App\Models\TenantSubscription::create([
                    'tenant_id' => $tenantId,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'ends_at' => now()->addMonths($duration)
                ]);
                
                $user = \App\Models\User::find($tenantId);
                if ($user) {
                    $user->plan_id = $plan->id;
                    $user->plan_status = 'active';
                    $user->plan_expires_at = now()->addMonths($duration);
                    $user->save();
                }
            }
        }
        
        return response()->json(['status' => 'simulated']);
    }
}
