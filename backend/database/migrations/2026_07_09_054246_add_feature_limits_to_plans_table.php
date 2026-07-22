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
            $table->integer('max_menu_items')->nullable();
            $table->integer('max_languages')->nullable();
            $table->boolean('has_custom_qr')->default(false);
            $table->boolean('has_analytics')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_menu_items', 'max_languages', 'has_custom_qr', 'has_analytics']);
        });
    }
};
