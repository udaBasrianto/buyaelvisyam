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
6. Versi rilis Android saat ini diatur dari `android/gradle.properties`:
   - `APP_VERSION_CODE=1`
   - `APP_VERSION_NAME=1.0.0`

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
2. Verifikasi icon, splash screen, dan identitas aplikasi
3. Pilih device atau emulator
4. Jalankan build/debug

## Siapkan Signing Release

1. Salin `android/keystore.properties.example` menjadi `android/keystore.properties`
2. Isi file tersebut dengan lokasi file keystore dan password upload key Anda
3. Simpan file `.jks` atau `.keystore` di folder yang aman, jangan di-commit ke git

Contoh:

```properties
storeFile=release-keystore.jks
storePassword=ISI_PASSWORD_STORE
keyAlias=upload
keyPassword=ISI_PASSWORD_KEY
```

Jika `android/keystore.properties` tersedia, project ini bisa langsung build bundle release dari Gradle.

## Testing Yang Disarankan

1. Login dari perangkat Android
2. Buka artikel detail dan pastikan navigasi berjalan normal
3. Tes share, bookmark, dan upload gambar bukti transfer
4. Tes link artikel dari browser atau WhatsApp lalu buka ke aplikasi
5. Tes tombol back di beberapa halaman

## Build Untuk Play Store

1. Build web terbaru dan sync ke Android:

```bash
npm run android
```

2. Untuk build bundle release dari terminal:

```bash
npm run android:bundle:release
```

3. File hasil build akan berada di:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

4. Alternatif lewat Android Studio:
   - `Build > Generate Signed Bundle / APK`
   - pilih `Android App Bundle`
   - pilih upload keystore
   - build file `.aab`

## Checklist Sebelum Upload

1. Naikkan `APP_VERSION_CODE` setiap kali upload build baru ke Play Console
2. Ubah `APP_VERSION_NAME` jika ingin menampilkan versi baru ke pengguna
3. Pastikan `.env` memakai `VITE_SITE_URL` dan `VITE_API_URL` production
4. Tes login, detail artikel, share, bookmark, dan back button di perangkat Android
5. Siapkan `privacy policy`, screenshot aplikasi, dan icon Play Store 512x512
6. Bila ingin deep link verified benar-benar aktif, tambahkan `assetlinks.json` di domain utama setelah upload key final tersedia

## Catatan Penting

- Runtime Android tidak boleh bergantung ke `localhost`
- Untuk build release mobile, `VITE_API_URL` harus mengarah ke backend publik
- Bila `appId` ingin diganti, ubah di `capacitor.config.ts`, `android/app/build.gradle`, dan `android/app/src/main/res/values/strings.xml` sebelum rilis pertama
- Deep link verified akan lebih mulus jika domain utama menyajikan file `/.well-known/assetlinks.json`
- Icon launcher, monochrome icon, dan splash sekarang sudah memakai logo/fav icon aktif dari situs
