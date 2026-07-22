<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('slug')->unique(); // e.g., 'hotel-abc'
            $table->string('restaurant_name')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('primary_color')->default('#f97316'); // Orange 500
            $table->string('secondary_color')->default('#1e293b');
            $table->string('font_family')->default('sans-serif');
            $table->string('language')->default('en');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_settings');
    }
};
