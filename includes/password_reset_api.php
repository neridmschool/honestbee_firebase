<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_connect.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;

const HB_PASSWORD_RESET_TTL = 600;
const HB_PASSWORD_RESET_MAX_ATTEMPTS = 5;

function hb_password_reset_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function hb_password_reset_payload(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $payload = json_decode($raw, true);

    if (is_array($payload)) {
        return $payload;
    }

    return $_POST ?: [];
}

function hb_password_reset_email(string $value): string
{
    $email = strtolower(trim($value));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Enter a valid Gmail address.',
        ], 422);
    }

    $parts = explode('@', $email);
    if (count($parts) !== 2 || $parts[1] !== 'gmail.com') {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Use gmail.com after @.',
        ], 422);
    }

    return $email;
}

function hb_password_reset_assert_password(string $password, string $confirmation): void
{
    $valid = strlen($password) > 8
        && strlen($password) <= 30
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[a-z]/', $password)
        && preg_match('/[0-9]/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);

    if (!$valid) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Password must be more than 8 characters and include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.',
        ], 422);
    }

    if ($password !== $confirmation) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Passwords do not match.',
        ], 422);
    }
}

function hb_password_reset_account_queries(?string $accountType = null): array
{
    $queries = [
        'merchant' => "SELECT
            'merchant' AS USER_type,
            MERCH_id AS USER_id,
            MERCH_ownerEmail AS USER_email,
            'merchant' AS USER_role,
            COALESCE(NULLIF(MERCH_approvalStatus, ''), 'Pending') AS USER_status
         FROM merchant
         WHERE LOWER(MERCH_ownerEmail) = :email
         LIMIT 1",
        'rider' => "SELECT
            'rider' AS USER_type,
            RIDER_id AS USER_id,
            RIDER_email AS USER_email,
            COALESCE(NULLIF(RIDER_role, ''), 'rider') AS USER_role,
            COALESCE(NULLIF(RIDER_employmentStatus, ''), 'Pending') AS USER_status
         FROM rider
         WHERE LOWER(RIDER_email) = :email
           AND LOWER(COALESCE(NULLIF(RIDER_role, ''), 'rider')) = 'rider'
         LIMIT 1",
        'customer' => "SELECT
            'customer' AS USER_type,
            CUST_id AS USER_id,
            CUST_email AS USER_email,
            COALESCE(NULLIF(CUST_role, ''), 'customer') AS USER_role,
            COALESCE(NULLIF(CUST_status, ''), 'Active') AS USER_status
         FROM customer
         WHERE LOWER(CUST_email) = :email
           AND LOWER(COALESCE(NULLIF(CUST_role, ''), 'customer')) = 'customer'
         LIMIT 1",
    ];

    if ($accountType === null || $accountType === '') {
        return $queries;
    }

    $accountType = strtolower($accountType);
    if (!isset($queries[$accountType])) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Choose a valid account type.',
        ], 422);
    }

    return [$accountType => $queries[$accountType]];
}

function hb_password_reset_account(PDO $pdo, string $email, ?string $accountType = null): array
{
    foreach (hb_password_reset_account_queries($accountType) as $query) {
        $statement = $pdo->prepare($query);
        $statement->execute(['email' => $email]);
        $account = $statement->fetch();

        if ($account) {
            if (strtolower((string) ($account['USER_status'] ?? '')) === 'deleted') {
                hb_password_reset_json([
                    'ok' => false,
                    'message' => 'Your account has been deleted.',
                ], 403);
            }

            return $account;
        }
    }

    hb_password_reset_json([
        'ok' => false,
        'message' => 'No account found for that Gmail.',
    ], 404);
}

