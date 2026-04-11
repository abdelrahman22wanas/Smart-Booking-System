// ============================================================================
// MEDICAL SMARTBOOKING - MAIN APPLICATION SCRIPT
// ============================================================================
// This script handles all application logic: forms, data storage, and UI updates
// Uses browser localStorage for data persistence (no backend)
// ============================================================================

// -------- STORAGE KEYS --------
// These keys store data in browser localStorage
const USERS_KEY = 'sb_users';                    // Array of registered users
const APPOINTMENTS_KEY = 'sb_appointments';      // Array of all appointments
const CURRENT_USER_KEY = 'sb_current_user';      // Currently logged-in user session

// ============================================================================
// SECTION 1: HEALTHCARE SERVICES DATABASE
// ============================================================================
// Defines 5 medical specialties with their details (duration, cost, description)
// Used in dropdowns and service cards on homepage
// Data structure: { id, name, category, description, duration, cost }

const HEALTHCARE_SERVICES = {
  doctor: {
    id: 'doctor',
    name: 'Doctor',
    category: 'General Physician',
    description: 'General medical consultation and check-up',
    duration: '30 min',
    cost: '$50'
  },
  dentist: {
    id: 'dentist',
    name: 'Dentist',
    category: 'Dental Care',
    description: 'Dental examination and cleaning',
    duration: '45 min',
    cost: '$75'
  },
  therapist: {
    id: 'therapist',
    name: 'Therapist',
    category: 'Mental Health',
    description: 'Psychological counseling and therapy session',
    duration: '60 min',
    cost: '$100'
  },
  cardiologist: {
    id: 'cardiologist',
    name: 'Cardiologist',
    category: 'Specialist',
    description: 'Heart and cardiovascular health consultation',
    duration: '45 min',
    cost: '$100'
  },
  pediatrician: {
    id: 'pediatrician',
    name: 'Pediatrician',
    category: 'Children Care',
    description: 'Child health check-up and vaccination',
    duration: '30 min',
    cost: '$45'
  }
};

function getServiceName(serviceId) {
  // Helper: Convert service ID (e.g., 'doctor') to display name (e.g., 'Doctor')
  return HEALTHCARE_SERVICES[serviceId]?.name || serviceId;
}

// ============================================================================
// SECTION 2: PAGE INITIALIZATION
// ============================================================================
// Runs when page loads - sets up all event listeners and renders dynamic content
document.addEventListener('DOMContentLoaded', () => {
  // Setup interactive elements
  setupHeroCalendar();         // Homepage: Interactive month/day calendar
  setupSlotButtons();           // Homepage: Click time slots
  setupNavbarToggle();          // Mobile: Hamburger menu
  setupHomepageAvailability();  // Homepage: Show available slots summary
  setupQuickAvailability();     // Homepage: "Check Availability" button
  
  // Setup form handlers
  setupRegisterForm();          // Register page form submission
  setupLoginForm();             // Login page form submission
  setupBookingForm();           // Book appointment form submission
  
  // Render dynamic pages (only load if element exists)
  renderAppointmentsPage();     // My Appointments page
  renderAdminPage();            // Admin Dashboard page
});

// ============================================================================
// SECTION 3: LOCALSTORAGE HELPERS
// ============================================================================
// These functions handle saving and retrieving data from browser storage
// All appointment/user data persists in localStorage (not a real database)

/**
 * Read data from localStorage
 * @param {string} key - Storage key (e.g., 'sb_users')
 * @param {*} fallback - Default value if key doesn't exist
 * @returns {*} Parsed JSON or fallback value
 */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;  // If JSON parsing fails, use fallback
  }
}

/**
 * Write data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be converted to JSON)
 */
function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Getter functions for main data
function getUsers() {
  return readStore(USERS_KEY, []);  // Returns array of user objects
}

function saveUsers(users) {
  writeStore(USERS_KEY, users);  // Save updated users array
}

function getAppointments() {
  return readStore(APPOINTMENTS_KEY, []);  // Returns array of appointment objects
}

function saveAppointments(appointments) {
  writeStore(APPOINTMENTS_KEY, appointments);  // Save updated appointments array
}

