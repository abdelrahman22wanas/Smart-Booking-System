document.addEventListener('DOMContentLoaded', () => {
  setupSlotButtons();
  setupNavbarToggle();
});

function setupSlotButtons() {
  const slotButtons = document.querySelectorAll('.slot');

  slotButtons.forEach((slotButton) => {
    slotButton.addEventListener('click', () => {
      slotButton.classList.toggle('active');
    });
  });
}

function setupNavbarToggle() {
  const toggles = document.querySelectorAll('[data-bs-toggle="collapse"]');

  toggles.forEach((toggleButton) => {
    const targetSelector = toggleButton.getAttribute('data-bs-target');
    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    toggleButton.addEventListener('click', () => {
      target.classList.toggle('show');
    });
  });
}

