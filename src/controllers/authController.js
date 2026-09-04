import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { UserModel } from '../models/userModel.js';
import { MasjidModel } from '../models/masjidModel.js';

export const AuthController = {
  showLogin(req, res) {
    res.render('auth/login', {
      title: 'Masuk - DanaMasjid',
      layout: 'layouts/auth',
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  },

  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        req.flash('error', 'Email dan kata sandi wajib diisi.');
        return res.redirect('/auth/login');
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        req.flash('error', 'Email atau kata sandi tidak sesuai.');
        return res.redirect('/auth/login');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        req.flash('error', 'Email atau kata sandi tidak sesuai.');
        return res.redirect('/auth/login');
      }

      // Simpan session pengguna
      req.session.user = {
        id: user.id,
        masjid_id: user.masjid_id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nama_masjid: user.nama_masjid,
        alamat_masjid: user.alamat,
        saldo_awal: user.saldo_awal
      };

      req.flash('success', `Selamat datang kembali, ${user.nama}!`);
      return res.redirect('/dashboard');
    } catch (error) {
      console.error('Error saat login:', error);
      req.flash('error', 'Terjadi kesalahan sistem saat proses masuk.');
      return res.redirect('/auth/login');
    }
  },

  showRegister(req, res) {
    res.render('auth/register', {
      title: 'Daftar Masjid Baru - DanaMasjid',
      layout: 'layouts/auth',
      messages: {
        error: req.flash('error'),
        success: req.flash('success')
      }
    });
  },

  async handleRegister(req, res) {
    const client = await pool.connect();
    try {
      const {
        nama_pengurus,
        email,
        password,
        nama_masjid,
        alamat_masjid,
        saldo_awal
      } = req.body;

      if (!nama_pengurus || !email || !password || !nama_masjid) {
        req.flash('error', 'Semua bidang wajib (nama, email, kata sandi, nama masjid) harus diisi.');
        return res.redirect('/auth/register');
      }

      // Cek apakah email sudah terdaftar
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        req.flash('error', 'Email tersebut sudah terdaftar. Silakan gunakan email lain atau masuk.');
        return res.redirect('/auth/register');
      }

      await client.query('BEGIN');

      // 1. Buat data Masjid
      const parsedSaldoAwal = parseFloat(saldo_awal) || 0;
      const masjid = await MasjidModel.create(
        {
          nama_masjid,
          alamat: alamat_masjid || null,
          saldo_awal: parsedSaldoAwal
        },
        client
      );

      // 2. Hash Password & Buat User Admin/Bendahara
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await UserModel.create(
        {
          masjid_id: masjid.id,
          nama: nama_pengurus,
          email,
          password_hash: passwordHash,
          role: 'bendahara'
        },
        client
      );

      // 3. Tambahkan Kategori Standar Otomatis
      const defaultCategories = [
        { nama: 'Infak Kotak Jumat', tipe: 'masuk' },
        { nama: 'Infak Kotak Tromol', tipe: 'masuk' },
        { nama: 'Zakat, Infaq & Sedekah', tipe: 'masuk' },
        { nama: 'Sumbangan Donatur Tetap', tipe: 'masuk' },
        { nama: 'Listrik, Air & Internet', tipe: 'keluar' },
        { nama: 'Kebersihan & Alat Masjid', tipe: 'keluar' },
        { nama: 'Honor Khotib & Penceramah', tipe: 'keluar' },
        { nama: 'Pemeliharaan Gedung & Sound', tipe: 'keluar' }
      ];

      for (const cat of defaultCategories) {
        await client.query(
          `INSERT INTO categories (masjid_id, nama_kategori, tipe) VALUES ($1, $2, $3)`,
          [masjid.id, cat.nama, cat.tipe]
        );
      }

      await client.query('COMMIT');

      // Simpan session dan arahkan ke dashboard
      req.session.user = {
        id: newUser.id,
        masjid_id: masjid.id,
        nama: newUser.nama,
        email: newUser.email,
        role: newUser.role,
        nama_masjid: masjid.nama_masjid,
        alamat_masjid: masjid.alamat,
        saldo_awal: masjid.saldo_awal
      };

      req.flash('success', 'Registrasi masjid berhasil! Selamat datang di DanaMasjid.');
      return res.redirect('/dashboard');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saat registrasi:', error);
      req.flash('error', 'Terjadi kesalahan sistem saat mendaftarkan masjid.');
      return res.redirect('/auth/register');
    } finally {
      client.release();
    }
  },

  handleLogout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/auth/login');
    });
  }
};
