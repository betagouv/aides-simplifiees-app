# Stores Domain (State Management)

## Overview

The Stores domain manages global application state using Pinia, Vue 3's official state management library. Unlike Vuex, Pinia provides a simplified API with full TypeScript support, modular store structure, and composition API integration. Stores handle cross-component state including survey answers, breadcrumb navigation, theme preferences, chat widget state, and debug modes.

## Core Concepts

### Pinia Store System
Modern state management for Vue 3:
- **Type-Safe**: Full TypeScript inference
- **Composition API**: Uses `ref()`, `computed()`, `reactive()`
- **Modular**: Each store handles specific domain
- **DevTools**: Vue DevTools integration for debugging
- **Persistence**: Plugin support for localStorage/sessionStorage
- **SSR Support**: Works with server-side rendering

### Store Definition Pattern
Two patterns for defining stores:

**Setup Store** (Preferred):
```typescript
export const useMyStore = defineStore('my-store', () => {
  const state = ref(initialValue)

  function action() {
    // mutate state
  }

  return { state, action }
})
```

**Options Store** (Alternative):
```typescript
export const useMyStore = defineStore('my-store', {
  state: () => ({ value: 0 }),
  actions: { increment() { this.value++ } },
  getters: { doubled: (state) => state.value * 2 }
})
```

Application uses Setup Store pattern for consistency with Composition API.

### Store Persistence
Selected stores persist to localStorage:
```typescript
defineStore('surveys', storeDefiner, {
  persist: {
    pick: ['answers', 'versions', 'currentPageIds']
  }
})
```

**Purpose**: Preserve user progress across sessions.

### Store Factory Pattern
Complex stores use factory functions:
```typescript
export function useSurveysStoreDefiner({ enableMatomo = false }) {
  return () => {
    // Store logic
  }
}

export const useSurveysStore = defineStore(
  'surveys',
  useSurveysStoreDefiner({ enableMatomo: true }),
  { persist: {...} }
)
```

**Benefits**: Configurable behavior, testability, reusability.

## Store Catalog

### Surveys Store (`stores/surveys.ts`)
**Purpose**: Manages survey state, answers, navigation, and schema loading.

**Architecture**: Modular composition using domain-specific composables.

**Responsibilities**:
- Store user answers per simulator
- Track current page in multi-step surveys
- Load and cache survey schemas
- Evaluate conditional question visibility
- Provide formatted answer display
- Integrate with analytics (Matomo)

**Persisted State**:
- `answers`: User answers by simulator slug
- `versions`: Schema versions to detect changes
- `currentPageIds`: Current page per simulator

**Composable Structure**:
The store composes six domain-focused composables from `composables/surveys/`:

1. **Questions** (`use_survey_questions.ts`):
   - `getQuestions(slug)`: Get all questions in schema
   - `findQuestionById(slug, id)`: Locate specific question

2. **Visibility** (`use_survey_visibility.ts`):
   - `isQuestionVisible(slug, id)`: Evaluate visibility conditions
   - `getVisibleQuestions(slug)`: Filter visible questions

3. **Answers** (`use_survey_answers.ts`):
   - `getAnswers(slug)`: Retrieve all answers
   - `getAnswer(slug, id)`: Get specific answer
   - `setAnswer(slug, id, value)`: Update answer
   - `hasAnswer(slug, id)`: Check if answered
   - `getAnswersForCalculation(slug)`: Format for API

4. **Formatting** (`use_survey_formatting.ts`):
   - `formatAnswer(slug, id, value)`: Display-friendly format

5. **Navigation** (`use_survey_navigation.ts`):
   - `getCurrentPage(slug)`: Current page object
   - `getNextVisiblePage(slug)`: Next navigable page
   - `getPreviousVisiblePage(slug)`: Previous page
   - `goToNextPage(slug)`: Navigate forward
   - `goToPreviousPage(slug)`: Navigate backward
   - `isFirstPage(slug)`: Check if first
   - `isLastPage(slug)`: Check if last
   - `getCurrentStep(slug)`: Current step in multi-step
   - `getProgress(slug)`: Percentage completion

