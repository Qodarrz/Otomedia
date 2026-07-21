# Layanan Backend - Sistem Manajemen Tugas Otomedia

Layanan backend ini direkayasa menggunakan bahasa Go dan framework web HTTP Gin. Arsitektur ini secara ketat mematuhi pola Controller-Service-Repository, memastikan pemisahan masalah (separation of concerns), kemudahan pengujian (testability), dan modularitas.

## Fitur Arsitektural

- **Titik Akhir (Endpoints) RESTful**: Mematuhi konvensi REST untuk transfer status, menggunakan DTO (Data Transfer Objects) standar untuk validasi permintaan dan pemformatan muatan respons (response payload).
- **Manajemen Tembolok (Cache)**: Redis digunakan untuk meringankan titik akhir dengan beban baca tinggi. Masalah cache stampede di bawah beban konkuren tinggi direduksi menggunakan paket `singleflight`. Operasi tulis (Create, Update, Delete) memicu rutinitas invalidasi tembolok deterministik.
- **Operasi Basis Data**: Terintegrasi dengan MySQL melalui GORM. Lapisan repositori mengabstraksi eksekusi SQL, memfasilitasi pembentukan kueri dinamis untuk filter/pengurutan dan menerapkan batasan (constraints) secara aman terhadap ancaman injeksi SQL.
- **Pengujian Unit Terisolasi**: Rangkaian pengujian memanfaatkan SQLite in-memory dan `miniredis` untuk menyediakan lingkungan yang terisolasi dan tanpa dependensi eksternal, sesuai untuk arsitektur continuous integration (CI/CD).

## Struktur Modul

- `/config` : Pemetaan DSN basis data dan inisialisasi connection pooling Redis.
- `/controllers` : Lapisan transport HTTP yang menangani rute, penguraian parameter, dan validasi muatan.
- `/dto` : Definisi struct untuk validasi permintaan dan serialisasi JSON terstandarisasi.
- `/helpers` : Fungsi utilitas bersama untuk pemformatan respons dan penanganan galat.
- `/middleware` : Pencegat permintaan (contoh: konfigurasi CORS).
- `/models` : Definisi entitas domain yang mengandung anotasi GORM untuk migrasi skema.
- `/repositories` : Lapisan Akses Data (Data Access Layer) yang bertanggung jawab atas mutasi dan kueri basis data secara langsung.
- `/services` : Lapisan logika bisnis inti yang berkoordinasi secara asinkron antara repositori dan layanan memori eksternal (Redis).

## Konfigurasi Lingkungan

Definisikan variabel lingkungan berikut dalam berkas `.env` di dalam direktori `backend` sebelum eksekusi kompilasi:

```env
DB_USER=root
DB_PASSWORD=root
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=otomedia_tasks

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Eksekusi & Pengujian

```bash
# Selesaikan dependensi modul dan jalankan peladen
go mod tidy
go run main.go

# Eksekusi rangkaian pengujian unit dengan keluaran verbose
go test ./... -v
```
