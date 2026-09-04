import pool from '../config/db.js';

export const UserModel = {
  async findByEmail(email) {
    const res = await pool.query(
      `SELECT u.*, m.nama_masjid, m.alamat, m.saldo_awal 
       FROM users u 
       JOIN masjids m ON u.masjid_id = m.id 
       WHERE LOWER(u.email) = LOWER($1) 
       LIMIT 1`,
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT u.id, u.masjid_id, u.nama, u.email, u.role, u.created_at,
              m.nama_masjid, m.alamat, m.saldo_awal
       FROM users u 
       JOIN masjids m ON u.masjid_id = m.id 
       WHERE u.id = $1 
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ masjid_id, nama, email, password_hash, role = 'bendahara' }, client = pool) {
    const res = await client.query(
      `INSERT INTO users (masjid_id, nama, email, password_hash, role) 
       VALUES ($1, $2, LOWER($3), $4, $5) 
       RETURNING id, masjid_id, nama, email, role, created_at`,
      [masjid_id, nama, email, password_hash, role]
    );
    return res.rows[0];
  }
};