function getCurrentUser() {
  return readStore(CURRENT_USER_KEY, null);  // Returns logged-in user or null
}

function setCurrentUser(user) {
  writeStore(CURRENT_USER_KEY, user);  // Save current session user
}

function setupHeroCalendar() {
  const monthLabel = document.getElementById('calendarMonthLabel');
  const prevButton = document.getElementById('calendarPrevBtn');
  const nextButton = document.getElementById('calendarNextBtn');
  const grid = document.getElementById('calendarGrid');
  const quickDateInput = document.getElementById('quickDate');

  if (!monthLabel || !prevButton || !nextButton || !grid || !quickDateInput) return;

  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedDate = quickDateInput.value
    ? new Date(`${quickDateInput.value}T00:00:00`)
    : todayStart;

  let viewYear = selectedDate.getFullYear();
  let viewMonth = selectedDate.getMonth();

  quickDateInput.value = toISODate(selectedDate);

  function renderCalendar() {
    monthLabel.textContent = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(viewYear, viewMonth, 1));

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPreviousMonth = new Date(viewYear, viewMonth, 0).getDate();

    const selectedISO = quickDateInput.value;

    grid.innerHTML = '';

    dayLabels.forEach((label) => {
      const labelNode = document.createElement('div');
      labelNode.className = 'cal-day-label';
      labelNode.textContent = label;
      grid.appendChild(labelNode);
    });

    for (let index = 0; index < 42; index += 1) {
      const dayButton = document.createElement('button');
      dayButton.type = 'button';
      dayButton.className = 'cal-day';

      let dayNumber;
      let cellYear = viewYear;
      let cellMonth = viewMonth;

      if (index < firstWeekday) {
        dayNumber = daysInPreviousMonth - firstWeekday + index + 1;
        cellMonth -= 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
        dayButton.classList.add('other');
      } else if (index >= firstWeekday + daysInMonth) {
        dayNumber = index - firstWeekday - daysInMonth + 1;
        cellMonth += 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
        dayButton.classList.add('other');
      } else {
        dayNumber = index - firstWeekday + 1;
      }

      const cellDate = new Date(cellYear, cellMonth, dayNumber);
      const isoDate = toISODate(cellDate);

      const isToday =
        cellDate.getFullYear() === todayStart.getFullYear() &&
        cellDate.getMonth() === todayStart.getMonth() &&
        cellDate.getDate() === todayStart.getDate();

      const isFutureOrToday = cellDate >= todayStart;
      const isWeekday = cellDate.getDay() !== 0 && cellDate.getDay() !== 6;

      if (isToday) {
        dayButton.classList.add('today');
      }

      if (isFutureOrToday && isWeekday) {
        dayButton.classList.add('available');
      }

      if (isoDate === selectedISO) {
        dayButton.classList.add('selected');
      }

      dayButton.textContent = String(dayNumber);
      dayButton.dataset.date = isoDate;

      dayButton.addEventListener('click', () => {
        quickDateInput.value = isoDate;

        viewYear = cellDate.getFullYear();
        viewMonth = cellDate.getMonth();

        renderCalendar();
        quickDateInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      grid.appendChild(dayButton);
    }
  }

  prevButton.addEventListener('click', () => {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    renderCalendar();
  });

  nextButton.addEventListener('click', () => {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    renderCalendar();
  });

  renderCalendar();
  quickDateInput.dispatchEvent(new Event('change', { bubbles: true }));
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const quickDateInput = document.getElementById('quickDate');
  if (!summary || slotButtons.length === 0 || !quickDateInput) return;

  const formatDateLabel = (isoDate) => {
    const parsedDate = new Date(`${isoDate}T00:00:00`);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsedDate);
  };

  const renderSlotsForDate = (selectedDate) => {
    const appointments = getAppointments();
    const bookedTimes = new Set(
      appointments
        .filter((item) => item.date === selectedDate && item.status !== 'Cancelled')
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
        slotButton.onclick = null;
        bookedCount += 1;
        return;
      }

      slotButton.title = 'Click to book this slot';
      slotButton.textContent = time;
      openCount += 1;

      slotButton.onclick = () => {
        const bookingService = document.getElementById('quickService');
        const bookingDate = document.getElementById('quickDate');
        const bookingTime = document.getElementById('quickTime');

        if (bookingService && !bookingService.value) bookingService.value = 'doctor';
        if (bookingDate) bookingDate.value = selectedDate;
        if (bookingTime) bookingTime.value = time;

        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    });

    summary.textContent = `${openCount} open slots on ${formatDateLabel(selectedDate)}, ${bookedCount} already booked.`;
  };

  if (!quickDateInput.value) {
    quickDateInput.value = toISODate(new Date());
  }

  renderSlotsForDate(quickDateInput.value);

  quickDateInput.addEventListener('change', () => {
    if (!quickDateInput.value) return;
    renderSlotsForDate(quickDateInput.value);
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

    alert('Great news! This slot is available. Redirecting to booking page...');
    // Store the selected values for the booking page
    localStorage.setItem('sb_quick_booking', JSON.stringify({
      service: service.value,
      date: date.value,
      time: time.value
    }));
    window.location.href = 'book-appointment.html';
  });
}

