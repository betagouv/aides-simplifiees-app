# Demarches Simplifiées Integration Domain

## Overview

This domain manages the integration with [Démarches Simplifiées](https://demarches-simplifiees.fr) (DS), allowing users to automatically prefill administrative procedures using data collected in our simulators.

## Core Concepts

### Association
Each `Aide` entity can be optionally linked to a specific DS procedure (`demarche_id`). When linked, a "Start Procedure" button appears on the aide's detail page.

### Field Mapping
To support prefilling, the system maps internal simulator answers (JSON keys) to DS field identifiers (Base64 keys). This mapping is stored in the database.

### Prefill Flow
1. User completes a simulator
2. Answers are stored in `FormSubmission`
3. User views an eligible Aide linked to DS
4. User clicks "Start Procedure"
5. System retrieves answers and constructs the specific DS API payload
6. User is redirected to the prefilled DS folder

## Entity Relationships

```
Aide (1) ──has options──> DS Configuration (JSON)
  ├─ enabled: boolean
  ├─ demarche_id: number (DS ID)
  └─ field_mapping: array
      ├─ ds_key: string (Base64 DS field ID)
      └─ question_id: string (Simulator JSON key)
```

## Data Flow

### Configuration (Admin)
Admins configure mappings in the CMS:
1. Enable DS integration for an Aide
2. Enter DS Procedure ID (e.g., `12345`)
3. Map DS Field Keys (e.g., `Q2hhbXAtMT...`) to Simulator Question IDs (e.g., `statut`)

### User Experience
```
User
  ↓ (completes simulator)
FormSubmission (stores answers with hash)
  ↓ (user views Aide page)
Frontend
  ↓ (POST /api/demarches-simplifiees/prefill)
Backend Controller
  ↓ (retrieves FormSubmission by hash)
  ↓ (loads Aide configuration)
  ↓ (transforms answers to DS format)
  ↓ (POST demarches-simplifiees.fr/api/...)
DS Service (External)
  ↓ (returns prefill URL)
Frontend
  ↓ (redirects user to new tab)
Demarches Simplifiées (Prefilled Form)
```

## Technical Implementation

### Database
- **Table**: `aides`
- **Columns**:
  - `ds_enabled` (boolean)
  - `ds_demarche_id` (integer)
  - `ds_field_mapping` (jsonb)

### External API
- **Endpoint**: `https://www.demarches-simplifiees.fr/preremplir/{demarche_id}`
- **Method**: POST
- **Payload**: `{ [ds_field_key]: value, ... }`
