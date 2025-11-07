# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-07

### Added
- Initial release of `@betagouv/survey-schema`
- Framework-agnostic core library
- TypeScript type definitions
- JSON Schema validation (v2.0.0)
- ConditionEvaluator for conditional logic
- AnswerValidator for answer validation
- SchemaNormalizer for schema transformation
- SurveySchemaBuilder with fluent API
- Schema versioning and migration system
- Comprehensive test suite
- Complete documentation and examples

### Features
- Support for OpenFisca and Publicodes engines
- Multiple question types (radio, checkbox, number, date, combobox, boolean)
- Conditional question visibility
- Built-in validation rules
- Schema migration tools
- CLI tool for schema management

### Breaking Changes
- New package structure (extracted from main application)
- Schema format version 2.0.0 with improved structure
- Framework-agnostic API (no Vue/Inertia dependencies in core)

## [Unreleased]

### Planned
- React adapter package
- Svelte adapter package
- Visual schema editor
- Additional question types
- Enhanced validation rules
- Performance optimizations
