# Survey Schema Package Examples

This directory contains example schemas demonstrating various features of the `@betagouv/survey-schema` package.

## Examples

### Basic Survey
A simple survey with basic question types and conditional logic.

```json
{
  "id": "basic-example",
  "version": "1.0.0",
  "title": "Basic Survey Example",
  "description": "A simple survey to demonstrate basic features",
  "engine": "publicodes",
  "forceRefresh": false,
  "dispositifs": [],
  "steps": [
    {
      "id": "profile",
      "title": "Your Profile",
      "pages": [
        {
          "id": "basic-info",
          "questions": [
            {
              "id": "age",
              "title": "What is your age?",
              "type": "number",
              "min": 0,
              "max": 120,
              "required": true
            },
            {
              "id": "status",
              "title": "Employment status",
              "type": "radio",
              "choices": [
                { "id": "student", "title": "Student" },
                { "id": "employed", "title": "Employed" },
                { "id": "unemployed", "title": "Unemployed" }
              ]
            },
            {
              "id": "student-id",
              "title": "Student ID",
              "type": "combobox",
              "visibleWhen": "status=student",
              "required": false
            }
          ]
        }
      ]
    }
  ]
}
```

## Running Examples

You can use these examples with the survey-schema package:

```typescript
import { SchemaNormalizer, ConditionEvaluator, AnswerValidator } from '@betagouv/survey-schema'
import basicSchema from './basic-survey.json'

// Normalize the schema
const normalizer = new SchemaNormalizer()
const normalized = normalizer.normalize(basicSchema)

// Evaluate conditions
const evaluator = new ConditionEvaluator()
const answers = { status: 'student' }
const isVisible = evaluator.evaluate('status=student', answers)

// Validate answers
const validator = new AnswerValidator()
const question = normalized.steps[0].pages[0].questions[0]
const result = validator.validateAnswer(question, 25)
```
