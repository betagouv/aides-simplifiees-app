# Architecture - Aides Simplifiées

## Overview

Aides Simplifiées is a full-stack web application for simulating eligibility to multiple financial aids. The architecture combines an AdonisJS backend with a Vue.js frontend via Inertia.js, providing an SPA experience with server-side rendering.

## Technology Stack

### Backend
- **Framework**: AdonisJS v6 (TypeScript)
- **ORM**: Lucid (for PostgreSQL)
- **Authentication**: @adonisjs/auth with sessions
- **Validation**: VineJS (@vinejs/vine)

### Frontend
- **UI Framework**: Vue.js 3 (Composition API)
- **Backend-Frontend Bridge**: Inertia.js
- **Design System**: DSFR (French State Design System) via VueDsfr
- **Icons**: Iconify
- **State Management**: Pinia stores + composables

### Build & Tooling
- **Bundler**: Vite
- **Package Manager**: pnpm (workspace)
- **Tests**: Japa (backend) + Vitest (frontend) + Playwright (e2e)
- **Linting**: ESLint
- **TypeScript**: Strict mode

### Database
- **DBMS**: PostgreSQL
- **Migrations**: Lucid migrations
- **Seeders**: For development and test data

### Calculation Engine
- **Engine**: Publicodes
- **Forms**: @publicodes/forms
- **Rules**: Defined in `publicodes/<name>/`

## Global Architecture

### MVC Pattern with Inertia

```
HTTP Request
    ↓
Routes (start/routes.ts)
    ↓
Middleware (auth, admin, etc.)
    ↓
Controller (app/controllers/)
    ↓
Services (app/services/) ← Models (app/models/)
    ↓
Inertia Response
    ↓
Vue Page (inertia/pages/)
    ↓
Vue Components (inertia/components/)
```

### Backend/Frontend Separation

#### Backend (AdonisJS)
- **Controllers**: Handle HTTP requests, validation, call services
- **Services**: Encapsulate business logic
- **Models**: Represent database entities
- **Middleware**: Authentication, authorization, logging
- **Validators**: VineJS schemas for data validation

#### Frontend (Vue + Inertia)
- **Pages**: Root Vue components for each route
- **Components**: Reusable components (VueDsfr + custom)
- **Composables**: Reusable logic (useState, useFetch, etc.)
- **Stores**: Global state with Pinia
- **Layouts**: Shared layouts (header, footer, navigation)

### Data Flow

1. **Server → Client**:
   - Controller returns `inertia.render('Page', { props })`
   - Inertia serializes props and sends to client
   - Vue hydrates page with props

2. **Client → Server**:
   - User actions trigger Inertia requests
   - `router.post()`, `router.put()`, etc.
   - Controller processes, returns new page or redirect

3. **Validation**:
   - Backend: VineJS validates incoming data
   - Frontend: Real-time validation with DSFR components
   - Errors displayed via Inertia system

## Directory Structure

### Backend (`app/`)
```
app/
├── controllers/          # HTTP Controllers
│   ├── admin/           # Administration routes
│   ├── api/             # API endpoints
│   ├── content/         # Content pages
│   ├── auth_controller.ts
│   └── ...
├── models/              # Lucid Models
├── services/            # Business logic
├── middleware/          # Custom middleware
├── exceptions/          # Exception handling
└── validators/          # Validation schemas
```

### Frontend (`inertia/`)
```
inertia/
├── pages/               # Inertia Pages (one per route)
│   ├── admin/
│   ├── auth/
│   ├── home.vue
│   └── ...
├── components/          # Reusable components
├── composables/         # Reusable logic
├── layouts/             # Page layouts
├── stores/              # Pinia stores
├── types/               # TypeScript types
├── utils/               # Utilities
└── styles/              # Global styles
```

### Configuration (`config/`)
```
config/
├── app.ts               # App configuration
├── auth.ts              # Authentication configuration
├── database.ts          # Database configuration
├── inertia.ts           # Inertia configuration
├── vite.ts              # Vite configuration
└── ...
```

### Database (`database/`)
```
database/
├── migrations/          # Lucid migrations
├── seeders/             # Seeders
└── seeders_data/        # Data for seeders
```

## Key Features

### Authentication
- Session system with @adonisjs/auth
- Middleware: `auth`, `guest`, `silent_auth`
- Pages: Login, Register (in `inertia/pages/auth/`)

### Administration
- Access protected by `admin` middleware
- Controllers in `app/controllers/admin/`
- Pages in `inertia/pages/admin/`

### Aid Simulators
- Publicodes calculation engine
- Rules in `publicodes/<aid>/`
- Dynamically generated forms
- Results calculated server-side or client-side

### Accessibility (RGAA 4.1)
- Accessible DSFR components
- Automated tests (`pnpm test:a11y`)
- Accessibility reports in `reports/accessibility/`

### Iframe Integration
- Separate build for iframe integration
- Configuration in `config/iframe_integration.ts`
- Build script: `scripts/build_iframe_integration.js`
- SRI (Subresource Integrity) for security

## Patterns and Conventions

### Controllers
- RESTful methods (index, show, store, update, destroy)
- Validation with VineJS
- Return Inertia pages or redirects
- Delegate business logic to services

### Services
- Encapsulate complex business logic
- Reusable by multiple controllers
- Interact with models
- Isolate side effects (external APIs, etc.)

### Models
- Inherit from `BaseModel`
- Define relationships (hasMany, belongsTo, etc.)
- Use computed properties for simple logic
- Hooks for events (beforeSave, afterCreate, etc.)

