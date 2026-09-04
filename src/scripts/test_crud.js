import app from '../app.js';
import pool from '../config/db.js';

async function runCrudTest() {
  console.log('🚀 Starting End-to-End CRUD & Session Verification Test...\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let sessionCookie = '';

  try {
    // 1. Test Login
    console.log('1️⃣ Testing Authentication Login...');
    const loginParams = new URLSearchParams();
    loginParams.append('email', 'bendahara@masjid.id');
    loginParams.append('password', 'password123');

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: loginParams.toString(),
      redirect: 'manual'
    });

    const setCookieHeaders = loginRes.headers.getSetCookie();
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      throw new Error('Failed to obtain session cookies from login response');
    }

    sessionCookie = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    console.log('   ✅ Login successful, session cookies obtained.');

    // 2. Test Dashboard Access with Session Cookie
    console.log('2️⃣ Testing Authenticated Dashboard Access...');
    const dashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { cookie: sessionCookie },
      redirect: 'manual'
    });

    if (dashRes.status !== 200) {
      throw new Error(`Expected 200 on /dashboard, got ${dashRes.status}`);
    }
    const dashHtml = await dashRes.text();
    if (!dashHtml.includes('Ringkasan Kas') && !dashHtml.includes('Saldo Kas')) {
      throw new Error('Dashboard content does not contain expected text');
    }
    console.log('   ✅ Dashboard loaded successfully with active session.');

    // 3. Test Create Transaction (Kas Masuk dengan Nominal Berformat Koma)
    console.log('3️⃣ Testing CREATE Transaction (Kas Masuk dengan Input Koma "10,000")...');
    const trxParams = new URLSearchParams();
    trxParams.append('tipe', 'masuk');
    trxParams.append('tanggal', '2026-09-04');
    trxParams.append('nominal', '10,000');
    trxParams.append('keterangan', 'Infak Jamaah Jum\'at Berkah Testing');
    trxParams.append('kategori_id', '');

    const createTrxRes = await fetch(`${baseUrl}/transaksi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie
      },
      body: trxParams.toString(),
      redirect: 'manual'
    });

    if (createTrxRes.status !== 302) {
      throw new Error(`Expected 302 redirect after transaction creation, got ${createTrxRes.status}`);
    }

    // Check in database
    const dbTrxCheck = await pool.query(
      `SELECT * FROM transactions WHERE keterangan = $1 ORDER BY created_at DESC LIMIT 1`,
      ['Infak Jamaah Jum\'at Berkah Testing']
    );

    if (dbTrxCheck.rows.length === 0) {
      throw new Error('Transaction was not found in the database after creation!');
    }
    const createdTrx = dbTrxCheck.rows[0];
    if (Number(createdTrx.nominal) !== 10000) {
      throw new Error(`Expected nominal to be 10000 from input '10,000', got ${createdTrx.nominal}`);
    }
    console.log(`   ✅ Transaction created successfully in Neon DB with ID: ${createdTrx.id}`);
    console.log(`      Nominal: Rp ${createdTrx.nominal}, Keterangan: "${createdTrx.keterangan}"`);

    // 4. Test Update Transaction (Koreksi dengan Nominal Berformat Koma "1,500,000")
    console.log('4️⃣ Testing UPDATE Transaction (Koreksi dengan Input Koma "1,500,000")...');
    const editParams = new URLSearchParams();
    editParams.append('tipe', 'masuk');
    editParams.append('tanggal', '2026-09-04');
    editParams.append('nominal', '1,500,000');
    editParams.append('keterangan', 'Infak Jamaah Jum\'at Berkah Testing (Diperbarui)');
    editParams.append('kategori_id', '');

    const updateTrxRes = await fetch(`${baseUrl}/transaksi/${createdTrx.id}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie
      },
      body: editParams.toString(),
      redirect: 'manual'
    });

    if (updateTrxRes.status !== 302) {
      throw new Error(`Expected 302 redirect after transaction update, got ${updateTrxRes.status}`);
    }

    const dbTrxUpdated = await pool.query(`SELECT * FROM transactions WHERE id = $1`, [createdTrx.id]);
    if (Number(dbTrxUpdated.rows[0].nominal) !== 1500000) {
      throw new Error(`Expected updated nominal to be 1500000, got ${dbTrxUpdated.rows[0].nominal}`);
    }
    console.log(`   ✅ Transaction updated successfully: New Nominal Rp ${dbTrxUpdated.rows[0].nominal}`);

    // 5. Test Delete Transaction
    console.log('5️⃣ Testing DELETE Transaction...');
    const deleteTrxRes = await fetch(`${baseUrl}/transaksi/${createdTrx.id}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie
      },
      redirect: 'manual'
    });

    if (deleteTrxRes.status !== 302) {
      throw new Error(`Expected 302 redirect after transaction deletion, got ${deleteTrxRes.status}`);
    }

    const dbTrxDeleted = await pool.query(`SELECT * FROM transactions WHERE id = $1`, [createdTrx.id]);
    if (dbTrxDeleted.rows.length !== 0) {
      throw new Error('Transaction was not deleted from database!');
    }
    console.log('   ✅ Transaction deleted successfully from Neon DB.');

    // 6. Test Create Category
    console.log('6️⃣ Testing CREATE Category...');
    const catParams = new URLSearchParams();
    catParams.append('nama_kategori', 'Infaq Takjil Ramadhan Test');
    catParams.append('tipe', 'masuk');

    const createCatRes = await fetch(`${baseUrl}/kategori`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie
      },
      body: catParams.toString(),
      redirect: 'manual'
    });

    if (createCatRes.status !== 302) {
      throw new Error(`Expected 302 redirect after category creation, got ${createCatRes.status}`);
    }

    const dbCatCheck = await pool.query(
      `SELECT * FROM categories WHERE nama_kategori = $1 ORDER BY created_at DESC LIMIT 1`,
      ['Infaq Takjil Ramadhan Test']
    );
    if (dbCatCheck.rows.length === 0) {
      throw new Error('Category was not found in database after creation!');
    }
    const createdCat = dbCatCheck.rows[0];
    console.log(`   ✅ Category created successfully in Neon DB with ID: ${createdCat.id}`);

    // 7. Test Delete Category
    console.log('7️⃣ Testing DELETE Category...');
    const deleteCatRes = await fetch(`${baseUrl}/kategori/${createdCat.id}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: sessionCookie
      },
      redirect: 'manual'
    });

    if (deleteCatRes.status !== 302) {
      throw new Error(`Expected 302 redirect after category deletion, got ${deleteCatRes.status}`);
    }

    const dbCatDeleted = await pool.query(`SELECT * FROM categories WHERE id = $1`, [createdCat.id]);
    if (dbCatDeleted.rows.length !== 0) {
      throw new Error('Category was not deleted from database!');
    }
    console.log('   ✅ Category deleted successfully from Neon DB.');

    // 8. Test Logout
    console.log('8️⃣ Testing LOGOUT...');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      headers: { cookie: sessionCookie },
      redirect: 'manual'
    });

    if (logoutRes.status !== 302) {
      throw new Error(`Expected 302 redirect after logout, got ${logoutRes.status}`);
    }
    console.log('   ✅ Logout executed cleanly.');

    console.log('\n======================================================');
    console.log('🎉 ALL CRUD & SESSION OPERATIONS VERIFIED 100% WORKING!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runCrudTest();
