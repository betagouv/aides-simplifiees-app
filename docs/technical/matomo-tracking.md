# Matomo Analytics

## Overview

The application tracks user journeys through aid eligibility simulators using Matomo Analytics.

**Tracking Flow:**
```
User Action → matomo_service.ts → Matomo API → matomo_reporting_service.ts → Statistics
              (client-side)       (storage)     (server-side)                 (dashboard)
```

## Event Structure

### Categories
Format: `[simulator-slug][source]Survey`

Example: `[demenagement-logement][aides.beta.numerique.gouv.fr]Survey`

### Actions (Whitelist)
- `Start`: User begins simulator
- `Answer`: User answers a question
- `Submit`: User completes simulator
- `Eligibility`: Eligibility result shown
- `IntermediaryResults`: Partial results shown

### Source Detection
- Direct access: Uses `url.hostname`
- Partner iframe: Uses `utm_source` parameter
- Unknown iframe: `iframe-unknown` (missing utm_source)

## Security

### Client-Side (`matomo_service.ts`)
- Event action whitelist validation
- Rate limiting: 60 events/min, 1000/session
- Flow session tracking (8-char unique ID per user journey)

### Server-Side (`matomo_reporting_service.ts`)
- Event label regex validation
- Bot traffic filtering (events/visit > 10)
- Data quality alerts (volume spikes, unknown actions)

### CSP (`config/shield.ts`)
Matomo domain (`stats.beta.gouv.fr`) whitelisted in CSP directives.

## Usage

```typescript
import { 
  trackSurveyStart, 
  trackSurveyAnswer, 
  trackSurveySubmit, 
  trackSurveyEligibility 
} from '~/services/matomo_service'

trackSurveyStart('simulator-slug')
trackSurveyAnswer('simulator-slug', 'question-name', 'answer-value')
trackSurveySubmit('simulator-slug')
trackSurveyEligibility('simulator-slug', 'eligible')
```

## Partner Integration

Iframe embeds require tracking parameters:
```html
<iframe src="https://aides.beta.numerique.gouv.fr/simulateur?iframe=true&utm_source=partner-domain.fr" />
```

## Files

| File | Purpose |
|------|---------|
| `inertia/services/matomo_service.ts` | Client-side tracking |
| `app/services/matomo_reporting_service.ts` | Server-side data extraction |
| `tests/frontend/services/matomo_service.spec.ts` | Test suite |
