/**
 * Middleware untuk membatasi akses hanya untuk pengguna yang telah login.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.flash('error', 'Sesi Anda telah berakhir atau belum login. Silakan login terlebih dahulu.');
  return res.redirect('/auth/login');
}

/**
 * Middleware untuk membatasi halaman otentikasi (login/register) agar tidak diakses pengguna yang sudah login.
 */
export function guestOnly(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
}
