# Publicodes - Aides fiscales à l'innovation pour les entreprises

Modèle publicodes des aides à l'innovation pour les entreprises.

## Installation

```sh
npm install publicodes-entreprise-innovation publicodes
```

## Usage

```typescript
import rules from 'publicodes-entreprise-innovation'
import { Engine } from 'publicodes'

const engine = new Engine(rules, {
  // Important : this package must be used with the flag "automaticNamespaceDisabling" set to false
  flags: {
    automaticNamespaceDisabling: false,
  },
})
```

## Development

```sh
// Install the dependencies
npm install

// Compile the Publicodes rules
npm run compile

// Run the tests
npm run test

// Run the documentation server
npm run doc
```
