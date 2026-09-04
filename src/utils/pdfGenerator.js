import PDFDocument from 'pdfkit';
import { formatRupiah, formatTanggalIndo } from './formatters.js';

/**
 * Generate PDF laporan keuangan kas masjid menggunakan PDFKit
 * @param {Object} options 
 * @param {Object} options.masjid
 * @param {Array} options.transactions
 * @param {string} options.startDate
 * @param {string} options.endDate
 * @param {Object} options.summary
 * @returns {PDFDocument}
 */
export function generateKasPDF({ masjid, transactions, startDate, endDate, summary }) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Laporan Kas - ${masjid.nama_masjid}`,
      Author: 'Sistem Keuangan DanaMasjid',
      Subject: 'Laporan Rekapitulasi Kas Masjid',
    }
  });

  // --- HEADER MASJID ---
  doc.rect(40, 40, doc.page.width - 80, 70).fill('#0f766e'); // Teal 700
  doc.fillColor('#ffffff');
  doc.fontSize(16).font('Helvetica-Bold').text(masjid.nama_masjid.toUpperCase(), 50, 52, { align: 'center', width: doc.page.width - 100 });
  doc.fontSize(10).font('Helvetica').text(masjid.alamat || 'Alamat Masjid Belum Diatur', 50, 74, { align: 'center', width: doc.page.width - 100 });
  doc.fontSize(9).font('Helvetica-Oblique').text('LAPORAN BUKU REKAPITULASI KAS', 50, 89, { align: 'center', width: doc.page.width - 100 });

  doc.moveDown(3);
  let currentY = 125;

  // --- INFO PERIODE ---
  doc.fillColor('#1f2937').fontSize(9).font('Helvetica');
  const periodeText = `Periode: ${startDate ? formatTanggalIndo(startDate) : 'Awal Pembukuan'} s/d ${endDate ? formatTanggalIndo(endDate) : 'Sekarang'}`;
  const cetakText = `Dicetak Pada: ${formatTanggalIndo(new Date())}`;
  doc.text(periodeText, 40, currentY);
  doc.text(cetakText, 40, currentY, { align: 'right', width: doc.page.width - 80 });

  currentY += 20;

  // --- RINGKASAN BOX (4 KOLOM) ---
  const boxWidth = (doc.page.width - 80 - 15) / 4;
  const boxHeight = 45;
  const boxes = [
    { title: 'Saldo Awal', amount: summary.saldo_awal, color: '#f3f4f6', textColor: '#374151' },
    { title: 'Total Masuk', amount: summary.total_masuk, color: '#ecfdf5', textColor: '#047857' },
    { title: 'Total Keluar', amount: summary.total_keluar, color: '#fef2f2', textColor: '#b91c1c' },
    { title: 'Saldo Akhir', amount: summary.saldo_akhir, color: '#f0fdfa', textColor: '#0f766e' },
  ];

  boxes.forEach((box, i) => {
    const x = 40 + i * (boxWidth + 5);
    doc.rect(x, currentY, boxWidth, boxHeight).fill(box.color);
    doc.rect(x, currentY, boxWidth, boxHeight).stroke('#d1d5db');
    doc.fillColor(box.textColor).fontSize(8).font('Helvetica').text(box.title, x + 5, currentY + 7, { width: boxWidth - 10, align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').text(formatRupiah(box.amount), x + 5, currentY + 23, { width: boxWidth - 10, align: 'center' });
  });

  currentY += boxHeight + 20;

  // --- TABEL TRANSAKSI HEADER ---
  const colX = {
    no: 40,
    tanggal: 65,
    kategori: 135,
    keterangan: 235,
    masuk: 375,
    keluar: 445,
    saldo: 515
  };

  function drawTableHeader(y) {
    doc.rect(40, y, doc.page.width - 80, 22).fill('#115e59'); // Dark Teal
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('No', colX.no, y + 6, { width: 20, align: 'center' });
    doc.text('Tanggal', colX.tanggal, y + 6, { width: 65 });
    doc.text('Kategori', colX.kategori, y + 6, { width: 95 });
    doc.text('Keterangan', colX.keterangan, y + 6, { width: 135 });
    doc.text('Masuk (Rp)', colX.masuk, y + 6, { width: 65, align: 'right' });
    doc.text('Keluar (Rp)', colX.keluar, y + 6, { width: 65, align: 'right' });
  }

  drawTableHeader(currentY);
  currentY += 22;

  // --- TABEL TRANSAKSI ISI ---
  doc.font('Helvetica').fontSize(8);

  if (transactions.length === 0) {
    doc.rect(40, currentY, doc.page.width - 80, 25).fill('#f9fafb');
    doc.fillColor('#6b7280').text('Tidak ada catatan transaksi pada periode yang dipilih.', 50, currentY + 8, { align: 'center', width: doc.page.width - 100 });
    currentY += 25;
  } else {
    transactions.forEach((trx, index) => {
      // Check for page break
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 40;
        drawTableHeader(currentY);
        currentY += 22;
        doc.font('Helvetica').fontSize(8);
      }

      const isEven = index % 2 === 0;
      const rowBg = isEven ? '#ffffff' : '#f9fafb';
      doc.rect(40, currentY, doc.page.width - 80, 20).fill(rowBg);
      doc.rect(40, currentY, doc.page.width - 80, 20).stroke('#e5e7eb');

      doc.fillColor('#374151');
      doc.text(String(index + 1), colX.no, currentY + 5, { width: 20, align: 'center' });
      doc.text(trx.tanggal ? new Date(trx.tanggal).toLocaleDateString('id-ID') : '-', colX.tanggal, currentY + 5, { width: 65 });
      doc.text(trx.nama_kategori || 'Tanpa Kategori', colX.kategori, currentY + 5, { width: 95, ellipsis: true });
      doc.text(trx.keterangan || '-', colX.keterangan, currentY + 5, { width: 135, ellipsis: true });

      if (trx.tipe === 'masuk') {
        doc.fillColor('#047857').text(formatRupiah(trx.nominal), colX.masuk, currentY + 5, { width: 65, align: 'right' });
        doc.fillColor('#9ca3af').text('-', colX.keluar, currentY + 5, { width: 65, align: 'right' });
      } else {
        doc.fillColor('#9ca3af').text('-', colX.masuk, currentY + 5, { width: 65, align: 'right' });
        doc.fillColor('#b91c1c').text(formatRupiah(trx.nominal), colX.keluar, currentY + 5, { width: 65, align: 'right' });
      }

      currentY += 20;
    });
  }

  // --- TANDA TANGAN DI BAGIAN BAWAH ---
  if (currentY > doc.page.height - 110) {
    doc.addPage();
    currentY = 50;
  } else {
    currentY += 25;
  }

  const signWidth = 160;
  const leftX = 80;
  const rightX = doc.page.width - 40 - signWidth - 40;

  doc.fillColor('#374151').fontSize(9).font('Helvetica');
  doc.text('Mengetahui,', leftX, currentY, { width: signWidth, align: 'center' });
  doc.text('Ketua DKM Masjid', leftX, currentY + 12, { width: signWidth, align: 'center' });
  doc.text('( ....................................... )', leftX, currentY + 65, { width: signWidth, align: 'center' });

  doc.text('Disusun oleh,', rightX, currentY, { width: signWidth, align: 'center' });
  doc.text('Bendahara Masjid', rightX, currentY + 12, { width: signWidth, align: 'center' });
  doc.text('( ....................................... )', rightX, currentY + 65, { width: signWidth, align: 'center' });

  return doc;
}
