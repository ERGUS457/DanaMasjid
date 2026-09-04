import { CategoryModel } from '../models/categoryModel.js';

export const CategoryController = {
  async index(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;

      const [categoriesMasuk, categoriesKeluar] = await Promise.all([
        CategoryModel.findAllByMasjid(masjid_id, 'masuk'),
        CategoryModel.findAllByMasjid(masjid_id, 'keluar')
      ]);

      res.render('categories/index', {
        title: 'Kategori Kas Masjid - DanaMasjid',
        categoriesMasuk,
        categoriesKeluar,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error saat mengambil daftar kategori:', error);
      req.flash('error', 'Gagal memuat kategori kas.');
      res.redirect('/dashboard');
    }
  },

  async create(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { nama_kategori, tipe } = req.body;

      if (!nama_kategori || !tipe || (tipe !== 'masuk' && tipe !== 'keluar')) {
        req.flash('error', 'Nama kategori dan tipe kas (masuk/keluar) harus diisi dengan benar.');
        return res.redirect('/kategori');
      }

      await CategoryModel.create({
        masjid_id,
        nama_kategori: nama_kategori.trim(),
        tipe
      });

      req.flash('success', `Kategori "${nama_kategori.trim()}" (${tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}) berhasil ditambahkan.`);
      return res.redirect('/kategori');
    } catch (error) {
      console.error('Error create category:', error);
      req.flash('error', 'Gagal menambahkan kategori.');
      return res.redirect('/kategori');
    }
  },

  async delete(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { id } = req.params;

      const category = await CategoryModel.findById(id, masjid_id);
      if (!category) {
        req.flash('error', 'Kategori tidak ditemukan.');
        return res.redirect('/kategori');
      }

      const countTrx = await CategoryModel.countTransactions(id, masjid_id);

      await CategoryModel.delete(id, masjid_id);

      if (countTrx > 0) {
        req.flash('success', `Kategori "${category.nama_kategori}" berhasil dihapus (${countTrx} riwayat transaksi kini berstatus Tanpa Kategori).`);
      } else {
        req.flash('success', `Kategori "${category.nama_kategori}" berhasil dihapus.`);
      }

      return res.redirect('/kategori');
    } catch (error) {
      console.error('Error delete category:', error);
      req.flash('error', 'Gagal menghapus kategori.');
      return res.redirect('/kategori');
    }
  }
};
