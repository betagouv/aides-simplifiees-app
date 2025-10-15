# Improvement Branches Strategy

**Date**: 2025-10-31  
**Base Branch**: `llms`  
**Reference**: `docs/analysis-improvements.md`

---

## Branching Strategy

Each improvement from the analysis document gets its own feature branch for:
- Better code review
- Independent testing
- Easier rollback if needed
- Clear git history

### Branch Naming Convention

```
<type>/<short-description>
```

**Types**:
- `refactor/` - Code restructuring without behavior change
- `feat/` - New features or significant enhancements
- `fix/` - Bug fixes
- `perf/` - Performance improvements
- `test/` - Adding or improving tests
- `docs/` - Documentation only
- `security/` - Security improvements

---

## Priority 1: Critical Issues (Q1 2026)

### ✅ 1. Surveys Store Refactoring - COMPLETED & MERGED
**Branch**: `refactor/surveys-store-composables`  
**Status**: ✅ Merged to llms  
**Completed**: 2025-10-31  
**Effort**: 2 weeks  
**Files**: 8 new composables, 1 refactored store (700→255 lines), documentation

**Results**:
- Created 6 domain-focused composables
- Reduced main store from 700 to 255 lines
- Incorporated type safety improvements (SurveyAnswerValue)
- All tests passing
- Both improvements combined via rebase

---

### ✅ 2. Type Safety - Eliminate `any` Types - COMPLETED & MERGED
**Branch**: `refactor/eliminate-any-types`  
**Status**: ✅ Merged to llms  
**Completed**: 2025-10-31  
**Effort**: 2 weeks  
**Priority**: Critical

**Scope**:
- Replace `any` with specific types in:
  - `inertia/utils/evaluate_conditions.ts`
  - `inertia/utils/autocomplete_functions.ts`
  - `inertia/composables/use_surveys_store_definer.ts` (if any remain)
  - Survey answer types
- Create union types for answers
- Create discriminated unions for conditions
- Update autocomplete function types

**Files to modify** (~15 files):
- Type definition files in `inertia/types/`
- Utilities with `any` usage
- Components receiving `any` props

**Tests**:
- Verify type inference works
- No runtime behavior changes
- All tests pass

---

### ✅ 3. Error Handling Standardization - PHASE 1 COMPLETED & MERGED
**Branch**: `refactor/error-handling-patterns`  
**Status**: ✅ Phase 1 merged to llms  
**Completed**: 2025-10-31  
**Effort**: 1 week  
**Priority**: Critical

**Phase 1 - Quick Wins (Completed)**:
- ✅ Fixed backend `console.error` → `LoggingService` in admin_persona_controller
- ✅ Created ErrorBoundary.vue component
- ✅ Added error tracking infrastructure (ErrorTracker interface)
- ✅ Frontend error tracking utility (Sentry-ready)

**Phase 2 - Deferred**:
- ⏸️ Result pattern utility
- ⏸️ Replace inconsistent error handling (~20 files)
- ⏸️ More comprehensive error boundaries

**Files created**:
- `inertia/components/ErrorBoundary.vue` - Vue error boundary
- `shared/types/error_tracker.ts` - ErrorTracker interface
- `inertia/utils/error_tracker.ts` - Frontend tracking utility
- `app/utils/error-handling.plan.llm.txt` - Implementation plan

**Files modified**:
- `app/controllers/admin/admin_persona_controller.ts` - Fixed console.error

**Tests**:
- All 127 tests passing

---

### 4. Security Improvements
**Branch**: `security/csp-and-rate-limiting`  
**Effort**: 1 week  
**Priority**: Critical

**Scope**:
- Add Content Security Policy middleware
- Implement rate limiting on API endpoints
- Add input sanitization for CMS content

**Files to create**:
- `app/middleware/csp_middleware.ts`
- `app/middleware/throttle_middleware.ts`
- `app/utils/sanitize.ts`

**Files to modify**:
- `start/kernel.ts` - Register middlewares
- API route definitions
- CMS content rendering

**Tests**:
- CSP header verification
- Rate limit behavior tests
- Sanitization unit tests

---

## Priority 2: High Priority (Q2 2026)

### 5. Performance - Bundle Optimization
**Branch**: `perf/bundle-optimization`  
**Effort**: 1 week  
**Priority**: High

**Scope**:
- Implement code splitting
- Dynamic imports for heavy components
- Split vendor chunks
- Lazy load admin routes

**Files to modify**:
- `vite.config.ts` - Manual chunks configuration
- Component imports (async components)
- Route definitions

**Tests**:
- Bundle size analysis
- Lighthouse performance scores
- E2E tests (no regressions)

---

### 6. Testing - Expand Coverage
**Branch**: `test/expand-coverage`  
**Effort**: 3 weeks  
**Priority**: High

**Scope**:
- Unit tests for OpenFisca utilities
- Component tests for Vue components
- Store tests for Pinia stores
- Integration tests for API endpoints

**Files to create**:
- `tests/unit/openfisca/*.spec.ts`
- `tests/unit/components/*.spec.ts`
- `tests/unit/stores/*.spec.ts`

**Target**: 80% coverage on critical paths

---

### 7. OpenFisca Request Builder Refactoring
**Branch**: `refactor/openfisca-builder-pattern`  
**Effort**: 2 weeks  
**Priority**: High

