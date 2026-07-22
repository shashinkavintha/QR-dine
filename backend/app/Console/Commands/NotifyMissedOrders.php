<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:notify-missed-orders')]
#[Description('Command description')]
class NotifyMissedOrders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
