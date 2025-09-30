# Publicodes AOM Bordeaux

Modèle publicodes de tarification de l'Autorité Organisatrice de la Mobilité (AOM) de Bordeaux Métropole.

## Installation

```bash
npm install @betagouv/publicodes-aom-bordeaux publicodes
```

## Usage

```typescript
import Engine from 'publicodes'
import rules from '@betagouv/publicodes-aom-bordeaux'

const engine = new Engine(rules)

// Calcul d'un tarif
const result = engine
  .setSituation({
    'âge': 25,
    'type . abonnement': 'mensuel'
  })
  .evaluate('résultat')

console.log(result.nodeValue) // Prix en euros

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
