<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\TenantDashboardController;

// Public routes for auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('throttle:3,1')->post('/forgot-password/send-otp', [\App\Http\Controllers\ForgotPasswordController::class, 'sendOtp']);
Route::post('/forgot-password/reset', [\App\Http\Controllers\ForgotPasswordController::class, 'resetPassword']);

// Google OAuth routes
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// Broadcasting routes (for Private Channels)
\Illuminate\Support\Facades\Broadcast::routes(['middleware' => ['auth:api']]);

// Protected routes (Tenant Admin)
Route::middleware(['auth:api', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        if ($user->role === 'staff') {
            $user->load('roles.permissions');
        }
        return $user;
    });
    
    // Profile Management
    Route::get('/user/profile', [\App\Http\Controllers\ProfileController::class, 'getProfile']);
    Route::post('/user/profile/personal', [\App\Http\Controllers\ProfileController::class, 'updatePersonal']);
    Route::post('/user/profile/hotel', [\App\Http\Controllers\ProfileController::class, 'updateHotel']);
    Route::post('/user/profile/security/otp', [\App\Http\Controllers\ProfileController::class, 'requestSecurityOtp']);
    Route::post('/user/profile/security/verify', [\App\Http\Controllers\ProfileController::class, 'verifySecurityOtp']);
    Route::delete('/user/profile/delete-account', [\App\Http\Controllers\ProfileController::class, 'deleteAccount']);

    Route::post('/tenant/onboarding', [OnboardingController::class, 'completeOnboarding']);
    
    // Dashboard Settings
    Route::get('/tenant/settings', [TenantDashboardController::class, 'getSettings']);
    Route::post('/tenant/settings', [TenantDashboardController::class, 'updateSettings']);
    
    // Dashboard Menu CRUD
    Route::get('/tenant/menu', [TenantDashboardController::class, 'getMenu'])->middleware('permission:manage_menu');
    Route::post('/tenant/menu/categories', [TenantDashboardController::class, 'addCategory'])->middleware('permission:manage_menu');
    Route::put('/tenant/menu/categories/{id}', [TenantDashboardController::class, 'updateCategory'])->middleware('permission:manage_menu');
    Route::delete('/tenant/menu/categories/{id}', [TenantDashboardController::class, 'deleteCategory'])->middleware('permission:manage_menu');
    Route::post('/tenant/menu/items', [TenantDashboardController::class, 'addMenuItem'])->middleware('feature:menu_items', 'permission:manage_menu');
    Route::put('/tenant/menu/items/{id}', [TenantDashboardController::class, 'updateMenuItem'])->middleware('permission:manage_menu');
    Route::delete('/tenant/menu/items/{id}', [TenantDashboardController::class, 'deleteMenuItem'])->middleware('permission:manage_menu');
});

use App\Http\Controllers\SuperAdminController;

// Protected routes (Super Admin)
Route::middleware(['auth:api', \App\Http\Middleware\SuperAdminMiddleware::class])->prefix('super-admin')->group(function () {
    
    // Overview Data
    Route::get('/overview', [SuperAdminController::class, 'getOverview']);

    // Tenants Management
    Route::get('/tenants', [SuperAdminController::class, 'getTenants']);
    Route::post('/tenants', [\App\Http\Controllers\SuperAdminController::class, 'addTenant']);
    Route::put('/tenants/{id}', [\App\Http\Controllers\SuperAdminController::class, 'editTenant']);
    Route::post('/tenants/{id}/extend-trial', [\App\Http\Controllers\SuperAdminController::class, 'extendTrial']);
    Route::post('/tenants/{id}/suspend', [\App\Http\Controllers\SuperAdminController::class, 'toggleSuspendTenant']);
    Route::delete('/tenants/{id}', [\App\Http\Controllers\SuperAdminController::class, 'deleteTenant']);
    
    // Users (Staff) Management
    Route::get('/users', [SuperAdminController::class, 'getUsers']);
    Route::post('/users', [SuperAdminController::class, 'addUser']);
    Route::delete('/users/{id}', [SuperAdminController::class, 'deleteUser']);

    // Settings
    Route::get('/settings', [SuperAdminController::class, 'getSettings']);
    Route::post('/settings', [SuperAdminController::class, 'updateSettings']);

    // Billing & Plans
    Route::get('/plans', [SuperAdminController::class, 'getPlans']);
    Route::put('/plans/{id}', [SuperAdminController::class, 'updatePlan']);
    Route::get('/transactions', [SuperAdminController::class, 'getTransactions']);
    
    // Bank Transfers
    Route::get('/bank-transfers/pending', [\App\Http\Controllers\BankTransferController::class, 'getPendingTransfers']);
    Route::post('/bank-transfers/{id}/approve', [\App\Http\Controllers\BankTransferController::class, 'approveTransfer']);
    Route::post('/bank-transfers/{id}/reject', [\App\Http\Controllers\BankTransferController::class, 'rejectTransfer']);
});

