import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function runSeed() {
  console.log('🌱 Menjalankan seeder data awal...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cek apakah sudah ada masjid sampel
    const existingMasjid = await client.query("SELECT id FROM masjids WHERE nama_masjid = 'Masjid Raya Al-Ikhlas' LIMIT 1");

    let masjidId;
    if (existingMasjid.rows.length > 0) {
      masjidId = existingMasjid.rows[0].id;
      console.log('ℹ️ Masjid sampel sudah ada dengan ID:', masjidId);
    } else {
      const resMasjid = await client.query(
        `INSERT INTO masjids (nama_masjid, alamat, saldo_awal) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['Masjid Raya Al-Ikhlas', 'Jl. Merdeka No. 45, Kota Sejahtera', 5000000]
      );
      masjidId = resMasjid.rows[0].id;
      console.log('✅ Masjid sampel dibuat dengan ID:', masjidId);
    }

    // 2. Buat User Pengurus Utama (Bendahara)
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', ['bendahara@masjid.id']);
    if (existingUser.rows.length === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await client.query(
        `INSERT INTO users (masjid_id, nama, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [masjidId, 'Ustadz Ahmad (Bendahara)', 'bendahara@masjid.id', passwordHash, 'bendahara']
      );
      console.log('✅ Akun user dibuat: bendahara@masjid.id / password123');
    }

    // 3. Kategori Standar
    const defaultCategories = [
      { nama: 'Infak Kotak Jumat', tipe: 'masuk' },
      { nama: 'Infak Kotak Tromol', tipe: 'masuk' },
      { nama: 'Zakat, Infaq & Sedekah', tipe: 'masuk' },
      { nama: 'Sumbangan Donatur Tetap', tipe: 'masuk' },
      { nama: 'Listrik, Air & Internet', tipe: 'keluar' },
      { nama: 'Kebersihan & Alat Kebersihan', tipe: 'keluar' },
      { nama: 'Honor Khotib & Imam', tipe: 'keluar' },
      { nama: 'Pemeliharaan Gedung & AC', tipe: 'keluar' }
    ];

    const categoryMap = {};
    for (const cat of defaultCategories) {
      const resCat = await client.query(
        `INSERT INTO categories (masjid_id, nama_kategori, tipe)
         VALUES ($1, $2, $3)
         RETURNING id, nama_kategori`,
        [masjidId, cat.nama, cat.tipe]
      );
      categoryMap[cat.nama] = resCat.rows[0].id;
    }
    console.log('✅ Kategori kas default berhasil ditambahkan.');

    // 4. Contoh Transaksi
    const today = new Date().toISOString().split('T')[0];
    const sampleTransactions = [
      {
        kategori_id: categoryMap['Infak Kotak Jumat'],
        tanggal: today,
        tipe: 'masuk',
        nominal: 2450000,
        keterangan: 'Perolehan Infak Sholat Jumat Pekan 1'
      },
      {
        kategori_id: categoryMap['Sumbangan Donatur Tetap'],
        tanggal: today,
        tipe: 'masuk',
        nominal: 1000000,
        keterangan: 'Transfer Hamba Allah untuk kas operasional'
      },
      {
        kategori_id: categoryMap['Listrik, Air & Internet'],
        tanggal: today,
        tipe: 'keluar',
        nominal: 850000,
        keterangan: 'Pembayaran tagihan listrik PLN bulan berjalan'
      },
      {
        kategori_id: categoryMap['Honor Khotib & Imam'],
        tanggal: today,
        tipe: 'keluar',
        nominal: 500000,
        keterangan: 'Bisyarah Khotib Jumat'
      }
    ];

    for (const trx of sampleTransactions) {
      if (trx.kategori_id) {
        await client.query(
          `INSERT INTO transactions (masjid_id, kategori_id, tanggal, tipe, nominal, keterangan)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [masjidId, trx.kategori_id, trx.tanggal, trx.tipe, trx.nominal, trx.keterangan]
        );
      }
    }
    // 5. Contoh Komentar & Doa Jamaah
    const existingComments = await client.query('SELECT COUNT(*) FROM comments');
    if (parseInt(existingComments.rows[0].count) === 0) {
      const sampleComments = [
        {
          nama: 'H. Fauzan (Bendahara)',
          komentar: 'Alhamdulillah, aplikasi ini sangat membantu pencatatan infak Jumat di masjid kami jadi jauh lebih transparan dan rapi.'
        },
        {
          nama: 'Hamba Allah',
          komentar: 'Semoga menjadi amal jariyah untuk para pengembang. Laporan kas sekarang bisa langsung dicetak dan ditempel di mading masjid.'
        },
        {
          nama: 'Ustadz Ridwan',
          komentar: 'Sangat praktis digunakan dari HP, tidak perlu repot bawa buku kas besar ke masjid saat sholat Jumat.'
        },
        {
          nama: 'Hamba Allah',
          komentar: 'Transparansi kas membuat jamaah makin percaya dan semangat berinfak. Syukron katsiron untuk tim DanaMasjid.'
        },
        {
          nama: 'Pak Bambang (DKM)',
          komentar: 'Fitur cetak A4 dan ekspor PDF-nya mantap sekali, pas untuk laporan pertanggungjawaban kas sebelum khotbah Jumat.'
        }
      ];

      for (const com of sampleComments) {
        await client.query(
          `INSERT INTO comments (nama, komentar) VALUES ($1, $2)`,
          [com.nama, com.komentar]
        );
      }
      console.log('✅ Komentar sampel berhasil ditambahkan.');
    }

    await client.query('COMMIT');
    console.log('🎉 Seeding data selesai dengan sukses!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Terjadi kesalahan saat seeding:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
