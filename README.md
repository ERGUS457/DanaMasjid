# 🕌 DanaMasjid - Sistem Pencatatan Keuangan Kas Masjid (Multi-Tenant)

Aplikasi web monolitik modern berbasis **Node.js (Express.js + EJS + Tailwind CSS)** untuk pencatatan dan transparansi tata kelola keuangan kas masjid secara **multi-tenant** (1 akun pengurus = 1 masjid terisolasi). Terhubung langsung ke cloud PostgreSQL di **Neon Tech**.

---

## 🌟 Fitur Utama

- **Isolasi Multi-Tenant Aman:** Setiap masjid memiliki ruang data mandiri. Seluruh kueri transaksi dan kategori difilter ketat berdasarkan `masjid_id` pengguna yang login.
- **Autentikasi Pengurus:**
  - Registrasi otomatis: Pendaftaran baru langsung membuat data masjid baru, akun bendahara, dan 8 kategori pos kas standar dalam satu transaksi database atomik.
  - Login & proteksi sesi dengan enkripsi kata sandi menggunakan `bcryptjs`.
- **Dashboard Ringkasan Kas:**
  - Kartu Saldo Kas Berjalan (Saldo Awal + Total Masuk - Total Keluar).
  - Indikator Kas Masuk & Kas Keluar bulan berjalan.
  - Tabel 7 transaksi mutasi terbaru.
  - Tombol aksi cepat pencatatan kas masuk & keluar.
- **Manajemen Mutasi Transaksi (CRUD):**
  - Catat kas masuk (penerimaan infak, donatur, zakat) & kas keluar (operasional, listrik, honor khotib).
  - Filter interaktif berdasarkan rentang tanggal, jenis pos kas, atau kategori.
  - Edit koreksi nominal atau uraian transaksi.
  - Hapus catatan transaksi dengan konfirmasi aman.
- **Manajemen Pos Kategori Kas (CRUD):**
  - Tambah kategori pos penerimaan dan pengeluaran secara fleksibel.
  - Penghapusan kategori aman (relasi transaksi dipertahankan).
- **Laporan & Rekapitulasi Pembukuan:**
  - **Pratinjau Cetak Resmi (Print-Ready):** Tata letak A4 resmi lengkap dengan kop surat nama masjid, ringkasan kas, tabel mutasi, dan kolom tanda tangan Ketua DKM & Bendahara.
  - **Ekspor PDF Langsung:** Unduh dokumen PDF laporan resmi secara instan via `pdfkit`.
  - **Ekspor Excel / CSV:** Format CSV berstandar UTF-8 BOM yang langsung rapi saat dibuka di Microsoft Excel atau Google Sheets.

---

## 📂 Struktur Direktori Proyek