Route::get('/system-settings/public', function () {
    $keys = ['enable_bank_transfer', 'bank_name', 'bank_account_name', 'bank_account_number', 'bank_branch', 'enable_payhere', 'hero_bg_image'];
    $settings = \App\Models\SystemSetting::whereIn('key', $keys)->pluck('value', 'key');
    return response()->json($settings);
});

// -----------------------------------------------------
// Tenant Dashboard API (For Hotel Owners)
// -----------------------------------------------------
Route::middleware(['auth:api', \App\Http\Middleware\TenantMiddleware::class, \App\Http\Middleware\CheckSubscription::class])->prefix('tenant')->group(function () {
    
    // Settings & Branding
    Route::get('/settings', [\App\Http\Controllers\TenantDashboardController::class, 'getSettings']);
    Route::post('/settings', [\App\Http\Controllers\TenantDashboardController::class, 'updateSettings']);
    Route::put('/settings', [\App\Http\Controllers\TenantDashboardController::class, 'updateSettings']);
    
    // Billing & Subscriptions
    Route::post('/subscriptions/bank-transfer', [\App\Http\Controllers\BankTransferController::class, 'uploadSlip']);
    
    // Menu Management
    Route::get('/menu', [\App\Http\Controllers\TenantDashboardController::class, 'getMenu']);
    Route::post('/category', [\App\Http\Controllers\TenantDashboardController::class, 'addCategory']);
    Route::post('/menu-item', [\App\Http\Controllers\TenantDashboardController::class, 'addMenuItem'])->middleware('feature:menu_items');
    
    // Orders
    Route::get('/orders', [\App\Http\Controllers\Tenant\OrderController::class, 'index'])->middleware('permission:view_orders');
    Route::put('/orders/{id}/status', [\App\Http\Controllers\Tenant\OrderController::class, 'updateStatus'])->middleware('permission:view_orders');
    Route::post('/orders/{id}/print', [\App\Http\Controllers\Tenant\OrderController::class, 'printOrder'])->middleware('permission:view_orders');
    
    // Staff & Roles
    Route::get('/roles', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'getRoles'])->middleware('permission:manage_staff');
    Route::post('/roles', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'createRole'])->middleware('permission:manage_staff');
    Route::put('/roles/{id}', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'updateRole'])->middleware('permission:manage_staff');
    Route::delete('/roles/{id}', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'deleteRole'])->middleware('permission:manage_staff');
    Route::get('/permissions', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'getPermissions'])->middleware('permission:manage_staff');
    Route::post('/staff/invite', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'createStaff'])->middleware('permission:manage_staff');
    Route::get('/staff', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'getStaff'])->middleware('permission:manage_staff');
    Route::post('/staff/{id}/toggle-status', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'toggleStaffStatus'])->middleware('permission:manage_staff');
    Route::delete('/staff/{id}', [\App\Http\Controllers\Tenant\StaffRoleController::class, 'deleteStaff'])->middleware('permission:manage_staff');
    
    // Audit Logs
    Route::get('/audit-logs', [\App\Http\Controllers\Tenant\AuditLogController::class, 'index'])->middleware('permission:view_analytics');
    
    // Menu Trash
    Route::get('/menu/categories/trashed', [\App\Http\Controllers\TenantDashboardController::class, 'getTrashedMenuCategories'])->middleware('permission:manage_menu');
    Route::post('/menu/categories/{id}/restore', [\App\Http\Controllers\TenantDashboardController::class, 'restoreMenuCategory'])->middleware('permission:manage_menu');
    Route::delete('/menu/categories/{id}/force', [\App\Http\Controllers\TenantDashboardController::class, 'forceDeleteMenuCategory'])->middleware('permission:manage_menu');
    Route::get('/menu/items/trashed', [\App\Http\Controllers\TenantDashboardController::class, 'getTrashedMenuItems'])->middleware('permission:manage_menu');
    Route::post('/menu/items/{id}/restore', [\App\Http\Controllers\TenantDashboardController::class, 'restoreMenuItem'])->middleware('permission:manage_menu');
    Route::delete('/menu/items/{id}/force', [\App\Http\Controllers\TenantDashboardController::class, 'forceDeleteMenuItem'])->middleware('permission:manage_menu');

    // Tables & QRs
    Route::get('/tables', [\App\Http\Controllers\Tenant\TableQrController::class, 'index'])->middleware('permission:manage_settings');
    Route::post('/tables', [\App\Http\Controllers\Tenant\TableQrController::class, 'store'])->middleware('permission:manage_settings');
    Route::delete('/tables/{id}', [\App\Http\Controllers\Tenant\TableQrController::class, 'destroy'])->middleware('permission:manage_settings');
    Route::get('/tables/{id}/qr', [\App\Http\Controllers\Tenant\TableQrController::class, 'generateQr'])->middleware('permission:manage_settings');

    // Orders (Duplicated in original code, ignoring the duplicate)
    Route::get('/orders-duplicate', [\App\Http\Controllers\Tenant\OrderController::class, 'index'])->middleware('permission:view_orders');
    Route::put('/orders-duplicate/{id}/status', [\App\Http\Controllers\Tenant\OrderController::class, 'updateStatus'])->middleware('permission:view_orders');
    
    // Analytics
    Route::get('/analytics/dashboard', [\App\Http\Controllers\AnalyticsController::class, 'getDashboardStats'])->middleware('permission:view_analytics');

    // Waiter Requests
    Route::get('/waiter-requests', [\App\Http\Controllers\TenantWaiterRequestController::class, 'index']);
    Route::put('/waiter-requests/{id}/complete', [\App\Http\Controllers\TenantWaiterRequestController::class, 'complete']);
    Route::post('/waiter-requests/{id}/complete', [\App\Http\Controllers\TenantWaiterRequestController::class, 'complete']);
    Route::put('/waiter-requests/{id}/resolve', [\App\Http\Controllers\TenantWaiterRequestController::class, 'complete']);
    Route::post('/waiter-requests/{id}/resolve', [\App\Http\Controllers\TenantWaiterRequestController::class, 'complete']);

    // Reviews
    Route::get('/reviews', [\App\Http\Controllers\TenantReviewController::class, 'index'])->middleware('permission:manage_reviews');
    Route::get('/reviews/complaints', [\App\Http\Controllers\TenantReviewController::class, 'index'])->middleware('permission:manage_reviews');
    Route::put('/reviews/{id}/read', [\App\Http\Controllers\TenantReviewController::class, 'markAsRead'])->middleware('permission:manage_reviews');
    Route::post('/reviews/{id}/read', [\App\Http\Controllers\TenantReviewController::class, 'markAsRead'])->middleware('permission:manage_reviews');
    Route::post('/reviews/complaints/{id}/read', [\App\Http\Controllers\TenantReviewController::class, 'markAsRead'])->middleware('permission:manage_reviews');
    Route::put('/reviews/complaints/{id}/read', [\App\Http\Controllers\TenantReviewController::class, 'markAsRead'])->middleware('permission:manage_reviews');

    // Upsell Rules
    Route::get('/upsell-rules', [\App\Http\Controllers\TenantUpsellRuleController::class, 'index'])->middleware('permission:manage_upsells');
    Route::post('/upsell-rules', [\App\Http\Controllers\TenantUpsellRuleController::class, 'store'])->middleware('permission:manage_upsells');
    Route::delete('/upsell-rules/{id}', [\App\Http\Controllers\TenantUpsellRuleController::class, 'destroy'])->middleware('permission:manage_upsells');
});

