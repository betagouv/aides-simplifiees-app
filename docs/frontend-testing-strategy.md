# Frontend Testing Strategy Options

**Date**: 2025-11-01  
**Context**: Need to unit test frontend OpenFisca request builder code  
**Issue**: Current test suite (Japa) runs in backend/Node environment, can't resolve Vite aliases

---

## Current Situation

### Test Infrastructure
- **Framework**: Japa (AdonisJS test runner)
- **Environment**: Node.js with ts-node
- **Scope**: Backend unit tests + E2E tests (Playwright)
- **Aliases**: Uses `#` prefix (package.json imports) - backend only

### Frontend Code
- **Location**: `inertia/` directory
- **Build Tool**: Vite
- **Aliases**: Uses `~` prefix (Vite alias) - frontend only
- **Context**: Vue 3 + Inertia.js + TypeScript

### The Problem
- OpenFisca request builder is in `inertia/utils/openfisca/request-builder/`
- Uses relative imports (`.js` extensions) to avoid Vite alias issues
- But imports from sibling files that still use `~` aliases (`constants.ts`, `date_periods.ts`, etc.)
- Japa test runner can't resolve these `~` aliases

---

## Options Analysis

### Option 1: Vitest for Frontend Unit Tests ⭐ RECOMMENDED

**Add Vitest as parallel test runner for frontend code**

**Pros**:
- ✅ Native Vite support - understands `~` aliases automatically
- ✅ Fast - uses Vite's transform pipeline
- ✅ Vue 3 testing support via @vue/test-utils
- ✅ Compatible with existing tests (runs separately)
- ✅ Modern, well-maintained, large ecosystem
- ✅ Can mock Pinia stores, composables
- ✅ Built-in coverage (c8/istanbul)

**Cons**:
- ❌ Adds another test framework (Japa + Vitest)
- ❌ Need to manage two test configs
- ❌ ~200KB additional dependencies

**Implementation**:
```bash
pnpm add -D vitest @vue/test-utils happy-dom @vitest/coverage-v8
```

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './inertia'),
    },
  },
})
```

**Test File**:
```typescript
// tests/frontend/request_builder.spec.ts
import { describe, it, expect } from 'vitest'
import { OpenFiscaRequestBuilder } from '~/utils/openfisca/request-builder'
import { Entites, INDIVIDU_ID } from '~/utils/openfisca/constants'

