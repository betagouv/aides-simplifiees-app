# Views Domain (Pages & Components)

## Overview

The Views domain encompasses all user interface components in Aides Simplifiées, built with Vue.js 3 and Inertia.js. The architecture follows a component-based approach using the DSFR (French State Design System) via VueDsfr, ensuring accessibility compliance and consistent government branding. Views are organized as Inertia pages rendered by backend controllers, with reusable components providing modular UI elements.

## Core Concepts

### Inertia Pages
Server-rendered Vue components that act as full-page views:
- **Single File Components**: `.vue` files with `<script setup>`, `<template>`, `<style>`
- **Props from Server**: Receive data via Inertia controllers
- **Type Safety**: InferPageProps utility for full TypeScript support
- **Head Management**: `<Head>` component for SEO metadata
- **No Direct Routing**: Routes defined in backend `start/routes.ts`

### Component Architecture
Three-tier component structure:
1. **Pages** (`inertia/pages/`): Top-level route components
2. **Layout Components** (`inertia/layouts/`): Shared structural wrappers
3. **Reusable Components** (`inertia/components/`): Domain-specific UI elements

### DSFR Integration
French State Design System provides:
- **Accessible Components**: WCAG 2.1 AA compliant
- **Government Branding**: Official colors, typography, iconography
- **Responsive Design**: Mobile-first approach
- **VueDsfr Package**: Vue 3 implementation of DSFR

### Composition API Pattern
All components use Vue 3 Composition API:
- **`<script setup lang="ts">`**: Simplified syntax with TypeScript
- **Composables**: Reusable logic via `use*` functions
- **Reactive State**: `ref()`, `computed()`, `reactive()`
- **Lifecycle Hooks**: `onMounted()`, `onBeforeUnmount()`, etc.

### Layout System
Two main layouts provide structure:
- **default.vue**: Standard layout with header, navigation, footer
- **user-simulation.vue**: Streamlined layout for simulator flow

Layouts wrap page content via `<slot />` mechanism.

## Page Organization

### Public Pages
**Static Pages** (`inertia/pages/static/`):
- `home.vue`: Landing page with simulator tiles
- `partenaires.vue`: Partner organizations
- `integrer-nos-simulateurs.vue`: Iframe integration guide
- `contact.vue`: Contact form
- `cookies.vue`: Cookie policy
- `statistiques.vue`: Usage statistics

**Simulator Pages** (`inertia/pages/simulateurs/`):
- `index.vue`: Simulator catalog listing
- `simulateur.vue`: Main simulator entry point
- `recapitulatif.vue`: Answer summary before calculation
- `resultats.vue`: Calculation results display

**Content Pages** (`inertia/pages/content/`):
- `pages/page.vue`: Generic CMS page
- `aides/aides.vue`: Aid catalog
- `aides/aide.vue`: Individual aid details
- `aides/resultats-aide.vue`: Aid-specific results
- `notions/notions.vue`: Glossary listing
- `notions/notion.vue`: Individual glossary entry
- `notions/simulateur-notion.vue`: Context-specific glossary

**Authentication Pages** (`inertia/pages/auth/`):
- Login, register, password reset flows

**Error Pages**:
- `error.vue`: Generic error display

### Admin Pages
**Admin Dashboard** (`inertia/pages/admin/`):
- `dashboard.vue`: Admin home with CMS navigation
- `simulateurs/`: CRUD for simulators
- `aides/`: CRUD for aids
- `type_aides/`: CRUD for aid categories
- `notions/`: CRUD for glossary entries
- `personas/`: CRUD for user personas
- `pages/`: CRUD for content pages

Each admin section has `index.vue`, `create.vue`, `edit.vue` pattern.

## Component Organization

### Layout Components (`inertia/components/layout/`)
**Structural**:
- `SharedDsfrLayout.vue`: Main layout wrapper with header/footer
- `BrandBackgroundContainer.vue`: Branded background sections
- `SectionContainer.vue`: Content width constraints
- `BreadcrumbSectionContainer.vue`: Breadcrumb navigation
- `SectionSeparator.vue`: Visual dividers
- `AdminPageHeading.vue`: Admin page headers

