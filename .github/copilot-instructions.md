---
description: Detailed Copilot instructions for aides-simplifiees-app
---

# Copilot Instructions - Aides Simplifiées

> **Note**: For a quick checklist, see `.github/copilot-critical-rules.md`

## Project Overview

**Aides Simplifiées** is a platform for simulating eligibility for multiple financial aids. The application uses a modern stack with AdonisJS for the backend and Vue.js/Inertia.js for the frontend.

### Technology Stack

- **Backend**: AdonisJS v6 (TypeScript)
  - Full-stack Node.js framework with MVC structure
  - Lucid ORM for PostgreSQL
  - Built-in authentication system
  - Middleware for request handling

- **Frontend**: Vue.js 3 + Inertia.js
  - Inertia.js: framework for building SPAs with server-side rendering
  - VueDsfr: Vue implementation of the French State Design System
  - Vue 3 Composition API
  - Strict TypeScript

- **Build Tools**:
  - Vite: bundler and development server
  - Multi-build configuration (main app + iframe integration)

- **Database**: PostgreSQL
  - Migrations with Lucid
  - Seeders for test data

- **Testing**:
  - Japa: AdonisJS test framework
  - E2E tests with Playwright
  - Accessibility tests (RGAA 4.1)

- **Calculation Engine**: Publicodes
  - Calculation rules in `publicodes/`
  - Form generation with `@publicodes/forms`

## Work Workflows

### 1. Direct Edit Workflow (1-3 files)

For small changes:

1. Identify files to modify
2. Read necessary context
3. Make the modifications
4. Run relevant tests
5. Update `.llm.txt` documentation (after user validation if bug fix)

### 2. Plan-First Workflow (4+ files)

For large changes, STOP and plan first:

1. **Create a plan file** `.plan.llm.txt` in the appropriate folder
2. Analyze architecture and dependencies
3. Document objectives and steps:
   - Context and problem description
   - List of files to modify
   - Implementation phases
   - Tests required
   - Risks and considerations
4. **Get user approval** of the plan
5. **Implement according to plan**:
   - Follow the documented steps
   - Mark completed tasks in the plan file
   - Run tests after each phase
6. Update the `.plan.llm.txt` with completion status
7. Update affected `.llm.txt` files (after user validation)

**Why plan first for 4+ files?**
- Reduces errors and rework
- Ensures architectural consistency
- Makes implementation more efficient
- Provides clear tracking of progress

## LLM Documentation Structure

### Main Architecture File

`docs/architecture.llm.txt`: Application overview

- Global architecture (backend/frontend)
- Main data flows
- Patterns and conventions
- External integrations

### Domain-Specific Files

Create `.llm.txt` files to document:

- **Controllers**: `app/controllers/<domain>/<name>.llm.txt`
  - Controller responsibilities
  - Routes handled
  - Data validation
  - Service interactions

- **Services**: `app/services/<name>.llm.txt`
  - Encapsulated business logic
  - Dependencies
  - Main methods

- **Models**: `app/models/<name>.llm.txt`
  - Relationships with other models
  - Scopes and computed properties
  - Hooks and events

- **Inertia Pages**: `inertia/pages/<domain>/<name>.llm.txt`
  - Vue components used
  - Props received from controller
  - Local state and composables
  - User interactions

- **Composables**: `inertia/composables/<name>.llm.txt`
  - Reusable functionality
  - Shared state
  - Side effects

### Plan Files

`<folder>/<name>.plan.llm.txt`: Tracking for large changes

Recommended structure:
```markdown
# Plan: <Feature Name>

## Date
Created: YYYY-MM-DD

## Context
[Description of need/problem]

## Objectives
- [ ] Objective 1
- [ ] Objective 2

## Implementation Steps
### Phase 1: [Name]
1. [x] Completed step
2. [ ] Current step
3. [ ] Future step

## Files Modified
- `path/file1.ts`: [description]
- `path/file2.vue`: [description]

## Tests
- [ ] Unit tests
- [ ] E2E tests
- [ ] Accessibility tests

## Documentation Updated
- [ ] `file.llm.txt`

## History
- YYYY-MM-DD: [Changes made]
```

## Code Conventions

### Backend (AdonisJS)

#### Controllers

```typescript
// app/controllers/<domain>/<name>_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class ExampleController {
  // RESTful methods
  async index({ inertia }: HttpContext) {
    // Return an Inertia page
    return inertia.render('Domain/Page', { data })
  }

  async store({ request, response }: HttpContext) {
    // Create a resource
  }
}
```

