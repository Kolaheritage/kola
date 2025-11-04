# CI/CD Pipeline

This directory contains GitHub Actions workflows for automated testing and deployment.

## Workflows

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main` or `develop` branches and on all pull requests.

#### Jobs

1. **Backend Lint & Test**
   - ESLint code quality check
   - Prettier formatting check
   - Jest unit tests with coverage
   - PostgreSQL service for database tests

2. **Frontend Lint & Test**
   - ESLint code quality check
   - Prettier formatting check
   - Jest/React Testing Library tests with coverage

3. **Backend Build Check**
   - Verifies Node.js syntax
   - Ensures no build-breaking errors

4. **Frontend Build Check**
   - Builds React production bundle
   - Verifies no build errors

5. **Docker Build Check**
   - Builds Docker images for both services
   - Ensures Dockerfiles are valid

6. **Security Audit**
   - Runs `npm audit` on dependencies
   - Checks for known vulnerabilities

7. **CI Success**
   - Final job that requires all others to pass
   - Provides clear success/failure status

## Status Badges

Add these badges to your README.md (replace `YOUR_USERNAME` with your GitHub username):

```markdown
[![CI](https://github.com/YOUR_USERNAME/heritage-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/heritage-platform/actions/workflows/ci.yml)
```

## Running Locally

### Backend

```bash
cd backend

# Install dependencies
npm install

# Run linting
npm run lint

# Run formatting check
npm run format:check

# Run tests
npm test

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run linting
npm run lint

# Run formatting check
npm run format:check

# Run tests
npm test

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Code Quality Standards

### ESLint Rules

- **Backend**: Standard Node.js rules with error prevention
- **Frontend**: React-specific rules from `react-app` config
- **Common**: No unused vars, prefer const, consistent formatting

### Prettier Configuration

- Single quotes
- Semicolons required
- 2 spaces indentation
- 100 character line length
- No trailing commas

### Test Coverage

Minimum coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Pre-commit Checklist

Before pushing code:

- [ ] `npm run lint` passes (both backend and frontend)
- [ ] `npm run format:check` passes
- [ ] `npm test` passes
- [ ] Code builds successfully
- [ ] No console errors or warnings

## CI/CD Troubleshooting

### Linting Failures

```bash
# Auto-fix most issues
npm run lint:fix

# Then check what remains
npm run lint
```

### Formatting Failures

```bash
# Auto-format code
npm run format

# Verify formatting
npm run format:check
```

### Test Failures

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- --testNamePattern="test name"

# Update snapshots (if applicable)
npm test -- -u
```

### Build Failures

```bash
# Backend: Check for syntax errors
node -c src/server.js

# Frontend: Try building locally
npm run build
```

### Docker Build Failures

```bash
# Build locally to debug
docker build -t test ./backend
docker build -t test ./frontend
```

## Pull Request Requirements

For a PR to be mergeable:

- ✅ All CI jobs must pass
- ✅ Code must be reviewed
- ✅ No merge conflicts
- ✅ Branch must be up to date with base branch

## GitHub Actions Secrets

No secrets are currently required for CI. Future additions:

- `CODECOV_TOKEN` - For code coverage reports
- `DOCKER_USERNAME` - For Docker Hub
- `DOCKER_PASSWORD` - For Docker Hub

## Future Enhancements

Planned additions:

- [ ] Automated deployment to staging
- [ ] E2E tests with Cypress/Playwright
- [ ] Performance testing
- [ ] Security scanning (CodeQL)
- [ ] Automated dependency updates (Dependabot)
- [ ] Release automation
- [ ] Docker image publishing

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)