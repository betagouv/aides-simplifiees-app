# Simulateurs Domain

## Overview

The Simulateurs domain represents the core feature of Aides Simplifiées: interactive multi-step forms that determine eligibility for various financial aids. A simulateur guides users through a series of questions, collects their answers, performs calculations using either OpenFisca API or Publicodes engine, and displays personalized results showing which aides they qualify for.

## Core Concepts

### Simulateur Entity
The central entity representing a complete simulation flow. Each simulateur has:
- **Status lifecycle**: `draft` (work in progress), `published` (visible to public), `unlisted` (accessible via direct link)
- **Two engine types**:
  - **Traditional mode**: Uses database-defined Steps → Questions → Choices hierarchy
  - **Publicodes mode**: Uses `@publicodes/forms` to dynamically generate forms from YAML rules
- **Built JSON**: Compiled configuration stored in database for fast retrieval
- **Metadata**: Title, slug, description, SEO fields, pictogram for visual identity

### Multi-Step Form Structure (Traditional Mode)
- **Steps**: Logical groupings of related questions (e.g., "Votre profil", "Votre logement")
- **Questions**: Individual inputs with types (radio, checkbox, text, number, date)
- **Choices**: Predefined options for selection-type questions
- **Navigation**: Users can move forward/backward, answers are preserved in session

### Publicodes Integration Mode
When `usesPublicodesForms = true`:
- Form structure is defined in `publicodes/<slug>/` YAML rules
- `@publicodes/forms` library dynamically generates questions from rules
- Form rendering and validation happen client-side
- Calculation engine runs directly in browser (no API calls)

### Personas
Test data sets attached to a simulateur for:
- QA testing of calculation logic
- Regression testing when rules change
- Documentation of expected behaviors for specific user profiles

## Entity Relationships

```
Simulateur (1) ──→ (N) Steps
               ──→ (N) Personas

Step (1) ──→ (N) Questions

Question (1) ──→ (N) Choices

Simulateur (1) ──→ (N) FormSubmissions
```

### Related Domains
- **Form Submission**: Stores user answers and results via secure hash
- **Aides**: Financial aids evaluated during simulation
- **Publicodes**: Calculation engine for Publicodes-mode simulateurs
- **Admin**: CMS interface for creating and managing simulateurs
- **Content**: Notions (help tooltips) embedded in questions

## User Journey / Data Flow

### 1. Discovery Phase
- User lands on `/simulateurs` (index page)
- Only `published` simulateurs are displayed
- User selects a simulateur card

### 2. Simulation Phase
- User arrives at `/simulateurs/{slug}` (welcome screen)
- Clicks "Commencer" to start
- **Traditional mode**: Questions loaded from `built_json`, rendered by `Survey.vue` component
- **Publicodes mode**: Rules fetched from `/public/forms/{slug}.json`, rendered by `PublicodesSurvey.vue`
- User answers questions page by page
- Answers stored in Pinia store (`useSurveysStore`)
- **Dynamic eligibility** (Publicodes only): Calculations run in real-time as user answers, showing progressive results

### 3. Recapitulatif Phase
- User reviews all answers at `/simulateurs/{slug}/recapitulatif`
- Can modify answers or proceed to final calculation

### 4. Calculation Phase
- **Traditional mode (OpenFisca)**:
  - Frontend sends answers to `/api/calculate`
  - Backend forwards request to OpenFisca API
  - Receives eligibility results for all aides
- **Publicodes mode**:
  - Calculation happens client-side using Publicodes engine
  - No API call required
  - Results computed directly from rules + answers

### 5. Submission Phase
- Frontend sends answers + results to `/api/form-submissions`
- Backend creates `FormSubmission` record with secure hash
- Returns `resultsUrl`: `/simulateurs/{slug}/resultats/{hash}`

