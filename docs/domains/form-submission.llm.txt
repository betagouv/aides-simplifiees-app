# Form Submission Domain

## Overview

The Form Submission domain handles the persistence and retrieval of simulation data. When users complete a simulateur, their answers and calculation results are stored in the database with a cryptographic hash. This hash serves as a secure, anonymous identifier that enables users to access their results later and share them without exposing personal information.

## Core Concepts

### FormSubmission Entity
A persistent record of a completed simulation containing:
- **Secure hash**: 64-character SHA-256 hash used as the URL parameter
- **Simulateur slug**: Links submission to the specific simulateur used
- **Answers**: Complete set of user responses (stored as JSONB)
- **Results**: Calculation output from OpenFisca or Publicodes (stored as JSONB)
- **Timestamps**: When the submission was created and last updated

### Cryptographic Hash System
The secure hash is generated using:
1. Random bytes (32 bytes = 256 bits of entropy)
2. Simulateur slug (ensures uniqueness per simulateur)
3. Timestamp (prevents collisions)
4. SHA-256 hashing algorithm
5. Truncated to 64 characters

This approach:
- Makes URLs unguessable (prevents enumeration attacks)
- Enables anonymous result sharing (no authentication required)
- Avoids sequential IDs that leak usage patterns
- Provides URL-safe identifiers

### JSONB Storage Strategy
Both `answers` and `results` are stored as JSONB columns in PostgreSQL:
- **Schema flexibility**: Structure can evolve without migrations
- **Query capabilities**: Can query specific fields within JSON if needed
- **Efficient storage**: PostgreSQL compresses JSON data
- **Direct serialization**: No transformation needed between API and database

## Entity Relationships

```
FormSubmission (N) ──→ (1) Simulateur
   ├─ foreignKey: simulateurSlug
   └─ localKey: slug (not id)
```

### Relationship Design Choice
Uses `slug` instead of `id` as the foreign key because:
- Results URL already contains simulateur slug
- Avoids extra database lookup to resolve ID to slug
- More human-readable in logs and debugging
- Slug is immutable once published (safe as foreign key)

## User Journey / Data Flow

### 1. Simulation Completion Flow

**Frontend (Vue/Inertia)**:
- User completes all questions in simulateur
- `useSimulation()` composable runs calculation
- Receives `SimulationResultsAides` object
- Calls `useFormSubmission().submit()`

**Submission Request**:
```typescript
POST /api/form-submissions
{
  simulateurSlug: "demenagement-logement",
  answers: { age: 25, revenu: 20000, ... },
  results: { 
    "aide-demenagement-eligibilite": true,
    "aide-demenagement": 500,
    ...
  }
}
```

**Backend Processing**:
1. Validate required fields (simulateurSlug, answers)
2. Results field optional (defaults to empty object)
3. `@beforeCreate()` hook generates secure hash
4. Insert record into `form_submissions` table
5. Call `getResultsUrl()` to construct results URL
6. Return response with hash and URL

**Response**:
```typescript
{
  success: true,
  submissionId: 123,
  secureHash: "a3f2c8b9...",
  resultsUrl: "/simulateurs/demenagement-logement/resultats/a3f2c8b9..."
}
```

**Frontend Redirection**:
- Frontend receives `resultsUrl`
- Performs `router.push(resultsUrl)` or `window.location.href`
- User lands on results page with hash in URL

### 2. Results Retrieval Flow

**User Arrives at Results URL**:
- URL: `/simulateurs/{slug}/resultats/{hash}`
- Route handled by `SimulateurController.showResultats()`

**Backend Retrieval**:
1. Extract `simulateur_slug` and `hash` from route params
2. Query `FormSubmission` where:
   - `secure_hash = hash`
   - `simulateur_slug = slug`
3. If not found → 404 error page
4. If found → Extract `results` from JSONB column
5. Call `transformSimulationResults()` to enrich data
6. Render Inertia page with full results

**Result Transformation**:
- Raw results only contain eligibility flags and amounts
- Controller fetches full `Aide` records from database
- Merges calculation data with content data (titles, descriptions, legal texts)
- Returns `RichSimulationResults` to frontend

### 3. Anonymous Sharing Flow

**User Copies URL**:
- Results URL contains only public information:
  - Simulateur slug (public)
  - Secure hash (acts as anonymous token)
  - No user ID, session ID, or personal identifiers

**Recipient Opens URL**:
- No authentication required
- No session needed
- Hash is sufficient to retrieve results
- Cannot access other users' results (hash is unguessable)

### 4. Direct API Access Flow (Optional)

**API Endpoint**:
```
GET /api/form-submissions/{hash}
```

Returns raw JSON:
```typescript
{
  success: true,
  submission: {
    id: 123,
    simulateurSlug: "demenagement-logement",
    answers: { ... },
    results: { ... },
    createdAt: "2025-10-31T10:30:00"
  }
}
```

**Use Cases**:
- Programmatic access to results
- Integration with external systems
- Data export for users
- Not used by main application (Inertia pages used instead)

## Technical Patterns

### Hash Generation Algorithm
Located in `FormSubmission.@beforeCreate()`:
```typescript
1. Generate 32 random bytes (256 bits)
2. Convert to hex string (64 characters)
3. Combine: simulateurSlug + randomBytes + timestamp
4. Hash with SHA-256
5. Convert to hex
6. Truncate to 64 characters
```

**Security properties**:
- 256-bit entropy prevents brute force
- SHA-256 prevents hash extension attacks
- Timestamp prevents pre-computation attacks
- Simulateur slug binds hash to specific simulateur

