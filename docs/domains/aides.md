# Aides Domain

## Overview

The Aides domain represents the catalog of financial aids available through Aides Simplifiées. Each aide is a specific financial support program (housing aid, mobility grant, tax credit, etc.) with detailed information including eligibility criteria, application processes, instructing organizations, and legal references. Aides serve as both content entities (browsable catalog) and calculation outputs (eligibility results from simulateurs).

## Core Concepts

### Aide Entity
The central content entity representing a financial aid program:
- **Status lifecycle**: `draft`, `published`, `unlisted`
- **Content structure**: Title, description, rich content (Markdown)
- **Metadata**: SEO fields, slug for URLs
- **Classification**: Type (taxonomy), usage category
- **Administrative info**: Instructing organization, legal texts
- **Calculation link**: Slug matches calculation engine identifiers

### TypeAide - Taxonomy System
Hierarchical classification of aides:
- **Purpose**: Groups similar aides (financial aid, guarantee, loan, tax credit)
- **Visual identity**: Each type has an icon for UI display
- **Relationships**: One TypeAide → Many Aides
- **Examples**:
  - `aide-financiere`: Direct financial support
  - `garantie`: Rental guarantees
  - `pret`: Zero-interest loans
  - `credit-impot`: Tax credits

### UsageAide - Expense Categories
Categorizes aides by intended use:
- `loyer-logement`: Rent payments
- `frais-installation-logement`: Moving/installation costs
- `caution-logement`: Security deposits
- `pret-garantie-logement`: Housing loan guarantees
- `credit-impot`: Tax credits
- `jeune-entreprise`: Young business support

**Purpose**: Groups results by expense type on results pages

### TexteLoi - Legal References
Array of legal documents supporting each aide:
- **Structure**: `{ label: string, url: string }`
- **Storage**: JSONB column in database
- **Purpose**: Transparency, official documentation links
- **Display**: Shown on aide detail pages and results

### Content vs Calculation Roles

**As Content** (browseable catalog):
- Users visit `/aides` to discover available aids
- Each aide has dedicated page: `/aides/{slug}`
- Rich Markdown content with application instructions
- SEO-optimized for discoverability

**As Calculation Output**:
- Simulateur calculations return aide slugs
- Slugs must match between database and calculation engines
- Results enriched with aide details from database
- Displayed on `/simulateurs/{slug}/resultats/{hash}` pages

## Entity Relationships

```
TypeAide (1) ──→ (N) Aide
   └─ Classifies aides by type

Aide (standalone entity)
   ├─ Referenced by: FormSubmission.results (by slug)
   ├─ Referenced by: OpenFisca calculations (by slug)
   └─ Referenced by: Publicodes dispositifs (by slug)
```

### Relationship Design
- **TypeAide**: Foreign key relationship (database-enforced)
- **Simulateurs**: Loose coupling via slug matching
- **FormSubmissions**: Referenced implicitly in results JSONB

## User Journey / Data Flow

### 1. Aide Discovery Flow (Catalog Browse)

**User arrives at catalog**:
- URL: `/aides`
- `AideController.index()` queries published aides
- Preloads `typeAide` relationship (avoids N+1)
- Renders `content/aides/aides.vue` with ListDto

**ListDto serialization**:
- Minimal fields for list view
- Includes: title, slug, description, instructeur, typeAide, usage
- Excludes: id, timestamps, metaDescription, content, textesLoi

**User clicks aide card**:
- Navigates to `/aides/{slug}`
- `AideController.show()` fetches aide by slug
- Validates status: `published` or `unlisted` only
- Converts Markdown content to HTML via `marked`
- Renders `content/aides/aide.vue` with SingleDto + HTML

### 2. Aide in Calculation Results Flow

**Simulateur completes calculation**:
- Returns results: `{ "aide-slug-eligibilite": true, "aide-slug": 500 }`
- `SimulateurController.transformSimulationResults()` called

**Result transformation pipeline**:
1. Extract aide slugs from eligibility flags
2. Query `Aide` table for matching slugs
3. Preload `typeAide` relationships
4. Match calculation data with database content
5. Create `RichAide` objects combining:
   - Calculation: eligibilite, montant
   - Database: title, description, instructeur, legal texts, type
6. Categorize by `usage` for grouping
7. Generate links to aide detail pages with hash context

**Results page display**:
- URL: `/simulateurs/{slug}/resultats/{hash}`
- Shows eligible aides with amounts
- Groups by usage category
- Links to: `/simulateurs/{slug}/resultats/{hash}/aides/{aide_slug}`

