<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;

header('Content-Type: application/json; charset=utf-8');

Auth::logout();

echo json_encode(['success' => true]);
