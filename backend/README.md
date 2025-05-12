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