function hb_password_reset_write_password(PDO $pdo, array $account, string $password): void
{
    $accountType = strtolower((string) ($account['USER_type'] ?? ''));
    $updates = [
        'merchant' => [
            'sql' => 'UPDATE merchant
                      SET MERCH_password = :password, MERCH_updatedAt = NOW()
                      WHERE MERCH_id = :id',
        ],
        'rider' => [
            'sql' => 'UPDATE rider
                      SET RIDER_password = :password, RIDER_updatedAt = NOW()
                      WHERE RIDER_id = :id',
        ],
        'customer' => [
            'sql' => 'UPDATE customer
                      SET CUST_password = :password, CUST_updatedAt = NOW()
                      WHERE CUST_id = :id',
        ],
    ];

    if (!isset($updates[$accountType])) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Password reset could not identify that account.',
        ], 422);
    }

    $statement = $pdo->prepare($updates[$accountType]['sql']);
    $statement->execute([
        'password' => $password,
        'id' => $account['USER_id'],
    ]);
}

function hb_password_reset_account_type(array $payload): ?string
{
    $accountType = strtolower(trim((string) ($payload['accountType'] ?? $payload['role'] ?? '')));

    if ($accountType === '') {
        return null;
    }

    if ($accountType === 'seller') {
        return 'merchant';
    }

    if ($accountType === 'shopper') {
        return 'rider';
    }

    return $accountType;
}

function hb_password_reset_mail_failed(Throwable $error, string $smtpTranscript = ''): void
{
    $message = $error->getMessage();
    $diagnostic = trim($message . "\n" . $smtpTranscript);
    error_log('honestbee OTP mail failed: ' . $diagnostic);

    $userMessage = 'OTP was not sent. Gmail rejected the SMTP login. Update the Gmail app password, then try again.';
    if (stripos($diagnostic, 'WebLoginRequired') !== false || stripos($diagnostic, 'Please log in with your web browser') !== false) {
        $userMessage = 'OTP was not sent. Gmail blocked the sender account. Log in to the sender Gmail in a browser, approve the security check, then try again.';
    } elseif (stripos($diagnostic, 'Could not authenticate') !== false || stripos($diagnostic, '534') !== false) {
        $userMessage = 'OTP was not sent. Gmail rejected the sender login. Use a fresh Gmail app password, then try again.';
    }

    unset($_SESSION['honestbee_password_reset']);
    hb_password_reset_json([
        'ok' => false,
        'message' => $userMessage,
    ], 500);
}

function hb_password_reset_mailer(): PHPMailer
{
    $mail = new PHPMailer(true);
    $smtpEmail = getenv('HONESTBEE_SMTP_EMAIL') ?: 'neridm.school@gmail.com';
    $smtpPassword = getenv('HONESTBEE_SMTP_PASSWORD') ?: 'gadx otkf bpll mevu';
    $smtpPassword = preg_replace('/\s+/', '', $smtpPassword);

    $mail->isSMTP();
    $mail->Host = getenv('HONESTBEE_SMTP_HOST') ?: 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $smtpEmail;
    $mail->Password = $smtpPassword;
    $mail->AuthType = 'LOGIN';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int) (getenv('HONESTBEE_SMTP_PORT') ?: 587);
    $mail->Timeout = (int) (getenv('HONESTBEE_SMTP_TIMEOUT') ?: 10);
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';
    $mail->setFrom($smtpEmail, 'honestbee');
    $mail->addReplyTo($smtpEmail, 'honestbee');

    return $mail;
}

function hb_password_reset_send_otp(PDO $pdo, array $payload): void
{
    $email = hb_password_reset_email((string) ($payload['email'] ?? ''));
    $account = hb_password_reset_account($pdo, $email, hb_password_reset_account_type($payload));

    $code = (string) random_int(100000, 999999);
    $_SESSION['honestbee_password_reset'] = [
        'email' => $email,
        'account_type' => $account['USER_type'],
        'code_hash' => password_hash($code, PASSWORD_DEFAULT),
        'expires_at' => time() + HB_PASSWORD_RESET_TTL,
        'verified' => false,
        'attempts' => 0,
    ];

    try {
        $smtpTranscript = '';
        $mail = hb_password_reset_mailer();
        $mail->SMTPDebug = 2;
        $mail->Debugoutput = function (string $line, int $level) use (&$smtpTranscript): void {
            $smtpTranscript .= "[{$level}] {$line}\n";
        };
        $mail->addAddress($email);
        $mail->Subject = 'honestbee OTP code';
        $mail->isHTML(true);
        $mail->Body = sprintf(
            '<p>Your honestbee OTP code is <strong>%s</strong>.</p><p>This code expires in 10 minutes.</p>',
            htmlspecialchars($code, ENT_QUOTES, 'UTF-8')
        );
        $mail->AltBody = "Your honestbee OTP code is {$code}. This code expires in 10 minutes.";
        $mail->send();
    } catch (Throwable $error) {
        hb_password_reset_mail_failed($error, $smtpTranscript ?? '');
    }

    hb_password_reset_json([
        'ok' => true,
        'message' => 'OTP sent to Gmail.',
    ]);
}