6. **Validation** (`use_survey_validation.ts`):
   - `areAllQuestionsInPageValid(slug)`: Validate current page
   - `areAllRequiredQuestionsAnswered(slug)`: Check completeness
   - `getVisibleQuestionsInCurrentPage(slug)`: Current page questions

**Composition Pattern**:
```typescript
export function useSurveysStoreDefiner({ enableMatomo = false }) {
  return () => {
    const answers = ref<{ [slug: string]: SurveyAnswers }>({})
    const currentPageIds = ref<{ [slug: string]: string | null }>({})

    // Compose domain composables
    const questions = useSurveyQuestions({ getSchema })
    const visibility = useSurveyVisibility({ getAnswers, findQuestionById, getQuestions })
    const answersLogic = useSurveyAnswers({ answers, findQuestionById, isQuestionVisible })
    const navigation = useSurveyNavigation({ currentPageIds, getSchema, isQuestionVisible })
    // ... compose others

    return {
      // Expose unified API
      ...questions,
      ...visibility,
      ...answersLogic,
      ...navigation,
      // ...
    }
  }
}
```

**Benefits of Modular Structure**:
- **Clear separation**: Each composable handles one concern
- **Testability**: Individual composables can be tested in isolation
- **Maintainability**: Smaller files (< 400 lines each)
- **Reusability**: Composables usable outside store context
- **Type safety**: Strong typing preserved throughout

**Integration**: Used by Survey.vue, PublicodesSurvey.vue, recapitulatif.vue

### Breadcrumb Store (`stores/breadcrumbs.ts`)
**Purpose**: Manages breadcrumb navigation trail.

**State**:
```typescript
interface Breadcrumb {
  text: string
  to: string
}
const breadcrumbs = ref<Breadcrumb[]>([])
```

**Methods**:
- `setBreadcrumbs(breadcrumbs)`: Set entire trail

**Usage Pattern**:
```typescript
const { setBreadcrumbs } = useBreadcrumbStore()
setBreadcrumbs([
  { text: 'Accueil', to: '/' },
  { text: 'Simulateurs', to: '/simulateurs' }
])
```

**Display**: BreadcrumbSectionContainer component reads and renders trail.

### Scheme Store (`stores/scheme.ts`)
**Purpose**: Manages dark/light theme preferences.

**State**:
- `preferences`: Theme and scheme settings
- `isModalOpen`: Theme selector modal visibility

**Methods**:
- `openModal()`: Show theme selector
- `closeModal()`: Hide theme selector

**VueDsfr Integration**:
```typescript
const { theme, scheme, setScheme } = useScheme()
watchEffect(() => setScheme(preferences.scheme))
```

**Supported Schemes**:
- `'light'`: Force light theme
- `'dark'`: Force dark theme
- `'system'`: Follow OS preference

### Crisp Store (`stores/crisp.ts`)
**Purpose**: Manages Crisp chat widget state.

**State**:
- `isChatOpen`: Whether chat window is open

**Methods**:
- `toggleChat()`: Open or close chat
- `Crisp`: Full SDK access

**Lifecycle**:
- `onMounted()`: Register chat event listeners
- `onBeforeUnmount()`: Cleanup listeners

**Chat Events**:
```typescript
Crisp.chat.onChatOpened(() => {
  Crisp.chat.show()
  isChatOpen.value = true
})

Crisp.chat.onChatClosed(() => {
  Crisp.chat.hide()
  isChatOpen.value = false
})
```

**Usage**: CrispButton.vue component toggles chat.

### Survey Debug Store (`stores/survey_debug.ts`)
**Purpose**: Provides conditional debug logging for surveys.

**Activation**: Via URL query parameter `?debug=true`

**State**:
- `debugMode`: Computed from URL

