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

/**
 * Konversi angka nominal ke kalimat terbilang bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 * @param {number|string} amount 
 * @returns {string}
 */
export function terbilang(amount) {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  let n = Math.floor(Math.abs(Number(amount) || 0));
  if (n === 0) return 'Nol Rupiah';

  function convert(x) {
    if (x < 12) return bilangan[x];
    if (x < 20) return convert(x - 10) + ' Belas';
    if (x < 100) return convert(Math.floor(x / 10)) + ' Puluh' + (x % 10 ? ' ' + convert(x % 10) : '');
    if (x < 200) return 'Seratus' + (x - 100 ? ' ' + convert(x - 100) : '');
    if (x < 1000) return convert(Math.floor(x / 100)) + ' Ratus' + (x % 100 ? ' ' + convert(x % 100) : '');
    if (x < 2000) return 'Seribu' + (x - 1000 ? ' ' + convert(x - 1000) : '');
    if (x < 1000000) return convert(Math.floor(x / 1000)) + ' Ribu' + (x % 1000 ? ' ' + convert(x % 1000) : '');
    if (x < 1000000000) return convert(Math.floor(x / 1000000)) + ' Juta' + (x % 1000000 ? ' ' + convert(x % 1000000) : '');
    if (x < 1000000000000) return convert(Math.floor(x / 1000000000)) + ' Miliar' + (x % 1000000000 ? ' ' + convert(x % 1000000000) : '');
    return convert(Math.floor(x / 1000000000000)) + ' Triliun' + (x % 1000000000000 ? ' ' + convert(x % 1000000000000) : '');
  }

  return convert(n).trim() + ' Rupiah';
}

/**
 * Parse string nominal (yang mungkin berisi koma atau titik ribuan) menjadi angka murni
 * @param {string|number} val 
 * @returns {number}
 */
export function parseNominal(val) {
  if (!val && val !== 0) return NaN;
  let str = val.toString().trim();
  if (/\.\d{3}(\.|$)/.test(str)) {
    str = str.replace(/\./g, '');
  }
  str = str.replace(/,/g, '').replace(/[^0-9]/g, '');
  return str ? Number(str) : NaN;
}
