import pool from '../config/db.js';

export const TransactionModel = {
  async findAllByMasjid(masjid_id, filters = {}) {
    const { startDate, endDate, tipe, kategori_id, limit, offset } = filters;

    let queryText = `
      SELECT t.id, t.masjid_id, t.kategori_id, t.tanggal, t.tipe, t.nominal, t.keterangan, t.created_at,
             c.nama_kategori
      FROM transactions t
      LEFT JOIN categories c ON t.kategori_id = c.id
      WHERE t.masjid_id = $1
    `;
    const params = [masjid_id];
    let paramIndex = 2;

    if (startDate) {
      queryText += ` AND t.tanggal >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND t.tanggal <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (tipe && (tipe === 'masuk' || tipe === 'keluar')) {
      queryText += ` AND t.tipe = $${paramIndex}`;
      params.push(tipe);
      paramIndex++;
    }

    if (kategori_id) {
      queryText += ` AND t.kategori_id = $${paramIndex}`;
      params.push(kategori_id);
      paramIndex++;
    }

    queryText += ` ORDER BY t.tanggal DESC, t.created_at DESC`;

    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset) {
      queryText += ` OFFSET $${paramIndex}`;
      params.push(offset);
      paramIndex++;
    }

    const res = await pool.query(queryText, params);
    return res.rows;
  },

  async findById(id, masjid_id) {
    const res = await pool.query(
      `SELECT t.*, c.nama_kategori 
       FROM transactions t
       LEFT JOIN categories c ON t.kategori_id = c.id
       WHERE t.id = $1 AND t.masjid_id = $2`,
      [id, masjid_id]
    );
    return res.rows[0] || null;
  },

  async create({ masjid_id, kategori_id, tanggal, tipe, nominal, keterangan }) {
    const res = await pool.query(
      `INSERT INTO transactions (masjid_id, kategori_id, tanggal, tipe, nominal, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [masjid_id, kategori_id || null, tanggal, tipe, Number(nominal), keterangan || null]
    );
    return res.rows[0];
  },

  async update(id, masjid_id, { kategori_id, tanggal, tipe, nominal, keterangan }) {
    const res = await pool.query(
      `UPDATE transactions
       SET kategori_id = $1, tanggal = $2, tipe = $3, nominal = $4, keterangan = $5
       WHERE id = $6 AND masjid_id = $7
       RETURNING *`,
      [kategori_id || null, tanggal, tipe, Number(nominal), keterangan || null, id, masjid_id]
    );
    return res.rows[0] || null;
  },

  async delete(id, masjid_id) {
    const res = await pool.query(
      `DELETE FROM transactions WHERE id = $1 AND masjid_id = $2 RETURNING id`,
      [id, masjid_id]
    );
    return res.rowCount > 0;
  },

  /**
   * Menghitung ringkasan kas (total masuk, total keluar, saldo akhir)
   */
  async getSummary(masjid_id, { startDate, endDate } = {}) {
    // 1. Ambil saldo awal masjid
    const masjidRes = await pool.query('SELECT saldo_awal FROM masjids WHERE id = $1', [masjid_id]);
    const saldoAwal = masjidRes.rows[0] ? Number(masjidRes.rows[0].saldo_awal) : 0;

    let queryText = `
      SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN nominal ELSE 0 END), 0) AS total_masuk,
        COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN nominal ELSE 0 END), 0) AS total_keluar
      FROM transactions
      WHERE masjid_id = $1
    `;
    const params = [masjid_id];
    let paramIndex = 2;

    if (startDate) {
      queryText += ` AND tanggal >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND tanggal <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const res = await pool.query(queryText, params);
    const totalMasuk = Number(res.rows[0].total_masuk);
    const totalKeluar = Number(res.rows[0].total_keluar);
    const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

    return {
      saldo_awal: saldoAwal,
      total_masuk: totalMasuk,
      total_keluar: totalKeluar,
      saldo_akhir: saldoAkhir
    };
  },

  /**
   * Menghitung statistik untuk Dashboard (Saldo saat ini, kas masuk bulan ini, kas keluar bulan ini)
   */
  async getDashboardStats(masjid_id) {
    // Ambil saldo awal
    const masjidRes = await pool.query('SELECT saldo_awal FROM masjids WHERE id = $1', [masjid_id]);
    const saldoAwal = masjidRes.rows[0] ? Number(masjidRes.rows[0].saldo_awal) : 0;

    // Total keseluruhan untuk saldo saat ini
    const allTimeRes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN nominal ELSE 0 END), 0) AS all_masuk,
        COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN nominal ELSE 0 END), 0) AS all_keluar,
        COUNT(*) AS total_trx
       FROM transactions
       WHERE masjid_id = $1`,
      [masjid_id]
    );
    const allMasuk = Number(allTimeRes.rows[0].all_masuk);
    const allKeluar = Number(allTimeRes.rows[0].all_keluar);
    const saldoBerjalan = saldoAwal + allMasuk - allKeluar;
    const totalTransaksi = parseInt(allTimeRes.rows[0].total_trx, 10);

    // Statistik bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const monthlyRes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN nominal ELSE 0 END), 0) AS monthly_masuk,
        COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN nominal ELSE 0 END), 0) AS monthly_keluar
       FROM transactions
       WHERE masjid_id = $1 AND tanggal >= $2 AND tanggal <= $3`,
      [masjid_id, startOfMonth, endOfMonth]
    );

    return {
      saldo_awal: saldoAwal,
      saldo_berjalan: saldoBerjalan,
      masuk_bulan_ini: Number(monthlyRes.rows[0].monthly_masuk),
      keluar_bulan_ini: Number(monthlyRes.rows[0].monthly_keluar),
      total_transaksi: totalTransaksi,
      bulan_nama: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    };
  }
};