**Methods**:
- `debug.log(...)`: Console.log only if debug mode
- `debug.error(...)`: Console.error only if debug mode
- `debug.warn(...)`: Console.warn only if debug mode

**Usage**:
```typescript
const { debug } = useSurveyDebugStore()
debug.log('[Survey] Processing answer:', answer)
```

**Purpose**: Reduce console noise in production, detailed logging in development.

## Survey Composables Architecture

The surveys store is built using a modular composable architecture located in `inertia/composables/surveys/`. Each composable handles a specific domain concern, promoting separation of concerns and testability.

### Composables Overview

#### Questions Composable (`use_survey_questions.ts`)
**Dependencies**: Schema only

**Responsibilities**:
- Extract all questions from schema
- Find questions by ID

**Methods**:
```typescript
getQuestions(slug): SurveyQuestionData[]
findQuestionById(slug, id): SurveyQuestionData | null
```

**Usage**: Foundation for other composables needing question data.

#### Visibility Composable (`use_survey_visibility.ts`)
**Dependencies**: Answers, Questions

**Responsibilities**:
- Evaluate conditional visibility rules
- Filter questions based on current answers

**Condition Evaluation**:
Supports both string and array formats:
```typescript
visibleWhen: "age >= 18"  // Single condition
visibleWhen: ["age >= 18", "statut === 'etudiant'"]  // AND logic
```

**Methods**:
```typescript
isQuestionVisible(slug, id): boolean
getVisibleQuestions(slug): SurveyQuestionData[]
```

**Integration**: `evaluateCondition()` utility handles condition parsing.

#### Answers Composable (`use_survey_answers.ts`)
**Dependencies**: Questions, Visibility, Matomo (optional)

**Responsibilities**:
- Store and retrieve answers
- Filter answers for calculation
- Track analytics events

**Answer Processing**:
```typescript
// Raw storage
setAnswer(slug, 'age', 25)

// Filtered for calculation
getAnswersForCalculation(slug)
// Returns only visible, non-undefined answers
// Parses combobox JSON to extract values
```

**Analytics Integration**:
```typescript
if (enableMatomo) {
  matomo.trackSurveyAnswer(slug, questionId, question.title)
}
```

**Methods**:
```typescript
getAnswers(slug): SurveyAnswers
getAnswer(slug, id): any
hasAnswer(slug, id): boolean
setAnswer(slug, id, value): void
getAnswersForCalculation(slug): SurveyAnswers
```

#### Formatting Composable (`use_survey_formatting.ts`)
**Dependencies**: Answers, Questions

**Responsibilities**:
- Convert raw values to display text
- Handle question type-specific formatting

**Type-Specific Formatting**:
```typescript
formatAnswer(slug, 'has-children', true)  // → "Oui"
formatAnswer(slug, 'transport-types', ['bus', 'metro'])  // → "Bus, Métro"
formatAnswer(slug, 'city', '{"text":"Paris","value":"75"}')  // → "Paris"
```

**Methods**:
```typescript
formatAnswer(slug, questionId, value): string
```

#### Navigation Composable (`use_survey_navigation.ts`)
**Dependencies**: Multiple (currentPageIds, schema, visibility, questions, answers)

**Responsibilities**:
- Track current page/step
- Navigate between pages
- Calculate progress
- Group questions by step

**Page Navigation**:
```typescript
getCurrentPage(slug): SurveyPageData | null
getNextVisiblePage(slug): SurveyPageData | null
getPreviousVisiblePage(slug): SurveyPageData | null
goToNextPage(slug): boolean
goToPreviousPage(slug): boolean
```

**Step Management**:
```typescript
getCurrentStep(slug): SurveyDeepStep | null
getCurrentStepId(slug): string | null
getCurrentStepIndex(slug): number | null
```

**Progress Calculation**:
```typescript
getProgress(slug): number  // 0-100 percentage
// Counts visible answered questions / total visible questions
```