### 3. Aide Detail from Results Flow

**User clicks aide card on results**:
- URL: `/simulateurs/{slug}/resultats/{hash}/aides/{aide_slug}`
- `AideController.showWithResults()` handles route
- Fetches both aide content AND form submission
- Displays aide details with personalized context
- Shows user's specific eligibility and amount

### 4. Admin Management Flow

**Admin creates aide**:
1. Navigate to `/admin/aides/create`
2. Fill form with: title, description, content (Markdown editor)
3. Select `typeAideId` from dropdown
4. Set `usage` category
5. Specify `instructeur` organization
6. Add `textesLoi` entries (label + URL pairs)
7. Submit → `AdminAideController.store()`
8. Slug auto-generated from title (if not provided)

**Admin updates aide**:
- Edit at `/admin/aides/{id}/edit`
- Modify fields, save changes
- `AdminAideController.update()` merges changes

**Admin deletes aide**:
- Soft deletion via status change (preferred)
- Or hard deletion via `destroy()` method
- No cascade to results (results reference by slug only)

## Technical Patterns

### Status Visibility Control
Three status levels control access:
- **draft**: Only visible in admin panel
- **unlisted**: Direct link access only (for pilot programs)
- **published**: Full public visibility (catalog + search)

**Query pattern**:
```typescript
// Public catalog
.where('status', 'published')

// Individual page (unlisted allowed)
.whereIn('status', ['published', 'unlisted'])
```

### Slug as Universal Identifier
Slugs serve multiple purposes:
- **URLs**: `/aides/aide-personnalisee-logement`
- **Calculation reference**: OpenFisca/Publicodes use same slug
- **Results matching**: Links calculation output to content
- **Immutability**: Once published, slug should not change

**Generation**:
```typescript
if (!slug) {
  slug = string.slug(title, { strict: true, lower: true })
}
```

### JSONB for Legal Texts
`textesLoi` stored as JSONB array:
- **Flexibility**: Schema-less, can add fields without migration
- **Queryability**: PostgreSQL JSONB supports queries if needed
- **Serialization**: Custom column decorators handle JSON ↔ object conversion

**Model definition**:
```typescript
@column({
  columnName: 'textes_loi',
  prepare: value => JSON.stringify(value),
  consume: value => JSON.parse(value),
})
declare textesLoi: TexteLoi[]
```

### Markdown Content Rendering
Rich content stored as Markdown:
- **Editor**: Admin uses Markdown editor (future: rich text)
- **Storage**: Plain text Markdown in database
- **Rendering**: Server-side conversion to HTML via `marked`
- **Security**: Sanitization to prevent XSS (future enhancement)

**Controller pattern**:
```typescript
const html = aide.content ? await marked(aide.content) : ''
return inertia.render('aide', { aide, html })
```

### TypeAide Preloading
Always preload relationship to avoid N+1:
```typescript
const aides = await Aide.query()
  .where('status', 'published')
  .preload('typeAide') // Single query with JOIN
```

### DTO Serialization Pattern
Two DTOs for different contexts:
- **ListDto**: Minimal fields for catalog listing
- **SingleDto**: Full fields for detail pages

**Shared pattern across controllers**:
- AdminAideController: Includes admin fields (id, updatedAt)
- AideController: Public fields only

## Integration Points

### Calculation Engines
- **OpenFisca API**: Aides must exist in OpenFisca model
- **Publicodes**: Dispositifs must match aide slugs
- **Slug convention**: Must be identical across systems

### Simulateurs
- **Result enrichment**: SimulateurController queries Aide table
- **Links**: Results page generates aide detail links
- **Context preservation**: Hash carried through to aide pages

### Admin CMS
- **CRUD operations**: Full lifecycle management
- **TypeAide management**: Separate controller/pages
- **Content authoring**: Markdown editor for rich content

### Frontend Components
- **AideCard**: Displays aide in catalog and results
- **AideForm**: Admin form with legal texts array editor
- **TypeAideForm**: Admin form for type management

## Business Rules

### Slug Immutability After Publication
Once published, aide slug should remain constant:
- **Reason**: Results URLs embed aide slugs
- **Impact**: Changing slug breaks old results links
- **Alternative**: Create new aide, mark old as unlisted

### TypeAide Required
Every aide should have a type:
- **Improves UX**: Visual categorization with icons
- **Enables filtering**: Future feature to filter by type
- **Data quality**: Foreign key constraint enforces

### Usage Categories for Grouping
Usage field enables logical grouping:
- **Results page**: Groups aides by expense category
- **Total calculations**: Sum amounts per usage
- **User understanding**: "Housing costs", "Moving costs", etc.

