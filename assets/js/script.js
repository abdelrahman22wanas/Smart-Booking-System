document.addEventListener('DOMContentLoaded', () => {
  setupSlotButtons();
});

function setupSlotButtons() {
  const slotButtons = document.querySelectorAll('.slot');

  slotButtons.forEach((slotButton) => {
    slotButton.addEventListener('click', () => {
      slotButton.classList.toggle('active');
    });
  });
}

