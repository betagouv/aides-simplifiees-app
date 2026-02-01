# Services Domain

## Overview

Services encapsulate business logic that doesn't fit into Controllers (Backend) or Components (Frontend). They promote code reuse, testability, and separation of concerns.

## Backend Services (`app/services/`)

Backend services handle core application logic, database interactions, and external integrations.

### `SimulateurService`
Manages the lifecycle and business rules of simulators.
- **Responsibilities**: creating, updating, publishing simulators.
- **Used by**: `AdminSimulateurController`, `ApiFormSubmissionController`.

### `LoggingService`
Provides structured logging with context.
- **Responsibilities**: Error logging, performance tracking, security events.
- **See also**: `docs/logging.md`.

### `MatomoReportingService`
Server-side Matomo Analytics data extraction with bot traffic filtering.
- **Responsibilities**: Retrieving usage statistics, data quality monitoring.
- **See also**: `docs/technical/matomo-analysis-consolidated.md`

### `StatisticsSnapshotService`
Manages statistics snapshots from multiple data providers (form_submissions, Matomo).
- **Responsibilities**: Generating daily snapshots, aggregating by granularity, backfilling.
- **CLI Command**: `node ace statistics:sync`

## Frontend Services (`inertia/services/`)

Frontend services (or "Utilities" with business logic) handle client-side calculations and data processing.

### `AutocompleteService` (`autocomplete_service.ts`)
Manages data fetching for autocomplete fields.
- **Exports**: `autocompleteFunctions` map.
- **Usage**: Used by `ComboboxQuestion` to fetch lists (e.g., communes, codes NAF).

### `ConditionService` (`condition_service.ts`)
Evaluates boolean logic for question visibility.
- **Exports**: `evaluateCondition(conditionStr, answers)`.
- **Logic**: Supports operators (`&&`, `||`, `>`, `includes`, etc.).
- **Usage**: Derived state in simulators to show/hide questions based on answers.

### `EligibilityService` (`eligibility_service.ts`)
Client-side eligibility calculation engine using Publicodes.
- **Exports**: `calculateEligibility(surveyId, answers, criteria)`.
- **Responsibilities**:
  1. Loads compiled Publicodes rules.
  2. Maps user answers to Publicodes variables.
  3. Evaluates eligibility for specific *dispositifs*.
- **Usage**: Real-time feedback in `use_survey_eligibility`.

### `MatomoService` (`matomo_service.ts`)
Client-side tracking with flow session management and rate limiting.
- **Responsibilities**: Survey event tracking, source detection (main site vs iframes).
- **See also**: `docs/technical/matomo-analysis-consolidated.md`

## Patterns

- **Stateless**: Services should generally be stateless.
- **Dependency Injection**: In backend, services are often injected into controllers.
- **Isolation**: Services should be testable without the full HTTP context.
- **Naming**: Suffix with `Service` (e.g., `UserLogicService`).
