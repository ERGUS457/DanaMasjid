import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import fs from 'fs';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (wajib untuk HTTPS cookies di Vercel / Railway)
app.set('trust proxy', 1);

// Body Parser Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files (Mendukung folder root public maupun src/public)
const cwdPublic = path.join(process.cwd(), 'public');
const dirnamePublic = path.join(__dirname, 'public');
if (fs.existsSync(cwdPublic)) {
  app.use(express.static(cwdPublic));
}
if (fs.existsSync(dirnamePublic)) {
  app.use(express.static(dirnamePublic));
}

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'danamasjid_super_secure_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 jam
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Flash Messages
app.use(flash());

// Global Variables Middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// View Engine & Layout Configuration
app.use(expressLayouts);
app.set('view engine', 'ejs');

const cwdViews = path.join(process.cwd(), 'src', 'views');
const dirnameViews = path.join(__dirname, 'views');
app.set('views', fs.existsSync(cwdViews) ? cwdViews : dirnameViews);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Application Routing
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/transaksi', transactionRoutes);
app.use('/kategori', categoryRoutes);
app.use('/laporan', reportRoutes);

// Landing Page (Halaman Utama Publik)
app.get('/', (req, res) => {
  res.render('landing/index', {
    layout: false,
    title: 'DanaMasjid - Aplikasi Pembukuan Kas Masjid Amanah & Transparan',
    currentUser: req.session ? req.session.user : null
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('auth/login', {
    title: 'Halaman Tidak Ditemukan - DanaMasjid',
    layout: 'layouts/auth',
    messages: {
      error: ['Halaman yang Anda cari tidak ditemukan.'],
      success: []
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).send('Terjadi kesalahan pada server. Silakan muat ulang halaman.');
});

// Server Initialization
if (process.argv[1] && process.argv[1].endsWith('app.js')) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🕌 DanaMasjid Server berjalan pada http://localhost:${PORT}`);
    console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

export default app;
