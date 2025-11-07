# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-19

### Added
- **Initial Release**: Standalone `@betagouv/survey-schema` package
- **Type System**: Complete TypeScript definitions with type guards
- **JSON Schema Validation**: v2.0.0 schema with Ajv validator
- **Core Business Logic**:
  - `ConditionEvaluator`: Conditional logic with custom operator support
  - `AnswerValidator`: Type checking and constraint validation
  - `SchemaNormalizer`: Format conversion (flat ↔ deep)
- **Builder Pattern**: Fluent API for all schema components
  - Question builders for all types (radio, checkbox, number, date, combobox, boolean)
  - Page and step builders
  - Complete schema builder
- **Comprehensive Testing**: 106 tests covering all functionality
- **Documentation**: Examples, API docs, and usage guides

### Features
- Framework-agnostic core (zero Vue/Inertia/AdonisJS dependencies)
- Support for OpenFisca and Publicodes engines
- Dual ESM/CJS builds
- Custom operator support for conditions
- Extensive JSDoc documentation
- MIT License

### Breaking Changes
- New package structure (extracted from main application)
- Schema format version 2.0.0
- Framework-agnostic API

## [Unreleased]

### Planned
- React adapter package
- Svelte adapter package
- Visual schema editor
- Additional question types
- Enhanced validation rules
- Performance optimizations
