<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add Composite Indexes
        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['tenant_id', 'is_available']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at']);
        });

        // Enable Row-Level Security
        if (Schema::connection($this->getConnection())->getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE orders ENABLE ROW LEVEL SECURITY;');
            
            // Force RLS even for table owners (Laravel DB user)
            DB::statement('ALTER TABLE menu_items FORCE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE menu_categories FORCE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE orders FORCE ROW LEVEL SECURITY;');

            // Create Policies
            // We use current_setting('app.current_tenant', true) to get the tenant ID from the session.
            DB::statement("CREATE POLICY tenant_isolation_menu_items ON menu_items FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));");
            DB::statement("CREATE POLICY tenant_isolation_menu_categories ON menu_categories FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));");
            DB::statement("CREATE POLICY tenant_isolation_orders ON orders FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true));");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::connection($this->getConnection())->getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_menu_items ON menu_items;');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_menu_categories ON menu_categories;');
            DB::statement('DROP POLICY IF EXISTS tenant_isolation_orders ON orders;');
            
            DB::statement('ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;');
            DB::statement('ALTER TABLE orders DISABLE ROW LEVEL SECURITY;');
        }

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_available']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'created_at']);
        });
    }
};
