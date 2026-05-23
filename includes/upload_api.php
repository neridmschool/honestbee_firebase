<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function hb_upload_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    hb_upload_response(['ok' => false, 'error' => 'Upload requests must use POST.'], 405);
}

$file = $_FILES['image'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    hb_upload_response(['ok' => false, 'error' => 'Choose an image file to upload.'], 400);
}

if (!is_uploaded_file((string) ($file['tmp_name'] ?? ''))) {
    hb_upload_response(['ok' => false, 'error' => 'Upload could not be verified.'], 400);
}

$maxBytes = 5 * 1024 * 1024;
if ((int) ($file['size'] ?? 0) > $maxBytes) {
    hb_upload_response(['ok' => false, 'error' => 'Image file must be 5 MB or smaller.'], 400);
}

$tmpName = (string) $file['tmp_name'];
$imageInfo = @getimagesize($tmpName);
if ($imageInfo === false) {
    hb_upload_response(['ok' => false, 'error' => 'Uploaded file must be an image.'], 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpName) ?: '';
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
];

if (!isset($extensions[$mimeType])) {
    hb_upload_response(['ok' => false, 'error' => 'Use a JPG, PNG, GIF, or WebP image.'], 400);
}

$category = preg_replace('/[^a-z0-9-]+/i', '-', (string) ($_POST['category'] ?? 'application'));
$category = trim((string) $category, '-') ?: 'application';
$uploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads';

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
    hb_upload_response(['ok' => false, 'error' => 'Uploads folder could not be created.'], 500);
}

$filename = strtolower($category) . '-' . date('YmdHis') . '-' . bin2hex(random_bytes(6)) . '.' . $extensions[$mimeType];
$targetPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($tmpName, $targetPath)) {
    hb_upload_response(['ok' => false, 'error' => 'Image could not be saved.'], 500);
}

hb_upload_response([
    'ok' => true,
    'path' => 'uploads/' . $filename,
]);
