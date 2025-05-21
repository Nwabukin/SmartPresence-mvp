# SmartPresence MVP: TODO List

This document tracks the development progress for the SmartPresence MVP.

## 0. Project Setup and Initialization

- [x] **Task 0.1: Version Control Setup**
    - [x] Initialize Git repository.
    - [x] Define branching strategy (e.g., Gitflow).
- [ ] **Task 0.2: Project Structure and Tooling**
    - [x] Create main project directory and subdirectories for backend, web-portal, and mobile-app.
    - [x] Set up linters and formatters for each sub-project (e.g., ESLint, Prettier for Node.js/React; Dart/Flutter linters). (Backend and Web Portal Done)
    - [ ] Choose and set up a task management tool (e.g., Trello, Jira, GitHub Issues/Projects).
- [ ] **Task 0.3: Initial Backend Project Setup (Node.js/Express)**
    - [x] Initialize `npm` project (`npm init`).
    - [x] Install core dependencies (Express, etc.).
    - [x] Set up basic server structure.
- [x] **Task 0.4: Initial Web Portal Project Setup (React)**
    - [x] Initialize `npm` project (`npm init`). (Implicitly done during lint/format setup)
    - [x] Install core dependencies (React, etc.). (Implicitly done)
    - [x] Initialize React project (e.g., using Vite or Create React App is still needed for full setup). (Completed with Vite)
    - [x] Set up basic folder structure (components, pages, services).
- [x] **Task 0.5: Initial Mobile App Project Setup (Flutter)**
    - [x] Initialize Flutter project (`flutter create`).
    - [x] Set up basic folder structure (screens, widgets, services). (Initial structure created by Flutter)
- [x] **Task 0.6: Define Basic Coding Standards and Conventions**
    - [x] Document naming conventions, code style preferences.

## I. Core System Setup & Backend (Node.js, Express, PostgreSQL)

- [x] **Task 1: Database Schema Design & Setup (PostgreSQL)**
    - [x] Define tables for: Users (Admins, Teachers, Students with roles), Rooms (with Wi-Fi SSID, Bluetooth Beacon ID), Classes, Sessions (with date, time window, room_id), Student_Enrollments (linking students to classes), Attendance_Records (linking students to sessions, timestamp, status).
    - [x] Set up the PostgreSQL database on Heroku (or locally for development). (Local setup with migrations complete)
- [x] **Task 2: API Development - Authentication (Node.js, Express, JWT)**
    - [x] Implement user registration and login endpoints. (Note: Registration now admin-only under Task 3)
    - [x] Generate JWT tokens upon successful login.
    - [x] Create middleware to protect routes, verifying JWT tokens.
- [ ] **Task 3: API Development - Admin Functionality**
    - [ ] Endpoints for:
        - [x] Creating/Reading/Updating/Deleting (CRUD) Rooms (including Wi-Fi SSID, Bluetooth Beacon ID).
        - [x] CRUD operations for Teacher accounts.
        - [x] CRUD operations for Student accounts.
        - [x] Assigning roles to users. (Note: Role assigned at creation; update not yet implemented)
- [x] **Task 4: API Development - Teacher Functionality**
    - [x] Endpoints for:
        - [x] CRUD operations for Classes.
        - [x] Enrolling/Unenrolling students in Classes.
        - [x] CRUD operations for Sessions (linking to a Class and a Room, setting date/time window).
        - [x] Viewing attendance records for a Session.
        - [x] Manually updating attendance records (e.g., mark present/absent).
- [x] **Task 5: API Development - Student Functionality (for Mobile App)**
    - [ ] Endpoints for:
        - [x] Fetching enrolled classes for a student.
        - [x] Marking attendance for a session:
            - [ ] Input: class_id, session_id, current Wi-Fi SSID, current Bluetooth Beacon ID.
            - [ ] Logic:
                - [x] Verify student is enrolled in the class.
                - [x] Verify session exists and is currently active (within time window).
                - [x] Fetch room details for the session.
                - [x] Compare submitted Wi-Fi SSID and Bluetooth Beacon ID with the room's configured IDs.
                - [x] Prevent duplicate attendance for the same student in the same session.
                - [x] Record attendance if all checks pass.
- [x] **Task 6: API Development - Location Verification Logic**
    - [x] Implement the core logic within the attendance marking endpoint to compare submitted Wi-Fi/Bluetooth data with stored room data.

## II. Web Portal Development (React)

- [x] **Task 7: Setup React Project & Basic Structure**
    - [x] Initialize React application.
    - [x] Set up routing.
    - [x] Implement JWT handling for API requests.
- [ ] **Task 8: Admin UI - Room Management**
    - [ ] Interface to list, create, edit, and delete rooms (with Wi-Fi SSID and Bluetooth Beacon ID fields).
- [ ] **Task 9: Admin UI - User Management**
    - [ ] Interface to list, create, edit (roles), and delete teacher and student accounts.
- [ ] **Task 10: Teacher UI - Class Management**
    - [ ] Interface to list, create, edit, and delete classes.
- [ ] **Task 11: Teacher UI - Student Enrollment Management**
    - [ ] Interface to add/remove students from classes.
- [ ] **Task 12: Teacher UI - Session Management**
    - [ ] Interface to schedule sessions for classes (select class, room, date, time window).
    - [ ] List existing sessions.
- [ ] **Task 13: Teacher UI - Attendance Viewing & Modification**
    - [ ] Interface to view attendance records for a session.
    - [ ] Allow manual modification of attendance status.

## III. Mobile App Development (Flutter)

- [ ] **Task 14: Setup Flutter Project & Basic Structure**
    - [ ] Initialize Flutter application.
    - [ ] Set up navigation.
    - [ ] Implement JWT handling for API requests.
- [ ] **Task 15: Student UI - Login**
    - [ ] Login screen for students.
- [ ] **Task 16: Student UI - View Enrolled Classes**
    - [ ] Screen to display a list of classes the logged-in student is enrolled in.
    - [ ] Display upcoming/current sessions for those classes.
- [ ] **Task 17: Student UI - Mark Attendance**
    - [ ] Interface to select a class/session.
    - [ ] Button to "Mark Attendance".
- [ ] **Task 18: Flutter Native Integration - Wi-Fi & Bluetooth Scanning**
    - [ ] Implement platform-specific code (or use plugins) to scan for current Wi-Fi SSID.
    - [ ] Implement platform-specific code (or use plugins) to scan for nearby Bluetooth beacon IDs.
    - [ ] Pass this data to the backend API when marking attendance.
- [ ] **Task 19: Student UI - Attendance Feedback**
    - [ ] Display success/failure messages after attempting to mark attendance (e.g., "Attendance Marked," "Error: Not in Location," "Error: Outside Time Window").

## IV. Deployment & General Tasks

- [ ] **Task 20: Heroku Deployment Setup**
    - [ ] Configure backend (Node.js/Express) for Heroku deployment.
    - [ ] Configure web portal (React) for static site hosting (e.g., Heroku, Netlify, Vercel).
    - [ ] (Mobile app deployment will be via app stores, but initial testing can be direct builds).
- [ ] **Task 21: Thorough Testing**
    - [ ] Unit tests for backend logic.
    - [ ] Integration tests for API endpoints.
    - [ ] End-to-end testing for user flows (Admin, Teacher, Student).
- [ ] **Task 22: Documentation**
    - [ ] API documentation.
    - [ ] Basic user guides if necessary. 