# API Reference

Complete API documentation for @betagouv/survey-schema.

## Table of Contents

- [Builders](#builders)
- [Validators](#validators)
- [Core Logic](#core-logic)
- [Types](#types)
- [Utilities](#utilities)

## Builders

### SurveySchemaBuilder

Create complete survey schemas with a fluent API.

```typescript
new SurveySchemaBuilder(id: string, engine?: 'openfisca' | 'publicodes')
```

**Methods:**
- `.version(version: string): this` - Set schema version (semver format)
- `.title(title: string): this` - Set schema title
- `.description(description: string): this` - Set schema description
- `.addStep(step: SurveyStepUnion): this` - Add a step
- `.steps(steps: SurveyStepUnion[]): this` - Set all steps
- `.forceRefresh(value: boolean): this` - Set force refresh flag
- `.dispositifs(dispositifs: string[]): this` - Set dispositifs (publicodes only)
- `.questionsToApi(questions: string[]): this` - Set questions to API (openfisca only)
- `.addTest(test: SurveyTest): this` - Add a test case
- `.tests(tests: SurveyTest[]): this` - Set all tests
- `.build(): SurveySchema` - Build and validate the schema

**Example:**
```typescript
const schema = new SurveySchemaBuilder('my-survey', 'publicodes')
  .version('1.0.0')
  .title('Eligibility Survey')
  .dispositifs(['rsa', 'prime-activite'])
  .addStep(step)
  .build()
```

### StepBuilder

Create survey steps (flat or deep format).

```typescript
new StepBuilder(id: string)
```

**Methods:**
- `.title(title: string): this` - Set step title
- `.addPage(page: SurveyQuestionsPageData | SurveyResultsPageData): this` - Add a page (deep format)
- `.pages(pages: Array<...>): this` - Set all pages
- `.addQuestion(question: SurveyQuestionData): this` - Add a question (flat format)
- `.questions(questions: SurveyQuestionData[]): this` - Set all questions
- `.build(): SurveyStepUnion` - Build and validate

**Example:**
```typescript
// Deep format with pages
const step = new StepBuilder('step1')
  .title('Personal Info')
  .addPage(page1)
  .build()

// Flat format with questions
const step = new StepBuilder('step1')
  .title('Quick Questions')
  .addQuestion(q1)
  .addQuestion(q2)
  .build()
```

### PageBuilder

Create survey pages.

```typescript
new PageBuilder(id: string)
```

**Methods:**
- `.title(title?: string): this` - Set page title (optional)
- `.addQuestion(question: SurveyQuestionData): this` - Add a question
- `.questions(questions: SurveyQuestionData[]): this` - Set all questions
- `.build(): SurveyQuestionsPageData` - Build and validate

**Example:**
```typescript
const page = new PageBuilder('page1')
  .title('Basic Information')
  .addQuestion(question1)
  .addQuestion(question2)
  .build()
```

### Question Builders

Specialized builders for each question type.

#### RadioQuestionBuilder

```typescript
new RadioQuestionBuilder(id: string)
```

**Methods:**
- `.title(title: string): this`
- `.description(description: string): this`
- `.choices(choices: SurveyChoice[]): this` - Set all choices
- `.addChoice(id: string, title: string): this` - Add a single choice
- `.visibleWhen(condition: string | string[]): this`
- `.notion(notion: SurveyQuestionNotion): this`
- `.tooltip(tooltip: string | SurveyQuestionTooltip): this`
- `.build(): SurveyQuestionRadio`

#### CheckboxQuestionBuilder

Same API as RadioQuestionBuilder, returns `SurveyQuestionCheckbox`.

#### NumberQuestionBuilder

```typescript
new NumberQuestionBuilder(id: string)
```

**Methods:**
- `.title(title: string): this`
- `.description(description: string): this`
- `.min(min: number): this` - Set minimum value
- `.max(max: number): this` - Set maximum value
- `.visibleWhen(condition: string | string[]): this`
- `.build(): SurveyQuestionNumber`

#### Other Question Builders

- `DateQuestionBuilder` - Date questions
- `ComboboxQuestionBuilder` - Autocomplete/dropdown
- `BooleanQuestionBuilder` - Yes/no questions

All support: `.title()`, `.description()`, `.visibleWhen()`

## Validators

### SchemaValidator

Validate survey schemas against JSON Schema.

```typescript
new SchemaValidator(options?: { schemaVersion?: string })
```

**Methods:**

#### validate

```typescript
validate(schema: unknown): ValidationResult
```

Validate a schema and return detailed results.

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean
  errors?: Array<{
    keyword: string
    message: string
    instancePath: string
    schemaPath: string
  }>
}
```

**Example:**
```typescript
const validator = new SchemaValidator()
const result = validator.validate(mySchema)

if (!result.valid) {
  console.error('Validation errors:', result.errors)
}
```

#### validateOrThrow

```typescript
validateOrThrow(schema: unknown): void
```

Validate and throw if invalid.

**Example:**
```typescript
try {
  validator.validateOrThrow(mySchema)
  console.log('Schema is valid!')
}
catch (error) {
  console.error(error.message)
}
```

#### validateFile

```typescript
async validateFile(filePath: string): Promise<ValidationResult>
```

Validate a schema from a JSON file.

#### validateJson

```typescript
validateJson(jsonString: string): ValidationResult
```

Validate a JSON string.

#### getErrorSummary

```typescript
getErrorSummary(result: ValidationResult): string
```

Get a human-readable error summary.

### AnswerValidator

Validate survey answers.

```typescript
new AnswerValidator()
```

**Methods:**

#### validateAnswer

```typescript
validateAnswer(
  question: SurveyQuestionData,
  answer: SurveyAnswerValue
): AnswerValidationResult
```

Validate a single answer against question constraints.

**Returns:**
```typescript
interface AnswerValidationResult {
  valid: boolean
  errors: string[]
}
```

**Example:**
```typescript
const validator = new AnswerValidator()
const result = validator.validateAnswer(
  { id: 'age', type: 'number', title: 'Age', min: 0, max: 120 },
  150
)

if (!result.valid) {
  console.log(result.errors) // ['Value must be at most 120']
}
```

## Core Logic

### ConditionEvaluator

Evaluate conditional expressions for question visibility.

```typescript
new ConditionEvaluator(options?: {
  strict?: boolean
  customOperators?: Record<string, ConditionOperator>
})
```

**Methods:**

#### evaluate

```typescript
evaluate(condition: string, answers: SurveyAnswers): boolean
```

Evaluate a condition against survey answers.

**Supported Operators:**
- Comparison: `=`, `!=`, `>`, `>=`, `<`, `<=`
- Logical: `&&`, `||`
- Array: `.includes()`, `.excludes()`

**Examples:**
```typescript
const evaluator = new ConditionEvaluator()
const answers = { age: 25, status: 'employed', hobbies: ['sports', 'reading'] }

evaluator.evaluate('age>=18', answers) // true
evaluator.evaluate('status=student', answers) // false
evaluator.evaluate('age>=18&&status=employed', answers) // true
evaluator.evaluate('hobbies.includes(sports)', answers) // true
evaluator.evaluate('hobbies.excludes(music,gaming)', answers) // true
```

**Custom Operators:**
```typescript
const evaluator = new ConditionEvaluator({
  customOperators: {
    '~=': {
      evaluate: (left, right) =>
        String(left).toLowerCase() === String(right).toLowerCase()
    }
  }
})

evaluator.evaluate('name~=JOHN', { name: 'John' }) // true
```

### SchemaNormalizer

Convert between flat and deep schema formats.

```typescript
new SchemaNormalizer()
```

**Methods:**

#### normalize

```typescript
normalize(schema: SurveySchema): PublicodesSurveySchema | OpenFiscaSurveySchema
```

Convert a schema to deep format (steps with pages).

#### denormalize

```typescript
denormalize(schema: SurveySchema): PublicodesSurveySchema | OpenFiscaSurveySchema
```

Convert a schema to flat format (steps with direct questions).

**Example:**
```typescript
const normalizer = new SchemaNormalizer()

// Convert to deep format
const deepSchema = normalizer.normalize(flatSchema)

// Convert back to flat format
const flatSchema = normalizer.denormalize(deepSchema)
```

## Types

### Main Schema Types

- `SurveySchema` - Union of all schema types
- `PublicodesSurveySchema` - Publicodes-specific schema
- `OpenFiscaSurveySchema` - OpenFisca-specific schema
- `SurveyStepUnion` - Union of flat and deep step formats
- `SurveyFlatStep` - Step with direct questions
- `SurveyDeepStep` - Step with pages

### Question Types

- `SurveyQuestionData` - Union of all question types
- `SurveyQuestionRadio` - Single choice
- `SurveyQuestionCheckbox` - Multiple choice
- `SurveyQuestionNumber` - Numeric input
- `SurveyQuestionDate` - Date input
- `SurveyQuestionCombobox` - Autocomplete
- `SurveyQuestionBoolean` - Yes/no

### Answer Types

- `SurveyAnswers` - Map of question ID to answer value
- `SurveyAnswerValue` - Union of all possible answer values

### Type Guards

```typescript
isRadioQuestion(question: SurveyQuestionData): question is SurveyQuestionRadio
isCheckboxQuestion(question: SurveyQuestionData): question is SurveyQuestionCheckbox
isNumberQuestion(question: SurveyQuestionData): question is SurveyQuestionNumber
isDateQuestion(question: SurveyQuestionData): question is SurveyQuestionDate
isComboboxQuestion(question: SurveyQuestionData): question is SurveyQuestionCombobox
isBooleanQuestion(question: SurveyQuestionData): question is SurveyQuestionBoolean

isOpenFiscaSchema(schema: SurveySchema): schema is OpenFiscaSurveySchema
isPublicodesSchema(schema: SurveySchema): schema is PublicodesSurveySchema

isFlatStep(step: SurveyStepUnion): step is SurveyFlatStep
isDeepStep(step: SurveyStepUnion): step is SurveyDeepStep
```

## Utilities

### Version Comparison

```typescript
import { compareVersions } from '@betagouv/survey-schema'

compareVersions('2.0.0', '1.9.0') // 1 (greater)
compareVersions('1.0.0', '1.0.0') // 0 (equal)
compareVersions('1.0.0', '2.0.0') // -1 (less)
```

## Error Handling

All builders validate inputs and throw descriptive errors:

```typescript
try {
  const schema = new SurveySchemaBuilder('test', 'publicodes')
    .version('1.0.0')
    .title('Test')
    // Missing dispositifs
    .build()
}
catch (error) {
  console.error(error.message) // 'Publicodes schema must have dispositifs array'
}
```

Validators return structured error objects:

```typescript
const result = validator.validate(invalidSchema)
if (!result.valid) {
  result.errors.forEach((error) => {
    console.log(`${error.instancePath}: ${error.message}`)
  })
}
```

## Best Practices

1. **Always validate schemas** before using them
2. **Use builders** for type safety when creating schemas programmatically
3. **Use type guards** when working with union types
4. **Enable strict mode** in ConditionEvaluator during development
5. **Version your schemas** using semver
6. **Document custom operators** if you use them

## See Also

- [README](./README.md) - Package overview
- [CHANGELOG](./CHANGELOG.md) - Version history
- [Examples](./examples/) - Usage examples
- [Builder Examples](./examples/builders/) - Builder pattern examples
