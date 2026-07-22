<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use App\Models\Transaction;
use App\Models\User;

class PayHereWebhookController extends Controller
{
    public function handleWebhook(Request $request)
    {
        $merchantId = $request->merchant_id;
        $orderId = $request->order_id;
        $payhereAmount = $request->payhere_amount;
        $payhereCurrency = $request->payhere_currency;
        $statusCode = $request->status_code;
        $md5sig = $request->md5sig;

        $merchantSecret = SystemSetting::where('key', 'payhere_secret')->value('value');

        if (!$merchantSecret) {
            return response()->json(['error' => 'Merchant secret not set'], 500);
        }

        $localMd5sig = strtoupper(
            md5(
                $merchantId . 
                $orderId . 
                $payhereAmount . 
                $payhereCurrency . 
                $statusCode . 
                strtoupper(md5($merchantSecret))
            )
        );

        if ($localMd5sig !== $md5sig) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $transaction = Transaction::where('transaction_id', $orderId)->first();

        if (!$transaction) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        if ($statusCode == 2) {
            // Success
            $transaction->status = 'Succeeded';
            $transaction->save();

            // Extract plan_id from order_id (SUB_{user_id}_{plan_id}_{timestamp} or SUB-{user_id}-{plan_id}-{timestamp})
            $isUnderscoreFormat = strpos($orderId, '_') !== false;
            $parts = $isUnderscoreFormat ? explode('_', $orderId) : explode('-', $orderId);
          
            $planId = null;
            if ($isUnderscoreFormat && count($parts) >= 4) {
                $planId = $parts[2];
            } else if (!$isUnderscoreFormat && count($parts) >= 12) {
                // Re-assemble the hyphenated UUID segments
                $planId = implode('-', array_slice($parts, 6, 5));
            } else {
                $planId = $parts[2] ?? null;
            }

            if ($planId) {
                $user = User::find($transaction->user_id);
                $plan = \App\Models\Plan::find($planId);

                if ($user && $plan) {
                    $user->plan_id = $plan->id;
                    $user->plan_status = 'active';

                    // Since the user was already given a monetary discount for remaining days, 
                    // the new plan simply starts today.
                    $user->plan_expires_at = now()->addMonths($plan->duration_months);
                    $user->save();
                }
            }
        } elseif ($statusCode < 0) {
            // Failed / Canceled
            $transaction->status = 'Failed';
            $transaction->save();
        }

        return response()->json(['message' => 'OK']);
    }
}
