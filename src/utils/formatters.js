/**
 * Format angka ke format mata uang Rupiah (Rp xx.xxx.xxx)
 * @param {number|string} amount 
 * @returns {string}
 */
export function formatRupiah(amount) {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
}

/**
 * Format tanggal ke format bahasa Indonesia (e.g. 14 September 2026)
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatTanggalIndo(date) {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

/**
 * Format tanggal ke format YYYY-MM-DD untuk input field HTML
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
