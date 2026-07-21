# Sistem Manajemen Tugas Otomedia

Repositori ini berisi implementasi teknis untuk asesmen Fullstack Engineer. Tujuan dari proyek ini adalah untuk mengevaluasi kemampuan fullstack terapan dalam skenario tim produk yang sudah berjalan, secara spesifik memelihara dan memperluas fungsionalitas aplikasi Manajemen Tugas tanpa merusak fungsionalitas yang sudah ada.

## Arsitektur Tumpukan Teknologi

- **Integrasi Backend**: Go (Gin Framework)
- **Lapisan Persistensi**: MySQL 8.0
- **Lapisan Tembolok (Cache)**: Redis 7.0
- **Klien Frontend**: React Native, TypeScript

## Skenario Asesmen & Implementasi

Berikut adalah rincian implementasi yang merespons spesifikasi kebutuhan asesmen secara langsung.

### Tugas 1 - Backend (40%)

- **Penambahan fitur penyaringan (filtering)**: Mengimplementasikan penyusunan kueri dinamis untuk parameter `status`, `keyword`, `assignee`, `page`, `limit`, dan `sort`.
- **Implementasi PUT /api/tasks/{id}**: Menangani pembaruan parsial melalui validasi DTO ketat dan eksekusi kueri GORM yang persisten.
- **Implementasi penghapusan lunak (soft DELETE) /api/tasks/{id}**: Memanfaatkan plugin `soft_delete` dari GORM untuk memastikan retensi data untuk kebutuhan auditabilitas tanpa mengorbankan performa kueri.
- **Konsistensi respons galat (error)**: Menstandardisasi seluruh respons galat API agar mematuhi kontrak JSON seragam melalui fungsi pembungkus (wrapper) utilitas khusus.

### Tugas 2 - Redis (15%)

- **Tembolok (Cache) GET /api/tasks selama 60 detik**: Mengimplementasikan tembolok pada tingkat layanan (service-level) dengan batasan TTL. Untuk mencegah cache stampedes di bawah beban puncak, pustaka `golang.org/x/sync/singleflight` digunakan.
- **Invalidasi tembolok pasca create/update/delete**: Operasi mutasi data (write) secara otomatis memicu rutinitas invalidasi tembolok atomik melalui eksekusi skrip Lua.
- **Kunci Tembolok Dinamis (Dynamic Cache Keys)**: Kunci tembolok dihasilkan secara dinamis dengan merangkai semua parameter kueri aktif untuk menjamin akurasi rujukan tembolok pada titik akhir (endpoint) yang menggunakan filter.

### Tugas 3 - Frontend (25%)

- **Input pencarian**: Diimplementasikan dengan mekanisme debouncing yang dioptimalkan untuk mereduksi permintaan (polling) API yang berlebihan.
- **Penyaring status**: Diimplementasikan menggunakan komponen chip interaktif berbasis status (state-driven).
- **Paginasi**: Mengimplementasikan virtualisasi daftar dengan gulir tak terbatas (infinite scrolling) menggunakan komponen `FlatList`.
- **Modal ubah data**: Mengembangkan komponen modal yang dapat direplikasi dengan pendelegasian animasi pada native UI thread.
- **Status pemuatan (Loading state)**: Merender skeleton loaders selama interval latensi jaringan untuk optimalisasi persepsi performa (perceived performance).

### Tugas 4 - Perbaikan Bug (10%)

- **Batasan Judul Duplikat**: Memitigasi galat peladen internal (HTTP 500) dengan menangkap `gorm.ErrDuplicatedKey` dan galat MySQL 1062, untuk mengembalikan respons HTTP 409 Conflict.
- **Sinkronisasi Status**: Memaksa pemuatan ulang daftar (list refresh) secara deterministik pasca mutasi `PUT` yang berhasil melalui manipulasi lapisan jaringan menggunakan antarmuka `AbortController`.
- **Visibilitas Penghapusan Lunak (Soft-delete)**: Mengonfigurasi lapisan ORM secara otomatis untuk memfilter eksklusi rekaman yang dihapus (soft-deleted) dari eksekusi kueri `SELECT` standar.

