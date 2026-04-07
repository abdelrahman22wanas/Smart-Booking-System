const USERS_KEY = 'sb_users';
const APPOINTMENTS_KEY = 'sb_appointments';
const CURRENT_USER_KEY = 'sb_current_user';

document.addEventListener('DOMContentLoaded', () => {
  setupSlotButtons();
  setupNavbarToggle();
  setupHomepageAvailability();
  setupQuickAvailability();
  setupRegisterForm();
  setupLoginForm();
  setupBookingForm();
  renderAppointmentsPage();
  renderAdminPage();
});

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readStore(USERS_KEY, []);
}

function saveUsers(users) {
  writeStore(USERS_KEY, users);
}

function getAppointments() {
  return readStore(APPOINTMENTS_KEY, []);
}

function saveAppointments(appointments) {
  writeStore(APPOINTMENTS_KEY, appointments);
}

function getCurrentUser() {
  return readStore(CURRENT_USER_KEY, null);
}

function setCurrentUser(user) {
  writeStore(CURRENT_USER_KEY, user);
}

function setupSlotButtons() {
  const slotButtons = document.querySelectorAll('.slot');

  slotButtons.forEach((slotButton) => {
    slotButton.addEventListener('click', () => {
      const isBooked = slotButton.classList.contains('booked');
      if (!isBooked) {
        slotButton.classList.toggle('active');
      }
    });
  });
}

