# API Integrations Domain

## Overview

The API Integrations domain handles communication with external services that provide critical functionality for the application. This includes OpenFisca for tax-benefit calculations, LexImpact for geographic data, and internal API endpoints for form submission and statistics.

## Core Concepts

### External APIs
- **OpenFisca**: Microsimulation engine for French tax-benefit system
- **LexImpact**: Geographic data service for commune autocomplete

### Internal APIs
- **Form Submission API**: Store and retrieve simulator results
- **Statistics API**: Aggregate usage data
- **Proxy Pattern**: Backend acts as proxy for external APIs

### Error Handling
- **Graceful Degradation**: Fallback behavior when APIs unavailable
- **Timeout Management**: Prevent slow external APIs from blocking
- **Error Logging**: Comprehensive logging of API failures

## Entity Relationships

```
Application → API Controllers → External Services
  ├─ OpenFiscaController → OpenFisca API
  ├─ GeoApiController → LexImpact API
  ├─ FormSubmissionController → PostgreSQL
  └─ StatisticsController → PostgreSQL

API Request → LoggingService
  └─ tracks timing, errors, response status
```

## API Endpoints

### Internal API Routes

**Form Submission**
- `POST /api/form-submissions`: Store simulator results
  - Body: `{ simulateurSlug, answers, results }`
  - Returns: `{ success, hash, url }`
- `GET /api/form-submissions/:hash`: Retrieve results by hash
  - Returns: `{ simulateurSlug, answers, results }`

**OpenFisca Proxy**
- `POST /api/openfisca/calculate`: Forward calculation to OpenFisca
  - Body: OpenFisca calculation request (JSON)
  - Returns: OpenFisca response (calculations)

**Geographic Data**
- `GET /api/geo/communes/autocomplete?q={query}`: Commune search
  - Query: Search string
  - Returns: `{ suggestions: [...] }`

**Statistics**
- `GET /api/statistics/simulators`: Simulator usage stats
  - Returns: Aggregated counts by simulator

## Data Flow

### OpenFisca Calculation Flow
```
Simulator Page (Frontend)
    ↓ POST /api/openfisca/calculate
OpenFiscaController
    ↓ validates environment config
    ↓ POST {OPENFISCA_URL}/calculate
OpenFisca API (External)
    ↓ performs tax-benefit calculations
OpenFiscaController
    ↓ logs timing and response
    ↓ returns calculation results
Simulator Page
    ↓ displays eligibility results
```

### Geographic Autocomplete Flow
```
Address Form Component
    ↓ GET /api/geo/communes/autocomplete?q={text}
GeoApiController
    ↓ validates query parameter
    ↓ GET {LEXIMPACT_URL}/communes/autocomplete
LexImpact API (External)
    ↓ returns commune suggestions
GeoApiController
    ↓ logs response (success or error)
    ↓ returns suggestions or empty array
Address Form
    ↓ displays dropdown with suggestions
```

### Form Submission Flow
```
Simulator Results Page
    ↓ POST /api/form-submissions
FormSubmissionController
    ↓ validates required fields (simulateurSlug, answers)
    ↓ generates unique hash
FormSubmission Model
    ↓ saves to PostgreSQL
FormSubmissionController
    ↓ constructs shareable URL
    ↓ returns { success, hash, url }
Results Page
    ↓ displays shareable link
```

## Technical Patterns

### Proxy Controller Pattern
Controllers act as proxies between frontend and external services:
- **Validation**: Check required parameters before forwarding
- **Environment Config**: Inject API URLs from environment
- **Error Translation**: Convert external errors to consistent format
- **Logging**: Track all external API calls with timing
- **Security**: Hide external API URLs from frontend

### Timeout Strategy
```typescript
axios.post(url, data, {
  timeout: 10000, // 10 seconds for OpenFisca
})

axios.get(url, {
  timeout: 5000, // 5 seconds for LexImpact
})
```

Timeouts prevent slow external APIs from blocking application.

### Error Handling Pattern
```typescript
try {
  const apiResponse = await axios.post(externalUrl, data)
  this.loggingService.logExternalApiCall(/* ... */)
  return response.json(apiResponse.data)
} catch (error) {
  this.loggingService.logError(error, /* ... */)

  if (error.response) {
    // External API returned error
    return response.status(error.response.status).json({
      error: error.response.status,
      message: error.response.data
    })
  }

  // Network or timeout error
  return response.status(500).json({
    error: 500,
    message: 'Internal Server Error'
  })
}
```

### Logging Integration
All API calls use `LoggingService`:
```typescript
// Start timer
const timer = this.loggingService.startTimer('operation_name')

// After API call
this.loggingService.logExternalApiCall(
  'service_name',
  'endpoint',
  'HTTP_METHOD',
  {
    query: params,
    responseStatus: apiResponse.status,
    duration: timer.stop()
  }
)
```

## Integration Points

### Environment Configuration
Required environment variables:
- `OPENFISCA_URL`: OpenFisca API endpoint (e.g., `https://openfisca.example.com`)
- `LEXIMPACT_URL`: LexImpact API endpoint (e.g., `https://leximpact.example.com`)

Set in `.env` for development, environment variables for production.

### Frontend Integration

**API Calls from Frontend**:
```typescript
// Using Inertia forms
import { router } from '@inertiajs/vue3'

router.post('/api/form-submissions', {
  simulateurSlug: 'simulator-slug',
  answers: { /* user answers */ },
  results: { /* calculation results */ }
})

// Using fetch
const response = await fetch('/api/geo/communes/autocomplete?q=Paris')
const data = await response.json()
```