### Tugas 5 - Pengujian (10%)

- **Pengujian Backend**: Membangun rangkaian pengujian unit memanfaatkan SQLite in-memory dan `miniredis` untuk mengisolasi operasi Update, logika penyaringan pencarian, dan rutinitas invalidasi tembolok tanpa ketergantungan pada dependensi layanan eksternal.
- **Pengujian Frontend**: Mengintegrasikan framework Jest dengan `react-test-renderer` untuk menjalankan pengujian validasi komponen via snapshot testing.

## Rincian Implementasi Kode (Code Breakdown)

### 1. Backend (Go & Gin)

- **`repositories/task_repository.go`**: Menangani seluruh kueri basis data menggunakan GORM. Penyusunan kueri dinamis (_dynamic query building_) diimplementasikan secara ekstensif pada fungsi `FindAll` untuk merangkai kondisi `WHERE` secara kondisional berdasarkan _query params_ tanpa celah SQL Injection. Eksepsi galat (seperti duplikasi judul) dipetakan melalui validasi galat MySQL spesifik (kode 1062) agar lapisan layanan (service) dapat menerima penanda `ErrDuplicateTitle`.
- **`services/task_service.go`**: Lapisan orkestrasi bisnis dan intervensi tembolok (cache). Pada operasi `GetTasks`, mekanisme _Singleflight_ (`s.sg.Do`) dikonfigurasi untuk menangkap permintaan identik yang bersamaan secara simultan, sehingga pangkalan data terhindar dari _Cache Stampede_. Invalidasi memori pasca mutasi berjalan secara asinkron (atau direkomendasikan berjalan di _goroutine_) menggunakan instruksi skrip Lua untuk membongkar daftar kunci tembolok (`UNLINK`) secara mutlak dan atomik.
- **`controllers/task_controller.go`**: Pengendali laju muatan (payload) HTTP. Mengeksekusi penarikan properti dari `gin.Context` (_query params_, parameter _path_, atau JSON _body_) serta menyelaraskan balasan _status code_ HTTP secara ketat dan konsisten (mengembalikan 409 untuk duplikasi alih-alih 500).

### 2. Frontend (React Native & Expo)

- **`src/app/index.tsx`**: Kontainer utama (smart component) perutean. Mengatur pengelolaan siklus hidup perenderan (lifecycle) yang sangat kompleks. `AbortController` diinisialisasi dalam `fetchTasks` untuk secara presisi mendiskualifikasi interaksi API yang usang (_stale_) jika mutasi input (penyaringan status/pencarian) terjadi sebelum intervensi jaringan diselesaikan.
- **`src/components/EditTaskModal.tsx`**: Komponen antarmuka yang sangat terenkapsulasi (dumb component). Modul ini menghindari siklus hidup re-render dari penampung utamanya dan mentransformasikan transisi elemen ke dalam bentuk primitif _native thread_ menggunakan implementasi `Animated.spring` dan `Animated.timing`.
- **Ekosistem UI**: Komponen `StatusBadge` dan `SkeletonCard` yang dikembangkan dengan _Atomic Design_ memastikan hierarki komponen pada tingkat produksi (production-level) tidak terkontaminasi oleh gaya yang disisipkan berulang (inline styling) atau logika eksternal yang tidak terkait.

## Penerapan & Persiapan (Deployment & Setup)

### Daftar Hasil Kerja (Deliverables)

- Repositori Git
- Dokumentasi README
- Migrasi basis data (AutoMigrate via GORM)
- Pengujian unit (Unit tests)

### Penyediaan Infrastruktur Lokal (Docker)

```bash
docker run --name otomedia-redis -p 6379:6379 -d redis:7-alpine
docker run --name otomedia-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=otomedia_tasks -p 3306:3306 -d mysql:8.0
```

### Eksekusi Backend

```bash
cd backend
go mod tidy
go run main.go
```

### Eksekusi Frontend

```bash
cd frontend
npm install
npm run web
```