### 6. Results Display Phase
- User redirected to `/simulateurs/{slug}/resultats/{hash}`
- Hash required to retrieve results (prevents unauthorized access)
- Results transformed into `RichSimulationResults` with full aide details
- Displays:
  - **Eligible aides**: Financial aids user qualifies for
  - **Non-eligible aides**: Why user doesn't qualify
  - **Montants by usage**: Grouped by expense category (frais-installation, frais-demenagement, etc.)
  - **Textes de loi**: Legal references for eligible aides
- User can share results URL anonymously

### 7. Aide Detail Phase
- User clicks on an aide card
- Navigates to `/simulateurs/{slug}/resultats/{hash}/aides/{aide_slug}`
- Shows detailed information, steps to apply, contact information

## Technical Patterns

### Database Schema Strategy
- **Simulateur table**: Core entity with configuration
- **Steps/Questions/Choices tables**: Form structure for traditional mode
- **built_json column**: Pre-compiled JSON of entire simulateur structure for performance
- **Status column**: Controls visibility without deletion

### Two-Engine Architecture
The system supports two distinct form generation approaches:

**Traditional Mode** (`usesPublicodesForms = false`):
- Database-driven: Admin creates Steps, Questions, Choices via CMS
- `SimulateurService.generateBuiltJson()` compiles structure to JSON
- Questions mapped to OpenFisca API parameters
- Server-side calculation via external API

**Publicodes Mode** (`usesPublicodesForms = true`):
- File-driven: Rules defined in `publicodes/<slug>/regles.yaml`
- Build process compiles rules to `/public/forms/{slug}.json`
- `@publicodes/forms` dynamically generates form from rules
- Client-side calculation in browser

### Inertia Page Flow
- **index.vue**: Lists all published simulateurs
- **simulateur.vue**: Main form interface, conditionally renders `Survey.vue` or `PublicodesSurvey.vue`
- **recapitulatif.vue**: Summary page for review
- **resultats.vue**: Results display with eligible/non-eligible aides

### Controller Responsibilities
- **SimulateurController** (content):
  - `index()`: List published simulateurs
  - `show()`: Render simulateur form page
  - `showRecapitulatif()`: Render review page
  - `showResultats()`: Fetch results by hash, transform data, render results page
  - `transformSimulationResults()`: Enriches raw calculation data with aide details from database
- **AdminSimulateurController**: CRUD operations for simulateurs
- **AdminPersonaController**: Manage test personas, run simulations with test data

### Services
- **SimulateurService**: Business logic for creating sample data, generating built_json

### Composables (Frontend)
- **useSimulation()**: Orchestrates calculation (OpenFisca API or Publicodes engine)
- **useDynamicEligibility()**: Real-time eligibility calculation in Publicodes mode
- **useSurveysStore()**: Pinia store managing answers, form state, navigation

### Result Transformation Pipeline
Raw calculation results → `transformSimulationResults()` → `RichSimulationResults`:
1. Extract aide slugs from eligibility flags (`{aide}-eligibilite`)
2. Fetch full `Aide` records from database
3. Preload `typeAide` relationships
4. Enrich each aide with: title, description, instructeur, legal texts
5. Categorize by usage (expense type)
6. Group into eligible/non-eligible arrays
7. Calculate total montants by category

## Integration Points

### External APIs
- **OpenFisca API**: Tax-benefit microsimulation engine (traditional mode only)
  - Receives situation + calculations request
  - Returns eligibility flags and amounts
  - Endpoint configured in `config/app.ts`

### Internal APIs
- **POST /api/calculate**: Forwards OpenFisca requests
- **POST /api/form-submissions**: Stores answers and results
- **GET /api/form-submissions/:hash**: Retrieves submission by secure hash

### Frontend Components
- **Survey.vue**: Traditional form renderer
- **PublicodesSurvey.vue**: Publicodes form renderer
- **Components**: Question types, navigation, progress indicators

### Build Process
- `pnpm build:publicodes`: Compiles YAML rules to JSON for each Publicodes simulateur
- `node ace generate:built-json`: Compiles database simulateurs to built_json

## Business Rules