function hb_password_reset_verify_otp(array $payload): void
{
    $email = hb_password_reset_email((string) ($payload['email'] ?? ''));
    $otp = preg_replace('/\D+/', '', (string) ($payload['otp'] ?? ''));
    $reset = $_SESSION['honestbee_password_reset'] ?? null;

    if (!is_array($reset) || ($reset['email'] ?? '') !== $email) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Get a new OTP for that Gmail first.',
        ], 422);
    }

    if (($reset['expires_at'] ?? 0) < time()) {
        unset($_SESSION['honestbee_password_reset']);
        hb_password_reset_json([
            'ok' => false,
            'message' => 'OTP expired. Get a new OTP.',
        ], 422);
    }

    if (($reset['attempts'] ?? 0) >= HB_PASSWORD_RESET_MAX_ATTEMPTS) {
        unset($_SESSION['honestbee_password_reset']);
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Too many OTP attempts. Get a new OTP.',
        ], 429);
    }

    if (!password_verify($otp, (string) ($reset['code_hash'] ?? ''))) {
        $_SESSION['honestbee_password_reset']['attempts'] = (int) ($reset['attempts'] ?? 0) + 1;
        hb_password_reset_json([
            'ok' => false,
            'message' => 'OTP code is incorrect.',
        ], 422);
    }

    $_SESSION['honestbee_password_reset']['verified'] = true;

    hb_password_reset_json([
        'ok' => true,
        'message' => 'OTP verified.',
    ]);
}

function hb_password_reset_update_password(PDO $pdo, array $payload): void
{
    $email = hb_password_reset_email((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $confirmation = (string) ($payload['confirmPassword'] ?? '');
    $reset = $_SESSION['honestbee_password_reset'] ?? null;

    if (!is_array($reset) || ($reset['email'] ?? '') !== $email || empty($reset['verified'])) {
        hb_password_reset_json([
            'ok' => false,
            'message' => 'Verify the OTP before changing the password.',
        ], 422);
    }

    if (($reset['expires_at'] ?? 0) < time()) {
        unset($_SESSION['honestbee_password_reset']);
        hb_password_reset_json([
            'ok' => false,
            'message' => 'OTP expired. Get a new OTP.',
        ], 422);
    }

    hb_password_reset_assert_password($password, $confirmation);
    $account = hb_password_reset_account(
        $pdo,
        $email,
        (string) ($reset['account_type'] ?? '') ?: hb_password_reset_account_type($payload)
    );
    hb_password_reset_write_password($pdo, $account, $password);

    unset($_SESSION['honestbee_password_reset']);

    hb_password_reset_json([
        'ok' => true,
        'message' => 'Password changed successfully.',
    ]);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    hb_password_reset_json([
        'ok' => false,
        'message' => 'Method not allowed.',
    ], 405);
}

$payload = hb_password_reset_payload();
$action = (string) ($payload['action'] ?? '');

try {
    if ($action === 'send_otp') {
        hb_password_reset_send_otp(honestbee_pdo(), $payload);
    }

    if ($action === 'verify_otp') {
        hb_password_reset_verify_otp($payload);
    }

    if ($action === 'reset_password') {
        hb_password_reset_update_password(honestbee_pdo(), $payload);
    }

    hb_password_reset_json([
        'ok' => false,
        'message' => 'Unknown password reset action.',
    ], 400);
} catch (Throwable $error) {
    hb_password_reset_json([
        'ok' => false,
        'message' => 'Password reset could not be completed. Please try again.',
    ], 500);
}
