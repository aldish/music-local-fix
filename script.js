const video = document.getElementById('video');
const status = document.getElementById('status');
const playlistDiv = document.getElementById('playlist');
const canvas = document.getElementById('snapshot');
const ctx = canvas.getContext('2d');

function getThumbnailFileName(title) {
    return `assets/thumbs/${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}.jpg`;
  }  

async function start() {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('models');
    await faceapi.nets.faceExpressionNet.loadFromUri('models');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    console.error("Gagal mengakses kamera:", err);
    alert("Kamera tidak bisa diakses. Pastikan izin kamera diaktifkan.");
  }
}

window.addEventListener("DOMContentLoaded", start);

async function detect() {
  const countdownEl = document.getElementById('countdown');
  countdownEl.style.display = 'block';

  let count = 3;

  const countdownInterval = setInterval(() => {
    countdownEl.innerText = count;
    count--;

    if (count < 0) {
      clearInterval(countdownInterval);
      countdownEl.style.display = 'none';

      processDetection(); // jalankan proses deteksi setelah hitung mundur selesai
    }
  }, 800);
}

async function processDetection() {
  // Mulai pengukuran waktu menggunakan performance.now()
  const startTime = performance.now();
  console.time('prosesLoop'); // Ini tetap bisa Anda gunakan untuk logging ke konsol

  // Contoh kode yang akan diukur: sebuah loop sederhana
  let total = 0;
  for (let i = 0; i < 1000000; i++) {
    total += i;
  }

  const result = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  if (!result) {
    status.innerText = '❌ Wajah tidak terdeteksi.';
    playlistDiv.innerHTML = '';
    canvas.style.display = 'none';
    video.style.display = 'block';
    console.timeEnd('prosesLoop'); // Tetap akhiri untuk logging
    return;
  }

  // 1. Ambil ekspresi terlebih dahulu
  const expressions = result.expressions;
  const emotion = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0][0];

  // 2. Gambar frame dari video ke canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/jpeg');

  // 3. Tampilkan canvas setelah digambar
  video.style.display = 'none';
  canvas.style.display = 'block';

  // 4. Sekarang kirim data gambar DAN ekspresi. Variabel 'emotion' sudah ada.
  fetch('save_image.php', {
    method: 'POST',
    body: JSON.stringify({ image: imageData, expression: emotion }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.text())
  .then(responseText => console.log("Respon dari save_image.php:", responseText))
  .catch(error => console.error("Error saat menyimpan gambar:", error));

  status.innerText = `😊 Ekspresi terdeteksi: ${emotion}`;

  const songList = playlistMap[emotion];
  if (!songList) {
    playlistDiv.innerHTML = `<p>⚠️ Belum ada lagu untuk ekspresi "${emotion}".</p>`;
    console.timeEnd('prosesLoop'); // Tetap akhiri untuk logging
    return;
  }

  const randomSongs = songList.sort(() => 0.5 - Math.random()).slice(0, 5);
  const [song1, song2, song3, song4, song5] = randomSongs;

  playlistDiv.innerHTML = randomSongs.map((song) => {
    const thumbnail = getThumbnailFileName(song.title);
    return `
      <div class="song-card">
        <img src="${thumbnail}" alt="Thumbnail" class="song-thumb">
        <div class="song-info">
          <strong>${song.artist}</strong><br>
          <small>${song.title}</small><br>
          <small>${song.album}</small>
        </div>
        <a href="${song.url}" target="_blank" class="play-btn">
          <i class="fas fa-play"></i>
        </a>
      </div>
    `;
  }).join('');

  document.getElementById('feedback-section').style.display = 'block';

  // Menghentikan penghitung waktu dan menampilkan hasilnya ke konsol
  console.timeEnd('prosesLoop');

  // Ambil waktu akhir dan hitung durasi dalam milidetik
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2); // Menggunakan toFixed(2) untuk 2 angka di belakang koma

  fetch('save_log.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // Kirim 'duration' yang sudah dihitung
    body: `expression=${encodeURIComponent(emotion)}&latency=${encodeURIComponent(duration)}&song1=${encodeURIComponent(song1?.title || '')}&song2=${encodeURIComponent(song2?.title || '')}&song3=${encodeURIComponent(song3?.title || '')}&song4=${encodeURIComponent(song4?.title || '')}&song5=${encodeURIComponent(song5?.title || '')}`
  })
  .then(res => res.text())
  .then(data => console.log(data))
  .catch(err => console.error("Gagal menyimpan log:", err));
}

function submitFeedback(feedback) {
fetch('submit_feedback.php', {
  method: 'POST',
  body: JSON.stringify({ feedback }),
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.text())
.then(msg => {
  alert(msg);
  document.getElementById('feedback-section').style.display = 'none';
})
.catch(err => {
  console.error('Gagal kirim feedback:', err);
});
}

function resetVideo() {
  // 1. Sembunyikan canvas snapshot dan tampilkan kembali video dari kamera
  document.getElementById('canvas').style.display = 'none';
  video.style.display = 'block';
  
  // 2. Sembunyikan kembali bagian feedback (tombol "Ya" / "Tidak")
  document.getElementById('feedback-section').style.display = 'none';

  // 3. Kosongkan isi div playlist (ini akan menghapus semua song-card di dalamnya)
  const playlistDiv = document.getElementById('playlist');
  playlistDiv.innerHTML = '';

  // 4. Reset status box ke teks dan ikon semula
  const statusBox = document.getElementById('status');
  statusBox.innerHTML = `
    <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" alt="Bot">
    <span>Ekspresi Terdeteksi: <strong><span id="emotion-text">-</span></strong></span>
  `;
}

start();

// Panggil fungsi saat halaman dimuat
window.addEventListener("DOMContentLoaded", startCamera);