function setupHomepageAvailability() {
  const summary = document.getElementById('availabilitySummary');
  const slotButtons = document.querySelectorAll('#appointments .slot');
  if (!summary || slotButtons.length === 0) return;

  const currentDate = '2026-03-07';
  const appointments = getAppointments();
  const bookedTimes = new Set(
    appointments
      .filter((item) => item.date === currentDate && item.status !== 'Cancelled')
      .map((item) => item.time)
  );

  let openCount = 0;
  let bookedCount = 0;

  slotButtons.forEach((slotButton) => {
    const time = slotButton.dataset.time || slotButton.textContent.trim();
    const isBooked = bookedTimes.has(time);

    slotButton.classList.remove('booked');
    slotButton.removeAttribute('aria-disabled');

    if (isBooked) {
      slotButton.classList.add('booked');
      slotButton.classList.remove('active');
      slotButton.setAttribute('aria-disabled', 'true');
      slotButton.title = 'Booked';
      slotButton.textContent = `${time} • Booked`;
      bookedCount += 1;
      return;
    }

    slotButton.title = 'Click to book this slot';
    slotButton.textContent = time;
    openCount += 1;

    slotButton.addEventListener('click', () => {
      const bookingService = document.getElementById('quickService');
      const bookingDate = document.getElementById('quickDate');
      const bookingTime = document.getElementById('quickTime');

      if (bookingService) bookingService.value = 'General Consultation';
      if (bookingDate) bookingDate.value = currentDate;
      if (bookingTime) bookingTime.value = time;

      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  summary.textContent = `${openCount} open slots available today, ${bookedCount} already booked.`;
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

function setupQuickAvailability() {
  const button = document.getElementById('quickCheckBtn');
  if (!button) return;

  button.addEventListener('click', () => {
    const service = document.getElementById('quickService');
    const date = document.getElementById('quickDate');
    const time = document.getElementById('quickTime');

    if (!service || !date || !time) return;
    if (!service.value || !date.value || !time.value) {
      alert('Please choose service, date, and time first.');
      return;
    }

    const hasConflict = getAppointments().some((item) => {
      return item.date === date.value && item.time === time.value && item.status !== 'Cancelled';
    });

    if (hasConflict) {
      alert('Selected slot is currently unavailable. Please choose another time.');
      return;
    }

    alert('Great news! This slot is available. You can continue with booking.');
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const message = document.getElementById('registerMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const firstName = document.getElementById('regFirstName')?.value.trim();
    const lastName = document.getElementById('regLastName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
    const phone = document.getElementById('regPhone')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    const termsAccepted = document.getElementById('regTerms')?.checked;

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setMessage(message, 'Please fill all required fields.', false);
      return;
    }

    if (password.length < 8) {
      setMessage(message, 'Password must be at least 8 characters.', false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(message, 'Passwords do not match.', false);
      return;
    }

    if (!termsAccepted) {
      setMessage(message, 'You must accept the terms to continue.', false);
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);
    if (exists) {
      setMessage(message, 'An account with this email already exists.', false);
      return;
    }

    const user = {
      id: `U-${Date.now()}`,
      firstName,
      lastName,
      email,
      phone,
      password
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser({ id: user.id, name: `${firstName} ${lastName}`, email: user.email });

    setMessage(message, 'Account created successfully. Redirecting to booking page...', true);
    form.reset();

    setTimeout(() => {
      window.location.href = 'book-appointment.html';
    }, 900);
  });
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const message = document.getElementById('loginMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
      setMessage(message, 'Please enter your email and password.', false);
      return;
    }

    const users = getUsers();
    const user = users.find((item) => item.email === email && item.password === password);
    if (!user) {
      setMessage(message, 'Invalid email or password.', false);
      return;
    }

    setCurrentUser({ id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email });
    setMessage(message, 'Login successful. Redirecting...', true);

    setTimeout(() => {
      window.location.href = 'my-appointments.html';
    }, 700);
  });
}

function setupBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const message = document.getElementById('bookingMessage');
  const currentUser = getCurrentUser();
  const nameInput = document.getElementById('bookingName');
  const emailInput = document.getElementById('bookingEmail');

  if (currentUser) {
    if (nameInput) nameInput.value = currentUser.name;
    if (emailInput) emailInput.value = currentUser.email;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim().toLowerCase();
    const service = document.getElementById('bookingService')?.value;
    const date = document.getElementById('bookingDate')?.value;
    const time = document.getElementById('bookingTime')?.value;
    const notes = document.getElementById('bookingNotes')?.value.trim() || '';

    if (!name || !email || !service || !date || !time) {
      setMessage(message, 'Please complete all required booking fields.', false);
      return;
    }

    const appointments = getAppointments();
    const conflict = appointments.some((item) => {
      return item.date === date && item.time === time && item.status !== 'Cancelled';
    });
    if (conflict) {
      setMessage(message, 'This slot is already booked. Please choose another time.', false);
      return;
    }

    appointments.push({
      id: `A-${Date.now().toString().slice(-6)}`,
      userName: name,
      userEmail: email,
      service,
      date,
      time,
      notes,
      status: 'Confirmed'
    });
    saveAppointments(appointments);

    setMessage(message, 'Booking confirmed successfully.', true);
    form.reset();
    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.name;
      if (emailInput) emailInput.value = currentUser.email;
    }
  });
}

function renderAppointmentsPage() {
  const root = document.getElementById('appointments-root');
  if (!root) return;

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === 'cancel') {
      const id = target.dataset.id;
      if (!id) return;
      updateAppointmentStatus(id, 'Cancelled');
      drawAppointments(root);
    }
  });

  drawAppointments(root);
}

