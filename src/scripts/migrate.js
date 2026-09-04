import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Memulai migrasi basis data ke Neon PostgreSQL...');
  try {
    const schemaPath = path.resolve(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Migrasi skema basis data berhasil dieksekusi!');
    console.log('Tabel yang tersedia: masjids, users, categories, transactions');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
