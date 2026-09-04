-- Skrip Pembuatan Tabel Sistem Keuangan Masjid Multi-Tenant
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabel Masjids (Tenant)
CREATE TABLE IF NOT EXISTS masjids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_masjid VARCHAR(255) NOT NULL,
    alamat TEXT,
    saldo_awal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Users (Pengurus / DKM)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'bendahara',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Categories (Kategori Pemasukan / Pengeluaran)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    nama_kategori VARCHAR(100) NOT NULL,
    tipe VARCHAR(20) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Transactions (Pencatatan Kas Masuk / Keluar)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id UUID NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    kategori_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    tipe VARCHAR(20) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
    nominal NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk optimasi query multi-tenant & filtering periode
CREATE INDEX IF NOT EXISTS idx_users_masjid_id ON users(masjid_id);
CREATE INDEX IF NOT EXISTS idx_categories_masjid_id ON categories(masjid_id);
CREATE INDEX IF NOT EXISTS idx_transactions_masjid_id ON transactions(masjid_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON transactions(tanggal);
CREATE INDEX IF NOT EXISTS idx_transactions_tipe ON transactions(tipe);

-- 5. Tabel Comments (Komentar & Testimoni Jamaah / Pengurus)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(100) NOT NULL DEFAULT 'Hamba Allah',
    komentar TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