### Visibility Rules
- `published`: Shown on index page, accessible to all
- `unlisted`: Not on index page, accessible via direct URL (for testing/pilot programs)
- `draft`: Only accessible to admin users

### Hash-Based Security
- Results URLs use cryptographic hash (not sequential IDs)
- Prevents guessing other users' results
- Enables anonymous result sharing

### Answer Persistence Strategy
- Answers stored client-side in Pinia store during simulation
- Only persisted to database when user completes simulation
- `FormSubmission` record created with answers + results

### Navigation Constraints
- Users can navigate backward freely (answers preserved)
- Cannot skip forward (must answer required questions)
- Can exit and resume later (via query parameter `resume=true`)

### Calculation Caching
- Birth dates standardized before sending to OpenFisca (for cache hit rate)
- OpenFisca API caches identical requests
- Publicodes calculations are stateless and instantaneous

### Result Expiration
- Results stored indefinitely (no automatic deletion)
- Users can regenerate results by re-running simulation
- Old submissions remain accessible via hash

## Key Code Locations

### Models
- `app/models/simulateur.ts`: Main entity
- `app/models/step.ts`: Form sections
- `app/models/question.ts`: Individual questions
- `app/models/choice.ts`: Question options
- `app/models/persona.ts`: Test data sets
- `app/models/form_submission.ts`: Stored results

### Controllers
- `app/controllers/content/simulateur_controller.ts`: User-facing pages
- `app/controllers/admin/admin_simulateur_controller.ts`: Admin CRUD
- `app/controllers/admin/admin_persona_controller.ts`: Persona management
- `app/controllers/api/form_submission_controller.ts`: Submission API

### Services
- `app/services/simulateur_service.ts`: Business logic

### Frontend Pages
- `inertia/pages/simulateurs/index.vue`: Simulateur listing
- `inertia/pages/simulateurs/simulateur.vue`: Main form
- `inertia/pages/simulateurs/recapitulatif.vue`: Review
- `inertia/pages/simulateurs/resultats.vue`: Results

### Frontend Composables
- `inertia/composables/use_simulation.ts`: Calculation orchestration
- `inertia/composables/use_dynamic_eligibility.ts`: Real-time eligibility
- `inertia/composables/use_eligibility_service.ts`: Publicodes engine wrapper
- `inertia/stores/surveys.ts`: Answer management

### Frontend Components
- `inertia/components/survey/Survey.vue`: Traditional form
- `inertia/components/survey/PublicodesSurvey.vue`: Publicodes form
- `inertia/components/admin/SimulateurForm.vue`: Admin form

### Tests
- `tests/unit/controllers/content/simulateur_controller.spec.ts`: Controller tests
- `tests/e2e/02_simulation.spec.ts`: End-to-end simulation flow
- `tests/fixtures/simulateur_factory.ts`: Test data factory

## Notes

### Why Two Engines?
- **Traditional mode**: Easier for non-technical admins, visual form builder in CMS
- **Publicodes mode**: More powerful for complex calculations, transparency in rules, open-source calculation engine

### Built JSON Performance Optimization
- Avoids N+1 queries when loading simulateur structure
- Pre-compiles entire form definition
- Regenerated when admin modifies structure

### Dynamic Eligibility Feature
- Unique to Publicodes mode
- Shows eligibility in real-time as user answers questions
- Helps users understand which questions affect which aides
- Uses `useDynamicEligibility()` composable with reactive calculations

### Migration Path
- Existing traditional simulateurs remain supported
- New simulateurs can use Publicodes for better transparency
- Both modes share same result display and submission logic

## Related Domains

**Primary relationships**:
- **Form Submission**: Storage and retrieval of simulation results
- **Aides**: Financial aids catalog evaluated during simulation
- **Publicodes**: Calculation engine for Publicodes-mode simulateurs

**Secondary relationships**:
- **Admin**: CMS for managing simulateurs, steps, questions
- **Content**: Notions displayed as help text in questions
- **Iframe Integration**: Embedding simulateurs in partner websites
