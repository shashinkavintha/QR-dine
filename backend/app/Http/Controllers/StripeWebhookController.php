<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierController;

class StripeWebhookController extends CashierController
{
    /**
     * Handle customer subscription trial will end.
     *
     * @param  array  $payload
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function handleCustomerSubscriptionTrialWillEnd(array $payload)
    {
        $user = $this->getUserByStripeId($payload['data']['object']['customer']);

        if ($user) {
            // Log that we should send an email. 
            // In a real application, you would dispatch a notification or Mailable here.
            Log::info("Trial ending soon for user: {$user->email}. Sending alert email.");
            
            // Example:
            // Mail::to($user->email)->send(new TrialEndingSoonMail($user));
        }

        return $this->successMethod();
    }

    /**
     * Handle a failed payment from a Stripe invoice.
     *
     * @param  array  $payload
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function handleInvoicePaymentFailed(array $payload)
    {
        $user = $this->getUserByStripeId($payload['data']['object']['customer']);

        if ($user) {
            Log::warning("Payment failed for user: {$user->email}. System will auto-block/update status.");
            
            // Cashier auto-updates the subscription status to 'past_due' or 'canceled',
            // which you can check on the frontend/middleware using $user->subscription()->active()
        }

        return parent::handleInvoicePaymentFailed($payload);
    }
}