### Publicodes Integration
OpenFisca API used as calculation backend for certain Publicodes rules:
- Complex tax calculations
- National-level benefits
- Cross-referenced data

Publicodes orchestrates when to call OpenFisca vs local calculation.

### Statistics Collection
Statistics controller aggregates:
- Simulator completion counts
- Most viewed simulators
- Geographic distribution (if tracking enabled)

Used for admin dashboard and analytics.

## Business Rules

### API Availability
- **Required**: OpenFisca for tax-benefit simulators
- **Optional**: LexImpact for commune autocomplete (graceful degradation)
- **Internal**: Form submission and statistics always available (PostgreSQL)

### Data Validation
**Form Submission**:
- `simulateurSlug`: Required, must be valid simulator
- `answers`: Required, JSON object
- `results`: Optional, JSON object (may be computed later)

**OpenFisca Calculation**:
- Body must be valid OpenFisca JSON format
- Validated by OpenFisca API (application passes through)

**Commune Autocomplete**:
- `q`: Required query parameter
- Empty query returns empty suggestions (no API call)

### Rate Limiting
Consider implementing rate limiting for:
- Form submission creation (prevent spam)
- OpenFisca calculations (expensive operations)
- External API calls (respect partner limits)

### Caching Strategy
Potential caching opportunities:
- Commune autocomplete results (frequently repeated queries)
- OpenFisca calculations (identical input = identical output)
- Statistics aggregates (update periodically, not real-time)

## Key Code Locations

### API Controllers
- `app/controllers/api/openfisca_controller.ts`: OpenFisca proxy
- `app/controllers/api/geo_api_controller.ts`: LexImpact proxy
- `app/controllers/api/form_submission_controller.ts`: Form storage
- `app/controllers/api/statistics_controller.ts`: Usage statistics

### Services
- `app/services/logging_service.ts`: API call logging, timing

### Routes
- `start/routes.ts`: API routes under `/api/*`

### Configuration
- `.env` / `.env.example`: External API URLs
- `config/cors.ts`: CORS rules for API endpoints

### Models
- `app/models/form_submission.ts`: Form submission storage

## Notes

### OpenFisca API
OpenFisca is a powerful microsimulation engine that handles complex French tax-benefit calculations. The application uses it for:
- Income tax calculations
- Social benefit eligibility
- Housing assistance (APL, etc.)

OpenFisca accepts JSON requests describing household situations and returns computed values for various tax-benefit variables.

### LexImpact Geographic Service
LexImpact provides French geographic data including:
- Commune names and codes (INSEE)
- Postal code distributions
- Autocomplete functionality

Used for address forms where users select their commune of residence.

### Form Submission Hash
Generated hash enables:
- Shareable result URLs
- Anonymous access (no authentication required)
- Permanent result storage
- Resume functionality

Hash generated using secure algorithm (UUID or similar).

### API Authentication
Currently, external APIs don't require authentication. If authentication needed:
- Add API keys to environment variables
- Include in request headers
- Rotate keys periodically

### Error Response Format
Standardized error responses:
```json
{
  "success": false,
  "error": 400,
  "message": "Missing required field: simulateurSlug"
}
```

Success responses:
```json
{
  "success": true,
  "data": { /* response payload */ }
}
```

### CORS Considerations
API endpoints must allow cross-origin requests if:
- Accessed from embedded iframe
- Used by external partners
- Accessed from different subdomain

Current CORS configuration in `config/cors.ts`.

### Client Headers
Custom headers sent to external APIs:
- `X-Client-ID: aides-simplifiees`: Identifies application to partners
- `Accept: application/json`: Expects JSON response
- `Content-Type: application/json`: Sends JSON payload

### Monitoring and Alerts
Consider monitoring:
- External API availability (uptime)
- Response times (performance degradation)
- Error rates (increased failures)
- Quota usage (if APIs have limits)

### Testing External APIs
Strategies for testing:
- **Mock Services**: Use mock servers for external APIs in tests
- **Fixtures**: Store sample responses for reproducible tests
- **Environment Toggle**: Use real APIs in integration tests, mocks in unit tests
- **Contract Testing**: Verify request/response format matches API docs

## Related Domains

- **Simulateurs**: Use OpenFisca for calculations
- **Form Submission**: Provides API for storing results
- **Publicodes**: Orchestrates when to call external APIs
- **Admin**: Uses statistics API for dashboard

## Future Considerations

### Potential Enhancements
- **Caching Layer**: Redis for frequently accessed data
- **Rate Limiting**: Protect against abuse
- **API Versioning**: Version internal APIs for backward compatibility
- **GraphQL**: Consider GraphQL for more flexible queries
- **Webhooks**: Notify external systems of events
- **Batch Operations**: Bulk calculations for efficiency

### External API Alternatives
- **Self-Hosted OpenFisca**: Deploy own OpenFisca instance for control
- **Multiple Providers**: Fallback to alternative geocoding services
- **Offline Mode**: Local calculation fallbacks when APIs unavailable

### Performance Optimization
- **Connection Pooling**: Reuse HTTP connections to external APIs
- **Parallel Requests**: Batch multiple independent API calls
- **Circuit Breaker**: Temporarily stop calling failing APIs
- **Request Compression**: Compress large request/response bodies

### Security Enhancements
- **API Key Rotation**: Automated key rotation for external services
- **Request Signing**: Sign requests to verify integrity
- **Allowlist IPs**: Restrict external API calls to known IPs
- **Secrets Management**: Use vault service for API credentials