describe('OpenFiscaRequestBuilder', () => {
  it('should initialize with empty entities', () => {
    const builder = new OpenFiscaRequestBuilder()
    const result = builder.build()
    
    expect(result.success).toBe(true)
  })
})
```

**Effort**: 2-3 hours  
**Maintenance**: Low - Vitest is very stable

---

### Option 2: Fix All OpenFisca Files to Use Relative Imports

**Convert all `~/utils/openfisca/` files from Vite aliases to relative imports**

**Pros**:
- ✅ No new dependencies
- ✅ Works with existing Japa tests
- ✅ More explicit imports
- ✅ Better IDE support in some cases

**Cons**:
- ❌ Large refactoring (~20 files to update)
- ❌ Relative imports are verbose (`../../../`)
- ❌ Breaks existing pattern used throughout frontend
- ❌ Need to update all imports in Vue components too
- ❌ High risk of breaking changes
- ❌ Ongoing maintenance burden

**Files to modify**:
- `inertia/utils/openfisca/*.ts` (~15 files)
- `inertia/composables/use_simulation.ts`
- Any Vue components importing OpenFisca utils

**Effort**: 1-2 days + testing  
**Maintenance**: High - need to maintain relative imports

---

### Option 3: Configure ts-node to Support Vite Aliases

**Add path mappings to tsconfig for test runner**

**Pros**:
- ✅ No frontend code changes needed
- ✅ Uses existing test framework

**Cons**:
- ❌ ts-node doesn't support Vite plugins well
- ❌ Need custom loader/transformer
- ❌ Complex configuration
- ❌ May break on ts-node updates
- ❌ Still doesn't solve Vue component testing

**Implementation**:
- Add `tsconfig.test.json` with path mappings
- Configure ts-node with custom paths
- May need ts-node paths plugin

**Effort**: 3-4 hours (trial and error)  
**Maintenance**: Medium - fragile configuration

---

### Option 4: Extract Pure Logic to Shared Package

**Create a shared package with no frontend dependencies**

**Pros**:
- ✅ Clean separation of concerns
- ✅ Reusable across projects
- ✅ Easy to test (no framework dependencies)

**Cons**:
- ❌ Over-engineering for current needs
- ❌ Need to manage monorepo or separate package
- ❌ Still need frontend tests for integration
- ❌ Doesn't solve immediate problem

**Effort**: 1 week  
**Maintenance**: High - package management overhead

---

### Option 5: Mock Frontend Dependencies in Backend Tests

**Keep tests in Japa but mock all Vite-dependent imports**

**Pros**:
- ✅ Uses existing test framework
- ✅ No new dependencies

**Cons**:
- ❌ Heavy mocking = brittle tests
- ❌ Not testing real code paths
- ❌ Defeats purpose of unit tests
- ❌ Complex mock setup

**Effort**: 2-3 hours per test file  
**Maintenance**: Very high - mocks need constant updates

---

### Option 6: E2E Tests Only (Current Approach)

**Test through existing Playwright E2E tests**

**Pros**:
- ✅ No additional setup
- ✅ Tests real user flows
- ✅ Already have 127 tests

**Cons**:
- ❌ Slow feedback loop
- ❌ Hard to test edge cases
- ❌ No unit-level isolation
- ❌ Harder to debug failures
- ❌ Lower coverage granularity

**Effort**: 0 (already done)  
**Maintenance**: Low

---

## Recommendation

### Short Term (Today): Option 6
Continue with E2E tests for now. The builder will be thoroughly tested when integrated.

### Medium Term (Next Sprint): Option 1 - Vitest

**Why Vitest?**
1. **Industry Standard**: Vue 3 ecosystem recommends Vitest
2. **Zero Config**: Works with existing Vite setup
3. **Fast**: Much faster than E2E for iteration
4. **Complete**: Can test composables, components, utilities
5. **Coverage**: Better granular coverage than E2E
6. **Future-Proof**: Will be useful for all frontend testing

**Implementation Plan**:
```bash
# 1. Install Vitest
pnpm add -D vitest @vue/test-utils happy-dom @vitest/coverage-v8

# 2. Create vitest.config.ts (see above)

# 3. Create tests/frontend/ directory
mkdir -p tests/frontend/utils/openfisca

# 4. Add script to package.json
"test:frontend": "vitest"
"test:frontend:ui": "vitest --ui"
"test:frontend:coverage": "vitest --coverage"

# 5. Update CI to run both test suites
"test:all": "pnpm test && pnpm test:frontend"
```

**Migration Path**:
- Phase 1: Set up Vitest (2 hours)
- Phase 2: Port OpenFisca builder tests (3 hours)
- Phase 3: Add composable tests (ongoing)
- Phase 4: Add component tests (future)

---

## Decision Matrix

| Criteria | Vitest | Relative Imports | ts-node Config | E2E Only |
|----------|--------|------------------|----------------|----------|
| Setup Time | 2-3h | 1-2d | 3-4h | 0h |
| Test Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Maintainability | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Test Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Future Value | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Risk | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Proposed Action

1. **Immediate**: Continue Phase 5 integration, test with E2E
2. **Next**: Set up Vitest in a separate PR
3. **Future**: Gradually add frontend unit tests for critical paths

This gives us:
- ✅ Unblocked development (keep moving forward)
- ✅ Better test infrastructure (Vitest)
- ✅ Comprehensive coverage (E2E + Unit)
- ✅ Future-proof architecture
