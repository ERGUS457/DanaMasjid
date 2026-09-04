/**
 * Generator CSV untuk Laporan Keuangan Kas Masjid
 * Dilengkapi dengan UTF-8 BOM untuk kompatibilitas penuh dengan Microsoft Excel.
 */
export function generateKasCSV({ masjid, transactions, startDate, endDate, summary }) {
  // UTF-8 BOM (Byte Order Mark)
  let csvContent = '\uFEFF';

  // Header Laporan
  csvContent += `"LAPORAN REKAPITULASI KAS MASJID"\n`;
  csvContent += `"Nama Masjid:","${masjid.nama_masjid.replace(/"/g, '""')}"\n`;
  csvContent += `"Alamat:","${(masjid.alamat || '-').replace(/"/g, '""')}"\n`;
  csvContent += `"Periode:","${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}"\n\n`;

  // Ringkasan Keuangan
  csvContent += `"RINGKASAN"\n`;
  csvContent += `"Saldo Awal Kas:","${summary.saldo_awal}"\n`;
  csvContent += `"Total Pemasukan:","${summary.total_masuk}"\n`;
  csvContent += `"Total Pengeluaran:","${summary.total_keluar}"\n`;
  csvContent += `"Saldo Akhir Kas:","${summary.saldo_akhir}"\n\n`;

  // Tabel Transaksi
  csvContent += `"No","Tanggal","Tipe Kas","Kategori","Nominal (Rp)","Keterangan"\n`;

  transactions.forEach((trx, index) => {
    const no = index + 1;
    const tanggal = trx.tanggal ? new Date(trx.tanggal).toISOString().split('T')[0] : '';
    const tipe = trx.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar';
    const kategori = (trx.nama_kategori || 'Tanpa Kategori').replace(/"/g, '""');
    const nominal = trx.nominal;
    const keterangan = (trx.keterangan || '').replace(/"/g, '""').replace(/\n/g, ' ');

    csvContent += `"${no}","${tanggal}","${tipe}","${kategori}","${nominal}","${keterangan}"\n`;
  });

  return csvContent;
}
