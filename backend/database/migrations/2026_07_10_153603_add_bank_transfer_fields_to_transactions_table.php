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
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_method')->default('payhere')->after('amount');
            $table->string('payment_slip_path')->nullable()->after('payment_method');
            $table->foreignUuid('plan_id')->nullable()->constrained()->nullOnDelete()->after('user_id');
            // Since transaction_id is unique, we should make it nullable because bank transfers might not have a generated transaction ID initially, or we generate one ourselves. 
            // Wait, changing unique to nullable is complex in SQLite/MySQL if data exists. Let's just generate a 'BT-xxxx' transaction ID in the backend.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['payment_method', 'payment_slip_path', 'plan_id']);
        });
    }
};
