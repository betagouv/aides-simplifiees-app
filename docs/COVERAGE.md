# Test Coverage Guide

This project uses [c8](https://github.com/bcoe/c8) for test coverage analysis.

## Quick Start

```bash
# Run all tests and collect coverage data
pnpm test:coverage

# Generate HTML, text, and LCOV reports
pnpm coverage:report

# Open the HTML coverage report in your browser
pnpm coverage:open

# Check if coverage meets minimum thresholds
pnpm coverage:check
```

## Coverage Thresholds

Current minimum coverage requirements:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 60%
- **Statements**: 70%

## Coverage Reports

After running coverage, you'll find reports in the `coverage/` directory:

- `coverage/index.html` - Interactive HTML report (recommended)
- `coverage/lcov.info` - LCOV format for CI/CD integration
- Terminal output shows a summary

## What's Covered

The coverage analysis includes:
- All files in `app/` directory
- Controllers, Models, Services, etc.

## What's Excluded

- Test files (`tests/**`)
- Configuration files (`config/**`)
- Database migrations and seeders
- Build artifacts
- Node modules
- TypeScript declaration files

## CI/CD Integration

The LCOV report (`coverage/lcov.info`) can be used with services like:
- Codecov
- Coveralls
- GitHub Actions
- GitLab CI

## Tips for Better Coverage

1. **Focus on Business Logic**: Prioritize testing controllers, models, and services
2. **Test Edge Cases**: Include error conditions and boundary cases
3. **Use Factories**: Leverage test factories for consistent test data
4. **Mock External Dependencies**: Use mocks for third-party services
5. **Test Happy and Sad Paths**: Cover both success and failure scenarios

## Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Models | 90%+ |
| Controllers | 80%+ |
| Services | 85%+ |
| Validators | 80%+ |
| Middleware | 75%+ |

## Common Commands

```bash
# Quick coverage check
npm run test:coverage && npm run coverage:report

# Coverage with specific test files
npx c8 node ace test tests/unit/models/

# Coverage for functional tests only
npx c8 node ace test tests/functional/

# Generate only HTML report
npx c8 report --reporter=html
```
