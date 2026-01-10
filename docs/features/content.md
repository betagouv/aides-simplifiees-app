# Content Domain

## Overview

The Content domain manages textual and educational content that supports users throughout their experience with Aides Simplifiées. It consists of three content types: Pages (static informational pages), Notions (contextual help articles), and an indirect relationship with static pages (hardcoded templates). Content is authored in Markdown, managed through the admin CMS, and rendered as HTML on public-facing pages.

## Core Concepts

### Notion - Contextual Help System
Educational micro-articles that explain concepts during simulations:
- **Purpose**: Help tooltips and explanatory pages
- **Embedding**: Referenced from survey questions via slug
- **Context modes**:
  - Standalone: `/notions/{slug}` (general catalog)
  - Simulateur-scoped: `/simulateurs/{slug}/notions/{notion_slug}` (preserves simulation context)
- **Content**: Markdown with rich formatting
- **Examples**: "What is a conventional housing?", "How to calculate taxable income?"

### Page - Static Content
Persistent informational pages required by law or policy:
- **Purpose**: Legal pages, about pages, terms of service
- **URL pattern**: `/content/{slug}`
- **Content**: Markdown with full formatting
- **Examples**: CGU, Mentions légales, Accessibilité, À propos

### Static Pages (Hardcoded)
Application pages with hardcoded templates:
- **Purpose**: Home, contact, partners, statistics, cookies
- **Implementation**: Vue components, not database-driven
- **URLs**: Root-level (`, `/contact`, `/partenaires`, `/statistiques`)
- **Controller**: StaticPagesController renders Inertia pages

### Common Content Pattern
Pages and Notions share identical structure:
- **Status lifecycle**: draft → unlisted → published
- **Metadata**: title, slug, description, metaDescription
- **Content**: Markdown stored as text
- **Rendering**: Server-side HTML conversion via `marked`

## Entity Relationships

```
Page (standalone entity)
   └─ No relationships, pure content

Notion (standalone entity)
   └─ Referenced by: Survey questions (by slug)

StaticPagesController
   └─ Renders: Home, Contact, Partners, Statistics, Cookies
```

### Loose Coupling Strategy
- **Notions**: Referenced by slug in survey question definitions
- **Pages**: Independent static content
- **No foreign keys**: Content referenced implicitly

## User Journey / Data Flow

### 1. Notion Discovery Flow (Catalog Browse)

**User arrives at catalog**:
- URL: `/notions`
- `NotionController.index()` queries published notions
- Renders `content/notions/notions.vue` with card grid
- Each card links to individual notion page

**User clicks notion card**:
- Navigates to `/notions/{slug}`
- `NotionController.show()` fetches notion by slug
- Validates status: `published` or `unlisted` only
- Converts Markdown to HTML via `marked`
- Renders `content/notions/notion.vue` with HTML content

### 2. Notion in Simulateur Context Flow

**User encounters "En savoir plus" button**:
- Question in survey has `notion` property
- Button displays in `SurveyQuestion.vue` component
- Click triggers navigation to `/simulateurs/{slug}/notions/{notion_slug}`

**Contextual notion page**:
- `NotionController.showWithSimulateur()` handles route
- Fetches both notion AND simulateur
- Validates both entities exist and published/unlisted
- Renders `content/notions/simulateur-notion.vue`
- Includes "Return to simulation" link
- Preserves simulation state via `preserveState: true`

**User returns to simulation**:
- Clicks back link
- Returns to exact question with answers preserved
- No data loss, seamless continuation

### 3. Tooltip vs Notion Decision

**Question help system supports two approaches**:
- **Tooltip**: Short text, inline display via DsfrTooltip
  - Use for: Quick definitions, brief explanations
  - Max 2-3 sentences
  - No formatting or rich content

- **Notion**: Full article, separate page
  - Use for: Complex concepts, detailed guides
  - Markdown formatting, images, links
  - Multiple paragraphs

**Implementation**:
```typescript
question.tooltip: string  // Simple text
question.notion: { id: string, buttonLabel?: string }  // Full article
```

### 4. Page Access Flow

**User navigates to page**:
- URL: `/content/{slug}` (e.g., `/content/mentions-legales`)
- `PageController.show()` fetches page by slug
- Validates status: `published` or `unlisted`
- Converts Markdown to HTML
- Renders `content/pages/page.vue` with HTML

**Common page access points**:
- Footer links (legal pages)
- Navigation menu
- Direct URL sharing

### 5. Static Page Access Flow

**Home page**:
- URL: `/`
- `StaticPagesController.showHome()` queries published simulateurs
- Renders `home.vue` with simulateur cards
- No database content, pure template

**Other static pages**:
- `/partenaires`: Partners listing
- `/integrer-nos-simulateurs`: Integration guide
- `/contact`: Contact information
- `/statistiques`: Usage statistics
- `/cookies`: Cookie management

**Characteristics**:
- No admin CRUD interface
- Content changes require code deployment
- Faster load times (no database queries)

### 6. Content Management Flow (Admin)

**Admin creates notion/page**:
1. Navigate to `/admin/notions/create` or `/admin/pages/create`
2. Fill form: title, slug, description, metaDescription, content (Markdown editor)
3. Submit → `AdminNotionController.store()` or `AdminPageController.store()`
4. Slug auto-generated from title if not provided
5. Redirect to index page

**Admin updates notion/page**:
- Edit at `/admin/notions/:id/edit` or `/admin/pages/:id/edit`
- Modify Markdown content
- Save changes
- Update reflected immediately on public pages

## Technical Patterns

### Markdown Content Strategy
Both Pages and Notions use Markdown:
- **Storage**: Plain text Markdown in `content` column
- **Rendering**: Server-side conversion to HTML
- **Library**: `marked` package
- **Security**: No XSS vulnerabilities (server-side rendering trusted content)

**Controller pattern**:
```typescript
const html = entity.content ? await marked(entity.content) : ''
return inertia.render('view', { entity, html })
```

### Status-Based Visibility
Three-tier visibility control:
- **draft**: Admin-only, not publicly accessible
- **unlisted**: Direct link access only (for review, testing)
- **published**: Full catalog visibility

**Query pattern**:
```typescript
// Catalog (only published)
.where('status', 'published')

// Individual page (published or unlisted)
.whereIn('status', ['published', 'unlisted'])
```

### Identical Model Structure
Pages and Notions share exact schema:
- **Purpose**: Consistency, reusable patterns
- **Fields**: id, createdAt, updatedAt, status, title, slug, description, metaDescription, content
- **Future**: Could consolidate into single `Content` model with `type` field

### DTO Serialization
Both controllers use DTOs:
- **SingleDto**: Full fields for detail pages
- **ListDto**: Minimal fields for catalog listings

**Consistency**: Same pattern as Aides, Simulateurs

### Markdown File Seeding
Seeders load content from files:
- **Location**: `database/seeders_data/pages/*.md` and `database/seeders_data/notions/*.md`
- **Process**: Read file, extract content, insert into database
- **Benefits**: Version control, easier editing, bulk import

### Simulateur-Scoped Navigation
Notion accessed from simulateur:
- **State preservation**: `preserveState: true` in Inertia
- **Scroll preservation**: `preserveScroll: true`
- **Return link**: Back to simulateur with context

**Implementation**:
```typescript
router.visit(
  `/simulateurs/${simulateurSlug}/notions/${notionSlug}`,
  { preserveState: true, preserveScroll: true }
)
```

### Tooltip Component Integration
Tooltips displayed inline:
- **Component**: DsfrTooltip from VueDsfr
- **Positioning**: Custom logic to move tooltip near choice label
- **Content**: Simple string, no HTML
- **Accessibility**: ARIA attributes, keyboard navigation

## Integration Points

### Survey Questions
Questions can reference notions:
```typescript
question: {
  id: 'housing-type',
  title: 'Type de logement',
  notion: {
    id: 'logement-conventionne',
    buttonLabel: 'En savoir plus'
  }
}
```

**Rendering**: `SurveyQuestion.vue` displays "En savoir plus" button

### Admin CMS
- **CRUD controllers**: AdminNotionController, AdminPageController
- **Forms**: NotionForm, PageForm components
- **Markdown editors**: Textarea inputs (future: rich editor)

### Static Pages
- **Home page**: Lists simulateurs from database
- **Integration guide**: References iframe configuration
- **Other pages**: Pure Vue templates

### Seeding System
- **Notion seeder**: Loads Markdown files from `seeders_data/notions/`
- **Page seeder**: Loads Markdown files from `seeders_data/pages/`
- **Development**: Run `node ace db:seed` to populate

## Business Rules

### Notion vs Page Distinction
- **Notions**: Educational, contextual help
- **Pages**: Informational, legal requirements
- **Separation**: Clear purpose, different UX patterns

**Future**: Could merge if distinction becomes unnecessary

### Status Lifecycle
Recommended transitions:
- `draft` → `unlisted` (review/testing)
- `unlisted` → `published` (public launch)
- `published` → `unlisted` (temporary hide)
- Never delete published (old links break)

### Slug Immutability
Once published, slug should remain constant:
- **Reason**: Direct links shared, bookmarked
- **Impact**: Changing slug breaks external links
- **Alternative**: Create new, redirect old

### Markdown Simplicity
Current implementation uses basic Markdown:
- **Pros**: Simple, version control friendly, universal
- **Cons**: Requires Markdown knowledge
- **Future**: Could add WYSIWYG editor

### Content Seeding Workflow
Development content managed via files:
- **Editing**: Modify `.md` files in `seeders_data/`
- **Loading**: Run seeders to update database
- **Production**: Content managed via admin CMS

### State Preservation in Simulateur Context
Critical for UX when accessing notions during simulation:
- Must preserve all user answers
- Must maintain current page position
- Must enable seamless return to simulation

## Key Code Locations

### Models
- `app/models/notion.ts`: Notion entity
- `app/models/page.ts`: Page entity

### Controllers
- `app/controllers/content/notion_controller.ts`: Public notion pages
- `app/controllers/content/page_controller.ts`: Public pages
- `app/controllers/static_pages_controller.ts`: Hardcoded templates
- `app/controllers/admin/admin_notion_controller.ts`: Notion CRUD
- `app/controllers/admin/admin_page_controller.ts`: Page CRUD

### Frontend Pages
- `inertia/pages/content/notions/notions.vue`: Notion catalog
- `inertia/pages/content/notions/notion.vue`: Standalone notion
- `inertia/pages/content/notions/simulateur-notion.vue`: Contextualized notion
- `inertia/pages/content/pages/page.vue`: Page display
- `inertia/pages/home.vue`: Home page
- `inertia/pages/static/`: Static page templates

### Frontend Components
- `inertia/components/survey/SurveyQuestion.vue`: Renders notion buttons
- `inertia/components/admin/NotionForm.vue`: Admin form
- `inertia/components/admin/PageForm.vue`: Admin form
- `inertia/components/layout/HtmlContent.vue`: Renders Markdown HTML

### Seeders
- `database/seeders/3_page_seeder.ts`: Loads pages from files
- `database/seeders/4_notion_seeder.ts`: Loads notions from files

### Seeder Data
- `database/seeders_data/pages/*.md`: Page Markdown files
- `database/seeders_data/notions/*.md`: Notion Markdown files

### Migrations
- `database/migrations/*_create_pages_table.ts`: Page schema
- `database/migrations/*_create_notions_table.ts`: Notion schema

### Tests
- `tests/e2e/01_app.spec.ts`: Notion and page navigation tests

## Notes

### Why Separate Pages and Notions?
- **Different purposes**: Legal vs educational
- **Different UX**: Static vs contextual
- **Different discovery**: Footer links vs in-simulation

**Could merge**: Both are Markdown content with identical structure

### Markdown vs Rich Text Editor
Current Markdown approach:
- **Advantages**: Simple, portable, version control friendly
- **Disadvantages**: Requires Markdown knowledge

**Future enhancement**:
- Add WYSIWYG editor (TipTap, ProseMirror)
- Store as Markdown still (portable)
- Preview mode for admins

### Content Versioning (Future)
No versioning currently:
- **Issue**: Content changes overwrite previous versions
- **Impact**: No audit trail, can't rollback
- **Solution**: Add version history table

### Search and Filtering (Future)
Notion/page catalogs could support:
- Full-text search across titles and content
- Category/tag filtering
- Related content suggestions
- Most viewed/popular content

### Multi-Language Support (Future)
Currently French-only:
- **Enhancement**: Add language field
- **Translation**: Duplicate records per language
- **URL**: Language prefix `/en/notions/{slug}`

### Accessibility Considerations
Content rendering respects RGAA 4.1:
- Semantic HTML from Markdown
- Proper heading hierarchy
- Alt text for images (via Markdown)
- Keyboard navigation for notion buttons

### Performance Optimization
Markdown rendering could be cached:
- **Problem**: `marked` called on every request
- **Solution**: Cache HTML output
- **Invalidation**: Clear cache on content update

### Static vs Dynamic Trade-offs
**Static pages** (hardcoded Vue):
- Faster: No database queries
- Less flexible: Requires deployment to change
- Better for: Rarely changing content

**Dynamic pages** (database):
- Slower: Database query + Markdown rendering
- More flexible: Admin can update instantly
- Better for: Frequently changing content

### Notion Button UX
"En savoir plus" button design:
- Secondary style (not primary action)
- Icon: Information icon (ri:information-line)
- Placement: Below question title, above input
- Accessibility: Keyboard accessible, screen reader friendly

### Content Organization Strategy
Current structure is flat:
- **No categories**: All notions in one list
- **No relationships**: No "related notions"
- **No hierarchy**: No parent/child structure

**Future**: Could add taxonomy/categories

## Related Domains

**Primary relationships**:
- **Simulateurs**: Notions embedded in survey questions
- **Admin**: CMS for managing pages and notions

**Secondary relationships**:
- **Form Submission**: No direct relationship
- **Aides**: Similar content patterns
- **API Integrations**: No integration
