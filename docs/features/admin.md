# Admin Domain

## Overview

The Admin domain provides a Content Management System (CMS) for managing all content entities in Aides Simplifiées. Admin users can create, read, update, and delete simulateurs, aides, pages, notions, type aides, and test personas through a secure web interface. The system enforces role-based access control and provides a unified dashboard for content administration.

## Core Concepts

### Admin User
Users with administrative privileges:
- **Authentication**: Email + password via session-based auth
- **Authorization**: `isAdmin` boolean flag on User model
- **Access control**: AdminMiddleware protects all `/admin/*` routes
- **Session management**: Web guard with cookie-based sessions

### CMS Pattern
Consistent CRUD interface across all admin controllers:
- **Index**: List all entities with status, updated date
- **Create**: Form to add new entity
- **Edit**: Form to modify existing entity
- **Store**: POST endpoint to create new record
- **Update**: PUT endpoint to modify existing record
- **Destroy**: DELETE endpoint to remove record

### Admin Controllers
Separate controller for each content type:
- **AdminDashboardController**: Entry point, entity counts
- **AdminSimulateurController**: Manage simulateurs
- **AdminAideController**: Manage financial aids
- **AdminPageController**: Manage static content pages
- **AdminNotionController**: Manage help tooltips
- **AdminTypeAideController**: Manage aide taxonomy
- **AdminPersonaController**: Manage test data sets

### DTO Serialization Pattern
Each controller provides DTOs for type-safe Inertia data:
- **SingleDto**: Full entity data for create/edit forms
- **ListDto**: Minimal data for index tables
- **Purpose**: Type inference, selective serialization, security

### Route Organization
All admin routes grouped under `/admin` prefix:
- Protected by `middleware.admin()`
- Consistent RESTful URL structure
- Form pages use `GET`, actions use `POST/PUT/DELETE`

## Entity Relationships

```
User (1) ──→ (N) Auth Sessions
   └─ isAdmin flag controls access

AdminMiddleware
   └─ Protects all /admin/* routes

Admin Controllers
   ├─→ Simulateurs (CRUD)
   ├─→ Aides (CRUD)
   ├─→ Pages (CRUD)
   ├─→ Notions (CRUD)
   ├─→ TypeAides (CRUD)
   └─→ Personas (CRUD, nested under Simulateurs)
```

### Access Control Flow
```
Request to /admin/* → AdminMiddleware
  → Check auth.user exists
  → Check user.isAdmin === true
  → Allow access OR redirect to /login
```

## User Journey / Data Flow

### 1. Authentication Flow

**Admin login**:
1. Navigate to `/login`
2. `AuthController.showLogin()` renders login form
3. User enters email + password
4. Submit → `AuthController.login()`
5. `User.verifyCredentials()` validates credentials
6. On success: `auth.use('web').login(user)` creates session
7. Redirect to `/admin` dashboard
8. On failure: Flash error message, redirect back

**Session validation** (every admin request):
1. AdminMiddleware intercepts request
2. Calls `auth.authenticateUsing()`
3. Verifies session cookie validity
4. Loads user from database
5. Checks `user.isAdmin === true`
6. Proceeds OR redirects to login

**Logout**:
1. User clicks logout button
2. POST to `/logout`
3. `AuthController.logout()` destroys session
4. Redirect to home page

### 2. Dashboard View Flow

**Admin lands on dashboard**:
- URL: `/admin`
- `AdminDashboardController.dashboard()` executes
- Queries counts for all entity types:
  - Pages count
  - Notions count
  - Aides count
  - Simulateurs count
  - TypeAides count
- Renders `admin/dashboard.vue` with stats cards
- Each card links to entity index page

### 3. Entity Management Flow (Generic CRUD)

**List entities** (e.g., `/admin/simulateurs`):
1. `AdminSimulateurController.index()` queries all records
2. Preloads relationships if needed
3. Serializes with `ListDto` (minimal fields)
4. Renders `admin/simulateurs/index.vue`
5. Table displays: title, slug, status, updated date
6. Actions: Edit, Delete buttons per row

**Create entity** (e.g., `/admin/simulateurs/create`):
1. GET `/admin/simulateurs/create`
2. `AdminSimulateurController.create()` renders form
3. Loads related data (e.g., typeAides for dropdown)
4. Renders `admin/simulateurs/create.vue`
5. User fills form fields
6. Submit → POST `/admin/simulateurs`
7. `AdminSimulateurController.store()` validates + creates
8. Auto-generate slug if not provided
9. Redirect to index page

**Edit entity** (e.g., `/admin/simulateurs/:id/edit`):
1. GET `/admin/simulateurs/:id/edit`
2. `AdminSimulateurController.edit()` fetches record
3. Serializes with `SingleDto` (full fields)
4. Renders `admin/simulateurs/edit.vue`
5. Form pre-filled with existing data
6. User modifies fields
7. Submit → PUT `/admin/simulateurs/:id`
8. `AdminSimulateurController.update()` validates + updates
9. Redirect to index page