### Survey Components (`inertia/components/survey/`)
**Form Rendering**:
- `Survey.vue`: OpenFisca survey orchestrator
- `PublicodesSurvey.vue`: Publicodes survey orchestrator
- `SurveyForm.vue`: Multi-step form controller
- `SurveyPage.vue`: Individual page renderer
- `SurveyQuestion.vue`: Question renderer with conditionals
- `SurveyRecap.vue`: Answer summary display
- Input components: `InputText`, `InputRadio`, `InputCheckbox`, etc.

### Aide Components (`inertia/components/aides/`)
**Aid Display**:
- `AidesList.vue`: Grid of aid cards
- `AideCard.vue`: Individual aid presentation
- `AideDetails.vue`: Detailed aid information
- `ResultsAide.vue`: Aid eligibility status

### Admin Components (`inertia/components/admin/`)
**CMS Management**:
- CRUD form components
- List displays with filters
- Validation feedback
- Rich text editors

### Utility Components (`inertia/components/`)
**Shared UI Elements**:
- `DsfrLink.vue`: Inertia-aware links
- `RouterLink.vue`: Client-side navigation
- `DsfrPictogram.vue`: Icon wrapper
- `LoadingSpinner.vue`: Loading states
- `CrispButton.vue`: Chat widget trigger
- `SchemeModal.vue`: Theme preference modal
- `PartenairesSection.vue`: Partner logos
- `MatomoOptOut.vue`: Analytics opt-out
- `ErrorBoundary.vue`: Component error boundary

### ErrorBoundary Component
The `ErrorBoundary` component catches JavaScript errors in its child component tree, displays a fallback UI, and logs errors for tracking.

**Props**:
- `fallbackMessage?: string` - Custom error message (default: "Une erreur s'est produite.")
- `showReload?: boolean` - Show reload button (default: true)

**Usage**:
```vue
<template>
  <ErrorBoundary fallback-message="Une erreur est survenue dans le formulaire">
    <SimulationForm />
  </ErrorBoundary>
</template>
```

**Features**:
- Captures errors via Vue's `onErrorCaptured` hook
- Displays DSFR-styled error alert
- Provides "Retry" button to reset error state
- Optional "Reload page" button
- Logs errors to console (ready for Sentry integration)

## Data Flow Patterns

### Server → Client (Props)
```typescript
// Controller
return inertia.render('simulateurs/simulateur', {
  simulateur: simulateurData
})

// Page Component
const { props: { simulateur } } = usePage<InferPageProps<...>>()
```

**Type Safety**: `InferPageProps` infers prop types from controller.

### Client → Server (Actions)
```typescript
// Form submission
router.post('/api/form-submissions', formData)

// Navigation
router.visit('/simulateurs/demenagement-logement')

// Link component
<DsfrLink to="/simulateurs" label="Voir tous" />
```

### State Management (Stores)
```typescript
// Store usage in components
import { useSurveysStore } from '~/stores/surveys'

const surveysStore = useSurveysStore()
const answers = surveysStore.getAnswers(simulateurSlug)
```

### Composables (Shared Logic)
```typescript
// Reusable functionality
const { isIframe } = useIframeDisplay()
const { trackEvent } = useMatomoTracking()
const { runSimulation } = useSimulation()
```

## Technical Patterns

### Page Props Pattern
Every page receives typed props from controller:
```typescript
interface PageProps {
  simulateur: Simulateur
  results?: SimulationResults
  secureHash?: string
}

const { props } = usePage<InferPageProps<Controller, 'method'>>()
// props is fully typed
```

### Breadcrumb Pattern
Pages set breadcrumbs for navigation context:
```typescript
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' },
  { text: simulateur.title, to: `/simulateurs/${slug}` }
])
```

Displayed by `BreadcrumbSectionContainer` in layout.

### Layout Selection Pattern
```typescript
// In page component
<script setup lang="ts">
defineOptions({
  layout: 'user-simulation'
})
</script>
```

Default layout used if not specified.

### Conditional Rendering Pattern
```typescript
// Show/hide based on data
<div v-if="hasAides">
  <AidesList :aides="results.aides" />
</div>
<div v-else>
  <p>Aucune aide trouvée</p>
</div>

// Conditional classes
<div :class="{ 'active': isActive }">
```

### DSFR Component Pattern
Consistent use of VueDsfr components:
```typescript
<DsfrButton label="Continuer" @click="handleNext" />
<DsfrInput v-model="value" label="Nom" />
<DsfrCard title="Titre" description="Description" />
<DsfrTiles :tiles="tileData" />
```

