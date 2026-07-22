<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_modifiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('menu_item_id')->constrained('menu_items')->onDelete('cascade');
            $table->string('name'); // e.g., 'Spice Level', 'Add-ons'
            $table->boolean('is_multiple_choice')->default(false);
            $table->boolean('is_required')->default(false);
            $table->json('options'); // e.g., [{"name": "Mild", "price": 0}, {"name": "Extra Cheese", "price": 1.50}]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_modifiers');
    }
};
