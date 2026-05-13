  const http = require('node:http');
  const fs = require('node:fs');
  const path = require('node:path');
  const crypto = require('node:crypto');
  const { DatabaseSync } = require('node:sqlite');

  const PORT = Number(process.env.PORT || 3000);
  const ROOT_DIR = __dirname;
  const DATA_DIR = path.join(ROOT_DIR, 'data');
  const DB_PATH = path.join(DATA_DIR, 'smartbooking.sqlite');

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      service TEXT NOT NULL,
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const services = {
    doctor: 'Doctor',
    dentist: 'Dentist',
    therapist: 'Therapist',
    cardiologist: 'Cardiologist',
    pediatrician: 'Pediatrician'
  };

  const validStatuses = ['Confirmed', 'Completed', 'Cancelled'];

  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(payload));
  }

  function readJson(request) {
    return new Promise((resolve, reject) => {
      let body = '';
      request.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1_000_000) {
          reject(new Error('Request body is too large.'));
          request.destroy();
        }
      });
      request.on('end', () => {
        if (!body) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (_error) {
          reject(new Error('Invalid JSON request body.'));
        }
      });
      request.on('error', reject);
    });
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
  }

  function verifyPassword(password, storedPassword) {
    if (!storedPassword) return false;

    if (!storedPassword.startsWith('scrypt:')) {
      return password === storedPassword;
    }

    const [, salt, expectedHash] = storedPassword.split(':');
    if (!salt || !expectedHash) return false;

    const actualHash = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    return expectedBuffer.length === actualHash.length && crypto.timingSafeEqual(expectedBuffer, actualHash);
  }

  function appointmentFromRow(row) {
    return {
      id: row.id,
      userName: row.user_name,
      userEmail: row.user_email,
      service: row.service,
      serviceId: row.service_id,
      date: row.date,
      time: row.time,
      notes: row.notes,
      status: row.status
    };
  }

  function userSessionFromRow(row) {
    return {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email
    };
  }

  async function handleApi(request, response, url) {
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        sendJson(response, 200, { ok: true, database: 'sqlite' });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/register') {
        const body = await readJson(request);
        const firstName = String(body.firstName || '').trim();
        const lastName = String(body.lastName || '').trim();
        const email = normalizeEmail(body.email);
        const phone = String(body.phone || '').trim();
        const password = String(body.password || '');

        if (!firstName || !lastName || !email || !phone || password.length < 8) {
          sendJson(response, 400, { message: 'Please provide valid registration details.' });
          return;
        }

        const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (exists) {
          sendJson(response, 409, { message: 'An account with this email already exists.' });
          return;
        }

        const user = {
          id: `U-${crypto.randomUUID()}`,
          firstName,
          lastName,
          email,
          phone,
          password: hashPassword(password)
        };

        db.prepare(`
          INSERT INTO users (id, first_name, last_name, email, phone, password)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(user.id, firstName, lastName, email, phone, password);

        sendJson(response, 201, { user: { id: user.id, name: `${firstName} ${lastName}`, email } });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/login') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!row || !verifyPassword(password, row.password)) {
          sendJson(response, 401, { message: 'Invalid email or password.' });
          return;
        }

        if (!row.password.startsWith('scrypt:')) {
          db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), row.id);
        }

        sendJson(response, 200, { user: userSessionFromRow(row) });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/user') {
        const email = normalizeEmail(url.searchParams.get('email'));
        if (!email) {
          sendJson(response, 400, { message: 'Email parameter is required.' });
          return;
        }

        const row = db.prepare('SELECT id, first_name, last_name, email, phone FROM users WHERE email = ?').get(email);
        if (!row) {
          sendJson(response, 404, { message: 'User not found.' });
          return;
        }

        sendJson(response, 200, {
          user: {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone
          }
        });
        return;
      }

      if (request.method === 'PUT' && url.pathname === '/api/user') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        const firstName = String(body.firstName || '').trim();
        const lastName = String(body.lastName || '').trim();
        const phone = String(body.phone || '').trim();

        if (!email || !firstName || !lastName || !phone) {
          sendJson(response, 400, { message: 'Please provide all required fields.' });
          return;
        }

        const result = db.prepare(`
          UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE email = ?
        `).run(firstName, lastName, phone, email);

        if (result.changes === 0) {
          sendJson(response, 404, { message: 'User not found.' });
          return;
        }

        sendJson(response, 200, { message: 'Profile updated successfully.' });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/user/change-password') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);
        const currentPassword = String(body.currentPassword || '');
        const newPassword = String(body.newPassword || '');

        if (!email || !currentPassword || !newPassword) {
          sendJson(response, 400, { message: 'Please provide all required fields.' });
          return;
        }

        if (newPassword.length < 8) {
          sendJson(response, 400, { message: 'New password must be at least 8 characters.' });
          return;
        }

        const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!row) {
          sendJson(response, 404, { message: 'User not found.' });
          return;
        }

        if (!verifyPassword(currentPassword, row.password)) {
          sendJson(response, 401, { message: 'Current password is incorrect.' });
          return;
        }

        const hashedPassword = hashPassword(newPassword);
        db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);

        sendJson(response, 200, { message: 'Password changed successfully.' });
        return;
      }

      if (request.method === 'DELETE' && url.pathname === '/api/user') {
        const body = await readJson(request);
        const email = normalizeEmail(body.email);

        if (!email) {
          sendJson(response, 400, { message: 'Email is required.' });
          return;
        }

        db.prepare('DELETE FROM appointments WHERE user_email = ?').run(email);
        const result = db.prepare('DELETE FROM users WHERE email = ?').run(email);

        if (result.changes === 0) {
          sendJson(response, 404, { message: 'User not found.' });
          return;
        }

        sendJson(response, 200, { message: 'Account deleted successfully.' });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/appointments') {
        const email = normalizeEmail(url.searchParams.get('email'));
        const rows = email
          ? db.prepare('SELECT * FROM appointments WHERE user_email = ? ORDER BY date, time').all(email)
          : db.prepare('SELECT * FROM appointments ORDER BY date, time').all();

        sendJson(response, 200, { appointments: rows.map(appointmentFromRow) });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/appointments') {
        const body = await readJson(request);
        const userName = String(body.userName || '').trim();
        const userEmail = normalizeEmail(body.userEmail);
        const serviceId = String(body.serviceId || '').trim();
        const date = String(body.date || '').trim();
        const time = String(body.time || '').trim();
        const notes = String(body.notes || '').trim();

        if (!userName || !userEmail || !serviceId || !date || !time || !services[serviceId]) {
          sendJson(response, 400, { message: 'Please complete all required booking fields.' });
          return;
        }

        const conflict = db.prepare(`
          SELECT id FROM appointments
          WHERE date = ? AND time = ? AND status != 'Cancelled'
        `).get(date, time);

        if (conflict) {
          sendJson(response, 409, { message: 'This slot is already booked. Please choose another time.' });
          return;
        }

        const appointment = {
          id: `A-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          userName,
          userEmail,
          service: services[serviceId],
          serviceId,
          date,
          time,
          notes,
          status: 'Confirmed'
        };

        db.prepare(`
          INSERT INTO appointments (id, user_name, user_email, service, service_id, date, time, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          appointment.id,
          appointment.userName,
          appointment.userEmail,
          appointment.service,
          appointment.serviceId,
          appointment.date,
          appointment.time,
          appointment.notes,
          appointment.status
        );

        sendJson(response, 201, { appointment });
        return;
      }

      const appointmentMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)$/);
      if (appointmentMatch && request.method === 'GET') {
        const id = decodeURIComponent(appointmentMatch[1]);
        const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
        if (!row) {
          sendJson(response, 404, { message: 'Appointment not found.' });
          return;
        }

        sendJson(response, 200, { appointment: appointmentFromRow(row) });
        return;
      }

      if (appointmentMatch && request.method === 'PUT') {
        const id = decodeURIComponent(appointmentMatch[1]);
        const body = await readJson(request);
        const userName = String(body.userName || '').trim();
        const userEmail = normalizeEmail(body.userEmail);
        const serviceId = String(body.serviceId || '').trim();
        const date = String(body.date || '').trim();
        const time = String(body.time || '').trim();
        const notes = String(body.notes || '').trim();
        const status = String(body.status || 'Confirmed').trim();

        if (!userName || !userEmail || !serviceId || !date || !time || !services[serviceId] || !validStatuses.includes(status)) {
          sendJson(response, 400, { message: 'Please provide valid appointment details.' });
          return;
        }

        const conflict = db.prepare(`
          SELECT id FROM appointments
          WHERE id != ? AND date = ? AND time = ? AND status != 'Cancelled'
        `).get(id, date, time);

        if (conflict) {
          sendJson(response, 409, { message: 'This slot is already booked. Please choose another time.' });
          return;
        }

        const result = db.prepare(`
          UPDATE appointments
          SET user_name = ?, user_email = ?, service = ?, service_id = ?, date = ?, time = ?, notes = ?, status = ?
          WHERE id = ?
        `).run(userName, userEmail, services[serviceId], serviceId, date, time, notes, status, id);

        if (result.changes === 0) {
          sendJson(response, 404, { message: 'Appointment not found.' });
          return;
        }

        const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
        sendJson(response, 200, { appointment: appointmentFromRow(row) });
        return;
      }

      if (appointmentMatch && request.method === 'DELETE') {
        const id = decodeURIComponent(appointmentMatch[1]);
        const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
        if (result.changes === 0) {
          sendJson(response, 404, { message: 'Appointment not found.' });
          return;
        }

        sendJson(response, 200, { id, deleted: true });
        return;
      }

      const statusMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
      if (request.method === 'PATCH' && statusMatch) {
        const id = decodeURIComponent(statusMatch[1]);
        const body = await readJson(request);
        const status = String(body.status || '').trim();

        if (!validStatuses.includes(status)) {
          sendJson(response, 400, { message: 'Invalid appointment status.' });
          return;
        }

        const result = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
        if (result.changes === 0) {
          sendJson(response, 404, { message: 'Appointment not found.' });
          return;
        }

        sendJson(response, 200, { id, status });
        return;
      }

      sendJson(response, 404, { message: 'API route not found.' });
    } catch (error) {
      sendJson(response, 500, { message: error.message || 'Server error.' });
    }
  }

  function serveStatic(request, response, url) {
    const requestedPath = url.pathname === '/' ? '/smartbooking.html' : decodeURIComponent(url.pathname);
    const filePath = path.normalize(path.join(ROOT_DIR, requestedPath));

    if (!filePath.startsWith(ROOT_DIR)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }

      const contentType = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(data);
    });
  }

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      handleApi(request, response, url);
      return;
    }

    serveStatic(request, response, url);
  });

  server.listen(PORT, () => {
    console.log(`CareFlow running at http://localhost:${PORT}`);
    console.log(`SQLite database: ${DB_PATH}`);
  });
