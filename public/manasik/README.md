# Simulasi Manasik Umrah & Haji 3D

Aplikasi statis (HTML + CSS + JavaScript + Three.js). **Tidak perlu install atau build.**

## Cara menjalankan

1. Klik dua kali **`jalankan.bat`**.
2. Browser akan terbuka otomatis di **http://127.0.0.1:8090/**

Atau lewat terminal:

```bash
cd D:\manasik
python -m http.server 8090 --bind 127.0.0.1
```

lalu buka http://127.0.0.1:8090/

> **Penting:** jangan membuka `index.html` langsung dengan klik dua kali.
> Browser memblokir ES module pada `file://`, sehingga halaman akan kosong.
> Harus lewat server lokal (cara di atas).

## Kebutuhan

- Koneksi internet — Three.js dan Google Fonts dimuat dari CDN.
- Browser modern dengan WebGL (Chrome / Edge / Firefox / Safari).

## Isi simulasi

**Umrah (11 tahap):** ihram & talbiyah di miqat → masuk Masjidil Haram →
tawaf 7 putaran dari Hajar Aswad → shalat di Maqam Ibrahim → sa'i 7 kali
dari Safa ke Marwah → tahallul.

**Haji — pilih salah satu jenis manasik:**
- **Tamattu' (15 tahap):** umrah dahulu, tahallul, lalu ihram haji 8 Dzulhijjah →
  mabit Mina → wukuf Arafah → mabit Muzdalifah → ramy Aqabah → hadyu →
  tahallul → tawaf ifadah (tanpa sa'i) → ramy hari tasyrik → nafar → wada'.
- **Qiran (17 tahap):** ihram umrah+haji di miqat → tawaf qudum → Mina/Arafah/
  Muzdalifah → ramy → hadyu → tahallul → satu tawaf ifadah + satu sa'i →
  tasyrik → wada'.
- **Ifrad (17 tahap):** ihram haji saja → tawaf qudum → Mina/Arafah/Muzdalifah →
  ramy → tanpa hadyu → tahallul → tawaf ifadah + sa'i → tasyrik → wada'.

Setiap tahap dilengkapi dalil, catatan sunnah, kuis koreksi, dan hitungan
otomatis (putaran tawaf, perjalanan sa'i, butir kerikil).

## Referensi jenis haji

- [Muslim.or.id — Tiga Cara Manasik Haji](https://muslim.or.id/10110-fikih-haji-2-tiga-cara-manasik-haji.html)
- [Almanhaj — Jenis-jenis Ibadah Haji](https://almanhaj.or.id/84056-jenis-jenis-ibadah-haji.html)
- [Konsultasi Syariah — Macam-macam Manasik Haji](https://konsultasisyariah.com/2976-macam-macam-manasik-haji.html)

## Kontrol

- **Drag** untuk memutar kamera, **scroll** untuk zoom.
- Tombol **1×–3,6×** mempercepat animasi, **Jeda** menghentikan sementara.
- Saat melontar jumrah: klik dinding jumrah di layar 3D, atau kartu jumrah di panel.
- Wukuf dan mabit mempercepat jam simulasi (matahari ikut berubah).

## Struktur file

```
D:\manasik\
├── index.html          # halaman aplikasi
├── styles.css          # tampilan
├── jalankan.bat        # server lokal + buka browser
├── js\
│   ├── app.js          # alur simulasi & interaksi
│   ├── data.js         # kurikulum, dalil, kuis, referensi
│   └── scene\
│       ├── builders.js # geometri Masjidil Haram, Mina, Muzdalifah, Arafah
│       └── world.js    # renderer, kamera, avatar, kerumunan, jamarat
└── preview\            # tangkapan layar
```

## Catatan fikih

Panduan mengikuti madzhab Syafi'i (mayoritas jamaah Indonesia). Perbedaan
pendapat dijelaskan sebagai catatan. Untuk ibadah sesungguhnya, tetap ikuti
bimbingan pembimbing manasik.
