# @betagouv/survey-schema

A framework-agnostic library for defining and managing survey schemas with conditional logic, validation, and multi-engine support.

## Features

- ✅ **TypeScript-first** with complete type definitions
- ✅ **JSON Schema validation** for compile-time and runtime safety
- ✅ **Framework-agnostic core** - use with any frontend framework
- ✅ **Conditional question visibility** with powerful expression language
- ✅ **Built-in validation** for answers
- ✅ **Schema versioning and migrations** for long-term maintenance
- ✅ **Multi-engine support** (OpenFisca, Publicodes)
- ✅ **Builder pattern** for programmatic schema creation
- ✅ **CLI tools** for schema management

## Installation

```bash
npm install @betagouv/survey-schema
# or
pnpm add @betagouv/survey-schema
# or
yarn add @betagouv/survey-schema
```

## Quick Start

### Define a Schema

```typescript
import { SurveySchemaBuilder } from '@betagouv/survey-schema'

const schema = new SurveySchemaBuilder('housing-aid')
  .version('1.0.0')
  .title('Housing Aid Calculator')
  .description('Calculate your eligibility for housing assistance')
  .engine('publicodes')
  .addStep(step => step
    .id('profile')
    .title('Your Profile')
    .addPage(page => page
      .id('basic-info')
      .addQuestion(q => q
        .id('age')
        .title('What is your age?')
        .type('number')
        .min(0)
        .max(120)
        .required(true)
      )
      .addQuestion(q => q
        .id('employment')
        .title('Employment status')
        .type('radio')
        .choices([
          { id: 'employed', title: 'Employed' },
          { id: 'student', title: 'Student' },
          { id: 'unemployed', title: 'Unemployed' }
        ])
      )
    )
  )
  .build()
```

### Validate a Schema

```typescript
import { SchemaValidator } from '@betagouv/survey-schema'

const validator = new SchemaValidator('2.0.0')
const result = validator.validate(schema)

if (!result.valid) {
  console.error('Schema validation failed:', result.errors)
} else {
  console.log('Schema is valid!')
}
```

### Evaluate Conditions

```typescript
import { ConditionEvaluator } from '@betagouv/survey-schema'

const evaluator = new ConditionEvaluator()
const answers = { employment: 'student', age: 22 }

const isVisible = evaluator.evaluate('employment=student', answers)
// true

const isInRange = evaluator.evaluate('age>=18&&age<=25', answers)
// true
```

### Validate Answers

```typescript
import { AnswerValidator } from '@betagouv/survey-schema'

const validator = new AnswerValidator()
const question = {
  id: 'age',
  title: 'Age',
  type: 'number',
  required: true,
  min: 0,
  max: 120
}

const result = validator.validateAnswer(question, 25)
// { valid: true }

const invalidResult = validator.validateAnswer(question, 150)
// { valid: false, errors: [...] }
```

## Core Concepts

### Schema Structure

A survey schema consists of:
- **Metadata**: id, version, title, description
- **Engine**: Calculation engine (openfisca, publicodes)
- **Steps**: High-level sections of the survey
- **Pages**: Individual screens within steps
- **Questions**: Form fields with validation and conditional logic

### Question Types

- `radio`: Single choice from options
- `checkbox`: Multiple choices
- `number`: Numeric input with min/max
- `date`: Date picker
- `combobox`: Autocomplete selection
- `boolean`: Yes/No toggle

### Conditional Logic

Questions can be shown/hidden based on previous answers using the `visibleWhen` property:

```typescript
{
  id: 'student-id',
  title: 'Student ID number',
  type: 'text',
  visibleWhen: 'employment=student'
}
```

Supported operators:
- `=`: Equality
- `!=`: Inequality
- `>`, `>=`, `<`, `<=`: Comparison
- `&&`: Logical AND
- `||`: Logical OR
- `.includes()`: Array contains
- `.excludes()`: Array does not contain

## API Reference

### Classes

- `SurveySchemaBuilder`: Fluent API for building schemas
- `SchemaValidator`: Validates schemas against JSON Schema
- `ConditionEvaluator`: Evaluates conditional expressions
- `AnswerValidator`: Validates user answers
- `SchemaNormalizer`: Converts between schema formats
- `SchemaMigrator`: Migrates schemas between versions

### Types

See [Type Definitions](./src/types/README.md) for complete type documentation.

## Framework Integrations

### Vue.js

```bash
npm install @betagouv/survey-schema-vue
```

See [@betagouv/survey-schema-vue](../survey-schema-vue/README.md) for usage.

### React (Coming Soon)

```bash
npm install @betagouv/survey-schema-react
```

## CLI Tool

Install the CLI globally:

```bash
npm install -g @betagouv/survey-schema-cli
```

Validate a schema:

```bash
survey-schema validate my-schema.json
```

Migrate a schema:

```bash
survey-schema migrate my-schema.json --to 2.0.0
```

Initialize a new schema:

```bash
survey-schema init --interactive
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Survey](./examples/basic-survey.json)
- [OpenFisca Survey](./examples/openfisca-survey.json)
- [Publicodes Survey](./examples/publicodes-survey.json)
- [Conditional Logic](./examples/conditional-logic.json)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © BetaGouv

## Support

- [Documentation](https://github.com/betagouv/aides-simplifiees-app/tree/main/packages/survey-schema)
- [Issues](https://github.com/betagouv/aides-simplifiees-app/issues)
- [Discussions](https://github.com/betagouv/aides-simplifiees-app/discussions)