### Legal Text Transparency
Legal references support trust:
- **Government requirement**: Official sources cited
- **User confidence**: Aids verifiable through laws
- **Admin responsibility**: Keep references up-to-date

### Content vs Calculation Sync
Aide slugs must stay synchronized:
- **OpenFisca**: Variable names match aide slugs
- **Publicodes**: Dispositif IDs match aide slugs
- **Database**: Aide records exist for all calculated aids
- **Seeding**: Critical to populate database with calculation aids

### Status Lifecycle Management
Recommended status transitions:
- `draft` → `unlisted` (pilot testing)
- `unlisted` → `published` (full launch)
- `published` → `unlisted` (temporarily hidden)
- Never delete published aides (breaks old results)

## Key Code Locations

### Models
- `app/models/aide.ts`: Main entity with JSONB handling
- `app/models/type_aide.ts`: Taxonomy entity

### Controllers
- `app/controllers/content/aide_controller.ts`: Public-facing pages
- `app/controllers/admin/admin_aide_controller.ts`: Admin CRUD
- `app/controllers/admin/admin_type_aide_controller.ts`: Type CRUD

### Frontend Pages
- `inertia/pages/content/aides/aides.vue`: Catalog listing
- `inertia/pages/content/aides/aide.vue`: Detail page
- `inertia/pages/admin/aides/index.vue`: Admin list
- `inertia/pages/admin/aides/create.vue`: Admin create
- `inertia/pages/admin/aides/edit.vue`: Admin edit

### Frontend Components
- `inertia/components/admin/AideForm.vue`: Admin form with legal texts array
- `inertia/components/admin/TypeAideForm.vue`: Type management form

### Types
- `shared/types/aides.d.ts`: Global types (UsageAide, TexteLoi, RichAide)

### Migrations
- `database/migrations/*_create_aides_table.ts`: Schema definition
- `database/migrations/*_create_type_aides_table.ts`: Type taxonomy

### Seeders
- `database/seeders/1_type_aide_seeder.ts`: Type taxonomy data
- `database/seeders/2_aide_seeder.ts`: Aide catalog with legal texts

### Tests
- `tests/unit/controllers/content/aide_controller.spec.ts`: Public controller tests
- `tests/fixtures/aide_factory.ts`: Test data factory
- `tests/fixtures/type_aide_factory.ts`: Type factory

## Notes

### Aide vs Dispositif Terminology
- **Aide**: Database entity, content object
- **Dispositif**: Publicodes calculation rule
- **Same concept**: Different terms in different systems
- **Slug links them**: Shared identifier across contexts

### Rich Content Future Enhancements
Current Markdown approach could evolve:
- **Rich text editor**: WYSIWYG for non-technical admins
- **Content blocks**: Structured content (steps, FAQs, etc.)
- **Media support**: Images, videos, documents
- **Versioning**: Track content changes over time

### Search and Filtering (Future)
Catalog could support:
- **Full-text search**: Search aide titles and descriptions
- **Type filtering**: Show only specific type of aides
- **Usage filtering**: Filter by expense category
- **Instructeur filtering**: Find aids by organization

### Legal Text Validation
Current implementation is flexible but could add:
- **URL validation**: Ensure legal text URLs are valid
- **Broken link checking**: Periodic verification
- **Version tracking**: Law versions change over time
- **PDF archiving**: Store local copies of legal texts

### Internationalization Considerations
Currently French-only, future could support:
- **Multi-language content**: English, other EU languages
- **Localized slugs**: Different URLs per language
- **Translation workflow**: Admin UI for translations

### Aide Versioning Strategy
Consider versioning for:
- **Rule changes**: Eligibility criteria evolve
- **Content updates**: Information changes over time
- **Historical accuracy**: Old results reference old rules
- **Migration path**: Update calculations without breaking results

### Performance Optimization
Catalog listing could benefit from:
- **Pagination**: Currently loads all published aides
- **Caching**: Static aide content rarely changes
- **CDN**: Serve aide pages via CDN
- **Search indexing**: Elasticsearch/Algolia for fast search

## Related Domains

**Primary relationships**:
- **Simulateurs**: Aides are evaluation targets for simulateurs
- **Form Submission**: Results contain aide eligibility/amounts
- **Publicodes**: Dispositifs in Publicodes correspond to aides

**Secondary relationships**:
- **Admin**: CMS functionality for managing aides
- **Content**: Similar content management patterns
- **API Integrations**: OpenFisca API references aides
