import { TransactionModel } from '../models/transactionModel.js';
import { CategoryModel } from '../models/categoryModel.js';
import { formatRupiah, formatTanggalIndo, formatDateInput } from '../utils/formatters.js';

function parseNominal(val) {
  if (!val && val !== 0) return NaN;
  let str = val.toString().trim();
  // Tangani format ribuan dengan titik (misal: 10.000)
  if (/\.\d{3}(\.|$)/.test(str)) {
    str = str.replace(/\./g, '');
  }
  // Hapus semua koma dan karakter non-digit lainnya
  str = str.replace(/,/g, '').replace(/[^0-9]/g, '');
  return str ? Number(str) : NaN;
}

export const TransactionController = {
  async index(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { startDate, endDate, tipe, kategori_id } = req.query;

      const filters = {
        startDate: startDate || null,
        endDate: endDate || null,
        tipe: (tipe === 'masuk' || tipe === 'keluar') ? tipe : null,
        kategori_id: kategori_id || null,
      };

      const [transactions, categories, summary] = await Promise.all([
        TransactionModel.findAllByMasjid(masjid_id, filters),
        CategoryModel.findAllByMasjid(masjid_id),
        TransactionModel.getSummary(masjid_id, filters)
      ]);

      res.render('transactions/index', {
        title: 'Riwayat Transaksi Kas - DanaMasjid',
        transactions,
        categories,
        filters,
        summary,
        formatRupiah,
        formatTanggalIndo,
        formatDateInput,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error saat memuat daftar transaksi:', error);
      req.flash('error', 'Gagal memuat transaksi.');
      res.redirect('/dashboard');
    }
  },

  async create(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { kategori_id, tanggal, tipe, nominal, keterangan } = req.body;

      if (!tanggal || !tipe || (tipe !== 'masuk' && tipe !== 'keluar') || !nominal) {
        req.flash('error', 'Tanggal, jenis kas, dan nominal transaksi wajib diisi.');
        return res.redirect(req.headers.referer || '/transaksi');
      }

      const cleanNominal = parseNominal(nominal);
      if (isNaN(cleanNominal) || cleanNominal <= 0) {
        req.flash('error', 'Nominal transaksi harus berupa angka positif.');
        return res.redirect(req.headers.referer || '/transaksi');
      }

      const cleanKategoriId = (kategori_id && typeof kategori_id === 'string' && kategori_id.trim() !== '' && kategori_id.trim() !== 'undefined' && kategori_id.trim() !== 'null') ? kategori_id.trim() : null;

      await TransactionModel.create({
        masjid_id,
        kategori_id: cleanKategoriId,
        tanggal,
        tipe,
        nominal: cleanNominal,
        keterangan: (keterangan || '').trim()
      });

      req.flash('success', `Transaksi ${tipe === 'masuk' ? 'pemasukan' : 'pengeluaran'} sebesar ${formatRupiah(cleanNominal)} berhasil dicatat.`);
      return res.redirect(req.headers.referer || '/transaksi');
    } catch (error) {
      console.error('Error create transaction:', error);
      req.flash('error', 'Gagal menyimpan transaksi.');
      return res.redirect('/transaksi');
    }
  },

  async update(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { id } = req.params;
      const { kategori_id, tanggal, tipe, nominal, keterangan } = req.body;

      if (!tanggal || !tipe || (tipe !== 'masuk' && tipe !== 'keluar') || !nominal) {
        req.flash('error', 'Tanggal, jenis kas, dan nominal transaksi wajib diisi.');
        return res.redirect('/transaksi');
      }

      const cleanNominal = parseNominal(nominal);
      if (isNaN(cleanNominal) || cleanNominal <= 0) {
        req.flash('error', 'Nominal transaksi harus berupa angka positif.');
        return res.redirect('/transaksi');
      }

      const cleanKategoriId = (kategori_id && typeof kategori_id === 'string' && kategori_id.trim() !== '' && kategori_id.trim() !== 'undefined' && kategori_id.trim() !== 'null') ? kategori_id.trim() : null;

      const updated = await TransactionModel.update(id, masjid_id, {
        kategori_id: cleanKategoriId,
        tanggal,
        tipe,
        nominal: cleanNominal,
        keterangan: (keterangan || '').trim()
      });

      if (!updated) {
        req.flash('error', 'Transaksi tidak ditemukan atau tidak memiliki hak akses.');
      } else {
        req.flash('success', 'Transaksi berhasil diperbarui.');
      }

      return res.redirect('/transaksi');
    } catch (error) {
      console.error('Error update transaction:', error);
      req.flash('error', 'Gagal memperbarui transaksi.');
      return res.redirect('/transaksi');
    }
  },

  async delete(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { id } = req.params;

      const deleted = await TransactionModel.delete(id, masjid_id);
      if (!deleted) {
        req.flash('error', 'Transaksi tidak ditemukan atau tidak memiliki hak akses.');
      } else {
        req.flash('success', 'Transaksi berhasil dihapus dari catatan kas.');
      }

      return res.redirect('/transaksi');
    } catch (error) {
      console.error('Error delete transaction:', error);
      req.flash('error', 'Gagal menghapus transaksi.');
      return res.redirect('/transaksi');
    }
  }
};
