# CareFlow (Medical SmartBooking) — Project Report

## 1. Project Summary

CareFlow is a healthcare appointment booking web application that supports patient registration/login, appointment booking, personal appointment tracking, and an admin view for managing bookings.  
The project combines a multi-page frontend (HTML/CSS/JavaScript) with a Node.js backend and SQLite database for persistent storage.

## 2. Problem Statement

Traditional appointment booking can be slow, error-prone, and vulnerable to scheduling conflicts.  
This project addresses that by providing a single web platform with structured service selection, time-slot management, and centralized appointment records.

## 3. Objectives

1. Provide a clear and responsive healthcare booking interface.
2. Support secure user account creation and login.
3. Prevent appointment slot conflicts.
4. Persist users and appointments in a database.
5. Enable both user-facing and admin-facing appointment workflows.

## 4. Technologies Used

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js (CommonJS, built-in `http` server) |
| Database | SQLite (`node:sqlite`, `DatabaseSync`) |
| Runtime Scripts | `npm start`, `npm run dev` |

## 5. System Architecture

The system uses a simple 3-layer flow:

1. **Presentation layer:** Multi-page frontend (`smartbooking.html`, `pages/...`) and shared logic in `assets/js/script.js`.
2. **Application/API layer:** `server.js` routes API requests under `/api/*` and serves static files.
3. **Data layer:** SQLite database file at `data/smartbooking.sqlite` with `users` and `appointments` tables.

The frontend can use backend APIs when served through Node.js, with a `localStorage` fallback for direct file preview.

## 6. Core Implemented Features

- Home page with quick booking and service overview.
- Authentication flow (register/login).
- Profile management (view/update user data, change password, delete account).
- Appointment booking with conflict prevention for already reserved slots.
- User dashboard for personal appointments.
- Admin dashboard for all appointments and status management.
- Theme toggle and responsive multi-page navigation.

## 7. Database Design

### 7.1 Users Table

Stores account identity and authentication data:

- `id` (TEXT, PK)
- `first_name`, `last_name`
- `email` (unique)
- `phone`
- `password`
- `created_at`

### 7.2 Appointments Table

Stores booking data and lifecycle status:

- `id` (TEXT, PK)
- `user_name`, `user_email`
- `service`, `service_id`
- `date`, `time`
- `notes`
- `status` (`Confirmed`, `Completed`, `Cancelled`)
- `created_at`

## 8. API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Authenticate user |
| GET | `/api/user` | Get user profile by email |
| PUT | `/api/user` | Update user profile |
| POST | `/api/user/change-password` | Update account password |
| DELETE | `/api/user` | Delete user and related appointments |
| GET | `/api/appointments` | List appointments (all or filtered by email) |
| POST | `/api/appointments` | Create a new appointment |
| GET | `/api/appointments/:id` | Get a specific appointment |
| PUT | `/api/appointments/:id` | Update appointment details |
| DELETE | `/api/appointments/:id` | Delete appointment |
| PATCH | `/api/appointments/:id/status` | Change appointment status |

## 9. User Workflow Overview

1. User creates an account or logs in.
2. User selects a healthcare service, date, and time.
3. System validates input and checks slot conflicts.
4. Booking is stored and shown in user dashboard.
5. Admin can monitor all bookings and update status.

## 10. Alignment with Course Project Requirements (CSE211)

- **Phase 1 (Design & Frontend):** Implemented multi-page UI with booking and dashboard flows.
- **Phase 2 (Backend & Database):** Implemented Node.js API routes, SQLite schema, and CRUD operations.
- **Phase 3 (Documentation):** This report contributes to final technical documentation deliverables.

## 11. Run Instructions

1. Install dependencies:
   - `npm install`
2. Start the server:
   - `npm start`
3. Open:
   - `http://localhost:3000`

## 12. Current Limitations and Improvement Opportunities

- Authentication currently relies on client-side session storage (`localStorage`) instead of server-side sessions/tokens.
- Role management is basic; admin access control can be strengthened.
- Input validation and audit logging can be expanded for production use.
- Automated tests (unit/integration/E2E) should be added to improve reliability.

## 13. Conclusion

CareFlow delivers a complete academic full-stack booking system with core healthcare scheduling functionality, persistent data storage, and distinct user/admin workflows.  
The project is suitable as a CSE211 web programming submission and provides a strong baseline for further hardening and deployment.
