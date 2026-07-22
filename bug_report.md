# QR Dine SaaS - Security and Bug Audit Report

This audit report document outlines 10 verified bugs in the **QR Dine SaaS** codebase, categorized by their structural domains: UI/UX, Backend, Security, and Logical. Each entry details the location of the issue, a description of the bug, steps for reproduction, and the proposed fix.

---

## UI/UX

### Bug 1: Frontend Super Admin Layout require() Syntax Bug
- **File Path**: `src/app/super-admin/layout.js` (lines 18 & 20)
- **Description**: In the client component body of `SuperAdminLayout`, React hooks (`useState` and `useEffect`) are dynamically loaded using CommonJS `require('react')` rather than ES imports at the top of the file. In Next.js client components, using dynamic require calls inside the component body violates React hook rules and causes errors or build warnings in the Next.js production build system.
- **Reproduction Steps**:
  1. Open a terminal in the project root.
  2. Run the production build command: `npm run build`.
  3. The compiler raises an error/warning during compilation of `/super-admin` page/layout and fails to build successfully.
- **Proposed Fix**: Import `useState` and `useEffect` as standard ESM imports at the top of `src/app/super-admin/layout.js`:
  ```javascript
  import { useState, useEffect } from 'react';
  ```
  And refactor lines 18 and 20 to use `useState` and `useEffect` directly.

### Bug 2: Frontend Users Page Block Scope Reference Bug
- **File Path**: `src/app/super-admin/users/page.js` (line 15)
- **Description**: The function `fetchUsers()` is invoked inside a `useEffect` hook (line 15) before its declaration at line 18. Because `fetchUsers` is defined as a `const` arrow function, it is not hoisted to the top of the scope (temporal dead zone). This triggers ESLint's `no-use-before-define` rule violation and halts the CI/CD build scripts.
- **Reproduction Steps**:
  1. Open a terminal in the project root.
  2. Run the linter command: `npm run lint`.
  3. The linter outputs: `'fetchUsers' was used before it was defined` under `src/app/super-admin/users/page.js`.
- **Proposed Fix**: Move the declaration of the `fetchUsers` function above the `useEffect` hook block in `src/app/super-admin/users/page.js` or convert it to a standard function declaration which supports hoisting:
  ```javascript
  async function fetchUsers() {
    // ...
  }
  ```

---

## Backend

### Bug 3: SQLite Datatype Mismatch in Eloquent Models
- **File Paths**: Various Eloquent models under `backend/app/Models/` including `User`, `SystemSetting`, `TenantSetting`, `MenuItem`, `MenuCategory`, `TableQr`, `Order`, `OrderItem`, `Transaction`, `TenantSubscription`, and `ItemModifier`.
- **Description**: These models use string UUIDs as their primary key fields. However, they lack the `HasUuids` trait. By default, Eloquent assumes `$incrementing = true` and `$keyType = 'int'`. When performing insert operations on an SQLite database, Eloquent attempts to bind the UUID strings as integer types, which throws a SQL constraint exception: `SQLSTATE[HY000]: General error: 20 datatype mismatch`.
- **Reproduction Steps**:
  1. Configure the database connection in `.env` to utilize the SQLite driver.
  2. Attempt to register a user, create a menu category, or add a menu item.
  3. The database transaction fails with a `QueryException` showing: `General error: 20 datatype mismatch`.
- **Proposed Fix**: Import and apply the `HasUuids` trait in all affected model classes under `backend/app/Models/`:
  ```php
  use Illuminate\Database\Eloquent\Concerns\HasUuids;

  class User extends Authenticatable
  {
      use HasUuids;
      // ...
  }
  ```