### Iframe Mode Pattern
Conditional UI for iframe embedding:
```typescript
const { isIframe } = useIframeDisplay()

<template>
  <div v-if="!isIframe">
    <Header />
  </div>
  <!-- Main content always shown -->
</template>
```

### Loading State Pattern
```typescript
const { isLoading, execute } = useAsyncState(
  () => fetchData(),
  null,
  { immediate: false }
)

<LoadingSpinner v-if="isLoading" />
<div v-else>{{ data }}</div>
```

### Form Validation Pattern
Real-time validation with DSFR error display:
```typescript
const errors = ref<Record<string, string>>({})

const validateField = (fieldName: string, value: any) => {
  if (!value) {
    errors.value[fieldName] = 'Ce champ est requis'
  } else {
    delete errors.value[fieldName]
  }
}

<DsfrInput
  :error-message="errors['email']"
  @update:model-value="validateField('email', $event)"
/>
```

## Integration Points

### Backend Controllers
Pages rendered by specific controllers:
- `StaticPagesController`: Static pages
- `SimulateurController`: Simulator pages
- `AideController`: Aid pages
- `NotionController`: Glossary pages
- `AdminController`: Admin CRUD pages

### Stores Integration
Pages consume global state:
- `useSurveysStore()`: Survey answers and navigation
- `useBreadcrumbStore()`: Breadcrumb trail
- `useSchemeStore()`: Theme preferences
- `useCrispStore()`: Chat widget state

### Composables Integration
Pages use composables for complex logic:
- `useSimulation()`: Run calculations
- `useMatomoTracking()`: Analytics events
- `useFormSubmission()`: Save/retrieve results
- `useIframeDisplay()`: Detect iframe mode
- `useSurveySchemaManager()`: Load survey schemas

### Route Integration
Inertia links match backend routes:
```typescript
// Backend: start/routes.ts
router.get('/simulateurs/:slug', [SimulateurController, 'show'])

// Frontend: DsfrLink
<DsfrLink to="/simulateurs/demenagement-logement" />
```

## Business Rules

### Accessibility Requirements
- **RGAA 4.1 Compliance**: All pages must meet French accessibility standards
- **Semantic HTML**: Proper heading hierarchy, landmarks
- **Keyboard Navigation**: All interactions accessible via keyboard
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: Minimum 4.5:1 ratio for text

### Responsive Design
- **Mobile First**: Design starts at 320px width
- **Breakpoints**: Follow DSFR grid system
  - Small: < 768px
  - Medium: 768px - 992px
  - Large: 992px - 1248px
  - Extra Large: ≥ 1248px

### SEO Requirements
Every page must have:
```typescript
<Head
  title="Page Title - Aides Simplifiées"
  description="Page meta description for search engines"
/>
```

### Iframe Embedding Rules
- Hide header/footer in iframe mode
- Show simplified navigation
- Maintain full functionality
- Ensure iframe-resizer communication

### Performance Guidelines
- **Lazy Loading**: Use `defineAsyncComponent` for heavy components
- **Code Splitting**: Vite automatically splits routes
- **Image Optimization**: Use appropriate formats and sizes
- **Bundle Size**: Monitor with `pnpm build --report`

## Key Code Locations

### Pages
- `inertia/pages/home.vue`: Landing page
- `inertia/pages/simulateurs/simulateur.vue`: Simulator entry
- `inertia/pages/simulateurs/resultats.vue`: Results display
- `inertia/pages/admin/dashboard.vue`: Admin home

### Layouts
- `inertia/layouts/default.vue`: Standard layout
- `inertia/layouts/user-simulation.vue`: Simulator layout

### Components
- `inertia/components/layout/SharedDsfrLayout.vue`: Main layout wrapper
- `inertia/components/survey/Survey.vue`: Survey orchestrator
- `inertia/components/aides/AidesList.vue`: Aid display

### Types
- `inertia/types/survey.d.ts`: Survey-related types
- `inertia/types/aide.d.ts`: Aid-related types
- `shared/types/`: Shared backend/frontend types

## Notes

### Vue 3 Composition API
All components use Composition API with `<script setup>`:
- **Pros**: More concise, better TypeScript support, improved tree-shaking
- **Pattern**: Setup runs once on component creation
- **Reactivity**: Use `ref()` for primitives, `reactive()` for objects

