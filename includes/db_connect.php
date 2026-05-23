<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Manila');

const HB_DB_HOST = 'localhost';
const HB_DB_NAME = 'honestbee_db';
const HB_DB_USER = 'root';
const HB_DB_PASS = '';

function honestbee_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('HONESTBEE_DB_HOST') ?: HB_DB_HOST;
    $database = getenv('HONESTBEE_DB_NAME') ?: HB_DB_NAME;
    $username = getenv('HONESTBEE_DB_USER') ?: HB_DB_USER;
    $password = getenv('HONESTBEE_DB_PASS');
    $password = $password === false ? HB_DB_PASS : $password;

    $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