### JSONB Serialization
Models use `@column({ serialize: value => value })`:
- Preserves JSON structure during serialization
- Prevents unwanted transformations
- Ensures consistency between storage and API

### Validation Strategy
Minimal validation on submission:
- `simulateurSlug` must be present
- `answers` must be present
- `results` is optional (can submit before calculation completes)

**Rationale**:
- Frontend already validates individual answers
- Backend trusts data from authenticated frontend
- Loose coupling allows schema evolution
- Results can be updated later if needed

### Error Handling
- **400 Bad Request**: Missing required fields
- **404 Not Found**: Hash doesn't exist or doesn't match simulateur
- **500 Internal Server Error**: Database errors, unexpected failures

All errors logged with context:
- Request details
- User context (IP, user agent)
- Timing information
- Error stack traces

### Logging and Monitoring
Uses `LoggingService` to track:
- **Form submissions**: `logFormSubmission()`
  - Simulateur used
  - Answer count
  - Whether results included
- **Business events**: `logBusinessEvent()`
  - Submission retrievals
  - Usage patterns
- **Performance**: Timer for each operation
- **Matomo tracking**: Form submission events

## Integration Points

### Frontend Composables
- **useFormSubmission()**: Main submission logic
  - Calls POST `/api/form-submissions`
  - Tracks status (idle → pending → success/error)
  - Integrates Matomo tracking
  - Returns secure hash for redirection

### Controllers
- **FormSubmissionController** (API):
  - `store()`: Create new submission
  - `show()`: Retrieve by hash
- **SimulateurController** (Content):
  - `showResultats()`: Renders results page using hash

### Database
- **Table**: `form_submissions`
- **Indexes**: 
  - Primary key on `id`
  - Unique index on `secure_hash` (for fast lookups)
  - Index on `simulateur_slug` (for filtering by simulateur)
  - Composite index on `(secure_hash, simulateur_slug)` (for results retrieval)

### External Services
- **Matomo Analytics**:
  - Tracks form submission events
  - Helps measure conversion rates
  - Provides usage statistics

## Business Rules

### Immutability Principle
Once created, submissions are never modified:
- No update endpoint exists
- Users must create new submission to update results
- Preserves historical data for analysis

**Rationale**:
- Results URL is shared - changing data would confuse recipients
- Historical data valuable for understanding rule changes
- Simplifies caching and performance optimization

### No Expiration Policy
Submissions stored indefinitely:
- No automatic deletion
- No expiration dates
- Users can access old results anytime

**Considerations**:
- Storage cost is low (JSONB compressed)
- Historical data useful for policy analysis
- Users may need old results for administrative purposes

### Anonymous by Design
No authentication required to view results:
- Hash provides security through obscurity
- Enables easy sharing without account creation
- Supports transparency and accessibility goals

**Trade-offs**:
- Anyone with hash can view results
- No way to revoke access to shared URL
- Acceptable given no PII stored in results

### Results Optional on Creation
`results` field can be empty object:
- Allows submitting answers before calculation completes
- Supports progressive enhancement patterns
- Future: Could enable updating results later

**Current behavior**:
- Frontend always includes results
- Backend accepts empty results for flexibility

### Simulateur Slug as Foreign Key
Uses string slug instead of integer ID:
- Avoids JOIN to get slug for URL generation
- More readable in API responses and logs
- Slug immutability ensures referential integrity

## Key Code Locations

### Models
- `app/models/form_submission.ts`: Entity with hash generation logic

### Controllers
- `app/controllers/api/form_submission_controller.ts`: API endpoints
- `app/controllers/content/simulateur_controller.ts`: Results page rendering

### Frontend
- `inertia/composables/use_form_submission.ts`: Submission composable
- `inertia/pages/simulateurs/resultats.vue`: Results display page

### Migrations
- `database/migrations/*_create_form_submissions_table.ts`: Schema definition

### Tests
- `tests/unit/controllers/api/form_submission_controller.spec.ts`: Unit tests
- `tests/e2e/02_simulation.spec.ts`: End-to-end submission flow

## Notes

### Hash Collision Probability
With 256-bit entropy:
- Probability of collision: ~1 in 2^128
- Practically impossible with current database sizes
- More secure than sequential IDs or UUIDs

### GDPR Compliance
Submission data may contain personal information (age, revenue):
- No direct identifiers stored (no name, email, address)
- Hash prevents linking submissions to users
- Results shareable without privacy concerns
- Users cannot request deletion (no authentication)

**Future considerations**:
- May need expiration policy if regulations change
- Could add optional user account linking
- Consider data minimization strategies

### Performance Characteristics
- **Write**: Single INSERT with hash generation (~10ms)
- **Read by hash**: Index scan on `secure_hash` (~1ms)
- **JSONB queries**: Can filter on answer values if needed
- **Storage**: ~1-5KB per submission depending on answer complexity

### Alternative Approaches Considered
- **Sequential IDs**: Rejected due to enumeration risk
- **UUIDs**: Rejected as less secure than cryptographic hash
- **Separate answers/results tables**: Rejected as over-normalization
- **Session-based storage**: Rejected as not shareable

### Relationship with Personas
Similar data structure but different purpose:
- **FormSubmission**: Real user data, production use
- **Persona**: Test data, QA and development use
- Both store answers and results in JSONB
- Personas belong to simulateur, submissions reference by slug

## Related Domains

**Primary relationships**:
- **Simulateurs**: Submissions are created after completing a simulateur
- **Aides**: Results contain eligibility and amounts for aides

**Secondary relationships**:
- **API Integrations**: Submission API could be consumed by external systems
- **Admin**: Admins may need to view submission statistics
