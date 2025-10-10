# Commit and Push to GitHub Origin

This command helps commit and push local changes to GitHub origin following the Gitflow branching strategy.

## Usage

```bash
# Check current branch and status
git status
git branch

# Add all changes (or specify specific files)
git add .

# Commit with descriptive message
git commit -m "feat: <description of changes>"

# Push to current branch origin
git push origin <current-branch>

# If pushing to develop branch for the first time
git push -u origin develop
```

## Gitflow Strategy Compliance

### Current Branch Analysis
- **`main`**: Only receives merges from `release/*` or `hotfix/*` branches
- **`develop`**: Primary integration branch for features
- **`feature/*`**: Feature development branches
- **`release/*`**: Release preparation branches
- **`hotfix/*`**: Critical production fixes

### Commit Message Format
```
<type>: <description>

[optional body explaining WHY, not what]
```

**Types:**
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code improvement
- `docs`: documentation
- `chore`: maintenance

### Pre-Push Checklist
1. ✅ Code builds and runs without errors
2. ✅ All tests pass (if applicable)
3. ✅ Linting passes (ESLint, Dart Analyzer)
4. ✅ Commit message follows format
5. ✅ Branch follows Gitflow naming convention

### Branch-Specific Commands

**For Feature Branches:**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# After development, push feature branch
git push origin feature/your-feature-name
```

**For Release Branches:**
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/version-number

# Push release branch
git push origin release/version-number
```

**For Hotfix Branches:**
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-description

# Push hotfix branch
git push origin hotfix/fix-description
```

## Safety Checks

Before pushing, verify:
- Current branch is appropriate for the changes
- No sensitive data (API keys, passwords) in commits
- All changes are intentional and tested
- Branch is up to date with remote

## Emergency Commands

**If you need to undo last commit (before push):**
```bash
git reset --soft HEAD~1
```

**If you need to undo last commit (after push):**
```bash
git revert HEAD
git push origin <branch-name>
```

**If you need to force push (use with caution):**
```bash
git push --force-with-lease origin <branch-name>
```

## Integration with Project Standards

This command follows the SmartPresence MVP development guidelines:
- Adheres to Gitflow branching strategy
- Uses pnpm for package management
- Follows coding standards for each sub-project
- Maintains functional code first approach