```text
DanaMasjid/
├── .env.example              # Template konfigurasi environment
├── .gitignore                # Berkas yang diabaikan Git (node_modules, .env)
├── README.md                 # Dokumentasi panduan instalasi & penggunaan
├── package.json              # Dependensi dan skrip Node.js (ES Module)
├── schema.sql                # Skema DDL tabel PostgreSQL (Neon Tech)
├── src/
│   ├── app.js                # Inisialisasi Express & konfigurasi server
│   ├── config/
│   │   └── db.js             # Pool koneksi PostgreSQL (SSL Neon Tech)
│   ├── controllers/
│   │   ├── authController.js         # Logika registrasi, login, & logout
│   │   ├── dashboardController.js    # Ringkasan saldo & data dashboard
│   │   ├── transactionController.js  # CRUD transaksi kas & filter
│   │   ├── categoryController.js     # CRUD pos kategori kas
│   │   └── reportController.js       # Rekapitulasi, cetak, PDF & CSV
│   ├── middleware/
│   │   └── auth.js           # Middleware proteksi sesi & otentikasi
│   ├── models/
│   │   ├── masjidModel.js    # Operasi tabel masjids
│   │   ├── userModel.js      # Operasi tabel users
│   │   ├── categoryModel.js  # Operasi tabel categories
│   │   └── transactionModel.js # Operasi tabel transactions & agregasi saldo
│   ├── public/
│   │   ├── css/
│   │   │   └── custom.css    # Tipografi & pengaturan cetak @media print
│   │   └── js/
│   │       └── main.js       # Skrip interaktif modal & alert
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── reportRoutes.js
│   ├── scripts/
│   │   ├── migrate.js        # Skrip migrasi tabel basis data
│   │   └── seed.js           # Skrip seeder akun demo & sampel transaksi
│   ├── utils/
│   │   ├── formatters.js     # Format mata uang Rupiah & tanggal Indonesia
│   │   ├── pdfGenerator.js   # Generator PDF dokumen kas resmi
│   │   └── csvGenerator.js   # Generator berkas CSV untuk Microsoft Excel
│   └── views/
│       ├── layouts/
│       │   ├── main.ejs      # Layout utama dashboard & sidebar
│       │   └── auth.ejs      # Layout halaman login & register
│       ├── partials/
│       │   └── alert.ejs     # Alert flash error/success
│       ├── auth/
│       │   ├── login.ejs
│       │   └── register.ejs
│       ├── dashboard/
│       │   └── index.ejs
│       ├── transactions/
│       │   └── index.ejs
│       ├── categories/
│       │   └── index.ejs
│       └── reports/
│           ├── index.ejs
│           └── print.ejs     # Halaman siap cetak format A4
```

---

## 🗄️ Skema Basis Data (PostgreSQL)

Aplikasi menggunakan 4 tabel inti yang saling berelasi:
1. `masjids`: Menyimpan identitas masjid (tenant), alamat, dan saldo awal pembukuan.
2. `users`: Menyimpan akun pengurus/bendahara yang terikat ke `masjid_id`.
3. `categories`: Daftar pos pemasukan (`masuk`) dan pos belanja (`keluar`) per masjid.
4. `transactions`: Seluruh mutasi kas masuk dan keluar dengan pencatatan nominal, tanggal, dan peruntukan.

---

## 🚀 Langkah Instalasi & Menjalankan Aplikasi

### 1. Klon Repositori & Pasang Dependensi
```bash
git clone https://github.com/ERGUS457/DanaMasjid.git
cd DanaMasjid
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi Neon Tech PostgreSQL di dalam `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=kunci_rahasia_sesi_anda_yang_sangat_aman
NODE_ENV=development
```

### 3. Migrasi Basis Data ke Neon Tech
Jalankan perintah berikut untuk membuat seluruh tabel dan indeks otomatis:
```bash
npm run migrate
```

### 4. (Opsional) Inisialisasi Data Demo / Seeder
Untuk memuat data masjid sampel (*Masjid Raya Al-Ikhlas*), kategori standar, dan beberapa transaksi awal:
```bash
npm run seed
```

### 5. Menjalankan Server Aplikasi
- **Mode Pengembangan (Hot Reload):**
  ```bash
  npm run dev
  ```
- **Mode Produksi:**
  ```bash
  npm start
  ```

Buka browser Anda dan akses: **`http://localhost:3000`**

---

## 👤 Akun Uji Coba (Demo Seed)
Setelah menjalankan `npm run seed`, Anda dapat langsung masuk dengan kredensial:
- **Email:** `bendahara@masjid.id`
- **Kata Sandi:** `password123`

---

## 📤 Perintah Git & Push ke GitHub

Untuk melakukan sinkronisasi dan push ke repositori GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit Sistem Keuangan Kas Masjid Multi-Tenant"
git remote add origin https://github.com/ERGUS457/DanaMasjid.git
git branch -M main
git push -u origin main
```
*(Catatan: Pastikan file `.env` tidak ter-push ke publik karena sudah otomatis diabaikan oleh `.gitignore`)*.
