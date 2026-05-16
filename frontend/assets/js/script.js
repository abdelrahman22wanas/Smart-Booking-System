// ============================================================================
// MEDICAL SMARTBOOKING - MAIN APPLICATION SCRIPT
// ============================================================================
// This script handles all application logic: forms, data storage, and UI updates
// Uses the Node.js API when served by server.js, with localStorage fallback for direct file preview.
// ============================================================================

// -------- STORAGE KEYS --------
// These keys store data in browser localStorage
const USERS_KEY = 'sb_users';                    // Array of registered users
const APPOINTMENTS_KEY = 'sb_appointments';      // Array of all appointments
const CURRENT_USER_KEY = 'sb_current_user';      // Currently logged-in user session
const THEME_KEY = 'sb_theme';                     // Light/dark UI preference

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

function formatBookingDateLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatBookingMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// ============================================================================
// SECTION 2: PAGE INITIALIZATION
// ============================================================================
// Runs when page loads - sets up all event listeners and renders dynamic content
document.addEventListener('DOMContentLoaded', () => {
  // Page: all pages that include assets/js/script.js
  // Purpose: Bootstraps only the features that are present on the current page.

  setupThemeMode();            // Shared: Light/dark mode toggle
  setupPageTransitions();      // Shared: Smooth fade between internal pages

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
  setupBookingDatePicker();     // Booking page: custom CareFlow date picker
  
  // Render dynamic pages (only load if element exists)
  renderAppointmentsPage();     // My Appointments page
  renderAdminPage();            // Admin Dashboard page
});

function setupThemeMode() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  const toggles = document.querySelectorAll('.theme-toggle');

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    toggles.forEach((toggle) => {
      toggle.textContent = theme === 'dark' ? '☀' : '☾';
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  applyTheme(initialTheme);

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });
}

function setupPageTransitions() {
  requestAnimationFrame(() => {
    document.body.classList.add('page-ready');
  });

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-ready');
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.target === '_blank' || link.hasAttribute('download')) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;

    const destination = new URL(href, window.location.href);
    const isSameSite = destination.origin === window.location.origin;
    const isSamePageHash = destination.pathname === window.location.pathname && destination.hash;
    if (!isSameSite || isSamePageHash) return;

    event.preventDefault();
    document.body.classList.add('page-leaving');

    window.setTimeout(() => {
      window.location.href = destination.href;
    }, 220);
  });
}

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

function apiAvailable() {
  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

async function apiRequest(path, options = {}) {
  if (!apiAvailable()) {
    throw new Error('API is only available when running the Node.js server.');
  }

  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

async function loadAppointments(email = '') {
  if (!apiAvailable()) return getAppointments();

  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const data = await apiRequest(`/api/appointments${query}`);
    return data.appointments || [];
  } catch (_error) {
    return getAppointments();
  }
}

async function createApiAppointment(appointment) {
  const data = await apiRequest('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment)
  });
  return data.appointment;
}