**Grouped Questions**:
```typescript
getGroupedQuestions(slug): QuestionGroup[]
// Returns questions organized by step for recap pages
```

**Methods**: 27 navigation and organization methods

#### Validation Composable (`use_survey_validation.ts`)
**Dependencies**: Answers, Questions, Navigation, Visibility

**Responsibilities**:
- Validate current page answers
- Check completion status
- Filter visible questions for current page

**Validation Logic**:
```typescript
areAllQuestionsInPageValid(slug): boolean
// Uses isAnswerValid() from form_validation utility
// Checks: required fields, format, min/max values

areAllRequiredQuestionsAnswered(slug): boolean
// Only visible questions with required !== false
```

**Methods**:
```typescript
getVisibleQuestionsInCurrentPage(slug): SurveyQuestionData[]
areAllQuestionsInPageValid(slug): boolean
areAllRequiredQuestionsAnswered(slug): boolean
```

### Composition Pattern

The main store composes all six composables:

```typescript
export function useSurveysStoreDefiner({ enableMatomo = false }) {
  return () => {
    // State
    const answers = ref<{ [slug: string]: SurveyAnswers }>({})
    const currentPageIds = ref<{ [slug: string]: string | null }>({})

    // Schema management
    const { getSchema, loadSchema, versions, schemaStatus } = useSurveySchemaManager({
      onNewSchema: (slug) => resetSurvey(slug)
    })

    // Compose domain composables in dependency order
    const questions = useSurveyQuestions({ getSchema })
    const visibility = useSurveyVisibility({
      getAnswers: (slug) => answers.value[slug] ?? {},
      findQuestionById: questions.findQuestionById,
      getQuestions: questions.getQuestions
    })
    const answersLogic = useSurveyAnswers({
      answers,
      findQuestionById: questions.findQuestionById,
      isQuestionVisible: visibility.isQuestionVisible,
      matomo
    })
    const formatting = useSurveyFormatting({
      getAnswer: answersLogic.getAnswer,
      findQuestionById: questions.findQuestionById
    })
    const navigation = useSurveyNavigation({
      currentPageIds,
      getSchema,
      isQuestionVisible: visibility.isQuestionVisible,
      findQuestionById: questions.findQuestionById,
      getAnswers: answersLogic.getAnswers,
      getAnswer: answersLogic.getAnswer
    })
    const validation = useSurveyValidation({
      getAnswer: answersLogic.getAnswer,
      hasAnswer: answersLogic.hasAnswer,
      getCurrentPage: navigation.getCurrentPage,
      getVisibleQuestions: visibility.getVisibleQuestions,
      isQuestionVisible: visibility.isQuestionVisible
    })

    // Return unified API
    return {
      // State
      answers,
      currentPageIds,
      versions,
      schemaStatus,
      // Composed methods
      ...questions,
      ...visibility,
      ...answersLogic,
      ...formatting,
      ...navigation,
      ...validation,
      // Store-specific methods
      resetSurvey,
      onComplete,
      tryComplete,
      // ...
    }
  }
}
```

### Dependency Management

**Initialization Order**:
1. Questions (no dependencies)
2. Visibility (depends on questions)
3. Answers (depends on questions, visibility)
4. Formatting (depends on answers, questions)
5. Navigation (depends on multiple)
6. Validation (depends on multiple)

**Circular Dependency Prevention**:
- Pass raw ref accessors instead of composed methods when needed
- Initialize composables in correct dependency order
- Use function references, not direct calls in options

### Benefits of Modular Architecture

**Separation of Concerns**:
- Each composable handles one responsibility
- Clear boundaries between domains
- Easier to reason about code

**Testability**:
- Individual composables can be unit tested
- Mock dependencies easily
- Test edge cases in isolation

**Maintainability**:
- Smaller files (< 400 lines each vs 700-line monolith)
- Changes localized to specific composable
- Clear ownership of functionality