function drawAppointments(root) {
  const currentUser = getCurrentUser();
  const all = getAppointments();
  const appointments = currentUser
    ? all.filter((item) => item.userEmail === currentUser.email)
    : all;

  if (appointments.length === 0) {
    root.innerHTML = [
      '<h1 class="h3 fw-bold mb-3">My Appointments</h1>',
      '<p class="text-secondary mb-4">No appointments found yet.</p>',
      '<a class="btn btn-outline-secondary mt-2" href="book-appointment.html">Book New Appointment</a>'
    ].join('');
    return;
  }

  const rowsHtml = appointments.map((item) => {
    const canCancel = item.status !== 'Cancelled' && item.status !== 'Completed';
    return [
      '<tr>',
      `<td>${item.id}</td>`,
      `<td>${item.service}</td>`,
      `<td>${item.date}</td>`,
      `<td>${item.time}</td>`,
      `<td>${item.status}</td>`,
      `<td>${canCancel ? `<button class="btn btn-outline-secondary btn-sm" data-action="cancel" data-id="${item.id}">Cancel</button>` : '-'}</td>`,
      '</tr>'
    ].join('');
  }).join('');

  root.innerHTML = [
    '<h1 class="h3 fw-bold mb-3">My Appointments</h1>',
    '<div class="table-responsive">',
    '<table class="table align-middle">',
    '<thead><tr><th>ID</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>',
    `<tbody>${rowsHtml}</tbody>`,
    '</table>',
    '</div>',
    '<a class="btn btn-outline-secondary mt-2" href="book-appointment.html">Book New Appointment</a>'
  ].join('');
}

function renderAdminPage() {
  const root = document.getElementById('admin-root');
  if (!root) return;

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'complete') {
      updateAppointmentStatus(id, 'Completed');
      drawAdmin(root);
      return;
    }

    if (action === 'cancel') {
      updateAppointmentStatus(id, 'Cancelled');
      drawAdmin(root);
    }
  });

  drawAdmin(root);
}

function drawAdmin(root) {
  const appointments = getAppointments();
  const today = new Date().toISOString().slice(0, 10);

  const total = appointments.length;
  const todayCount = appointments.filter((item) => item.date === today).length;
  const pending = appointments.filter((item) => item.status === 'Confirmed').length;

  const stats = [
    { title: 'Total Bookings', value: total },
    { title: 'Today Appointments', value: todayCount },
    { title: 'Open Confirmed', value: pending }
  ];

  const statsHtml = stats.map((item) => {
    return [
      '<div class="col-md-4">',
      '<div class="p-3 rounded border bg-light">',
      `<div class="text-secondary small">${item.title}</div>`,
      `<div class="h4 fw-bold mb-0">${item.value}</div>`,
      '</div>',
      '</div>'
    ].join('');
  }).join('');

  const rowsHtml = appointments.map((item) => {
    const allowComplete = item.status === 'Confirmed';
    const allowCancel = item.status !== 'Cancelled' && item.status !== 'Completed';

    return [
      '<tr>',
      `<td>${item.id}</td>`,
      `<td>${item.userName}</td>`,
      `<td>${item.service}</td>`,
      `<td>${item.date}</td>`,
      `<td>${item.time}</td>`,
      `<td>${item.status}</td>`,
      '<td>',
      allowComplete ? `<button class="btn btn-outline-secondary btn-sm" data-action="complete" data-id="${item.id}">Mark Completed</button>` : '',
      allowCancel ? ` <button class="btn btn-outline-secondary btn-sm" data-action="cancel" data-id="${item.id}">Cancel</button>` : '',
      '</td>',
      '</tr>'
    ].join('');
  }).join('');

  const table = appointments.length === 0
    ? '<p class="text-secondary">No appointments have been booked yet.</p>'
    : [
      '<div class="table-responsive">',
      '<table class="table align-middle">',
      '<thead><tr><th>ID</th><th>User</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>',
      `<tbody>${rowsHtml}</tbody>`,
      '</table>',
      '</div>'
    ].join('');

  root.innerHTML = [
    '<h1 class="h3 fw-bold mb-3">Admin Dashboard</h1>',
    '<div class="row g-3 mb-4">',
    statsHtml,
    '</div>',
    '<h2 class="h5 fw-bold mb-3">All Appointments</h2>',
    table
  ].join('');
}

function updateAppointmentStatus(id, status) {
  const appointments = getAppointments();
  const updated = appointments.map((item) => {
    if (item.id !== id) return item;
    return { ...item, status };
  });
  saveAppointments(updated);
}

function setMessage(node, text, isSuccess) {
  if (!node) return;
  node.textContent = text;
  node.style.color = isSuccess ? '#1a6b4a' : '#b42318';
}

