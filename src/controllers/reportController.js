import { TransactionModel } from '../models/transactionModel.js';
import { MasjidModel } from '../models/masjidModel.js';
import { generateKasPDF } from '../utils/pdfGenerator.js';
import { generateKasCSV } from '../utils/csvGenerator.js';
import { formatRupiah, formatTanggalIndo, formatDateInput } from '../utils/formatters.js';

export const ReportController = {
  async index(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      let { startDate, endDate } = req.query;

      // Default: bulan berjalan jika belum ditentukan
      const now = new Date();
      if (!startDate) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      }
      if (!endDate) {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      }

      const [transactions, summary, masjid] = await Promise.all([
        TransactionModel.findAllByMasjid(masjid_id, { startDate, endDate }),
        TransactionModel.getSummary(masjid_id, { startDate, endDate }),
        MasjidModel.findById(masjid_id)
      ]);

      res.render('reports/index', {
        title: 'Laporan Rekapitulasi Kas - DanaMasjid',
        transactions,
        summary,
        masjid,
        startDate,
        endDate,
        formatRupiah,
        formatTanggalIndo,
        formatDateInput,
        messages: {
          error: req.flash('error'),
          success: req.flash('success')
        }
      });
    } catch (error) {
      console.error('Error rendering report index:', error);
      req.flash('error', 'Gagal memuat halaman laporan kas.');
      res.redirect('/dashboard');
    }
  },

  async printView(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { startDate, endDate } = req.query;

      const [transactions, summary, masjid] = await Promise.all([
        TransactionModel.findAllByMasjid(masjid_id, { startDate, endDate }),
        TransactionModel.getSummary(masjid_id, { startDate, endDate }),
        MasjidModel.findById(masjid_id)
      ]);

      res.render('reports/print', {
        layout: false, // Halaman cetak mandiri tanpa navbar/sidebar
        title: `Laporan Kas - ${masjid.nama_masjid}`,
        transactions,
        summary,
        masjid,
        startDate,
        endDate,
        formatRupiah,
        formatTanggalIndo,
        formatDateInput
      });
    } catch (error) {
      console.error('Error rendering print view:', error);
      req.flash('error', 'Gagal memuat tampilan cetak laporan.');
      res.redirect('/laporan');
    }
  },

  async exportPdf(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { startDate, endDate } = req.query;

      const [transactions, summary, masjid] = await Promise.all([
        TransactionModel.findAllByMasjid(masjid_id, { startDate, endDate }),
        TransactionModel.getSummary(masjid_id, { startDate, endDate }),
        MasjidModel.findById(masjid_id)
      ]);

      const doc = generateKasPDF({
        masjid,
        transactions,
        startDate,
        endDate,
        summary
      });

      const safeMasjidName = masjid.nama_masjid.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan_Kas_${safeMasjidName}_${startDate || 'awal'}_sd_${endDate || 'akhir'}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      req.flash('error', 'Gagal membuat berkas PDF laporan.');
      res.redirect('/laporan');
    }
  },

  async exportCsv(req, res) {
    try {
      const masjid_id = req.session.user.masjid_id;
      const { startDate, endDate } = req.query;

      const [transactions, summary, masjid] = await Promise.all([
        TransactionModel.findAllByMasjid(masjid_id, { startDate, endDate }),
        TransactionModel.getSummary(masjid_id, { startDate, endDate }),
        MasjidModel.findById(masjid_id)
      ]);

      const csvContent = generateKasCSV({
        masjid,
        transactions,
        startDate,
        endDate,
        summary
      });

      const safeMasjidName = masjid.nama_masjid.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan_Kas_${safeMasjidName}_${startDate || 'awal'}_sd_${endDate || 'akhir'}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      req.flash('error', 'Gagal membuat berkas CSV laporan.');
      res.redirect('/laporan');
    }
  }
};