**Reusability**:
- Composables usable outside store context
- Can compose in different ways
- Share logic across features

**Type Safety**:
- Each composable has typed options interface
- Return types fully inferred
- Strong typing preserved throughout composition

## Surveys Store Deep Dive

### Answer Management

**Storage Structure**:
```typescript
answers.value = {
  'demenagement-logement': {
    'statut-professionnel': 'etudiant',
    'age': 25,
    'loyer': 600
  },
  'aom-bordeaux': {
    'zone-residence': 'zone-a'
  }
}
```

**Multi-Simulator Support**: Each simulator maintains independent state.

**Answer Formatting**:
```typescript
formatAnswer(slug, questionId, value)
```

Converts raw values to display-friendly text:
- Boolean → "Oui"/"Non"
- Checkbox → Comma-separated choice titles
- Radio → Selected choice title
- Number → String representation
- Combobox → Parsed label text

**Calculation Filtering**:
```typescript
getAnswersForCalculation(slug)
```

Returns only:
- Answers to visible questions (based on conditions)
- Non-undefined values
- Parsed combobox values (extract `value` from JSON)

**Purpose**: Send clean data to calculation engines (OpenFisca/Publicodes).

### Schema Management

**Loading**:
```typescript
await loadSchema(simulateurSlug)
```

Fetches survey schema from `/forms/{slug}.json`, normalizes structure, stores with version.

**Version Detection**:
If schema version changes (forceRefresh or version mismatch):
- Clear stored answers
- Reset to first page
- Trigger `onNewSchema` callback

**Caching**: Schemas cached in memory after first load.

**Status Tracking**:
```typescript
schemaStatus.value[slug] = 'loading' | 'loaded' | 'error'
```

### Page Navigation

**Current Page Tracking**:
```typescript
currentPageIds.value['simulator-slug'] = 'page-3'
```

**Visibility Logic**:
```typescript
isQuestionVisible(slug, questionId)
```

Evaluates conditions:
- Check question's `visibleIf` condition
- Recursively check dependencies
- Returns boolean

**Navigation Methods**:
- `getNextVisiblePage()`: Finds next page with visible questions or intermediary results
- `getPreviousVisiblePage()`: Finds previous page with visible questions
- `isFirstPage()`: No previous visible page
- `isLastPage()`: No next visible page

**Intermediary Results**: Special page type that's always visible regardless of conditions.

### Question Finding

**By ID**:
```typescript
findQuestionById(slug, questionId)
```

Searches all pages in all steps for matching question ID.

**By Page**:
```typescript
getCurrentPage(slug).questions
```

Returns questions on current page.

### Conditional Logic

**Condition Evaluation**:
```typescript
evaluateCondition(condition, getAnswer)
```

Supports operators:
- `equals`, `notEquals`
- `in`, `notIn`
- `greaterThan`, `lessThan`
- `greaterThanOrEquals`, `lessThanOrEquals`
- `and`, `or`, `not`

**Example Condition**:
```typescript
{
  operator: 'and',
  conditions: [
    { questionId: 'age', operator: 'greaterThan', value: 18 },
    { questionId: 'statut', operator: 'equals', value: 'etudiant' }
  ]
}
```

### Analytics Integration

**Matomo Tracking** (when enabled):
```typescript
setAnswer(slug, questionId, value) {
  // ...
  matomo?.trackSurveyAnswer(slug, questionId, question.title)
}
```

Tracks each answer for analytics.

## Data Flow Patterns

### Store Initialization
```typescript
// 1. Import store
import { useSurveysStore } from '~/stores/surveys'

// 2. Get store instance
const surveysStore = useSurveysStore()

// 3. Use store
surveysStore.setAnswer(slug, questionId, value)
```

**Singleton Pattern**: Same store instance shared across all components.

### Reactive Store State
```typescript
// Store state is reactive
const answers = computed(() => surveysStore.getAnswers(slug))

// Updates automatically when store changes
```

