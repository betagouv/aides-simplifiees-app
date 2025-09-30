# aom-rennes

Modèle de tarification de l'AOM de Bordeaux

## Installation

```sh
npm install aom-rennes publicodes
```

## Usage

```typescript
import { Engine } from 'publicodes'
import rules from 'aom-rennes'

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



// Run the documentation server
npm run doc
```