**Delete entity**:
1. User clicks delete button
2. Confirmation modal (frontend)
3. DELETE `/admin/simulateurs/:id`
4. `AdminSimulateurController.destroy()` removes record
5. Response redirects to index
6. Table updates (entity removed)

### 4. Nested Entity Management (Personas)

**Personas belong to Simulateurs**:
- URL pattern: `/admin/simulateurs/:simulateur_id/personas`
- CRUD operations scoped to parent simulateur
- Index shows only personas for that simulateur
- Create/edit forms include hidden simulateurId field

**Special operations**:
- **Import**: Upload JSON file with persona data
- **Export**: Download all personas as JSON
- **Run simulation**: Execute persona test data through calculation

### 5. Complex Form Handling

**Array fields** (e.g., textesLoi in AideForm):
- Frontend manages array state
- Add/remove buttons for array items
- Each item has multiple fields (label, url)
- Submitted as JSON array
- Backend validates + stores as JSONB

**Markdown editors**:
- Rich content fields use Markdown
- Admin writes Markdown syntax
- Preview could show rendered HTML
- Stored as plain text in database

**Relationship selects**:
- Dropdown populated from related table
- Example: typeAideId select in AideForm
- Controller preloads options for form
- Frontend displays as DsfrSelect component

## Technical Patterns

### AdminMiddleware Implementation
```typescript
1. Check auth.user exists (session valid)
2. Verify user.isAdmin === true
3. If valid: next()
4. If invalid: redirect to /login
```

**Placement**: Applied to entire `/admin` route group

### DTO Serialization Strategy
Each controller defines inner classes:
```typescript
class SingleDto {
  constructor(private entity: Entity) {}
  toJson() { return { /* full fields */ } }
}

class ListDto {
  constructor(private entities: Entity[]) {}
  toJson() { return entities.map(e => { /* minimal */ }) }
}
```

**Benefits**:
- Type safety with Inertia TypeScript
- Consistent serialization across controllers
- Selective field exposure (security)
- Easy to modify serialization without changing model

### Slug Auto-Generation
Common pattern across controllers:
```typescript
if (!data.slug) {
  data.slug = string.slug(data.title, {
    strict: true,
    lower: true
  })
}
```

**Applied to**: Simulateurs, Aides, Pages, Notions, TypeAides

### Allowed Fields Pattern
Controllers define whitelist:
```typescript
private static allowedFields: Array<keyof Entity> = [
  'title', 'slug', 'status', 'description', ...
]

const data = request.only(AdminController.allowedFields)
```

**Benefits**:
- Mass assignment protection
- Explicit control over updateable fields
- Prevents privilege escalation

### Preloading Relationships
Index pages preload to avoid N+1:
```typescript
const aides = await Aide.query()
  .preload('typeAide')
```

**Applied to**: Aides (typeAide), Simulateurs (steps), Personas (simulateur)

### Flash Messages
Success/error feedback:
```typescript
session.flash('success', 'Entity created')
session.flash('errors', { field: 'Error message' })
```

**Frontend**: DsfrAlert components display flashed messages

### Redirect After Mutation
Standard pattern after create/update/delete:
```typescript
return response.redirect().toRoute('/admin/entities')
```

**Benefits**: Prevents form resubmission, provides feedback

## Integration Points

### Authentication System
- **Web guard**: Session-based auth with cookies
- **User model**: AuthFinder mixin for credential verification
- **Hash service**: Scrypt for password hashing
- **Session store**: Database-backed sessions

### Models
- **All content models**: Aide, Simulateur, Page, Notion, TypeAide, Persona
- **User model**: Admin flag, authentication methods

### Frontend Components
- **Admin layout**: Shared navigation, header, footer
- **CRUD forms**: Reusable form components per entity
- **Tables**: Entity listings with actions
- **VueDsfr**: DSFR components (buttons, inputs, selects)

### Logging Service
All admin actions logged:
- **Auth attempts**: Login success/failure
- **Entity mutations**: Create, update, delete
- **Business events**: Persona simulation runs

## Business Rules

### Single Admin Role
Current implementation supports one role:
- **isAdmin = true**: Full access to all admin features
- **isAdmin = false**: No admin access

**Future**: Could add granular roles (editor, reviewer, super-admin)

### Authentication Required
No anonymous admin access:
- All `/admin/*` routes protected
- Session expiration enforced
- Re-authentication required after timeout

### Slug Uniqueness
Slugs must be unique per entity type:
- **Enforced**: Database unique constraint
- **Validated**: Controller checks before save
- **Auto-generated**: From title if not provided

### Status Workflow
Entities support status transitions:
- `draft` → `unlisted` → `published`
- Admin controls visibility through status
- Published content appears on public pages

