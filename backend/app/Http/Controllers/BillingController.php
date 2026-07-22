<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Auth;
use App\Models\Transaction;
use App\Models\Plan;

class BillingController extends Controller
{
    public function generatePayhereCheckout(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|string',
        ]);

        $user = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        $merchantId = SystemSetting::where('key', 'payhere_merchant_id')->value('value');
        $merchantSecret = SystemSetting::where('key', 'payhere_secret')->value('value');
        $env = SystemSetting::where('key', 'payhere_env')->value('value') ?: 'sandbox';

        if (!$merchantId || !$merchantSecret) {
            return response()->json(['error' => 'PayHere credentials not configured.'], 400);
        }

        // format: SUB-{user_id}-{plan_id}-{timestamp}
        $orderId = 'SUB-' . $user->id . '-' . $plan->id . '-' . time();
        $amount = number_format($plan->price, 2, '.', '');
        $currency = 'LKR';

        // MD5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret)))
        $hash = strtoupper(
            md5(
                $merchantId . 
                $orderId . 
                $amount . 
                $currency . 
                strtoupper(md5($merchantSecret))
            )
        );

        Transaction::create([
            'user_id' => $user->id,
            'transaction_id' => $orderId,
            'amount' => $plan->price,
            'status' => 'Pending',
            'date' => now(),
        ]);

        return response()->json([
            'merchant_id' => $merchantId,
            'return_url' => env('FRONTEND_URL', 'http://localhost:3000') . '/dashboard/billing?status=success',
            'cancel_url' => env('FRONTEND_URL', 'http://localhost:3000') . '/dashboard/billing?status=cancel',
            'notify_url' => env('APP_URL', 'http://localhost:8000') . '/api/payhere/webhook',
            'order_id' => $orderId,
            'items' => $plan->name . ' Subscription',
            'currency' => $currency,
            'amount' => $amount,
            'first_name' => $user->name ?: 'Customer',
            'last_name' => 'Name',
            'email' => $user->email,
            'phone' => '0770000000',
            'address' => 'No Address',
            'city' => 'Colombo',
            'country' => 'Sri Lanka',
            'hash' => $hash,
            'env' => $env
        ]);
    }

    public function simulatePayment(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|string',
        ]);

        $user = Auth::user();
        $plan = Plan::findOrFail($request->plan_id);

        $user->plan_id = $plan->id;
        $user->plan_status = 'active';

        $currentExpiry = ($user->plan_expires_at && $user->plan_expires_at > now()) 
            ? \Carbon\Carbon::parse($user->plan_expires_at) 
            : now();
        
        $user->plan_expires_at = $currentExpiry->addMonths($plan->duration_months);
        $user->save();
        
        \App\Models\TenantSubscription::create([
            'tenant_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'ends_at' => $user->plan_expires_at
        ]);

        \App\Models\Transaction::create([
            'user_id' => $user->id,
            'transaction_id' => 'SIM-' . $user->id . '-' . $plan->id . '-' . time(),
            'amount' => $plan->price,
            'status' => 'Succeeded',
            'date' => now(),
        ]);

        return response()->json(['message' => 'Simulated successfully']);
    }
}
