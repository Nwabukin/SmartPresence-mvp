# SmartPresence - Backend

This directory contains the Node.js/Express backend application for the SmartPresence MVP.

## Coding Standards

*   **Naming Conventions:**
    *   Variables & Functions: `camelCase` (e.g., `userId`, `getUserData`)
    *   Classes: `PascalCase` (e.g., `UserService`)
    *   Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_USERS`)
    *   Files: `camelCase.js` or `kebab-case.js`
*   **Formatting:** Code formatting is enforced by Prettier using the configuration in `.prettierrc.json`. Run `npm run format` to format code.
*   **Linting:** Code quality and potential errors are checked by ESLint using the configuration in `.eslintrc.js`. Run `npm run lint` to check code.
*   **Comments:** Use comments primarily to explain *why* something is done, not *what* it does (code should be self-explanatory). Document public functions/APIs clearly.
*   **API Design:** Follow RESTful principles for endpoint naming and structure (e.g., `GET /users`, `POST /users/{id}`). Use JSON for requests and responses. 

## User Profiles (Students & Teachers)

The backend supports role-specific profile data stored in separate tables and exposed via the users API.

### Database Tables

- `student_profiles`
  - `user_id` (FK unique → `users.user_id`)
  - `matric_no` (unique, required)
  - `department` (required)
  - `course` (required)
  - `level` (required)
  - `phone` (optional)

- `teacher_profiles`
  - `user_id` (FK unique → `users.user_id`)
  - `lecturer_no` (unique, required)
  - `department` (required)
  - `office` (optional)
  - `phone` (optional)

### API

#### Create User
`POST /api/users`

Request body (common):
```
{ email, password, firstName, lastName, role }
```

If `role === "student"`, you can include:
```
profileStudent: {
  matricNo,        // required
  department,      // required
  course,          // required
  level,           // required
  phone            // optional
}
```

If `role === "teacher"`, you can include:
```
profileTeacher: {
  lecturerNo,      // required
  department,      // required
  office,          // optional
  phone            // optional
}
```

The endpoint runs in a DB transaction, creating the `users` row and corresponding profile row when provided.

#### List Users
`GET /api/users`

Returns users joined with their role-specific `profile` object when applicable, e.g.:
```
{
  user_id, email, first_name, last_name, role, created_at,
  profile: { matric_no, department, course, level, phone } // for students
  // or
  profile: { lecturer_no, department, office, phone } // for teachers
}
```