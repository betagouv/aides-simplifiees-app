---
description: Detailed Copilot instructions for aides-simplifiees-app
---

# Copilot Instructions - Aides Simplifiées

> **Note**: For a quick checklist, see `.github/copilot-critical-rules.md`

## Context & Architecture

**MANDATORY**: Before starting any task, read `docs/architecture.md` for the full project overview, technology stack, and global architecture.

For domain-specific details, refer to the documents listed in `docs/architecture.md`.

## Work Workflows

### 1. Direct Edit Workflow (1-3 files)

For small changes:

1. Identify files to modify
2. Read necessary context
3. Make the modifications
4. Run relevant tests
5. Update `.md` documentation (after user validation if bug fix)

### 2. Plan-First Workflow (4+ files)

For large changes, STOP and plan first:

1. **Create a plan file** `.plan.md` in the appropriate folder
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
6. Update the `.plan.md` with completion status
7. Update affected `.md` files (after user validation)

**Why plan first for 4+ files?**
- Reduces errors and rework
- Ensures architectural consistency
- Makes implementation more efficient
- Provides clear tracking of progress

## Documentation Structure

### Main Architecture File

`docs/architecture.md`: Application overview. **Read this first.**

### Code Conventions File

(Removed)

### Specific Documentation Files

Refer to the "Domain Documentation Map" in `docs/architecture.md` to find the relevant file for:
- **Features**: `docs/features/*.md` (Simulations, Aides, Admin...)
- **Technical**: `docs/technical/*.md` (Services, Views, Stores...)
- **Integrations**: `docs/integrations/*.md` (Publicodes, OpenFisca...)

### Plan Files

`<folder>/<name>.plan.md`: Tracking for large changes.

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

**Key Stack Rules**:
- **Backend**: AdonisJS v6 (TypeScript) with Lucid ORM & VineJS validation

- **Frontend**: Vue.js 3 + Inertia.js + DSFR (VueDsfr)
- **Package Manager**: `pnpm` (Strict)

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

## Code Review Checklist

Before marking a task as complete:

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Relevant tests pass (`pnpm test`)
- [ ] Accessibility is respected (if UI changes)
- [ ] Imports use aliases (`#controllers/*`, etc.)
- [ ] pnpm is used (never npm/yarn)
- [ ] `.md` documentation is up to date (after user validation)
- [ ] Static reference style is used (no temporal language)
- [ ] Visual changes have been validated by user

## Documentation Style Guide

### `.md` Files (Static Reference)

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

### `.plan.md` Files (Historical Tracking)

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