### Bug 4: PostgreSQL Row-Level Security Syntax in SQLite Migration
- **File Path**: `backend/database/migrations/2026_07_09_054434_add_rls_and_indexes_to_tenant_tables.php` (lines 24–37)
- **Description**: The migration contains raw SQL statement executions to enable PostgreSQL-specific Row-Level Security features (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and `CREATE POLICY ...`). Since SQLite does not support PostgreSQL's RLS syntax, local developer environments utilizing SQLite crash during database migration.
- **Reproduction Steps**:
  1. Configure the project database to run on SQLite locally.
  2. Run the Artisan command: `php artisan migrate`.
  3. The migration process crashes at line 24 with a syntax error near `ENABLE ROW LEVEL SECURITY`.
- **Proposed Fix**: Add a conditional check to ensure raw PostgreSQL statements are only executed if the current database connection driver is `pgsql`:
  ```php
  if (Schema::connection($this->getConnection())->getConnection()->getDriverName() === 'pgsql') {
      DB::statement('ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;');
      // ...
  }
  ```

### Bug 5: Tenant Account Deletion Database Crash (QueryException)
- **File Path**: `backend/app/Http/Controllers/ProfileController.php` (lines 181–182)
- **Description**: In the `deleteAccount` action of `ProfileController`, the database is queried to cancel the tenant's subscriptions: `TenantSubscription::where('user_id', $user->id)->update(['status' => 'canceled', 'canceled_at' => now()])`. However, the `tenant_subscriptions` table schema uses the column name `tenant_id` instead of `user_id`, and has `ends_at` instead of `canceled_at`. Running the deletion query throws a `QueryException` (column does not exist) and blocks tenant account removal.
- **Reproduction Steps**:
  1. Authenticate as a tenant owner.
  2. Send a `DELETE` request to `/api/user/profile/delete-account`.
  3. The server responds with a `500 Internal Server Error` due to a database column error.
- **Proposed Fix**: Correct the queried columns to match the actual database schema in `ProfileController.php`:
  ```php
  \App\Models\TenantSubscription::where('tenant_id', $user->id)
      ->update(['status' => 'canceled', 'ends_at' => now()]);
  ```

---

## Security

### Bug 6: Staff User Subscription Expiration and Account Suspension Bypass
- **File Paths**: `backend/app/Http/Middleware/CheckSubscription.php` and `CheckSuspended.php`
- **Description**: These middlewares intercept incoming tenant requests to ensure active subscription status and to block access to suspended accounts. However, they only inspect the roles/attributes of the authenticated user. If a staff user (whose role is `staff`) makes a request, they bypass these checks since the middleware only checks if the tenant owner (`role === 'tenant'`) is suspended or expired. This allows staff members to continue modifying menus and orders for deactivated tenants.
- **Reproduction Steps**:
  1. Register a staff user associated with a tenant whose subscription is expired or whose account is marked `is_suspended`.
  2. Authenticate as the staff user and make a `POST` request to edit menu items or fetch details.
  3. The request succeeds, bypassing expiration and suspension blockades.
- **Proposed Fix**: Resolve the tenant owner's account status using the tenant's owner ID (which matches the tenant owner user ID) in both middlewares:
  ```php
  $tenantId = $user->role === 'tenant' ? $user->id : $user->tenant_id;
  $owner = \App\Models\User::find($tenantId);

  if ($owner && $owner->is_suspended) {
      return response()->json(['error' => 'Your account is suspended.'], 403);
  }
  // Perform similar check for plan expiration in CheckSubscription
  ```

### Bug 7: Public Order Placement Bypass for Suspended/Expired Tenants
- **File Path**: `backend/app/Http/Controllers/PublicController.php` (line 52)
- **Description**: The public endpoint for placing restaurant orders `POST /api/public/orders` validates that `tenant_id` exists in the database. However, it lacks any validation of whether that specific tenant owner account has been suspended or has expired subscriptions. This allows customers to place new orders for suspended or expired venues.
- **Reproduction Steps**:
  1. Fetch the user ID of a suspended or expired tenant.
  2. Send a `POST` request to `/api/public/orders` specifying the target `tenant_id`.
  3. The order is processed and stored in the database successfully, bypassing account restrictions.
