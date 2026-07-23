<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? $request->user()->id;
        $logs = Audit::with('user')->where('tenant_id', $tenantId)->latest()->paginate(20);
        return response()->json($logs);
    }
}