#### Services

```typescript
// app/services/<name>_service.ts
export default class ExampleService {
  // Isolated business logic
  async doSomething() {
    // ...
  }
}
```

#### Models

```typescript
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
// app/models/<name>.ts
import { DateTime } from 'luxon'

export default class Example extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @hasMany(() => RelatedModel)
  declare related: HasMany<typeof RelatedModel>
}
```

### Frontend (Vue.js + Inertia)

#### Inertia Pages

```vue
<!-- inertia/pages/<Domain>/<Name>.vue -->
<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import { computed } from 'vue'

// Typed props
interface Props {
  data: SomeType
}

const props = defineProps<Props>()
</script>

<template>
  <Head title="Page title" />
  <div>
    <!-- Content -->
  </div>
</template>
```

#### Components

```vue
<!-- inertia/components/<Name>.vue -->
<script setup lang="ts">
// Use DSFR via VueDsfr
import { DsfrButton, DsfrInput } from '@gouvminint/vue-dsfr'

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <DsfrInput
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
```

## Essential Commands

### Development

```bash
# Start development server
pnpm dev

# Typecheck (backend + frontend)
pnpm typecheck

# Linting
pnpm lint
pnpm format  # with --fix
```

### Tests

```bash
# All tests
pnpm test

# Accessibility tests
pnpm test:a11y

# Tests with coverage
pnpm test:coverage
pnpm coverage:report
```

### Database

```bash
# Migrations
node ace migration:run
node ace migration:fresh --seed  # Reset + seed

# Create a migration
node ace make:migration <name>

# Create a seeder
node ace make:seeder <name>
```

### Build

```bash
# Production build
pnpm build

# Start production server
pnpm start

# Specific builds
pnpm build:publicodes
pnpm build:icons
pnpm build:iframe-integration
```

## Specific Patterns

### Publicodes Form Handling

Forms are dynamically generated from Publicodes rules:

1. Rules defined in `publicodes/<name>/`
2. Build with `pnpm build:publicodes`
3. Render via `@publicodes/forms` in Vue components

### DSFR Integration

- Use VueDsfr components (`DsfrButton`, `DsfrInput`, etc.)
- Respect RGAA accessibility guidelines
- Test with `pnpm test:a11y`

### State Management

- Pinia stores in `inertia/stores/`
- Composables for reusable logic in `inertia/composables/`
- Inertia props for server data

### Middleware

Typical middleware order (see `start/kernel.ts`):
1. CORS
2. Session
3. Auth (or Guest or Silent Auth depending on route)
4. Admin (for admin routes)

## Code Review Checklist

Before marking a task as complete:

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Relevant tests pass (`pnpm test`)
- [ ] Accessibility is respected (if UI changes)
- [ ] Imports use aliases (`#controllers/*`, etc.)
- [ ] pnpm is used (never npm/yarn)
- [ ] `.llm.txt` documentation is up to date (after user validation)
- [ ] Static reference style is used (no temporal language)
- [ ] Visual changes have been validated by user

## Documentation Style Guide

### `.llm.txt` Files (Static Reference)

**DO**:
- Use present tense: "handles", "provides", "uses"
- Describe current behavior and state
- Include technical details (types, parameters, process)
- Document relationships and dependencies

**DON'T**:
- Use temporal language: "before", "after", "was changed", "completed"
- Include dates or milestones
- Describe historical changes
- Use phrases like "we added" or "this fixes"

**Example**:
```markdown
# Example Service

This service handles user authentication.
It uses session-based auth and supports OAuth providers.

## Methods
- `login()`: Authenticates user credentials
- `logout()`: Ends the user session
```

### `.plan.llm.txt` Files (Historical Tracking)

**CAN** include:
- Dates and timestamps
- Objectives and milestones
- "Before/after" descriptions
- Completion status
- Historical context

**Example**:
```markdown
# Plan: Add OAuth Support

## Date: 2025-10-31

## Objectives
- [x] Implement Google OAuth - Completed 2025-10-31
- [ ] Add GitHub OAuth

## History
- 2025-10-31: Completed Google OAuth integration
```

## Useful Resources

- [AdonisJS Documentation](https://docs.adonisjs.com/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Vue.js Documentation](https://vuejs.org/)
- [VueDsfr](https://vue-ds.fr/)
- [French State Design System](https://www.systeme-de-design.gouv.fr/)
- [RGAA 4.1](https://www.numerique.gouv.fr/publications/rgaa-accessibilite/)
- [Publicodes Documentation](https://publi.codes/)
