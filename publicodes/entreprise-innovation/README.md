# entreprise-innovation

Modèle publicodes des aides à l'innovation pour les entreprises

## Installation

```sh
npm install entreprise-innovation publicodes
```

## Usage

```typescript
import { Engine } from 'publicodes'
import rules from 'entreprise-innovation'

const engine = new Engine(rules)

console.log(engine.evaluate('salaire net').nodeValue)
// 1957.5

engine.setSituation({ 'salaire brut': 4000 })
console.log(engine.evaluate('salaire net').nodeValue)
// 3120
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
