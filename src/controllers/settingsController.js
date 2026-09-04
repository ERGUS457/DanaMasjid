import bcrypt from 'bcryptjs';
import { MasjidModel } from '../models/masjidModel.js';
import { UserModel } from '../models/userModel.js';
import { formatRupiah, parseNominal } from '../utils/formatters.js';

export const SettingsController = {
  async index(req, res) {
    try {
      const userId = req.session.user.id;
      const masjidId = req.session.user.masjid_id;

      const [user, masjid] = await Promise.all([
        UserModel.findById(userId),
        MasjidModel.findById(masjidId)
      ]);

      if (!user || !masjid) {
        req.flash('error', 'Data pengguna atau masjid tidak ditemukan.');
        return res.redirect('/dashboard');
      }

      res.render('settings/index', {
        title: 'Pengaturan - DanaMasjid',
        user,
        masjid,
        formatRupiah,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error rendering settings index:', error);
      req.flash('error', 'Gagal memuat halaman pengaturan.');
      res.redirect('/dashboard');
    }
  },

  async updateMasjid(req, res) {
    try {
      const masjidId = req.session.user.masjid_id;
      const { nama_masjid, alamat, saldo_awal } = req.body;

      if (!nama_masjid || !nama_masjid.trim()) {
        req.flash('error', 'Nama masjid wajib diisi.');
        return res.redirect('/pengaturan');
      }

      const numericSaldoAwal = parseNominal(saldo_awal);
      const safeSaldoAwal = isNaN(numericSaldoAwal) ? 0 : numericSaldoAwal;

      const updated = await MasjidModel.update(masjidId, {
        nama_masjid: nama_masjid.trim(),
        alamat: alamat ? alamat.trim() : '',
        saldo_awal: safeSaldoAwal
      });

      // Update session agar perubahan nama masjid langsung terlihat di header/sidebar
      if (req.session && req.session.user) {
        req.session.user.nama_masjid = updated.nama_masjid;
        req.session.user.alamat_masjid = updated.alamat;
      }

      req.flash('success', 'Data profil masjid dan saldo awal kas berhasil diperbarui.');
      res.redirect('/pengaturan');
    } catch (error) {
      console.error('Error updating masjid info:', error);
      req.flash('error', 'Terjadi kesalahan saat memperbarui informasi masjid.');
      res.redirect('/pengaturan');
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.session.user.id;
      const { nama, email } = req.body;

      if (!nama || !nama.trim()) {
        req.flash('error', 'Nama pengurus wajib diisi.');
        return res.redirect('/pengaturan');
      }

      if (!email || !email.trim()) {
        req.flash('error', 'Alamat email wajib diisi.');
        return res.redirect('/pengaturan');
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Cek apakah email sudah dipakai pengguna lain
      const existingUser = await UserModel.findByEmail(trimmedEmail);
      if (existingUser && existingUser.id !== userId) {
        req.flash('error', 'Alamat email tersebut sudah terdaftar pada akun lain.');
        return res.redirect('/pengaturan');
      }

      const updated = await UserModel.updateProfile(userId, {
        nama: nama.trim(),
        email: trimmedEmail
      });

      // Update session agar nama langsung berubah di UI
      if (req.session && req.session.user) {
        req.session.user.nama = updated.nama;
        req.session.user.email = updated.email;
      }

      req.flash('success', 'Profil nama dan email pengurus berhasil diperbarui.');
      res.redirect('/pengaturan');
    } catch (error) {
      console.error('Error updating user profile:', error);
      req.flash('error', 'Terjadi kesalahan saat memperbarui profil pengurus.');
      res.redirect('/pengaturan');
    }
  },

  async updatePassword(req, res) {
    try {
      const userId = req.session.user.id;
      const { password_lama, password_baru, konfirmasi_password } = req.body;

      if (!password_lama || !password_baru || !konfirmasi_password) {
        req.flash('error', 'Semua kolom kata sandi wajib diisi.');
        return res.redirect('/pengaturan');
      }

      if (password_baru.length < 6) {
        req.flash('error', 'Kata sandi baru minimal harus 6 karakter.');
        return res.redirect('/pengaturan');
      }

      if (password_baru !== konfirmasi_password) {
        req.flash('error', 'Konfirmasi kata sandi baru tidak sesuai.');
        return res.redirect('/pengaturan');
      }

      const user = await UserModel.findWithPassword(userId);
      if (!user) {
        req.flash('error', 'Pengguna tidak ditemukan.');
        return res.redirect('/pengaturan');
      }

      const isMatch = await bcrypt.compare(password_lama, user.password_hash);
      if (!isMatch) {
        req.flash('error', 'Kata sandi saat ini yang Anda masukkan salah.');
        return res.redirect('/pengaturan');
      }

      const saltRounds = 10;
      const newHash = await bcrypt.hash(password_baru, saltRounds);

      await UserModel.updatePassword(userId, newHash);

      req.flash('success', 'Kata sandi akun Anda berhasil diperbarui dengan aman.');
      res.redirect('/pengaturan');
    } catch (error) {
      console.error('Error updating password:', error);
      req.flash('error', 'Terjadi kesalahan saat mengubah kata sandi.');
      res.redirect('/pengaturan');
    }
  }
};
