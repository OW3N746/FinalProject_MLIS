# FinalProject_MLIS
# 🧩 Voxel AR Puzzle Game - Hand Tracking Edition

![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-00B0FF?style=for-the-badge&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

Voxel AR Puzzle adalah sebuah permainan teka-teki 3D interaktif di mana pemain harus menyusun balok (voxel) agar sesuai dengan pola hologram yang diberikan. Keunikan utama dari game ini adalah **sistem kontrolnya yang 100% menggunakan pergerakan tangan asli di depan Webcam** berkat integrasi kecerdasan buatan (Computer Vision) dari Google MediaPipe dan grafik 3D dari Three.js.

Proyek ini dibuat sebagai Final Project (MLIS) untuk mendemonstrasikan implementasi Machine Learning dalam antarmuka interaktif.

---

## ✨ Fitur Utama

- **👐 Hand Gesture Controls:** Tanpa mouse atau keyboard! Gunakan tangan kirimu untuk memutar dunia 3D, dan tangan kananmu sebagai kursor untuk membangun.
- **🧠 AI-Powered Tracking:** Menggunakan model MediaPipe Hand Landmarker secara *offline* untuk latensi yang sangat rendah.
- **🎲 Procedural Generation:** Level dibuat secara otomatis dengan tingkat kesulitan yang terus meningkat (ukuran grid meluas setiap kelipatan 5 level, dan jumlah kluster bangunan bertambah setiap 10 level).
- **⏱️ Time Attack:** Pemain diberikan waktu 30 detik untuk menyelesaikan setiap susunan puzzle.
- **🖥️ Standalone Desktop App:** Dibungkus rapi menggunakan Python (`pywebview`) sehingga terasa seperti aplikasi *desktop* native.

---

## 🎮 Cara Bermain (Kontrol Gestur)

Pastikan kamu berada di tempat dengan pencahayaan yang cukup agar Webcam dapat mendeteksi tangan dengan baik.

### 1. Memulai Permainan
- Berikan gestur **👍 Jempol ke Atas (Thumbs Up)** ke arah kamera.
- Pastikan jempol tegak lurus dan keempat jari lainnya mengepal rapat. Hitung mundur 3 detik akan dimulai.

### 2. Rotasi Kamera (Tangan Kiri 🟢)
- **Grab & Drag:** Kepalkan tangan kirimu (sentuh ujung jari tengah ke telapak tangan/pangkal). Garis kerangka di layar akan berubah menjadi oranye.
- Geser kepalan tanganmu ke kiri atau kanan untuk memutar Grid 3D.

### 3. Membangun Voxel (Tangan Kanan 🟣)
Arahkan kursor kotak hijau di layar menggunakan pergerakan tangan kananmu.
- **Menambah Blok (Cubit Telunjuk):** Pertemukan ujung ibu jari dengan ujung jari telunjuk. Kursor akan menjadi **Biru** dan blok baru akan tercipta.
- **Menghapus Blok (Cubit Jari Manis):** Pertemukan ujung ibu jari dengan ujung jari manis. Kursor akan menjadi **Merah** dan blok akan terhapus.
- **Catatan:** Kamu harus membuka jari (melepas cubitan) terlebih dahulu sebelum bisa melakukan aksi selanjutnya (sistem dilengkapi *cooldown* & *hysteresis* agar tidak *spam*).

---

## 🚀 Cara Menjalankan Aplikasi

Kamu bisa menjalankan aplikasi ini menggunakan dua cara: melalui kode sumber (*Developer Mode*) atau langsung memainkan file executable (*Player Mode*).

### Opsi 1: Menjalankan via Kode Python (`main.py`)
Sangat cocok jika kamu ingin memodifikasi kode atau menjalankan game tanpa proses *compile*.

**Prasyarat:**
- Python 3.x terinstal di sistem.
- Memiliki Webcam yang aktif.

**Langkah-langkah:**
1. *Clone* repositori ini:
   ```bash
   git clone https://github.com/OW3N746/FinalProject_MLIS.git
   cd FinalProject_MLIS
   ```

2. Instal pustaka Python yang dibutuhkan:
   ```bash
   pip install pywebview
   ```

3. Jalankan program:
   ```bash
   python main.py
   ```
   Jendela game akan terbuka secara otomatis!

### Opsi 2: Menjalankan via Aplikasi Mandiri (`main.exe`)
Ini adalah cara termudah jika kamu hanya ingin langsung bermain tanpa perlu menginstal Python atau mengatur environment.

**Langkah-langkah:**
1. Pergi ke tab [**Releases**](https://github.com/OW3N746/FinalProject_MLIS/releases) di halaman GitHub ini.
2. Unduh file `.zip` yang berisi aplikasi.
3. Ekstrak file `.zip` tersebut.
4. Klik dua kali pada file `main.exe` (atau nama file `.exe` yang tersedia di dalamnya).

**⚠️ Peringatan Keamanan (False Positive):** Jika Windows Defender / SmartScreen memunculkan peringatan layar biru ("Windows protected your PC"), klik tulisan "More info", lalu klik tombol "Run anyway". Ini terjadi karena aplikasi di-compile secara mandiri tanpa sertifikat penerbit berbayar.

---

## 📋 Persyaratan Teknis

- Python 3.7 atau lebih tinggi
- Webcam dengan resolusi minimal 640x480
- Koneksi internet (untuk unduhan awal dependencies)
- RAM minimal 4GB
- Pencahayaan yang cukup di area bermain

---

## 🛠️ Teknologi yang Digunakan

- **Three.js** - Rendering grafik 3D
- **MediaPipe** - Hand tracking dan gesture recognition
- **pywebview** - Desktop application wrapper
- **Python** - Backend dan logic game

---

## 📝 Lisensi

Proyek ini dibuat untuk keperluan akademik sebagai Final Project MLIS.

---

## 🤝 Kontribusi

Jika kamu menemukan bug atau punya saran fitur, silakan buka [issue](https://github.com/OW3N746/FinalProject_MLIS/issues) atau kirimkan pull request!

---

**Selamat bermain! 🎮✨**
