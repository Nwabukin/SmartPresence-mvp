module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true, // Important for backend Node.js projects
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'prettier/prettier': 'error', // Show Prettier errors as ESLint errors
    // Add any other custom ESLint rules here
  },
};
