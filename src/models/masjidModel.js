import pool from '../config/db.js';

export const MasjidModel = {
  async findById(id) {
    const res = await pool.query('SELECT * FROM masjids WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async create({ nama_masjid, alamat, saldo_awal = 0 }, client = pool) {
    const res = await client.query(
      `INSERT INTO masjids (nama_masjid, alamat, saldo_awal) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [nama_masjid, alamat, Number(saldo_awal) || 0]
    );
    return res.rows[0];
  },

  async update(id, { nama_masjid, alamat, saldo_awal }) {
    const res = await pool.query(
      `UPDATE masjids 
       SET nama_masjid = $1, alamat = $2, saldo_awal = $3 
       WHERE id = $4 
       RETURNING *`,
      [nama_masjid, alamat, Number(saldo_awal) || 0, id]
    );
    return res.rows[0];
  }
};
