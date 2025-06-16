<?php
// Mendapatkan data JSON yang dikirim dari client
$data = json_decode(file_get_contents("php://input"), true);

// Validasi data: pastikan 'image' dan 'expression' ada
if (!$data || !isset($data['image']) || !isset($data['expression'])) {
    http_response_code(400);
    echo "Data tidak lengkap. 'image' dan 'expression' dibutuhkan.";
    exit;
}

// --- Proses Data Gambar ---
$imageData = $data['image'];
$imageData = str_replace('data:image/jpeg;base64,', '', $imageData);
$imageData = str_replace(' ', '+', $imageData);
$decodedImage = base64_decode($imageData);

if (!$decodedImage) {
    http_response_code(500);
    echo "Gagal melakukan decode pada data gambar base64.";
    exit;
}

// --- Proses Data Ekspresi ---
// Sanitasi nama ekspresi untuk keamanan file
$expression = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['expression']);

// --- Manajemen File ---
$folder = 'log_foto/';
$idFile = $folder . 'last_id.txt';

// Buat folder jika belum ada
if (!is_dir($folder)) {
    // Memberikan izin 0777 agar web server bisa menulis di dalamnya
    mkdir($folder, 0777, true);
}

// Ambil ID terakhir, atau mulai dari 0 jika file belum ada
$lastId = file_exists($idFile) ? (int)file_get_contents($idFile) : 0;
$newId = $lastId + 1;

// Simpan ID baru ke file
file_put_contents($idFile, $newId);

// --- Pembuatan Nama File Baru ---
$timestamp = date("Ymd_His"); // format: 20250612_195512
// Format nama file baru: ID_EXPRESSION_TIMESTAMP.jpg
$filename = "{$newId}_{$expression}_{$timestamp}.jpg";
$filepath = $folder . $filename;

// Simpan file gambar
if (file_put_contents($filepath, $decodedImage)) {
    echo "✅ Gambar disimpan sebagai $filename";
} else {
    http_response_code(500);
    echo "Gagal menyimpan file gambar di server.";
}
?>
