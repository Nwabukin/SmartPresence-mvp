# Clean Folder or Codebase

This command helps clean and organize your codebase by removing unused files, sorting files properly, and grouping them into appropriate folders.

## Usage

```bash
# Clean entire codebase
npm run clean:all

# Clean specific folder
npm run clean:folder <folder-path>

# Clean with backup (recommended for first run)
npm run clean:backup

# Clean and organize files
npm run clean:organize
```

## What This Command Does

### 1. File Cleanup
- **Remove unused files**: Delete files not referenced in the codebase
- **Remove duplicate files**: Identify and remove duplicate content
- **Remove empty directories**: Clean up empty folder structures
- **Remove temporary files**: Delete `.tmp`, `.cache`, `.log` files
- **Remove build artifacts**: Clean `dist/`, `build/`, `node_modules/.cache/`

### 2. File Organization
- **Sort files by type**: Group similar files together
- **Rename files consistently**: Apply naming conventions
- **Move files to correct locations**: Place files in appropriate directories
- **Create proper folder structure**: Ensure logical organization

### 3. Codebase Structure Optimization

**Backend Organization:**
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   ├── routes/          # Route definitions
│   └── config/          # Configuration files
├── tests/               # Test files
├── docs/                # Documentation
└── scripts/             # Build/deployment scripts
```

**Frontend Organization:**
```
web-portal/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── utils/           # Helper functions
│   ├── styles/          # CSS/SCSS files
│   └── assets/          # Static assets
├── public/              # Public assets
└── tests/               # Test files
```

**Mobile App Organization:**
```
mobile-app/
├── lib/
│   ├── screens/         # Screen components
│   ├── widgets/         # Reusable widgets
│   ├── services/        # API services
│   ├── models/          # Data models
│   ├── utils/           # Helper functions
│   └── constants/       # App constants
├── assets/               # Images, fonts, etc.
└── test/                # Test files
```

## File Naming Conventions

### Backend (Node.js)
- **Files**: `camelCase.js` (e.g., `userService.js`)
- **Classes**: `PascalCase.js` (e.g., `UserController.js`)
- **Constants**: `UPPER_SNAKE_CASE.js` (e.g., `API_ENDPOINTS.js`)

### Frontend (React)
- **Components**: `PascalCase.jsx` (e.g., `UserProfile.jsx`)
- **Hooks**: `camelCase.js` (e.g., `useAuth.js`)
- **Services**: `camelCase.js` (e.g., `apiService.js`)

### Mobile (Flutter)
- **Files**: `snake_case.dart` (e.g., `user_service.dart`)
- **Classes**: `PascalCase` (e.g., `UserController`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINTS`)

## Cleanup Rules

### Files to Remove
- **Unused imports**: Remove unused import statements
- **Dead code**: Remove unreachable code blocks
- **Console logs**: Remove development console.log statements
- **TODO comments**: Remove completed TODO items
- **Duplicate files**: Remove identical files
- **Empty files**: Remove files with no content
- **Temporary files**: Remove `.tmp`, `.cache`, `.log` files

### Files to Keep
- **Configuration files**: `package.json`, `tsconfig.json`, etc.
- **Documentation**: `README.md`, `API_DOCUMENTATION.md`
- **Test files**: `*.test.js`, `*.spec.js`
- **Migration files**: Database migration scripts
- **Environment files**: `.env.example`, `.env.template`

## Folder Structure Rules

### 1. Group by Function
- **Controllers**: Handle HTTP requests
- **Services**: Business logic
- **Models**: Data structures
- **Utils**: Helper functions
- **Middleware**: Request processing

### 2. Group by Feature
- **Auth**: Authentication related files
- **Users**: User management files
- **Classes**: Class management files
- **Attendance**: Attendance related files

### 3. Group by Type
- **Components**: UI components
- **Pages**: Full page components
- **Hooks**: Custom React hooks
- **Services**: API services

## Safety Features

### Backup Before Cleanup
```bash
# Create backup before cleaning
npm run clean:backup

# This creates a backup in ./backup/ directory
```

### Dry Run Mode
```bash
# See what would be cleaned without actually doing it
npm run clean:dry-run
```

### Selective Cleaning
```bash
# Clean only specific file types
npm run clean:js-files
npm run clean:css-files
npm run clean:test-files
```

## Integration with Project Standards

This command follows SmartPresence MVP guidelines:
- **Functional code first**: Preserves working code
- **Proper naming conventions**: Applies project standards
- **Gitflow compliance**: Maintains branch structure
- **pnpm compatibility**: Works with pnpm package manager

## Advanced Features

### 1. Dependency Analysis
- **Unused dependencies**: Remove from package.json
- **Missing dependencies**: Add to package.json
- **Version conflicts**: Resolve dependency issues

### 2. Code Quality
- **Linting**: Run ESLint/Dart Analyzer
- **Formatting**: Apply Prettier/dart format
- **Type checking**: Run TypeScript compiler

### 3. Performance Optimization
- **Bundle analysis**: Analyze bundle sizes
- **Tree shaking**: Remove unused code
- **Asset optimization**: Compress images and assets

## Usage Examples

```bash
# Clean entire codebase with backup
npm run clean:backup
npm run clean:all

# Clean specific project
npm run clean:backend
npm run clean:frontend
npm run clean:mobile

# Clean and organize
npm run clean:organize

# Clean with specific options
npm run clean:files -- --remove-unused --organize --backup
```

## Recovery Commands

```bash
# Restore from backup
npm run clean:restore

# Undo last cleanup
npm run clean:undo

# List cleanup history
npm run clean:history
```

## Configuration

Create `.clean-config.json` in project root:
```json
{
  "exclude": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "fileTypes": {
    "remove": [".tmp", ".cache", ".log"],
    "organize": [".js", ".jsx", ".ts", ".tsx"]
  },
  "backup": true,
  "dryRun": false
}
```

This command ensures your codebase is clean, organized, and follows best practices while maintaining functionality.
