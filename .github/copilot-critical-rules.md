---
description: Copilot critical rules for aides-simplifiees-app
applyTo: "**"
---

# Critical Rules Checklist

> **Purpose**: Quick-reference checklist for every task. For detailed workflows, see `.github/copilot-instructions.md`.

## Before Starting ANY Task

1. **ALWAYS** read `docs/architecture.llm.txt` FIRST to understand the context (MANDATORY - NO EXCEPTIONS)
2. **ALWAYS** read `.github/copilot-critical-rules.md` to ensure compliance with all rules
3. Identify which domain-specific `.llm.txt` files are relevant
4. Choose approach: Direct Edit (1-3 files) or Plan-First (4+ files)
5. For 4+ files: Create `.plan.llm.txt` before editing code

## During Code Changes

1. Track which `.llm.txt` files need updates based on behavior changes
2. For 4+ files: Stop and create `<name>.plan.llm.txt` with strategy before coding
3. Never use emojis in code, comments, docs, or responses
4. Always use **pnpm**, never npm or yarn
5. Respect AdonisJS structure (controllers, models, services, middleware)
6. Use import aliases (`#controllers/*`, `#models/*`, `#services/*`, etc.)

## Stack-Specific Rules

- **Backend**: AdonisJS v6 (TypeScript)
- **Frontend**: Vue.js 3 + Inertia.js + DSFR (VueDsfr)
- **Database**: PostgreSQL with Lucid ORM
- **Tests**: Japa (AdonisJS test framework)
- **Package manager**: pnpm (MANDATORY)
- **Build**: Vite

## After Code Changes (CRITICAL - Most Often Forgotten)

1. **WAIT FOR USER VALIDATION** - When investigating a bug, DO NOT update documentation until user confirms the fix works
2. **NEVER ASSUME RENDERING FIXES WORK FROM COMPILATION ALONE** - TypeScript compilation and builds DO NOT validate visual/rendering behavior. Always require user visual confirmation for any changes affecting:
   - Vue component rendering, UI appearance, layout, interactions
   - Publicodes forms, aide display
   - Data visualization, charts
   - Any visual or interactive functionality (Inertia pages)
3. Update affected `.llm.txt` documentation files ONLY after user validation for bug fixes
4. Use STATIC REFERENCE style in `.llm.txt` files:
   - Present tense only ("handles", "provides", "uses")
   - NO temporal language: "before/after", "completed", "resolved", "Phase X"
   - NO dates, objectives, or problem descriptions
   - Describe HOW it works NOW, not how it changed
5. Plan files (`.plan.llm.txt`) CAN use historical language
6. Verify changes compile/run correctly

## Tests and Validation

1. Always run relevant tests after changes:
   - `pnpm test` for all tests
   - `pnpm test:a11y` for accessibility (RGAA 4.1)
2. Verify typecheck:
   - `pnpm typecheck` (backend + frontend + e2e tests)
3. Verify linting:
   - `pnpm lint` (ESLint)

## Documentation Types

- **`.llm.txt`** = Static reference (timeless, current state only)
- **`.plan.llm.txt`** = Historical tracking (objectives, dates, before/after OK)
- **`.md`** = [CRITICAL] NEVER MENTION OR TRY TO CREATE OR UPDATE ANY MARKDOWN FILE unless user explicitly asks

## Quick Self-Check

Ask yourself after completing work:
- Did I update the relevant `.llm.txt` files?
- Did I remove temporal language from `.llm.txt` files?
- Does the documentation describe the current state, not the change?
- For large tasks: Did I create/update the plan file?
- Did I use the appropriate workflow (plan-first vs direct edit)?
- Did I use pnpm (not npm/yarn)?
- Do the tests pass?

## Common Violations to Avoid

1. **UPDATING DOCS BEFORE USER VALIDATES FIX** - NEVER document until user confirms it works
2. **ASSUMING RENDERING FIXES WORK FROM COMPILATION** - TypeScript/build success does NOT mean visual functionality works
3. Using npm or yarn instead of pnpm
4. Implementing feature but not updating `.llm.txt` docs (after validation)
5. Adding "completed" or "Phase X" markers to `.llm.txt` files
6. Leaving future enhancements in docs when feature is implemented
7. Using "we added" or "this was changed" in reference docs
8. Forgetting to mark plan file tasks as complete
9. Editing 4+ files without creating a plan first
10. Not respecting AdonisJS structure (controllers, services, models)

## AdonisJS-Specific Conventions

1. **Controller structure**:
   - Use RESTful methods (index, show, create, store, edit, update, destroy)
   - Group by domain in subfolders (`admin/`, `api/`, `content/`)

2. **Services**:
   - Isolate business logic in `app/services/`
   - One service per responsibility

3. **Models**:
   - Use Lucid ORM
   - Define relationships (hasMany, belongsTo, etc.)

4. **Migrations**:
   - Create with `node ace make:migration`
   - Always provide `up()` and `down()` methods

5. **Routes**:
   - Define in `start/routes.ts`
   - Group by middleware and prefix

6. **Inertia**:
   - Vue components in `inertia/components/`
   - Pages in `inertia/pages/`
   - Use VueDsfr for DSFR components

## Token Budget Management

When conversation grows long:
- Summaries MUST include "Critical Rules Compliance" section
- Reference this file in summaries for quick re-orientation
- Include list of updated `.llm.txt` files in summary
