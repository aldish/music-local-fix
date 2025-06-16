<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "music-emotion";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo "Koneksi database gagal";
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$feedback = $data['feedback'] ?? null;

if (!$feedback || !in_array($feedback, ['Ya', 'Tidak'])) {
    http_response_code(400);
    echo "Feedback tidak valid";
    exit;
}

// Masukkan feedback
$stmt = $conn->prepare("INSERT INTO user_feedback (feedback) VALUES (?)");
$stmt->bind_param("s", $feedback);
$stmt->execute();
$stmt->close();

// Hitung ulang average_accuracy
$res = $conn->query("SELECT COUNT(*) AS total, SUM(feedback = 'Ya') AS ya_count FROM user_feedback");
$row = $res->fetch_assoc();

$total = $row['total'];
$ya = $row['ya_count'];
$average = $total > 0 ? round(($ya / $total) * 100, 2) : 0;

// Update semua baris (atau bisa juga hanya update saat select jika kamu mau hemat storage)
$conn->query("UPDATE user_feedback SET average_accuracy = $average");

setcookie("has_feedback", "1", time() + (86400 * 365), "/"); // 1 tahun
echo "Feedback tersimpan. Terimakasih";

$conn->close();
?>