### Cascade Deletion Considerations
Deleting entities with relationships:
- **TypeAides**: Can't delete if aides reference it (foreign key)
- **Simulateurs**: Should archive, not delete (results reference slug)
- **Personas**: Safe to delete (test data only)

### Audit Trail (Future)
Currently no audit log, but should track:
- Who made changes
- When changes occurred
- What changed (before/after values)

## Key Code Locations

### Middleware
- `app/middleware/admin_middleware.ts`: Access control

### Controllers
- `app/controllers/auth_controller.ts`: Login/logout
- `app/controllers/admin/admin_dashboard_controller.ts`: Dashboard
- `app/controllers/admin/admin_simulateur_controller.ts`: Simulateurs CRUD
- `app/controllers/admin/admin_aide_controller.ts`: Aides CRUD
- `app/controllers/admin/admin_page_controller.ts`: Pages CRUD
- `app/controllers/admin/admin_notion_controller.ts`: Notions CRUD
- `app/controllers/admin/admin_type_aide_controller.ts`: TypeAides CRUD
- `app/controllers/admin/admin_persona_controller.ts`: Personas CRUD + special ops

### Models
- `app/models/user.ts`: Admin user with AuthFinder mixin

### Frontend Pages
- `inertia/pages/auth/login.vue`: Login form
- `inertia/pages/admin/dashboard.vue`: Admin home
- `inertia/pages/admin/simulateurs/`: Simulateur CRUD pages
- `inertia/pages/admin/aides/`: Aide CRUD pages
- `inertia/pages/admin/pages/`: Page CRUD pages
- `inertia/pages/admin/notions/`: Notion CRUD pages
- `inertia/pages/admin/type_aides/`: TypeAide CRUD pages
- `inertia/pages/admin/personas/`: Persona CRUD pages

### Frontend Components
- `inertia/components/admin/AdminLayout.vue`: Admin shell
- `inertia/components/admin/SimulateurForm.vue`: Simulateur form
- `inertia/components/admin/AideForm.vue`: Aide form with array handling
- `inertia/components/admin/PageForm.vue`: Page form
- `inertia/components/admin/NotionForm.vue`: Notion form
- `inertia/components/admin/TypeAideForm.vue`: TypeAide form
- `inertia/components/admin/PersonaForm.vue`: Persona form

### Routes
- `start/routes.ts`: All admin routes grouped with middleware

### Tests
- `tests/unit/middleware/admin_middleware.spec.ts`: Access control tests
- `tests/unit/controllers/auth_controller.spec.ts`: Authentication tests

## Notes

### Why Separate Admin Controllers?
- **Separation of concerns**: Public vs admin logic separated
- **Different DTOs**: Admin needs more fields (id, updatedAt)
- **Access control**: Easier to protect entire controller
- **Maintainability**: Clear responsibilities per controller

### Session vs Token Authentication
Current implementation uses sessions:
- **Pros**: Built-in CSRF protection, server-side revocation
- **Cons**: Requires cookie support, server state
- **Alternative**: Could add API token auth for headless CMS

### Inertia for Admin Pages
Inertia provides SPA-like experience:
- **No page reloads**: Form submissions feel instant
- **Type safety**: TypeScript props from controllers
- **Vue components**: Rich UI with DSFR
- **SEO not needed**: Admin pages don't need indexing

### CSRF Protection
All mutating requests protected:
- **Enabled**: AdonisJS Shield middleware
- **Token**: Included in forms automatically
- **Validation**: Verified on POST/PUT/DELETE

### Form Validation
Two-layer validation:
- **Frontend**: Vue component validation (immediate feedback)
- **Backend**: Vine schema validation (security)
- **Error handling**: Flash errors to session, display in forms

### Markdown vs Rich Text
Current approach uses Markdown:
- **Pros**: Plain text, version control friendly, lightweight
- **Cons**: Requires Markdown knowledge
- **Future**: Could add WYSIWYG editor (TipTap, ProseMirror)

### Persona Management
Special features for test data:
- **Import/Export**: JSON files for version control
- **Run simulation**: Test personas through calculation
- **Batch operations**: Manage multiple test cases

### Build-Time Operations
Some admin actions trigger builds:
- **Simulateurs**: `generateBuiltJson()` compiles form structure
- **Publicodes simulateurs**: Require recompiling rules
- **Future**: Could automate builds on save

## Related Domains

**Primary relationships**:
- **Simulateurs**: CRUD for simulateur entities
- **Aides**: CRUD for aide catalog
- **Content**: CRUD for pages and notions
- **Form Submission**: View submission statistics (future)

**Secondary relationships**:
- **Publicodes**: Admin toggles Publicodes mode
- **API Integrations**: No direct admin integration (configured via files)
- **Iframe Integration**: No admin interface (configured via code)
