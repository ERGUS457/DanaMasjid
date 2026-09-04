// DanaMasjid Client Helper
document.addEventListener('DOMContentLoaded', () => {
  // Auto dismiss alerts after 5 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll('[role="alert"]');
    alerts.forEach(el => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    });
  }, 5000);
});

// Modal helpers
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
};

// Quick format for currency numeric input with commas (misal: 10,000 atau 1,500,000)
window.formatCurrencyInput = function(input) {
  if (!input) return;
  const cursorPos = input.selectionStart || 0;
  const oldVal = input.value || '';
  const rawDigits = oldVal.replace(/\D/g, '');

  if (!rawDigits) {
    input.value = '';
    return;
  }

  // Format dengan koma setiap 3 digit ribuan
  const formatted = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  input.value = formatted;

  // Hitung ulang posisi kursor agar pengetikan tetap nyaman
  try {
    const diff = formatted.length - oldVal.length;
    const newPos = Math.max(0, cursorPos + diff);
    input.setSelectionRange(newPos, newPos);
  } catch (e) {
    // Abaikan jika browser tidak mendukung setSelectionRange
  }
};

// Otomatis format input nominal dan saldo awal saat diketik
document.addEventListener('input', function(e) {
  if (e.target && (
    e.target.classList.contains('currency-input') || 
    e.target.name === 'nominal' || 
    e.target.name === 'saldo_awal'
  )) {
    window.formatCurrencyInput(e.target);
  }
});