### Store Composition
```typescript
// Store can use other stores
const { debug } = useSurveyDebugStore()
```

### Store → Component
```typescript
// Component reads from store
const currentPage = surveysStore.getCurrentPage(slug)
```

### Component → Store
```typescript
// Component updates store
surveysStore.setAnswer(slug, 'age', 25)
```

### Store → API
```typescript
// Store triggers API call
const schema = await fetch(`/forms/${slug}.json`)
```

## Technical Patterns

### Computed Properties
```typescript
const debugMode = computed(() => {
  return getParam(page.url, 'debug') === 'true'
})
```

**Purpose**: Derived state that updates automatically.

### Ref Unwrapping
```typescript
// Direct access to ref value
const value = state.value

// Automatic unwrapping in template
<div>{{ state }}</div>
```

### Reactive Objects
```typescript
const preferences: Preferences = reactive({
  theme: 'light',
  scheme: 'light'
})
```

**Use Case**: Objects with multiple properties.

### Store Composables
Stores use composables for complex logic:
```typescript
const { debug } = useSurveyDebugStore()
const matomo = enableMatomo ? useMatomoTracking() : null
```

### Persistence Plugin
```typescript
{
  persist: {
    pick: ['answers', 'versions'],
    // Automatically syncs to localStorage
  }
}
```

**Storage Key**: `pinia:surveys` (store ID prefixed)

### Lazy Store Creation
```typescript
// Store created on first use
const store = useSurveysStore()
```

**Before First Call**: Store doesn't exist.
**After First Call**: Store instance created and reused.

## Integration Points

### View Components
Components access stores:
```typescript
import { useSurveysStore } from '~/stores/surveys'

const surveysStore = useSurveysStore()
const answers = surveysStore.getAnswers(slug)
```

### Composables
Composables use stores:
```typescript
export function useEligibility() {
  const surveysStore = useSurveysStore()
  const answers = surveysStore.getAnswersForCalculation(slug)
  // ...
}
```

### Layouts
Layouts use stores for global state:
```typescript
const { breadcrumbs } = useBreadcrumbStore()

<DsfrBreadcrumb :links="breadcrumbs" />
```

### Persistence Layer
Pinia plugin syncs to localStorage:
```typescript
// Write
localStorage.setItem('pinia:surveys', JSON.stringify(state))

// Read
const stored = localStorage.getItem('pinia:surveys')
if (stored) {
  Object.assign(state, JSON.parse(stored))
}
```

### DevTools Integration
Vue DevTools shows:
- Current store state
- Action history
- State mutations
- Time-travel debugging

## Business Rules

### Answer Persistence
**Persisted**: Survey answers remain across:
- Page refreshes
- Browser close/reopen
- Navigation away and back

**Cleared**: Answers reset when:
- User explicitly resets survey
- Schema version changes
- Schema `forceRefresh` flag set

### Schema Versioning
**Version Check**:
```typescript
if (schema.version !== storedVersion || schema.forceRefresh) {
  resetSurvey(slug)
}
```

**Purpose**: Prevent incompatible data after schema changes.

### Question Visibility
Questions hidden if:
- `visibleIf` condition evaluates false
- Any dependency condition fails

**Recursive Check**: Dependencies of dependencies also evaluated.

### Navigation Rules
- Cannot navigate past last visible page
- Cannot navigate before first visible page
- Intermediary results pages always accessible
- Empty pages (all questions hidden) skipped

### Debug Mode
**Activation**: Only via `?debug=true` URL parameter
**Persistence**: Not persisted, must be in URL each session
**Production**: Safe to leave code in production

## Key Code Locations

### Store Definitions
- `inertia/stores/surveys.ts`: Survey state management
- `inertia/stores/breadcrumbs.ts`: Navigation trail
- `inertia/stores/scheme.ts`: Theme preferences
- `inertia/stores/crisp.ts`: Chat widget state
- `inertia/stores/survey_debug.ts`: Debug logging

