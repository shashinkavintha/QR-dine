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
        Schema::table('plans', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable();
            $table->string('currency')->default('USD');
            $table->integer('duration_months')->default(1);
            $table->json('features')->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->uuid('plan_id')->nullable();
            $table->string('plan_status')->default('trialing');
            $table->timestamp('plan_expires_at')->nullable();
            $table->string('payhere_customer_id')->nullable();

            $table->foreign('plan_id')->references('id')->on('plans')->onDelete('set null');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payhere_payment_id')->nullable();
            $table->string('md5sig')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['payhere_payment_id', 'md5sig']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'plan_status', 'plan_expires_at', 'payhere_customer_id']);
        });

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['slug', 'currency', 'duration_months', 'features']);
        });
    }
};