- **Proposed Fix**: Validate the tenant owner's status and subscription expiry in `PublicController::placeOrder` prior to starting the database transaction:
  ```php
  $tenant = \App\Models\User::findOrFail($request->tenant_id);
  if ($tenant->is_suspended || !$tenant->is_active) {
      return response()->json(['error' => 'This menu is currently unavailable.'], 403);
  }
  $expiry = \Carbon\Carbon::parse($tenant->plan_expires_at ?? $tenant->trial_ends_at);
  if ($expiry->isPast()) {
      return response()->json(['error' => 'This menu subscription has expired.'], 403);
  }
  ```

### Bug 8: Password Reset OTP Expiration Leak
- **File Path**: `backend/app/Http/Controllers/ForgotPasswordController.php` (lines 54–61)
- **Description**: In the `resetPassword` handler, the OTP submitted by the user is matched against the database `password_reset_tokens` table based on email and token values. However, the system fails to check the `created_at` timestamp of the token. This allows any password reset OTP to remain valid indefinitely, exposing accounts to token reuse attacks.
- **Reproduction Steps**:
  1. Request a password reset OTP for a registered email.
  2. Wait past the intended 15-minute validity window (e.g., hours or days later).
  3. Submit the old OTP to `/api/auth/reset-password`. The password reset succeeds.
- **Proposed Fix**: Verify that the token has not expired (is within 15 minutes of creation) in `ForgotPasswordController.php`:
  ```php
  if (!$resetRecord || \Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(15)->isPast()) {
      return response()->json(['error' => 'The OTP you entered is incorrect or expired.'], 400);
  }
  ```

---

## Logical

### Bug 9: PayHere Webhook Plan Resolution Failure
- **File Path**: `backend/app/Http/Controllers/PayHereWebhookController.php` (lines 53–55)
- **Description**: The webhook handler processes the order ID (`order_id`) to extract the purchased plan ID using `$planId = explode('-', $orderId)[2]`. Since `user_id` is a hyphenated UUID (containing 4 hyphens), using `explode('-', $orderId)` splits the UUID itself. As a result, index 2 points to a segment of the UUID instead of the plan ID, causing plan activation to fail.
- **Reproduction Steps**:
  1. Submit a subscription payment that issues an order ID using the standard format (e.g. `SUB_{user_id}_{plan_id}_{timestamp}` where user_id is a UUID).
  2. Trigger the PayHere webhook endpoint `POST /api/payhere/webhook`.
  3. The transaction status changes to `Succeeded`, but the tenant's plan fails to activate.
- **Proposed Fix**: Implement segment parsing that accounts for both underscore and hyphenated formats:
  ```php
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
  ```

### Bug 10: Multi-tenancy Limit Bypass for Staff Members
- **File Path**: `backend/app/Http/Middleware/CheckFeatureLimits.php` (lines 25–33)
- **Description**: The `CheckFeatureLimits` middleware queries the current count of menu items for a tenant using `$currentCount = MenuItem::where('tenant_id', $user->id)->count();`. When a staff user attempts to add a menu item, the query queries `tenant_id` matching the staff member's ID. However, the global `TenantScope` filters query records matching the tenant owner ID (`tenant_id = owner_id`). This results in an intersection query returning `0`, bypassing the menu limits check entirely.
- **Reproduction Steps**:
  1. Log in as a staff member.
  2. Send a `POST` request to create a menu item past the maximum menu item limit of the tenant's active plan.
  3. The menu item is successfully created without blocking the request.
- **Proposed Fix**: Resolve the correct tenant ID (owner's ID) in `CheckFeatureLimits.php` to calculate the item count accurately:
  ```php
  $tenantId = config('tenant.id') ?? $user->id;
  $currentCount = \App\Models\MenuItem::where('tenant_id', $tenantId)->count();
  ```
