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
        Schema::create('upsell_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('item_id')->constrained('menu_items')->onDelete('cascade');
            $table->foreignUuid('suggested_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['tenant_id', 'item_id', 'suggested_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upsell_rules');
    }
};