async function updateApiAppointmentStatus(id, status) {
  await apiRequest(`/api/appointments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// Page: smartbooking.html
// Targets: #calendarMonthLabel, #calendarPrevBtn, #calendarNextBtn, #calendarGrid, #quickDate
// Purpose: Renders the homepage calendar, handles month navigation, and syncs selected date.
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

    // Clear grid and reset display
    grid.innerHTML = '';
    grid.style.display = 'none';
    
    // Rebuild day labels
    dayLabels.forEach((label) => {
      const labelNode = document.createElement('div');
      labelNode.className = 'cal-day-label';
      labelNode.textContent = label;
      grid.appendChild(labelNode);
    });

    // Build calendar day buttons
    const dayButtons = [];
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

    // Re-enable grid display for proper layout recalculation
    grid.style.display = 'grid';
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

// Page: smartbooking.html
// Purpose: Converts JS Date objects into YYYY-MM-DD strings used by date inputs/storage.
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Page: smartbooking.html
// Targets: .slot buttons in the availability section
// Purpose: Allows selecting/unselecting free time slots for quick booking intent.
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

// Page: smartbooking.html
// Targets: #availabilitySummary, #appointments .slot, #quickDate
// Purpose: Marks booked/open slots for the selected day and updates availability summary text.
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

  const renderSlotsForDate = async (selectedDate) => {
    const appointments = await loadAppointments();
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

// Page: pages/appointments/book-appointment.html, pages/dashboard/my-appointments.html, pages/dashboard/admin-dashboard.html
// Targets: [data-bs-toggle="collapse"] and corresponding collapse container
// Purpose: Provides mobile nav expand/collapse behavior for utility-based pages.
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

// Page: smartbooking.html
// Targets: #quickCheckBtn, #quickService, #quickDate, #quickTime
// Purpose: Validates quick booking input, checks slot conflicts, stores temporary selection, and redirects.
function setupQuickAvailability() {
  const button = document.getElementById('quickCheckBtn');
  if (!button) return;

  button.addEventListener('click', async () => {
    const service = document.getElementById('quickService');
    const date = document.getElementById('quickDate');
    const time = document.getElementById('quickTime');

    if (!service || !date || !time) return;
    if (!service.value || !date.value || !time.value) {
      alert('Please choose service, date, and time first.');
      return;
    }

    const appointments = await loadAppointments();
    const hasConflict = appointments.some((item) => {
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
    window.location.href = '../../pages/appointments/book-appointment.html';
  });
}

// Page: pages/appointments/book-appointment.html
// Targets: [data-booking-date-picker], #bookingDate, .date-picker-trigger
// Purpose: Renders a CareFlow-styled calendar popup and keeps the hidden date input synced.
function setupBookingDatePicker() {
  const wrapper = document.querySelector('[data-booking-date-picker]');
  if (!wrapper) return;

  const trigger = wrapper.querySelector('.date-picker-trigger');
  const valueNode = wrapper.querySelector('[data-date-value]');
  const input = wrapper.querySelector('#bookingDate');
  const popover = wrapper.querySelector('.date-picker-popover');
  const monthLabel = wrapper.querySelector('[data-month-label]');
  const grid = wrapper.querySelector('[data-date-grid]');
  const prevButton = wrapper.querySelector('[data-action="prev"]');
  const nextButton = wrapper.querySelector('[data-action="next"]');

  if (!trigger || !valueNode || !input || !popover || !monthLabel || !grid || !prevButton || !nextButton) return;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  input.min = toISODate(todayStart);

  const initialDate = input.value ? new Date(`${input.value}T00:00:00`) : todayStart;
  if (!input.value) {
    input.value = toISODate(todayStart);
  }

  let viewYear = initialDate.getFullYear();
  let viewMonth = initialDate.getMonth();

  function updateTriggerLabel() {
    const selected = input.value ? new Date(`${input.value}T00:00:00`) : null;
    valueNode.textContent = selected ? formatBookingDateLabel(selected) : 'Select a date';
  }

  function closePicker() {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function openPicker() {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }

  function renderPicker() {
    monthLabel.textContent = formatBookingMonthLabel(new Date(viewYear, viewMonth, 1));
    grid.innerHTML = '';

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPreviousMonth = new Date(viewYear, viewMonth, 0).getDate();
    const selectedISO = input.value;

    for (let index = 0; index < 42; index += 1) {
      let cellYear = viewYear;
      let cellMonth = viewMonth;
      let dayNumber = index - firstWeekday + 1;
      let isOtherMonth = false;

      if (index < firstWeekday) {
        cellMonth -= 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
        dayNumber = daysInPreviousMonth - firstWeekday + index + 1;
        isOtherMonth = true;
      } else if (dayNumber > daysInMonth) {
        dayNumber -= daysInMonth;
        cellMonth += 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
        isOtherMonth = true;
      }

      const cellDate = new Date(cellYear, cellMonth, dayNumber);
      const isoDate = toISODate(cellDate);
      const isPast = cellDate < todayStart;
      const isToday = isoDate === toISODate(todayStart);
      const isSelected = isoDate === selectedISO;

      const dayButton = document.createElement('button');
      dayButton.type = 'button';
      dayButton.className = 'date-picker-day';
      dayButton.textContent = String(dayNumber);
      dayButton.dataset.date = isoDate;

      if (isOtherMonth) dayButton.classList.add('other-month');
      if (isToday) dayButton.classList.add('today');
      if (isSelected) dayButton.classList.add('selected');
      if (isPast) dayButton.disabled = true;

      dayButton.addEventListener('click', () => {
        input.value = isoDate;
        updateTriggerLabel();
        renderPicker();
        input.dispatchEvent(new Event('change', { bubbles: true }));
        closePicker();
      });

      grid.appendChild(dayButton);
    }
  }

  updateTriggerLabel();
  renderPicker();

  trigger.addEventListener('click', () => {
    if (popover.hidden) {
      openPicker();
    } else {
      closePicker();
    }
  });

  prevButton.addEventListener('click', () => {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    renderPicker();
  });

  nextButton.addEventListener('click', () => {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    renderPicker();
  });

  input.addEventListener('change', () => {
    if (!input.value) return;
    const selected = new Date(`${input.value}T00:00:00`);
    viewYear = selected.getFullYear();
    viewMonth = selected.getMonth();
    updateTriggerLabel();
    renderPicker();
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      closePicker();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePicker();
    }
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
  // Page: pages/auth/register.html
  // Targets: #registerForm and register input fields/message node
  // Purpose: Validates registration data, prevents duplicate emails, saves user, and auto-logs in.
  const form = document.getElementById('registerForm');
  if (!form) return;  // Exit if form doesn't exist on this page

  const message = document.getElementById('registerMessage');  // Displays feedback

  form.addEventListener('submit', async (event) => {
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

    let sessionUser;

    try {
      if (apiAvailable()) {
        const data = await apiRequest('/api/register', {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, phone, password })
        });
        sessionUser = data.user;
      } else {
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
        sessionUser = {
          id: user.id,
          name: `${firstName} ${lastName}`,
          email: user.email
        };
      }
    } catch (error) {
      setMessage(message, error.message, false);
      return;
    }

    setCurrentUser(sessionUser);

    // Show success message and redirect
    setMessage(message, 'Account created successfully. Redirecting to booking page...', true);
    form.reset();

    setTimeout(() => {
      window.location.href = '../../pages/appointments/book-appointment.html';
    }, 900);
  });
}

/**
 * LOGIN PAGE FORM
 * Validates credentials against registered users, creates session, redirects
 * Flow: User enters email/password → Click submit → Validate → Create session → Redirect
 */
function setupLoginForm() {
  // Page: pages/auth/login.html
  // Targets: #loginForm, #loginEmail, #loginPassword, #loginMessage
  // Purpose: Authenticates user against local storage and creates session state.
  const form = document.getElementById('loginForm');
  if (!form) return;

  const message = document.getElementById('loginMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Collect form values
    const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('loginPassword')?.value;

    // VALIDATION: Both fields filled
    if (!email || !password) {
      setMessage(message, 'Please enter your email and password.', false);
      return;
    }

    let sessionUser;

    try {
      if (apiAvailable()) {
        const data = await apiRequest('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        sessionUser = data.user;
      } else {
        const users = getUsers();
        const user = users.find((item) => item.email === email && item.password === password);

        if (!user) {
          setMessage(message, 'Invalid email or password.', false);
          return;
        }

        sessionUser = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        };
      }
    } catch (error) {
      setMessage(message, error.message, false);
      return;
    }

    setCurrentUser(sessionUser);

    // Show success and redirect to profile page
    setMessage(message, 'Login successful. Redirecting...', true);

    setTimeout(() => {
      window.location.href = '../dashboard/profile.html';
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
  // Page: pages/appointments/book-appointment.html
  // Targets: #bookingForm and all booking inputs/message node
  // Purpose: Prefills user/quick-booking data, validates slot, creates appointment, then redirects.
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

  form.addEventListener('submit', async (event) => {
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

    try {
      if (apiAvailable()) {
        await createApiAppointment({
          userName: name,
          userEmail: email,
          serviceId,
          date,
          time,
          notes
        });
      } else {
        const appointments = getAppointments();
        const conflict = appointments.some((item) => {
          return item.date === date && item.time === time && item.status !== 'Cancelled';
        });
        if (conflict) {
          setMessage(message, 'This slot is already booked. Please choose another time.', false);
          return;
        }

        const serviceName = getServiceName(serviceId);
        appointments.push({
          id: `A-${Date.now().toString().slice(-6)}`,
          userName: name,
          userEmail: email,
          service: serviceName,
          serviceId: serviceId,
          date,
          time,
          notes,
          status: 'Confirmed'
        });
        saveAppointments(appointments);
      }
    } catch (error) {
      setMessage(message, error.message, false);
      return;
    }

    // Success message
    setMessage(message, 'Booking confirmed successfully! Check your email for confirmation.', true);
    form.reset();
    
    // REPREFILL: If logged in, restore user info for next booking
    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.name;
      if (emailInput) emailInput.value = currentUser.email;
    }

    if (dateInput) {
      dateInput.value = toISODate(new Date());
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // REDIRECT: Go to appointments dashboard
    setTimeout(() => {
      window.location.href = '../../pages/dashboard/my-appointments.html';
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
  // Page: pages/dashboard/my-appointments.html
  // Targets: #appointments-root
  // Purpose: Initializes user dashboard event handlers and renders appointment list.
  const root = document.getElementById('appointments-root');
  if (!root) return;

  // Click handler: When user clicks "Cancel" button on an appointment
  root.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === 'cancel') {
      const id = target.dataset.id;
      if (!id) return;
      await updateAppointmentStatus(id, 'Cancelled');  // Update the status
      drawAppointments(root);                         // Redraw table
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
async function drawAppointments(root) {
  // Page: pages/dashboard/my-appointments.html
  // Targets: injected table/buttons inside #appointments-root
  // Purpose: Builds current user's appointment table and supports cancellation UI states.
  const currentUser = getCurrentUser();
  const all = await loadAppointments(currentUser?.email || '');
  
  // FILTER: Show only appointments for logged-in user
  const appointments = currentUser
    ? all.filter((item) => item.userEmail === currentUser.email)
    : all;

  // EMPTY STATE: No appointments yet
  if (appointments.length === 0) {
    root.innerHTML = [
      '<h1 class="h3 fw-bold mb-3">My Appointments</h1>',
      '<p class="text-secondary mb-4">No appointments found yet.</p>',
      '<a class="btn btn-outline-secondary mt-2" href="../../pages/appointments/book-appointment.html">Book New Appointment</a>'
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
    '<a class="btn btn-outline-secondary mt-2" href="../../pages/appointments/book-appointment.html">Book New Appointment</a>'
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
  // Page: pages/dashboard/admin-dashboard.html
  // Targets: #admin-root
  // Purpose: Initializes admin action handlers and renders all bookings view.
  const root = document.getElementById('admin-root');
  if (!root) return;

  // Click handler: When admin clicks action buttons
  root.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'complete') {
      await updateAppointmentStatus(id, 'Completed');  // Mark as done
      drawAdmin(root);                                // Refresh display
      return;
    }

    if (action === 'cancel') {
      await updateAppointmentStatus(id, 'Cancelled');  // Cancel appointment
      drawAdmin(root);                                // Refresh display
    }
  });

  // Initial render
  drawAdmin(root);
}

/**
 * Build and display admin dashboard
 * Shows summary stats and full appointments table
 */
async function drawAdmin(root) {
  // Page: pages/dashboard/admin-dashboard.html
  // Targets: injected stats cards/table inside #admin-root
  // Purpose: Displays booking KPIs and admin controls (complete/cancel) for all appointments.
  const appointments = await loadAppointments();
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
async function updateAppointmentStatus(id, status) {
  // Page: shared utility used by user/admin dashboards
  // Purpose: Updates one appointment status in storage while keeping all others unchanged.
  if (apiAvailable()) {
    await updateApiAppointmentStatus(id, status);
    return;
  }

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
  // Page: shared utility used in auth and booking forms
  // Purpose: Writes user feedback message text and applies success/error color styling.
  if (!node) return;
  node.textContent = text;
  node.style.color = isSuccess ? 'var(--accent)' : '#b42318';  // Accent or Red
}

