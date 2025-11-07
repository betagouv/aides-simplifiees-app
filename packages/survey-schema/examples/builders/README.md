# Builder Pattern Examples

This directory demonstrates how to use the builder pattern to create survey schemas programmatically.

## Usage Example

```typescript
import {
  BooleanQuestionBuilder,
  NumberQuestionBuilder,
  PageBuilder,
  RadioQuestionBuilder,
  StepBuilder,
  SurveySchemaBuilder,
} from '@betagouv/survey-schema'

// Build questions using specialized builders
const ageQuestion = new NumberQuestionBuilder('age')
  .title('What is your age?')
  .description('Enter your age in years')
  .min(0)
  .max(120)
  .build()

const statusQuestion = new RadioQuestionBuilder('employment_status')
  .title('What is your employment status?')
  .addChoice('employed', 'Employed')
  .addChoice('unemployed', 'Unemployed')
  .addChoice('student', 'Student')
  .build()

const hasChildrenQuestion = new BooleanQuestionBuilder('has_children')
  .title('Do you have children?')
  .build()

// Build a page
const personalInfoPage = new PageBuilder('personal-info')
  .title('Personal Information')
  .addQuestion(ageQuestion)
  .addQuestion(statusQuestion)
  .addQuestion(hasChildrenQuestion)
  .build()

// Build a step
const step1 = new StepBuilder('step-1')
  .title('About You')
  .description('Tell us about yourself')
  .addPage(personalInfoPage)
  .build()

// Build the complete schema
const schema = new SurveySchemaBuilder('my-survey', 'publicodes')
  .version('1.0.0')
  .title('Social Benefits Survey')
  .description('Check your eligibility for social benefits')
  .dispositifs(['rsa', 'prime-activite'])
  .forceRefresh(false)
  .addStep(step1)
  .build()

console.log(JSON.stringify(schema, null, 2))
```

## Advantages of the Builder Pattern

1. **Type Safety**: Builders enforce required fields at build time
2. **Fluent API**: Chainable methods make code more readable
3. **Validation**: Automatic validation before building
4. **Flexibility**: Easy to create complex nested structures
5. **Discoverability**: IDE autocomplete helps discover available methods

## Question Builders

The package provides specialized builders for each question type:

- `RadioQuestionBuilder` - Single choice questions
- `CheckboxQuestionBuilder` - Multiple choice questions
- `NumberQuestionBuilder` - Numeric input with min/max constraints
- `DateQuestionBuilder` - Date input
- `ComboboxQuestionBuilder` - Autocomplete/dropdown
- `BooleanQuestionBuilder` - Yes/no questions

## Flat vs. Deep Steps

The `StepBuilder` supports both formats:

### Deep Format (with pages)
```typescript
const step = new StepBuilder('step1')
  .title('Step Title')
  .addPage(page1)
  .addPage(page2)
  .build()
```

### Flat Format (direct questions)
```typescript
const step = new StepBuilder('step1')
  .title('Step Title')
  .addQuestion(question1)
  .addQuestion(question2)
  .build()
```

## Validation

All builders validate required fields and constraints:

```typescript
try {
  const invalid = new StepBuilder('step1').build() // Error: Step must have a title
} catch (error) {
  console.error(error.message)
}
```

## See Also

- [basic-schema-builder.ts](./basic-schema-builder.ts) - Complete working example
- [README.md](../README.md) - Main package documentation
