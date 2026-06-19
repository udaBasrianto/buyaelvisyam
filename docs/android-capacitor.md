# Android Dengan Capacitor

Panduan singkat untuk membungkus web app ini menjadi aplikasi Android.

## Persiapan

1. Salin `.env.example` menjadi `.env`.
2. Pastikan `VITE_SITE_URL` mengarah ke domain publik utama.
3. Pastikan `VITE_API_URL` mengarah ke endpoint API publik, misalnya `https://domainanda.com/api`.
4. Install Android Studio beserta Android SDK.
5. Baseline identitas Android saat ini memakai:
   - `appId`: `id.buyaelvisyam.app`
   - `appName`: `Buya Elvisyam`

## Build Web + Sync Android

```bash
npm install
npm run android
```

Perintah di atas akan:

1. Build frontend ke folder `dist`
2. Sinkronkan asset web ke project Android Capacitor

## Perilaku Native Yang Sudah Disiapkan

- Splash screen ditutup otomatis saat app siap
- Status bar Android diatur agar tidak menimpa konten
- Tombol back Android kembali ke halaman sebelumnya
- Jika sedang di beranda, tombol back akan menutup aplikasi
- Deep link yang memakai domain utama akan diarahkan ke route yang sesuai di dalam app

## Buka Project Android

```bash
npm run cap:open:android
```

Lalu dari Android Studio:

1. Tunggu Gradle sync selesai
2. Ubah nama aplikasi, icon, dan splash screen bila perlu
3. Pilih device atau emulator
4. Jalankan build/debug

## Testing Yang Disarankan

1. Login dari perangkat Android
2. Buka artikel detail dan pastikan navigasi berjalan normal
3. Tes share, bookmark, dan upload gambar bukti transfer
4. Tes link artikel dari browser atau WhatsApp lalu buka ke aplikasi
5. Tes tombol back di beberapa halaman

## Build Untuk Play Store

1. Buka project Android di Android Studio
2. Pilih `Build > Generate Signed Bundle / APK`
3. Pilih `Android App Bundle`
4. Buat atau pilih keystore
5. Build file `.aab`
6. Upload ke Google Play Console

## Catatan Penting

- Runtime Android tidak boleh bergantung ke `localhost`
- Untuk build release mobile, `VITE_API_URL` harus mengarah ke backend publik
- Bila `appId` ingin diganti, ubah di `capacitor.config.ts` sebelum rilis pertama
- Bila ingin deep link Android yang lebih resmi, tahap berikutnya adalah menambahkan `assetlinks.json` di domain utama
- Icon dan splash saat ini sudah dibaseline-kan secara internal, tetapi masih disarankan diganti lagi saat logo final resmi sudah tersedia
