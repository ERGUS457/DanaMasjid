import { TransactionModel } from '../models/transactionModel.js';
import { CategoryModel } from '../models/categoryModel.js';
import { MasjidModel } from '../models/masjidModel.js';
import { formatRupiah, formatTanggalIndo, formatDateInput } from '../utils/formatters.js';

export const DashboardController = {
  async index(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;

      const [stats, recentTransactions, categories, masjid] = await Promise.all([
        TransactionModel.getDashboardStats(masjid_id),
        TransactionModel.findAllByMasjid(masjid_id, { limit: 7 }),
        CategoryModel.findAllByMasjid(masjid_id),
        MasjidModel.findById(masjid_id)
      ]);

      res.render('dashboard/index', {
        title: 'Dashboard Keuangan - DanaMasjid',
        stats,
        recentTransactions,
        categories,
        masjid,
        formatRupiah,
        formatTanggalIndo,
        formatDateInput,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      req.flash('error', 'Gagal memuat data ringkasan dashboard.');
      res.render('dashboard/index', {
        title: 'Dashboard Keuangan - DanaMasjid',
        stats: { saldo_berjalan: 0, masuk_bulan_ini: 0, keluar_bulan_ini: 0, total_transaksi: 0 },
        recentTransactions: [],
        categories: [],
        masjid: {},
        formatRupiah,
        formatTanggalIndo,
        formatDateInput,
        messages: {
          error: ['Gagal memuat data dashboard.'],
          success: []
        }
      });
    }
  }
};
