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

// Quick format for numeric input
window.formatCurrencyInput = function(input) {
  let value = input.value.replace(/\D/g, '');
  if (value) {
    input.value = new Intl.NumberFormat('id-ID').format(value);
  } else {
    input.value = '';
  }
};
