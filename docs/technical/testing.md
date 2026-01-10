# Testing Strategy

## Overview

This project uses a multi-layered testing strategy to ensure reliability across the stack.

## Frameworks & Tools

| Scope | Framework | Config | Usage |
|-------|-----------|--------|-------|
| **Backend** | [Japa](https://japa.dev) | `test.ts` | Unit testing Controllers, Services, Models. |
| **Frontend** | [Vitest](https://vitest.dev) | `vitest.config.ts` | Unit testing Vue components, Composables, Utils. |
| **E2E** | [Playwright](https://playwright.dev) | `playwright.config.ts` | End-to-End user flow validation. |
| **Accessibility**| [Axe Core](https://github.com/dequelabs/axe-core) | `scripts/accessibility_report.cjs`| RGAA 4.1 compliance checks. |

## 1. Backend Testing (Japa)

**Location**: `tests/unit/`
**Command**: `pnpm test`

Used for AdonisJS specific logic. Mocks are generally discouraged for database interactions (use a real test DB), but **required** for external APIs (OpenFisca, Matomo).

### Example
```typescript
test('it calculates eligibility', async ({ client }) => {
  const response = await client.post('/api/calculate').json({ ... })
  response.assertStatus(200)
})
```

## 2. Frontend Testing (Vitest)

**Location**: `tests/frontend/`
**Command**: `pnpm test:frontend`

Used for pure logic in `inertia/` directory (Composables, Stores, Utils).
**Key constraint**: Use `happy-dom` environment.

### Example
```typescript
import { mount } from '@vue/test-utils'
import MyComponent from '~/components/MyComponent.vue'

test('renders correctly', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.text()).toContain('Hello')
})
```

## 3. End-to-End Testing (Playwright)

**Location**: `tests/e2e/`
**Command**: `pnpm test:e2e`

Tests the full stack.
- **Environment**: Runs against a local dev server (`pnpm dev` or `pnpm start`).
- **Database**: Should be seeded with stable test data (`node ace db:seed`).

## Coverage

**Command**: `pnpm test:coverage`

We track coverage to ensure critical paths are tested.

### Thresholds
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 60%
- **Statements**: 70%

### Viewing Reports
LCOV reports are generated in `coverage/`. Open `coverage/index.html` for a visual heatmap.