// ============================================================================
// SECTION 4: FORM HANDLERS
// ============================================================================
// Each section handles a specific form submission and validation

/**
 * REGISTRATION PAGE FORM
 * Validates input, checks for duplicate email, creates new user, auto-login
 * Flow: User fills form → Click submit → Save user → Auto-login → Redirect to booking
 */
function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;  // Exit if form doesn't exist on this page

  const message = document.getElementById('registerMessage');  // Displays feedback

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Collect form values
    const firstName = document.getElementById('regFirstName')?.value.trim();
    const lastName = document.getElementById('regLastName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim().toLowerCase();  // Normalize email
    const phone = document.getElementById('regPhone')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    const termsAccepted = document.getElementById('regTerms')?.checked;

    // VALIDATION: Check all fields filled
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setMessage(message, 'Please fill all required fields.', false);
      return;
    }

    // VALIDATION: Password length (minimum 8 characters)
    if (password.length < 8) {
      setMessage(message, 'Password must be at least 8 characters.', false);
      return;
    }

    // VALIDATION: Passwords match
    if (password !== confirmPassword) {
      setMessage(message, 'Passwords do not match.', false);
      return;
    }

    // VALIDATION: Terms accepted
    if (!termsAccepted) {
      setMessage(message, 'You must accept the terms to continue.', false);
      return;
    }

    // VALIDATION: Email uniqueness - check if this email already exists
    const users = getUsers();
    const exists = users.some((user) => user.email === email);
    if (exists) {
      setMessage(message, 'An account with this email already exists.', false);
      return;
    }

    // CREATE USER OBJECT and save to localStorage
    const user = {
      id: `U-${Date.now()}`,  // Unique ID based on timestamp
      firstName,
      lastName,
      email,
      phone,
      password  // NOTE: In production, password should be hashed
    };

    users.push(user);
    saveUsers(users);

    // AUTO-LOGIN: Set current user session
    setCurrentUser({ 
      id: user.id, 
      name: `${firstName} ${lastName}`, 
      email: user.email 
    });

    // Show success message and redirect
    setMessage(message, 'Account created successfully. Redirecting to booking page...', true);
    form.reset();

    setTimeout(() => {
      window.location.href = 'book-appointment.html';
    }, 900);
  });
}

/**
 * LOGIN PAGE FORM
 * Validates credentials against registered users, creates session, redirects
 * Flow: User enters email/password → Click submit → Validate → Create session → Redirect
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const message = document.getElementById('loginMessage');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Collect form values
    const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPassword')?.value;

    // VALIDATION: Both fields filled
    if (!email || !password) {
      setMessage(message, 'Please enter your email and password.', false);
      return;
    }

    // LOOKUP: Find user with matching email AND password
    const users = getUsers();
    const user = users.find((item) => item.email === email && item.password === password);
    
    if (!user) {
      setMessage(message, 'Invalid email or password.', false);
      return;
    }

    // CREATE SESSION: Set current user
    setCurrentUser({ 
      id: user.id, 
      name: `${user.firstName} ${user.lastName}`, 
      email: user.email 
    });

    // Show success and redirect to dashboard
    setMessage(message, 'Login successful. Redirecting...', true);

    setTimeout(() => {
      window.location.href = 'my-appointments.html';
    }, 700);
  });
}

/**
 * BOOKING PAGE FORM
 * Most complex form. Pre-fills from quick booking or logged-in user.
 * Validates time slot availability, creates appointment record, redirects.
 * Flow: User selects/enters details → Submit → Validate slot free → Save appointment → Redirect
 */
function setupBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  const message = document.getElementById('bookingMessage');
  const currentUser = getCurrentUser();
  const nameInput = document.getElementById('bookingName');
  const emailInput = document.getElementById('bookingEmail');
  const serviceInput = document.getElementById('bookingService');
  const dateInput = document.getElementById('bookingDate');
  const timeInput = document.getElementById('bookingTime');

  // PREFILL: If user is logged in, auto-fill name and email
  if (currentUser) {
    if (nameInput) nameInput.value = currentUser.name;
    if (emailInput) emailInput.value = currentUser.email;
  }

  // PREFILL: If coming from homepage "Check Availability" button
  // This data was stored temporarily in localStorage
  const quickBooking = localStorage.getItem('sb_quick_booking');
  if (quickBooking) {
    try {
      const data = JSON.parse(quickBooking);
      if (serviceInput && data.service) serviceInput.value = data.service;
      if (dateInput && data.date) dateInput.value = data.date;
      if (timeInput && data.time) timeInput.value = data.time;
      localStorage.removeItem('sb_quick_booking');  // Clear after use
    } catch (_error) {
      // Ignore if parsing fails
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Collect all form values
    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim().toLowerCase();
    const serviceId = serviceInput?.value;          // Service ID like 'doctor'
    const date = dateInput?.value;                  // Date as YYYY-MM-DD
    const time = timeInput?.value;                  // Time as "HH:MM AM/PM"
    const notes = document.getElementById('bookingNotes')?.value.trim() || '';

    // VALIDATION: All required fields filled
    if (!name || !email || !serviceId || !date || !time) {
      setMessage(message, 'Please complete all required booking fields.', false);
      return;
    }

    // VALIDATION: Check if this time slot is already booked by someone else
    const appointments = getAppointments();
    const conflict = appointments.some((item) => {
      return item.date === date && item.time === time && item.status !== 'Cancelled';
    });
    if (conflict) {
      setMessage(message, 'This slot is already booked. Please choose another time.', false);
      return;
    }

    // CREATE APPOINTMENT: Convert service ID to display name, build record
    const serviceName = getServiceName(serviceId);
    appointments.push({
      id: `A-${Date.now().toString().slice(-6)}`,  // Auto-generated ID from timestamp
      userName: name,
      userEmail: email,
      service: serviceName,                         // Display name (e.g., "Doctor")
      serviceId: serviceId,                         // ID for lookups (e.g., "doctor")
      date,
      time,
      notes,
      status: 'Confirmed'                           // Initial status
    });
    saveAppointments(appointments);

    // Success message
    setMessage(message, 'Booking confirmed successfully! Check your email for confirmation.', true);
    form.reset();
    
    // REPREFILL: If logged in, restore user info for next booking
    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.name;
      if (emailInput) emailInput.value = currentUser.email;
    }

    // REDIRECT: Go to appointments dashboard
    setTimeout(() => {
      window.location.href = 'my-appointments.html';
    }, 1500);
  });
}

// ============================================================================
// SECTION 5: PAGE RENDERING - MY APPOINTMENTS DASHBOARD
// ============================================================================
// Shows appointments for currently logged-in user
// Allows user to cancel their own appointments
// Displays message if no appointments exist

/**
 * Initialize appointments page
 * Sets up click handlers for cancel buttons
 */
function renderAppointmentsPage() {
  const root = document.getElementById('appointments-root');
  if (!root) return;

  // Click handler: When user clicks "Cancel" button on an appointment
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === 'cancel') {
      const id = target.dataset.id;
      if (!id) return;
      updateAppointmentStatus(id, 'Cancelled');  // Update the status
      drawAppointments(root);                    // Redraw table
    }
  });

  // Initial render
  drawAppointments(root);
}