### Inertia.js SSR
Server-side rendering with client-side navigation:
- **First Load**: Full HTML from server
- **Subsequent**: JSON data only, no page reload
- **History**: Browser back/forward works correctly
- **Scroll**: Automatic scroll management

### DSFR Component Library
VueDsfr provides 50+ accessible components:
- **Documentation**: https://vue-ds.fr/
- **Theming**: CSS custom properties for colors
- **Icons**: Remix Icon + custom pictograms
- **Grid**: 12-column responsive grid

### Component Naming Conventions
- **Pages**: Descriptive names (`simulateur.vue`, `resultats.vue`)
- **Components**: PascalCase (`AideCard.vue`, `SurveyForm.vue`)
- **Layouts**: Single word (`default.vue`)
- **Props**: camelCase in script, kebab-case in template

### Dynamic Imports
Load components on-demand:
```typescript
const PublicodesSurvey = defineAsyncComponent(
  () => import('~/components/survey/PublicodesSurvey.vue')
)
```

### Slot Pattern
Flexible component composition:
```typescript
// Parent
<SectionContainer>
  <h1>Title</h1>
  <p>Content</p>
</SectionContainer>

// Component
<template>
  <div class="section">
    <slot />
  </div>
</template>
```

### Props vs Stores
**Use Props** for:
- Server data (simulateur, aide, page)
- Parent-child communication
- One-way data flow

**Use Stores** for:
- Global state (survey answers)
- Cross-component communication
- Persistent data

### Error Handling
Pages handle errors gracefully:
```typescript
try {
  await runSimulation()
} catch (error) {
  console.error('Simulation failed:', error)
  // Show user-friendly error message
}
```

### Analytics Integration
Track user interactions:
```typescript
const { trackEvent } = useMatomoTracking()

function handleClick() {
  trackEvent('button', 'click', 'submit-survey')
  // ...
}
```

## Related Domains

- **Stores**: State management consumed by views
- **Simulateurs**: Survey components render simulators
- **Admin**: CMS pages for content management
- **Content**: Dynamic pages and aids displayed
- **Iframe Integration**: Embedded view modes

## View Hierarchy Examples

### Home Page Flow
```
default.vue (layout)
  └─ SharedDsfrLayout.vue
      ├─ DsfrHeader
      ├─ home.vue (page)
      │   ├─ BrandBackgroundContainer
      │   │   └─ SectionContainer
      │   │       └─ DsfrTiles (simulators)
      │   └─ PartenairesSection
      └─ DsfrFooter
```

### Simulator Flow
```
default.vue (layout)
  └─ SharedDsfrLayout.vue
      ├─ DsfrHeader
      ├─ simulateur.vue (page)
      │   └─ Survey.vue (component)
      │       └─ SurveyForm.vue
      │           ├─ SurveyPage.vue
      │           │   └─ SurveyQuestion.vue (multiple)
      │           └─ Navigation buttons
      └─ DsfrFooter
```

### Results Flow
```
default.vue (layout)
  └─ SharedDsfrLayout.vue
      ├─ DsfrHeader
      ├─ resultats.vue (page)
      │   ├─ DsfrAccordionsGroup
      │   │   ├─ AidesList.vue (eligible)
      │   │   │   └─ AideCard.vue (multiple)
      │   │   └─ AidesList.vue (not eligible)
      │   └─ Call to action buttons
      └─ DsfrFooter
```

## Future Considerations

### Potential Enhancements
- **Component Library**: Extract reusable components to separate package
- **Storybook Integration**: Visual testing and documentation
- **A/B Testing**: Experiment with different UI variations
- **Progressive Web App**: Offline support and installability
- **Dark Mode**: Full theme switching support
- **Internationalization**: Multi-language support (i18n)

### Performance Optimization
- **Virtual Scrolling**: For long lists (aid catalog)
- **Image Lazy Loading**: Native `loading="lazy"`
- **Route Prefetching**: Preload likely next pages
- **CSS Purging**: Remove unused DSFR styles

### Accessibility Improvements
- **Focus Management**: Better keyboard navigation
- **ARIA Live Regions**: Dynamic content announcements
- **High Contrast Mode**: Enhanced contrast theme
- **Screen Reader Testing**: Regular audit with NVDA/JAWS

### Developer Experience
- **Component Documentation**: JSDoc comments
- **Visual Regression Testing**: Automated screenshot comparisons
- **Performance Budgets**: Bundle size limits
- **Design Tokens**: Centralized theming variables
