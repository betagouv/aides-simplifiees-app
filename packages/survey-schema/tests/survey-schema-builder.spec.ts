/**
 * Tests for SurveySchemaBuilder
 */

import { describe, expect, it } from 'vitest'

import { PageBuilder } from '../src/builders/page-builder.js'
import { BooleanQuestionBuilder } from '../src/builders/question-builder.js'
import { StepBuilder } from '../src/builders/step-builder.js'
import { SurveySchemaBuilder } from '../src/builders/survey-schema-builder.js'

describe('survey schema builder', () => {
  it('should build a valid publicodes schema', () => {
    const question = new BooleanQuestionBuilder('q1').title('Question 1').build()
    const page = new PageBuilder('page1').addQuestion(question).build()
    const step = new StepBuilder('step1').title('Step 1').addPage(page).build()

    const schema = new SurveySchemaBuilder('my-survey', 'publicodes')
      .version('1.0.0')
      .title('My Survey')
      .description('A test survey')
      .dispositifs(['aide-1', 'aide-2'])
      .addStep(step)
      .build()

    expect(schema.id).toBe('my-survey')
    expect(schema.version).toBe('1.0.0')
    expect(schema.title).toBe('My Survey')
    expect(schema.description).toBe('A test survey')
    expect(schema.engine).toBe('publicodes')
    expect(schema.steps).toHaveLength(1)

    if (schema.engine === 'publicodes') {
      expect(schema.dispositifs).toEqual(['aide-1', 'aide-2'])
    }
  })

  it('should build a valid openfisca schema', () => {
    const question = new BooleanQuestionBuilder('q1').title('Question 1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    const schema = new SurveySchemaBuilder('openfisca-survey', 'openfisca')
      .version('1.0.0')
      .title('OpenFisca Survey')
      .questionsToApi(['q1'])
      .addStep(step)
      .build()

    expect(schema.engine).toBe('openfisca')

    if (schema.engine === 'openfisca') {
      expect(schema.questionsToApi).toEqual(['q1'])
    }
  })

  it('should support setting steps array', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step1 = new StepBuilder('step1').title('Step 1').addQuestion(question).build()
    const step2 = new StepBuilder('step2').title('Step 2').addQuestion(question).build()

    const schema = new SurveySchemaBuilder('survey', 'publicodes')
      .version('1.0.0')
      .title('Survey')
      .dispositifs([])
      .steps([step1, step2])
      .build()

    expect(schema.steps).toHaveLength(2)
  })

  it('should support forceRefresh flag', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    const schema = new SurveySchemaBuilder('survey', 'publicodes')
      .version('1.0.0')
      .title('Survey')
      .dispositifs([])
      .forceRefresh(true)
      .addStep(step)
      .build()

    expect(schema.forceRefresh).toBe(true)
  })

  it('should throw if no version', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    expect(() => {
      new SurveySchemaBuilder('survey', 'publicodes')
        .title('Survey')
        .dispositifs([])
        .addStep(step)
        .build()
    }).toThrow('Schema must have a version')
  })

  it('should throw if no title', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    expect(() => {
      new SurveySchemaBuilder('survey', 'publicodes')
        .version('1.0.0')
        .dispositifs([])
        .addStep(step)
        .build()
    }).toThrow('Schema must have a title')
  })

  it('should throw if no steps', () => {
    expect(() => {
      new SurveySchemaBuilder('survey', 'publicodes')
        .version('1.0.0')
        .title('Survey')
        .dispositifs([])
        .build()
    }).toThrow('Schema must have at least one step')
  })

  it('should throw if publicodes schema has no dispositifs', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    expect(() => {
      new SurveySchemaBuilder('survey', 'publicodes')
        .version('1.0.0')
        .title('Survey')
        .addStep(step)
        .build()
    }).toThrow('Publicodes schema must have dispositifs array')
  })

  it('should throw if openfisca schema has no questionsToApi', () => {
    const question = new BooleanQuestionBuilder('q1').title('Q1').build()
    const step = new StepBuilder('step1').title('Step 1').addQuestion(question).build()

    expect(() => {
      new SurveySchemaBuilder('survey', 'openfisca')
        .version('1.0.0')
        .title('Survey')
        .addStep(step)
        .build()
    }).toThrow('OpenFisca schema must have questionsToApi array')
  })
})
