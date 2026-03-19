document.addEventListener('DOMContentLoaded', () => {
  const slotButtons = document.querySelectorAll('.slot');

  slotButtons.forEach((slotButton) => {
    slotButton.addEventListener('click', () => {
      slotButton.classList.toggle('active');
    });
  });
});