### Inertia Pages
- One Vue component per route
- Receive props from controller
- Use shared layouts
- Compose reusable components

### Composables
- Prefixed with `use` (useAuth, useForm, etc.)
- Return reactive state and methods
- Reusable across pages
- Handle complex logic (API calls, shared state)

### Pinia Stores
- Global application state
- Persistence with plugins if needed
- Actions for mutations
- Getters for computed state

## Imports and Aliases

AdonisJS provides import aliases:
- `#controllers/*` → `app/controllers/*.js`
- `#models/*` → `app/models/*.js`
- `#services/*` → `app/services/*.js`
- `#middleware/*` → `app/middleware/*.js`
- `#config/*` → `config/*.js`
- `#publicodes/*` → `publicodes/`
- `#tests/*` → `tests/`

Always use these aliases for backend imports.

## Environments

### Development
- `pnpm dev`: Vite HMR + AdonisJS watch mode
- `.env` variables for local configuration
- Local PostgreSQL database
- Seeders for test data

### Test
- `.env.test` variables for test environment
- Separate database
- Japa for unit tests
- Playwright for e2e tests

### Production
- `pnpm build`: Optimized build
- `pnpm start`: Production server
- Environment variables for configuration
- Managed PostgreSQL (cloud)

## External Integrations

### Publicodes
- Open-source calculation engine
- Rules defined in YAML/JSON
- Build with script: `pnpm build:publicodes`
- Import in app via `#publicodes/*`

### DSFR
- French State Design System
- Components via VueDsfr
- Styles imported in `inertia/styles/`
- Customizable theme and variables

### Iconify
- Icon library
- Collections automatically detected
- Build with: `pnpm build:icons`
- Used via component or direct import

### OpenFisca (Optional)
- Tax-benefit microsimulation engine
- External API integration
- Used for complex national-level calculations
- Alternative to Publicodes for certain simulators

## Security

### CORS
- Configured in `config/cors.ts`
- Middleware `@adonisjs/cors`

### CSRF
- Protection with @adonisjs/shield
- Tokens in Inertia forms

### Sessions
- Stored server-side
- Secure cookie (httpOnly, sameSite)

### Validation
- Always validate server-side with VineJS
- Frontend validation for UX

### SRI (Subresource Integrity)
- Hash of iframe scripts
- Generation with `scripts/generate_sri_hash.js`

## Monitoring and Logging

### Logging
- Configuration in `config/logger.ts`
- Middleware `request_logging_middleware.ts`
- Files in `logs/`
- Documentation: `docs/LOGGING.md`

### Health Checks
- Endpoint: `/health`
- Controller: `health_checks_controller.ts`
- Checks: Database, external services

## Performance

### SSR with Inertia
- Initial render server-side
- Client-side hydration
- SPA navigation after hydration

### Vite
- Fast HMR in development
- Tree-shaking in production
- Automatic code splitting

### Database
- Indexes on frequently queried columns
- Eager-loaded relationships when needed
- Result pagination

## Tests

### Backend Unit Tests
- Framework: Japa (AdonisJS test framework)
- Location: `tests/unit/`
- Command: `pnpm test`
- Coverage: `pnpm test:coverage`
- Tests: Controllers, models, services, middleware

### Frontend Unit Tests
- Framework: Vitest
- Location: `tests/frontend/`
- Command: `pnpm test:frontend`
- UI: `pnpm test:frontend:ui`
- Coverage: `pnpm test:frontend:coverage`
- Environment: happy-dom (lightweight DOM implementation)
- Tests: Utilities, composables, components
- Features: Native Vite alias support, Vue Test Utils integration

### E2E Tests
- Framework: Playwright
- Location: `tests/e2e/`
- Browser: Chromium
- Tests: Full user flows, simulation scenarios

### Accessibility Tests
- Based on RGAA 4.1
- Location: `tests/e2e/03_a11y/`
- Reports: `reports/accessibility/`
- Command: `pnpm test:a11y`

## Deployment

### Build Process
1. `pnpm install`: Install dependencies
2. `pnpm build:publicodes`: Build Publicodes rules
3. `pnpm build:icons`: Build icon collections
4. `pnpm build`: Build application
5. Result in `build/`

### Production
- Dockerfile provided
- Environment variables required (see `.env.example`)
- Migrations executed before deployment
- Node.js server with `pnpm start`

## Maintenance

### Dependency Updates
- `pnpm update`: Update respecting `package.json`
- Test after updates
- Check breaking changes

### Migrations
- Create: `node ace make:migration <name>`
- Execute: `node ace migration:run`
- Rollback: `node ace migration:rollback`

### Seeders
- Create: `node ace make:seeder <name>`
- Execute: `node ace db:seed`
- Data in `database/seeders_data/`

## Domain Documentation

For detailed information about specific domains, refer to:
- `docs/domains/simulateurs.llm.txt`: Simulator feature
- `docs/domains/form-submission.llm.txt`: Result storage
- `docs/domains/publicodes.llm.txt`: Calculation engine (client-side)
- `docs/domains/openfisca.llm.txt`: Calculation engine (server-side)
- `docs/domains/aides.llm.txt`: Financial aids catalog
- `docs/domains/admin.llm.txt`: CMS functionality
- `docs/domains/content.llm.txt`: Pages and notions
- `docs/domains/iframe-integration.llm.txt`: Partner embedding system
- `docs/domains/api-integrations.llm.txt`: External service integrations
- `docs/domains/views.llm.txt`: Pages and components (Vue.js UI)
- `docs/domains/stores.llm.txt`: State management (Pinia stores)
- `docs/domains/services.llm.txt`: Internal business logic services