**Scope**:
- Implement Builder pattern for request construction
- Reduce cyclomatic complexity
- Centralize error handling
- Improve testability

**Files to modify**:
- `inertia/utils/openfisca/build_calculation_request.ts`
- Create `inertia/utils/openfisca/request-builder/` directory

**Tests**:
- Builder pattern unit tests
- Error collection tests
- Integration tests with OpenFisca API

---

### 8. Monitoring - Error Tracking
**Branch**: `feat/error-tracking-sentry`  
**Effort**: 1 week  
**Priority**: High

**Scope**:
- Integrate Sentry for error tracking
- Add performance monitoring
- Configure error reporting

**Files to modify**:
- `app/exceptions/handler.ts`
- `inertia/app/app.ts`
- Environment configuration

---

## Priority 3: Medium Priority (Q3 2026)

### 9. Caching - Schema Caching Strategy
**Branch**: `perf/schema-caching`  
**Effort**: 1 week  
**Priority**: Medium

**Scope**:
- HTTP caching headers for schemas
- ETag support
- Frontend SWR pattern implementation

**Files to modify**:
- `app/controllers/content/simulateur_controller.ts`
- `inertia/composables/use_survey_schema_manager.ts`

---

### 10. Route Organization
**Branch**: `refactor/split-route-files`  
**Effort**: 1 week  
**Priority**: Medium

**Scope**:
- Split `start/routes.ts` into domain files
- Create `start/routes/` directory
- Group routes by domain

**Files to create**:
- `start/routes/auth.ts`
- `start/routes/api.ts`
- `start/routes/admin.ts`
- `start/routes/content.ts`
- `start/routes/static.ts`

---

### 11. Documentation - JSDoc Comments
**Branch**: `docs/add-jsdoc-comments`  
**Effort**: 2 weeks  
**Priority**: Medium

**Scope**:
- Add JSDoc to complex functions
- Document parameters and return types
- Add usage examples

**Files to modify**: All utility files and complex functions

---

### 12. Accessibility - Keyboard Navigation
**Branch**: `feat/improve-keyboard-navigation`  
**Effort**: 1 week  
**Priority**: Medium

**Scope**:
- Improve keyboard navigation in surveys
- Add ARIA labels where missing
- Test with screen readers

---

## Priority 4: Nice to Have (Q4 2026)

### 13. Storybook Integration
**Branch**: `feat/storybook-components`  
**Effort**: 2 weeks  
**Priority**: Low

**Scope**:
- Set up Storybook
- Document components
- Add interaction tests

---

### 14. Performance Monitoring
**Branch**: `feat/performance-metrics`  
**Effort**: 1 week  
**Priority**: Low

**Scope**:
- Add performance tracking composable
- Track key user flows
- Send metrics to analytics

---

### 15. Developer Experience - Helpful Scripts
**Branch**: `feat/dev-scripts`  
**Effort**: 1 week  
**Priority**: Low

**Scope**:
- Add helpful npm scripts
- Improve pre-commit hooks
- Bundle analysis tools

---

## Workflow for Each Branch

### 1. Create Branch
```bash
git checkout llms
git pull origin llms
git checkout -b <type>/<description>
```

### 2. Create Plan File (if 4+ files)
```bash
# Create .plan.llm.txt in appropriate directory
# Follow template from refactor-store.plan.llm.txt
```

### 3. Implementation
- Follow plan if exists
- Run tests frequently
- Commit incrementally

### 4. Testing
```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:a11y  # if UI changes
```

### 5. Documentation
- Update relevant `.llm.txt` files (AFTER user validation for bug fixes)
- Use static reference style (no temporal language)
- Update plan file status

### 6. Commit
```bash
git add <files>
git commit -m "<type>: <description>

<detailed explanation>

Benefits:
- Benefit 1
- Benefit 2

Tests: All X tests pass"
```

### 7. Ready for Review
```bash
# Push to remote
git push origin <branch-name>

# Create PR targeting 'llms' branch
# Link to analysis-improvements.md
# Reference plan file if exists
```

---

## Current Status

| Priority | Branch | Status | Effort | Assignee |
|----------|--------|--------|--------|----------|
| P1 | `refactor/surveys-store-composables` | ✅ Complete | 2 weeks | - |
| P1 | `refactor/eliminate-any-types` | ✅ Complete | 2 weeks | - |
| P1 | `refactor/error-handling-patterns` | ✅ Complete (Phase 1) | 1 week | - |
| P1 | `security/csp-and-rate-limiting` | 📋 Ready | 1 week | - |
| P2 | `perf/bundle-optimization` | 📋 Ready | 1 week | - |
| P2 | `test/expand-coverage` | 📋 Ready | 3 weeks | - |
| P2 | `refactor/openfisca-builder-pattern` | 📋 Ready | 2 weeks | - |
| P2 | `feat/error-tracking-sentry` | 📋 Ready | 1 week | - |
| ... | ... | ... | ... | ... |

---

## Notes

- **Base branch**: Always branch from `llms`
- **Testing**: All tests must pass before considering complete
- **Documentation**: Update after user validates changes
- **Code review**: Each branch gets independent review
- **Merging**: Merge to `llms` after approval
- **Deployment**: Batch merge to `main` for deployment

---

## Next Recommended Branch

**Priority 1, Item 2**: `refactor/eliminate-any-types`

This is the next critical improvement and builds on the type safety improvements from the surveys store refactoring.
