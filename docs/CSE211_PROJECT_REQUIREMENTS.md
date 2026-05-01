# CSE211 Web Programming Project Description

Source PDF: `C:\Users\wanas-shell\Downloads\ABDM\Documents\CSE211___Project__Description.pdf`

Course: Web Programming  
Course Code: CSE211  
Faculty: Faculty of Computer Science & Engineering  
University: Alamein International University

## Introduction

This project applies the topics covered in the Web Programming course. The goal is to assess understanding of front-end development, back-end development, database integration, teamwork, and presentation skills.

By completing this project, the team should demonstrate the ability to design, implement, and present a complete and functional web application.

## Project Overview

The project is a full web application divided into three main phases. Each phase focuses on a different aspect of web development, from front-end design to back-end logic and final presentation.

## Phase 1: Design and Front-End Development

Weight: 40%  
Evaluation marks: 6

This phase focuses on UI/UX design and front-end implementation.

### Required Deliverables

- Website front-end using HTML, CSS, and JavaScript
- Responsive design
- Design Report using the provided template

### Design Report Content

- Project idea and target users
- Wireframes or mockups
- Design decisions
- Tools used in design, such as Figma or Adobe XD

## Phase 2: Back-End and Database Implementation

Weight: 40%  
Evaluation marks: 6

This phase focuses on technical implementation and system functionality.

### Required Deliverables

- Back-end logic and APIs
- Database connection and schema
- CRUD operations
- Implementation Report using the provided template

### Implementation Report Content

- System architecture
- Database design
- Technologies used

## Phase 3: Presentation and Documentation

Weight: 20%  
Evaluation marks: 3

This phase is mandatory to pass the project.

### Required Deliverables

- Project presentation using the provided template
- Final documentation using the provided template
- Team participation and explanation

### Presentation Content

- Problem statement
- Solution overview
- System demo
- Team roles

### Documentation Content

- How to run the project
- User guide
- Technical overview

## Important Note

Passing Phase 3 is mandatory regardless of Phase 1 and Phase 2 scores.

## Evaluation Table

| Phase | Description | Marks |
| --- | --- | ---: |
| Phase 1 | Design and Front-End Development | 6 |
| Phase 2 | Back-End, Connection, and Database | 6 |
| Phase 3 | Report, Presentation, and Teamwork | 3 |

## SmartBooking Project Work Plan

### Current Project Fit

SmartBooking already covers a substantial part of Phase 1:

- Multi-page healthcare appointment booking interface
- HTML, CSS, and JavaScript implementation
- Responsive-oriented page structure
- User-facing flows for registration, login, booking, appointments, and admin dashboard
- Existing design and setup documentation in `docs/`

The project now includes a Node.js backend starter with a SQLite database. The frontend still keeps a `localStorage` fallback for direct file preview, but the preferred workflow is to run the site through the Node server.

### Immediate Priorities

1. Stabilize the frontend pages and navigation.
2. Verify responsive behavior across home, auth, booking, user dashboard, and admin dashboard pages.
3. Add a real backend layer with APIs for users and appointments.
4. Add a database schema and persistent CRUD operations.
5. Update implementation documentation with architecture, database design, and technologies used.
6. Prepare final documentation and presentation material for Phase 3.

### Phase Checklist

| Requirement | Status | Notes |
| --- | --- | --- |
| Website front-end | In progress | Existing HTML/CSS/JS pages are present. |
| Responsive design | In progress | Needs browser verification and polish. |
| Design report | In progress | Existing `docs/DESIGN_REPORT.md` is available. |
| Back-end logic and APIs | In progress | Node.js server exposes auth and appointment APIs. |
| Database connection and schema | In progress | SQLite database is created by `server.js`. |
| CRUD operations | In progress | Appointment create, read, and status update are implemented through the API. |
| Implementation report | In progress | Existing technical docs need backend/database updates. |
| Presentation | Not started | Required for Phase 3. |
| Final documentation | In progress | Existing docs need final run guide and user guide review. |
