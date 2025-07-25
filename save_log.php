<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "music-emotion";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  die("Koneksi gagal: " . $conn->connect_error);
}

$expression = $_POST['expression'] ?? '';
$latency = $_POST['latency'] ?? 0;
$song1 = $_POST['song1'] ?? '';
$song2 = $_POST['song2'] ?? '';
$song3 = $_POST['song3'] ?? '';
$song4 = $_POST['song4'] ?? '';
$song5 = $_POST['song5'] ?? '';
$song6 = $_POST['song6'] ?? '';

$stmt = $conn->prepare("INSERT INTO logs (expression, latency_ms, song1, song2, song3, song4, song5, song6) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sdssssss", $expression, $latency, $song1, $song2, $song3, $song4, $song5, $song6);


if ($stmt->execute()) {
  echo "✅ Log berhasil disimpan.";
} else {
  echo "❌ Gagal menyimpan log: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
