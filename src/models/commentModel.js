import pool from '../config/db.js';

export const CommentModel = {
  async create({ nama, komentar }) {
    const finalNama = (!nama || !nama.trim()) ? 'Hamba Allah' : nama.trim();
    const res = await pool.query(
      `INSERT INTO comments (nama, komentar) 
       VALUES ($1, $2) 
       RETURNING *`,
      [finalNama, komentar.trim()]
    );
    return res.rows[0];
  },

  async findAll(limit = 25) {
    const res = await pool.query(
      `SELECT * FROM comments ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
};
