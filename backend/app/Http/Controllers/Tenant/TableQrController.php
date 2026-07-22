<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TableQr;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TableQrController extends Controller
{
    public function index()
    {
        $tenantId = config('tenant.id') ?? auth()->id();
        $tables = TableQr::where('tenant_id', $tenantId)->get();
        return response()->json($tables);
    }

    public function store(Request $request)
    {
        $request->validate([
            'table_number' => 'required|string|max:50',
        ]);

        $tenantId = config('tenant.id') ?? auth()->id();
        
        // Enforce max_tables limit
        $activeSubscription = \App\Models\TenantSubscription::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with('plan')
            ->first();

        if ($activeSubscription && $activeSubscription->plan && $activeSubscription->plan->max_tables !== null) {
            $currentTablesCount = TableQr::where('tenant_id', $tenantId)->count();
            if ($currentTablesCount >= $activeSubscription->plan->max_tables) {
                return response()->json(['error' => 'You have reached the maximum number of tables allowed on your current plan. Please upgrade to add more.'], 403);
            }
        }

        $tableQr = TableQr::create([
            'tenant_id' => $tenantId,
            'table_number' => $request->table_number,
            'redirect_hash' => Str::random(10), // E.g., a 10 character hash
        ]);

        return response()->json($tableQr, 201);
    }

    public function destroy($id)
    {
        $tenantId = config('tenant.id') ?? auth()->id();
        $tableQr = TableQr::where('tenant_id', $tenantId)->findOrFail($id);
        $tableQr->delete();

        return response()->json(['message' => 'Table QR deleted']);
    }

    public function generateQr($id)
    {
        $tenantId = config('tenant.id') ?? auth()->id();
        $tableQr = TableQr::where('tenant_id', $tenantId)->findOrFail($id);

        $redirectUrl = config('app.url') . '/api/r/' . $tableQr->redirect_hash;

        $options = new \chillerlan\QRCode\QROptions([
            'version'    => 5,
            'outputType' => \chillerlan\QRCode\QRCode::OUTPUT_BASE64,
            'eccLevel'   => \chillerlan\QRCode\QRCode::ECC_H,
            'addQuietzone' => true,
        ]);

        $qrcode = (new \chillerlan\QRCode\QRCode($options))->render($redirectUrl);

        return response()->json([
            'table_number' => $tableQr->table_number,
            'qr_image' => $qrcode,
            'url' => $redirectUrl
        ]);
    }
}
