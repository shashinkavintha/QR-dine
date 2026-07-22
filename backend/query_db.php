<?php
// query_db.php - dump info from sqlite
try {
    $dbPath = __DIR__ . '/database/database.sqlite';
    if (!file_exists($dbPath)) {
        die("Database file not found at " . $dbPath . "\n");
    }
    
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    echo "--- TABLES ---\n";
    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll();
    foreach ($tables as $t) {
        echo "- " . $t['name'] . "\n";
    }
    
    echo "\n--- USERS ---\n";
    try {
        $users = $pdo->query("SELECT id, name, email, role, tenant_id, plan_id, is_active, is_suspended, first_name, last_name, phone FROM users")->fetchAll();
        echo json_encode($users, JSON_PRETTY_PRINT) . "\n";
    } catch (Exception $e) {
        echo "Error querying users: " . $e->getMessage() . "\n";
    }
    
    echo "\n--- PLANS ---\n";
    try {
        $plans = $pdo->query("SELECT id, name, slug, price, currency, duration_months, max_menu_items, max_languages, has_custom_qr, has_analytics FROM plans")->fetchAll();
        echo json_encode($plans, JSON_PRETTY_PRINT) . "\n";
    } catch (Exception $e) {
        echo "Error querying plans: " . $e->getMessage() . "\n";
    }
    
    echo "\n--- SYSTEM SETTINGS ---\n";
    try {
        $settings = $pdo->query("SELECT * FROM system_settings")->fetchAll();
        echo json_encode($settings, JSON_PRETTY_PRINT) . "\n";
    } catch (Exception $e) {
        echo "Error querying system_settings: " . $e->getMessage() . "\n";
    }
    
    echo "\n--- TENANT SETTINGS ---\n";
    try {
        $tsettings = $pdo->query("SELECT id, tenant_id, company_name, phone, currency FROM tenant_settings")->fetchAll();
        echo json_encode($tsettings, JSON_PRETTY_PRINT) . "\n";
    } catch (Exception $e) {
        echo "Error querying tenant_settings: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
