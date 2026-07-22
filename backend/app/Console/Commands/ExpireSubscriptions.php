<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:expire-subscriptions')]
#[Description('Checks for expired subscriptions and updates their status.')]
class ExpireSubscriptions extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiredCount = \App\Models\TenantSubscription::where('status', 'active')
            ->where('ends_at', '<', now())
            ->update(['status' => 'expired']);

        $this->info("Expired {$expiredCount} subscriptions.");
        
        // Also update the Users table plan_status if we are using it
        $usersExpired = \App\Models\User::where('plan_status', 'active')
            ->where('plan_expires_at', '<', now())
            ->update(['plan_status' => 'expired']);
            
        $this->info("Expired {$usersExpired} users.");
    }
}
