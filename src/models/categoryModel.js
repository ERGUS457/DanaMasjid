import pool from '../config/db.js';

export const CategoryModel = {
  async findAllByMasjid(masjid_id, tipe = null) {
    let queryText = `SELECT * FROM categories WHERE masjid_id = $1`;
    const params = [masjid_id];

    if (tipe) {
      queryText += ` AND tipe = $2`;
      params.push(tipe);
    }

    queryText += ` ORDER BY tipe ASC, nama_kategori ASC`;
    const res = await pool.query(queryText, params);
    return res.rows;
  },

  async findById(id, masjid_id) {
    const res = await pool.query(
      `SELECT * FROM categories WHERE id = $1 AND masjid_id = $2`,
      [id, masjid_id]
    );
    return res.rows[0] || null;
  },

  async create({ masjid_id, nama_kategori, tipe }, client = pool) {
    const res = await client.query(
      `INSERT INTO categories (masjid_id, nama_kategori, tipe) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [masjid_id, nama_kategori, tipe]
    );
    return res.rows[0];
  },

  async countTransactions(id, masjid_id) {
    const res = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions WHERE kategori_id = $1 AND masjid_id = $2`,
      [id, masjid_id]
    );
    return parseInt(res.rows[0].total, 10) || 0;
  },

  async delete(id, masjid_id) {
    const res = await pool.query(
      `DELETE FROM categories WHERE id = $1 AND masjid_id = $2 RETURNING id`,
      [id, masjid_id]
    );
    return res.rowCount > 0;
  }
};
