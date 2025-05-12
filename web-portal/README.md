# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Coding Standards

*   **Naming Conventions:**
    *   Variables & Functions: `camelCase` (e.g., `userId`, `getUserData`)
    *   React Components & Classes: `PascalCase` (e.g., `UserProfile`, `UserService`)
    *   Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_USERS`)
    *   Files: `PascalCase.jsx` for components, `camelCase.js` or `kebab-case.js` for utilities/hooks/etc.
*   **Formatting:** Code formatting is enforced by Prettier using the configuration in `.prettierrc.json`. Run `npm run format` to format code.
*   **Linting:** Code quality and potential errors are checked by ESLint using the configuration in `eslint.config.js`. Run `npm run lint` to check code.
*   **Comments:** Use comments primarily to explain *why* something is done, not *what* it does (code should be self-explanatory). Document component props and complex logic.