### Store Factory
- `inertia/composables/use_surveys_store_definer.ts`: Surveys store logic (700 lines)

### Integration
- Components: Import and use stores directly
- Composables: Access stores for complex operations
- Persistence: Automatic via Pinia plugin

### Types
- `inertia/types/survey.d.ts`: Survey-related types
- Pinia types: Built-in TypeScript support

## Notes

### Pinia vs Vuex
**Why Pinia**:
- Simpler API (no mutations)
- Better TypeScript support
- Composition API aligned
- Smaller bundle size
- Official recommendation for Vue 3

**Migration**: Aides Simplifiées built with Pinia from start.

### Store Naming Convention
- **Store File**: `kebab-case.ts` (e.g., `survey_debug.ts`)
- **Store ID**: `'kebab-case'` (e.g., `'survey-debug'`)
- **Store Hook**: `usePascalCaseStore()` (e.g., `useSurveyDebugStore()`)

### State Mutation
**Direct Mutation** (Allowed in Pinia):
```typescript
store.value.answers = newAnswers
```

**No Special Syntax**: Unlike Vuex, no commit/dispatch needed.

### Store Lifecycle
1. **First Access**: Store instance created
2. **Component Mount**: Store available immediately
3. **Component Unmount**: Store persists
4. **App Unmount**: Store cleaned up

### Getters vs Computed
**In Store**:
```typescript
const doubled = computed(() => count.value * 2)
return { doubled }
```

**In Component**:
```typescript
const doubled = computed(() => store.count * 2)
```

Both work, prefer store-level for shared logic.

### Actions vs Functions
In Setup Stores, no distinction:
```typescript
function myAction() {
  // Just a function
}
return { myAction }
```

**Benefit**: Simpler mental model.

### Hot Module Replacement
Stores support HMR in development:
- State preserved on code changes
- Actions update immediately
- No manual reload needed

### Testing Stores
```typescript
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('should store answer', () => {
  const store = useSurveysStore()
  store.setAnswer('test', 'q1', 'answer')
  expect(store.getAnswer('test', 'q1')).toBe('answer')
})
```

## Related Domains

- **Views**: Components consume store state
- **Simulateurs**: Survey stores manage simulator flow
- **Form Submission**: Stores provide data for API calls
- **Publicodes**: Stores provide answers for calculations

## Store Dependencies

```
useSurveysStore
  ├─ uses: useSurveyDebugStore
  ├─ uses: useSurveySchemaManager (composable)
  └─ uses: useMatomoTracking (composable)

useSurveyDebugStore
  └─ uses: usePage (Inertia)

useSchemeStore
  └─ uses: useScheme (VueDsfr)

useCrispStore
  └─ uses: Crisp SDK

useBreadcrumbStore
  └─ (no dependencies)
```

## Future Considerations

### Potential Enhancements
- **Undo/Redo**: Survey answer history with time travel
- **Auto-Save**: Debounced API persistence for cross-device sync
- **Offline Mode**: Service worker integration
- **State Snapshots**: Export/import full survey state
- **Multi-User**: Collaborative survey completion
- **Real-time Sync**: WebSocket updates for shared surveys

### Performance Optimization
- **Selective Persistence**: Only persist changed answers
- **Compression**: Compress localStorage data
- **Lazy Loading**: Load stores on-demand
- **Memory Management**: Clear old simulator data

### Developer Experience
- **Store Documentation**: JSDoc for all methods
- **Type Safety**: Stricter TypeScript types
- **Validation**: Runtime schema validation
- **Debugging Tools**: Custom DevTools panels
- **Store Testing**: Comprehensive test coverage

### Advanced Features
- **State Machine**: Formal state transitions for surveys
- **Middleware**: Plugin system for store extensions
- **Action History**: Audit trail of all changes
- **Optimistic Updates**: Immediate UI updates before API confirmation
- **Conflict Resolution**: Handle concurrent modifications