/**
 * Build and display appointments table for current user
 * Filters appointments by logged-in user's email
 * Shows empty state if no appointments
 */
function drawAppointments(root) {
  const currentUser = getCurrentUser();
  const all = getAppointments();
  
  // FILTER: Show only appointments for logged-in user
  const appointments = currentUser
    ? all.filter((item) => item.userEmail === currentUser.email)
    : all;

  // EMPTY STATE: No appointments yet
  if (appointments.length === 0) {
    root.innerHTML = [
      '<h1 class="h3 fw-bold mb-3">My Appointments</h1>',
      '<p class="text-secondary mb-4">No appointments found yet.</p>',
      '<a class="btn btn-outline-secondary mt-2" href="book-appointment.html">Book New Appointment</a>'
    ].join('');
    return;
  }

  // BUILD TABLE ROWS: Generate HTML for each appointment
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

  // RENDER: Display table
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

// ============================================================================
// SECTION 6: PAGE RENDERING - ADMIN DASHBOARD
// ============================================================================
// Shows ALL appointments across all users (not filtered)
// Admin can mark appointments as "Completed" or "Cancelled"
// Displays summary stats at top

/**
 * Initialize admin dashboard
 * Sets up click handlers for admin actions (complete, cancel)
 */
function renderAdminPage() {
  const root = document.getElementById('admin-root');
  if (!root) return;

  // Click handler: When admin clicks action buttons
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'complete') {
      updateAppointmentStatus(id, 'Completed');  // Mark as done
      drawAdmin(root);                           // Refresh display
      return;
    }

    if (action === 'cancel') {
      updateAppointmentStatus(id, 'Cancelled');  // Cancel appointment
      drawAdmin(root);                           // Refresh display
    }
  });

  // Initial render
  drawAdmin(root);
}

/**
 * Build and display admin dashboard
 * Shows summary stats and full appointments table
 */
function drawAdmin(root) {
  const appointments = getAppointments();
  const today = new Date().toISOString().slice(0, 10);  // Today's date

  // STATS: Calculate key numbers
  const total = appointments.length;
  const todayCount = appointments.filter((item) => item.date === today).length;
  const pending = appointments.filter((item) => item.status === 'Confirmed').length;

  const stats = [
    { title: 'Total Bookings', value: total },
    { title: 'Today Appointments', value: todayCount },
    { title: 'Open Confirmed', value: pending }
  ];

  // BUILD STATS CARDS
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

  // BUILD TABLE ROWS: Generate HTML for each appointment with admin actions
  const rowsHtml = appointments.map((item) => {
    const allowComplete = item.status === 'Confirmed';  // Can only complete confirmed appointments
    const allowCancel = item.status !== 'Cancelled' && item.status !== 'Completed';  // Can't cancel if already done

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

  // Build table or empty message
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

  // RENDER: Display dashboard
  root.innerHTML = [
    '<h1 class="h3 fw-bold mb-3">Admin Dashboard</h1>',
    '<div class="row g-3 mb-4">',
    statsHtml,
    '</div>',
    '<h2 class="h5 fw-bold mb-3">All Appointments</h2>',
    table
  ].join('');
}

// ============================================================================
// SECTION 7: UTILITY FUNCTIONS
// ============================================================================

/**
 * Update appointment status in storage
 * Used by admin to mark appointments as Completed or Cancelled
 * @param {string} id - Appointment ID
 * @param {string} status - New status (Confirmed, Completed, Cancelled)
 */
function updateAppointmentStatus(id, status) {
  const appointments = getAppointments();
  const updated = appointments.map((item) => {
    if (item.id !== id) return item;
    return { ...item, status };  // Update only matching ID
  });
  saveAppointments(updated);
}

/**
 * Display message to user (success or error)
 * Colors: Green for success, Red for errors
 * @param {HTMLElement} node - Message element
 * @param {string} text - Message text
 * @param {boolean} isSuccess - True for success (green), false for error (red)
 */
function setMessage(node, text, isSuccess) {
  if (!node) return;
  node.textContent = text;
  node.style.color = isSuccess ? 'var(--accent)' : '#b42318';  // Accent or Red
}

