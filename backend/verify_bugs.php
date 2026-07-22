<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "===============================================\n";
echo "QR Dine Bug Verification Script\n";
echo "===============================================\n\n";

// --- TEST 1: delete-account crash ---
echo "--- TEST 1: delete-account crash ---\n";
try {
    $user = \App\Models\User::where('email', 'test@example.com')->first();
    if (!$user) {
        echo "Creating test user...\n";
        $user = \App\Models\User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'tenant',
            'is_active' => 1,
            'is_suspended' => 0,
        ]);
    }
    
    // Log in programmatically to get token
    $token = auth('api')->login($user);
    echo "Logged in test user. Token: " . substr($token, 0, 20) . "...\n";

    // Call DELETE /api/user/profile/delete-account
    $request = Illuminate\Http\Request::create('/api/user/profile/delete-account', 'DELETE');
    $request->headers->set('Authorization', 'Bearer ' . $token);
    $response = $kernel->handle($request);

    echo "Status: " . $response->status() . "\n";
    echo "Response: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception caught during account deletion:\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
echo "\n";

// --- TEST 2: PayHere Webhook resolution logic error ---
echo "--- TEST 2: PayHere Webhook resolution logic ---\n";
try {
    $merchantId = '1234672';
    $orderId = 'SUB-019f4575-ed7a-70f2-a5af-b3cacade9686-2-1783577333766'; // UUID hyphenated order ID
    $payhereAmount = '8700.00';
    $payhereCurrency = 'LKR';
    $statusCode = '2';

    $merchantSecret = \App\Models\SystemSetting::where('key', 'payhere_secret')->value('value');
    if (!$merchantSecret) {
        echo "Error: payhere_secret not found in system settings!\n";
    } else {
        $hashedSecret = strtoupper(md5($merchantSecret));
        $md5sig = strtoupper(md5($merchantId . $orderId . $payhereAmount . $payhereCurrency . $statusCode . $hashedSecret));

        // Create transaction first
        \App\Models\Transaction::where('transaction_id', $orderId)->delete();
        \App\Models\Transaction::create([
            'user_id' => 12, // test user ID or similar
            'transaction_id' => $orderId,
            'amount' => 8700.00,
            'status' => 'Pending',
            'date' => now(),
        ]);

        // Call webhook route
        $request = Illuminate\Http\Request::create('/api/payhere/webhook', 'POST', [
            'merchant_id' => $merchantId,
            'order_id' => $orderId,
            'payhere_amount' => $payhereAmount,
            'payhere_currency' => $payhereCurrency,
            'status_code' => $statusCode,
            'md5sig' => $md5sig
        ]);
        $response = $kernel->handle($request);

        echo "Status: " . $response->status() . "\n";
        echo "Response: " . $response->getContent() . "\n";

        // Check if plan of user 12 was updated (it should NOT be, since plan_id couldn't be resolved)
        $user = \App\Models\User::find(12);
        echo "User 12 plan_id after webhook: " . ($user->plan_id ?? 'NULL (Failed to resolve)') . "\n";
    }
} catch (\Exception $e) {
    echo "Exception caught during webhook test:\n";
    echo $e->getMessage() . "\n";
}
echo "\n";

// --- TEST 3: Public order placement bypass ---
echo "--- TEST 3: Public order placement bypass ---\n";
try {
    // 1. Suspend tenant 4
    $tenant = \App\Models\User::find(4);
    if ($tenant) {
        $tenant->is_suspended = 1;
        $tenant->save();
        echo "Suspended tenant 4 (is_suspended = " . $tenant->is_suspended . ")\n";

        // 2. Call public order placement
        $request = Illuminate\Http\Request::create('/api/public/orders', 'POST', [
            'tenant_id' => 4,
            'items' => [
                [
                    'menu_item_id' => 22,
                    'quantity' => 1
                ]
            ]
        ]);
        $response = $kernel->handle($request);

        echo "Status: " . $response->status() . "\n";
        echo "Response: " . $response->getContent() . "\n";

        // 3. Unsuspend tenant 4 (restore state)
        $tenant->is_suspended = 0;
        $tenant->save();
        echo "Restored tenant 4 (is_suspended = " . $tenant->is_suspended . ")\n";
    } else {
        echo "Error: Tenant 4 not found!\n";
    }
} catch (\Exception $e) {
    echo "Exception caught during order placement test:\n";
    echo $e->getMessage() . "\n";
}
echo "\n";
