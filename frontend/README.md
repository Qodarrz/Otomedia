# Klien Frontend - Sistem Manajemen Tugas Otomedia

Klien frontend adalah aplikasi lintas platform yang direkayasa memanfaatkan ekosistem React Native, Expo Router, dan TypeScript. Arsitektur ini difokuskan pada optimasi perenderan antarmuka, manajemen status (state management) yang deterministik, dan keamanan tipe (type safety) yang ketat pada tahapan kompilasi.

## Spesifikasi Teknis

- **Arsitektur Komponen**: Mengimplementasikan prinsip-prinsip Atomic Design untuk memastikan komponen UI (contoh: StatusBadge, SkeletonCard) mempertahankan tingkat kohesi yang tinggi dan tetap berpasangan longgar (loosely coupled) terhadap logika domain.
- **Manajemen Status & Lapisan Jaringan**: Permintaan antarmuka pemrograman aplikasi (API) dikelola menggunakan `fetch` asli dan dikendalikan dengan implementasi `AbortController` guna menangani kondisi balapan (race conditions) asinkron selama mutasi status frekuensi tinggi (contoh: pengetikan pencarian cepat).
- **Virtualisasi Daftar**: Memanfaatkan komponen `FlatList` untuk melakukan perenderan himpunan data secara malas (lazy rendering), terbukti meminimalkan konsumsi memori dan manipulasi node DOM pada penargetan lingkungan web.
- **Performa Interaksi**: Sinkronisasi animasi kustom digerakkan oleh Animated API untuk memindahkan kalkulasi berat ke utas native UI (native UI thread). Pengurangan frekuensi input difasilitasi melalui mekanisme debouncing matematis guna memitigasi latensi API.
- **Keamanan Tipe (Type Safety)**: Penegakan polimorfisme dan definisi statis TypeScript secara menyeluruh (end-to-end) pada antarmuka properti komponen dan muatan jaringan untuk mengeliminasi eksploitasi galat tipe saat runtime.

## Topologi Direktori

- `/src/api` : Abstraksi lapisan jaringan yang membungkus integrasi titik akhir (endpoint) dan interseptor muatan.
- `/src/app` : Skema konfigurasi Expo Router dan pemetaan perutean berbasis hierarki berkas.
- `/src/components` : Komponen komposit terintegrasi yang menjembatani entitas komponen visual dengan logika layanan eksternal.
- `/src/components/ui` : Elemen visual primitif dan tanpa status (stateless), tidak terikat pada struktur domain model tertentu.
- `/src/constants` : Agregator token sistem desain visual (skala warna, metrik tipografi).
- `/src/types` : Ruang lingkup deklarasi global untuk entitas tipe dan antarmuka struktur data TypeScript.

## Eksekusi & Pengujian

```bash
# Selesaikan instalasi modul dependensi
npm install

# Inisialisasi peladen pengembangan Expo untuk penargetan resolusi web
npm run web

# Eksekusi instrumen pengujian Jest (Snapshot testing)
npm test
```
