<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class StaffRoleController extends Controller
{
    public function getRoles(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        return response()->json(Role::with('permissions')->where('tenant_id', $tenantId)->get());
    }

    public function createRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);
        
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $role = Role::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
        ]);
        
        if ($request->has('permissions')) {
            $role->permissions()->sync($request->permissions);
        }
        
        return response()->json($role->load('permissions'), 201);
    }

    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);
        
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $role = Role::where('tenant_id', $tenantId)->findOrFail($id);
        $role->update(['name' => $request->name]);
        
        if ($request->has('permissions')) {
            $role->permissions()->sync($request->permissions);
        }
        
        return response()->json($role->load('permissions'));
    }

    public function deleteRole(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $role = Role::where('tenant_id', $tenantId)->findOrFail($id);
        $role->delete();
        return response()->json(['message' => 'Role deleted']);
    }

    public function getPermissions()
    {
        return response()->json(Permission::all());
    }

    public function createStaff(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'name' => 'required|string',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id'
        ]);

        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $role = Role::where('tenant_id', $tenantId)->findOrFail($request->role_id);
        
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $tenantId,
            'role' => 'staff' // Basic role indicator
        ]);

        DB::table('role_user')->insert([
            'user_id' => $user->id,
            'role_id' => $role->id
        ]);

        // Optional: Send welcome email, but since owner sets password, it's not strictly necessary.
        // We'll skip sending the plain-text password over email for security.

        return response()->json(['message' => 'Staff created successfully', 'user' => $user]);
    }

    public function getStaff(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $staff = User::where('tenant_id', $tenantId)
                     ->where('id', '!=', $request->user()->id)
                     ->with('roles')
                     ->get();
        return response()->json($staff);
    }
    
    public function toggleStaffStatus(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $staff = User::where('tenant_id', $tenantId)->findOrFail($id);
        
        $staff->is_active = !$staff->is_active;
        if (!$staff->is_active) {
            $staff->token_version = ($staff->token_version ?? 0) + 1; // Invalidate active sessions immediately
        }
        $staff->save();
        
        return response()->json(['message' => 'Staff status updated', 'user' => $staff]);
    }

    public function deleteStaff(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $staff = User::where('tenant_id', $tenantId)->where('id', '!=', $request->user()->id)->findOrFail($id);
        
        $staff->delete();
        
        return response()->json(['message' => 'Staff member deleted']);
    }
}