// -----------------------------------------------------
// Public API (For Customers Scanning QR Codes)
// -----------------------------------------------------
Route::get('/public/settings', [\App\Http\Controllers\PublicController::class, 'getSettings']);
Route::get('/menu/{slug}', [\App\Http\Controllers\PublicMenuController::class, 'getMenuBySlug'])->middleware('throttle:60,1');
Route::get('/r/{hash}', [\App\Http\Controllers\PublicController::class, 'resolveQr'])->middleware('throttle:60,1');
Route::post('/public/orders', [\App\Http\Controllers\PublicController::class, 'placeOrder']);
Route::get('/public/orders/{id}', [\App\Http\Controllers\PublicController::class, 'getOrderStatus']);

// Milestone 2 Public Routes
Route::post('/public/waiter-requests', [\App\Http\Controllers\PublicWaiterRequestController::class, 'store']);
Route::post('/public/translate', [\App\Http\Controllers\PublicTranslationController::class, 'translate']);
Route::post('/public/reviews', [\App\Http\Controllers\PublicReviewController::class, 'store']);
Route::get('/public/upsell', [\App\Http\Controllers\PublicUpsellController::class, 'index']);
Route::get('/public/upsell-suggestions', [\App\Http\Controllers\PublicUpsellController::class, 'index']);

Route::get('/plans', [\App\Http\Controllers\SubscriptionController::class, 'getPlans']);

// PayHere Webhooks
Route::post('/billing/payhere/webhook', [\App\Http\Controllers\SubscriptionController::class, 'payhereWebhook']);
Route::post('/payhere/webhook', [\App\Http\Controllers\PayHereWebhookController::class, 'handleWebhook']);
Route::post('/billing/payhere/simulate-webhook', [\App\Http\Controllers\SubscriptionController::class, 'simulatePayhereWebhook']);

// Super Admin updating plans
Route::middleware(['auth:api', \App\Http\Middleware\SuperAdminMiddleware::class])->prefix('super-admin')->group(function () {
    Route::put('/plans/{id}', [\App\Http\Controllers\PlanController::class, 'update']);
});

Route::middleware(['auth:api', \App\Http\Middleware\TenantMiddleware::class, \App\Http\Middleware\CheckSubscription::class])->prefix('tenant')->group(function () {
    Route::post('/billing/payhere-checkout', [\App\Http\Controllers\BillingController::class, 'generatePayhereCheckout']);
    Route::post('/billing/simulate-payment', [\App\Http\Controllers\BillingController::class, 'simulatePayment']);
});

Route::middleware('auth:api')->group(function () {
    Route::get('/billing/status', [\App\Http\Controllers\SubscriptionController::class, 'getStatus']);
    Route::post('/billing/payhere/hash', [\App\Http\Controllers\SubscriptionController::class, 'generatePayHereHash']);
});
