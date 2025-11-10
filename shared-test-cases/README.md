# Format JSON commun pour les cas de test

## Vue d'ensemble

Ce dossier contient les **cas de test partagés** entre le dépôt Node.js (cette application) et le dépôt Python OpenFisca. Le format JSON commun permet de :

1. **Source de vérité unique** : Un seul endroit pour définir les cas de test
2. **Tests de non-régression** : Exécutés dans la CI/CD des deux dépôts
3. **Alimentation des personas** : Les personas de l'interface admin sont dérivés de ces test cases
4. **Traçabilité temporelle** : Chaque test case est lié à une période législative (`period`)

## Structure

```
shared-test-cases/
├── schema.json                          # JSON Schema pour validation
├── README.md                            # Ce fichier
├── demenagement-logement/
│   ├── test-cases.json                  # Cas de test pour ce simulateur
│   └── snapshots/
│       ├── 2025-01/                     # Snapshots par période
│       │   ├── france-158.0.0.json      # Par version OpenFisca
│       │   └── france-159.0.0.json
│       └── 2024-12/
│           └── france-157.0.0.json
└── entreprise-innovation/
    └── test-cases.json
```

## Format d'un test case

Un test case contient **3 parties principales** :

### 1. Survey Answers (Réponses au questionnaire)

Format utilisé par l'application Node.js pour les formulaires :

```json
{
  "survey_answers": {
    "statut-professionnel": "etudiant",
    "date-naissance": "2007-02-15",
    "boursier": true,
    ...
  }
}
```

### 2. OpenFisca Request (Requête OpenFisca)

Format de requête vers l'API OpenFisca (généré par `buildCalculationRequest()`) :

```json
{
  "openfisca_request": {
    "individus": {
      "usager": {
        "activite": {"2025-01": "etudiant"},
        "date_naissance": {"ETERNITY": "2007-02-15"}
      }
    },
    "menages": {...},
    "foyers_fiscaux": {...},
    "familles": {...}
  }
}
```

**Point clé** : Le champ `period` du test case doit être appliqué à toutes les variables temporelles dans la requête.

### 3. OpenFisca Response (Réponse attendue)

Réponse attendue de l'API OpenFisca :

```json
{
  "openfisca_response": {
    "individus": {
      "usager": {
        "aide_mobili_jeune": { "2025-01": 100 }
      }
    },
    "menages": {
      "menage_usager": {
        "apl": { "2025-01": 250 }
      }
    }
  }
}
```

### 4. Expected Results (Résultats attendus)

Format simplifié pour l'affichage à l'utilisateur :

```json
{
  "expected_results": {
    "eligible": true,
    "total_amount": 350,
    "aids": [
      {
        "name": "aide_mobili_jeune",
        "amount": 100,
        "period": "2025-01",
        "unit": "euros"
      }
    ]
  }
}
```

## Métadonnées et validation

Chaque test case contient des métadonnées pour la traçabilité :

```json
{
  "metadata": {
    "created_by": "Expert Métier",
    "created_date": "2025-01-15",
    "validated_by": "Responsable Réglementation",
    "validation_date": "2025-01-20",
    "real_case_source": "dossier_ref_123",
    "tags": ["etudiant", "mobilite", "boursier"],
    "notes": "Cas particulier pour..."
  }
}
```

## Utilisation dans le dépôt Node.js

### Chargement des test cases

```typescript
import testCases from '@/shared-test-cases/demenagement-logement/test-cases.json'

// Accès à un test case
const testCase = testCases.test_cases[0]
console.log(testCase.name) // "Étudiant boursier en mobilité Parcoursup"
console.log(testCase.period) // "2025-01"
```

### Construction de la requête OpenFisca avec period

```typescript
import { buildCalculationRequest } from '~/services/openfisca/build_calculation_request'

// Le period doit être passé à buildCalculationRequest
const request = buildCalculationRequest(
  testCase.survey_answers,
  ['aide_mobili_jeune', 'apl'],
  testCase.period // <- Period appliqué ici
)
```

### Validation d'un test case

```bash
# Valider le schéma JSON
pnpm test-cases:validate

# Exécuter un test case contre OpenFisca réel
pnpm test-cases:run --case dem-log-001

# Créer/mettre à jour les snapshots
pnpm test-cases:snapshot --period 2025-01
```

## Utilisation dans le dépôt Python

Le dépôt Python OpenFisca utilise le même format pour :

1. **Tests unitaires** : Valider que les calculs sont corrects pour une période donnée
2. **Tests de non-régression** : Comparer les résultats avec les snapshots
3. **CI/CD** : Exécuter automatiquement tous les test cases

```python
# Exemple d'utilisation en Python
import json

with open('shared-test-cases/demenagement-logement/test-cases.json') as f:
    test_cases = json.load(f)

for test_case in test_cases['test_cases']:
    # Exécuter le test case
    result = openfisca_api.calculate(
        test_case['openfisca_request'],
        period=test_case['period']
    )

    # Comparer avec la réponse attendue
    assert result == test_case['openfisca_response']
```

## Synchronisation avec les Personas

Les personas de l'interface admin sont **dérivés** des test cases :

- Un test case peut devenir un persona pour l'interface utilisateur
- Les modifications d'un persona peuvent mettre à jour le test case correspondant
- La synchronisation est bidirectionnelle

```bash
# Synchronisation
pnpm sync:personas-from-test-cases
pnpm sync:test-cases-from-personas
```

## Gestion des versions OpenFisca

### Snapshots par version

Les snapshots sont organisés par période et version d'OpenFisca :

```
snapshots/
└── 2025-01/
    ├── france-158.0.0.json  # Résultats avec version 158
    └── france-159.0.0.json  # Résultats avec version 159
```

Cela permet de :
- Détecter les breaking changes lors d'une mise à jour OpenFisca
- Documenter l'évolution des calculs dans le temps
- Valider que les changements sont attendus

### Mise à jour lors d'un changement de version

Quand OpenFisca est mis à jour :

1. Exécuter les test cases avec la nouvelle version
2. Comparer avec les snapshots de l'ancienne version
3. Documenter les différences (attendues ou bugs)
4. Créer de nouveaux snapshots si les changements sont validés

```bash
# Mettre à jour les snapshots pour une nouvelle version
pnpm test-cases:snapshot --version france-159.0.0 --period 2025-01
```

## Gestion des périodes législatives

### Format de period

Le champ `period` utilise le format **YYYY-MM** (année-mois) :

```json
{
  "period": "2025-01"
}
```

Ce format correspond aux périodes OpenFisca et permet de :
- Tester avec une législation spécifique
- Gérer les changements réglementaires dans le temps
- Archiver les anciens test cases quand la législation change

### Période obsolète

Un test case est considéré obsolète si :
- `period` > 12 mois dans le passé
- La version d'OpenFisca n'est plus supportée

L'interface admin affiche un **warning** pour les test cases obsolètes.

## Bonnes pratiques

### Création d'un test case

1. **Partir d'un cas réel** : Utiliser `real_case_source` pour référencer le dossier
2. **Valider avec un expert** : Renseigner `validated_by` et `validation_date`
3. **Tagger correctement** : Utiliser des tags pertinents pour faciliter la recherche
4. **Documenter le contexte** : Ajouter des notes explicatives si nécessaire
5. **Tester contre OpenFisca réel** : Vérifier que la réponse est correcte

### Maintenance des test cases

1. **Revue trimestrielle** : Vérifier que les test cases sont toujours pertinents
2. **Mise à jour législative** : Créer de nouveaux test cases pour les nouvelles périodes
3. **Archivage** : Déplacer les test cases obsolètes vers un dossier `archive/`
4. **Documentation des changements** : Maintenir un CHANGELOG.md par simulateur

## Scripts disponibles

### Validation

```bash
# Valider tous les test cases contre le schéma JSON
pnpm test-cases:validate

# Valider un simulateur spécifique
pnpm test-cases:validate --simulateur demenagement-logement
```

### Exécution

```bash
# Exécuter tous les test cases
pnpm test-cases:run

# Exécuter un test case spécifique
pnpm test-cases:run --case dem-log-001

# Exécuter tous les test cases d'un simulateur
pnpm test-cases:run --simulateur demenagement-logement
```

### Snapshots

```bash
# Créer/mettre à jour tous les snapshots
pnpm test-cases:snapshot

# Snapshots pour une période spécifique
pnpm test-cases:snapshot --period 2025-01

# Snapshots pour une version OpenFisca spécifique
pnpm test-cases:snapshot --version france-159.0.0
```

### Comparaison

```bash
# Comparer les résultats actuels avec les snapshots
pnpm test-cases:compare

# Comparer deux versions d'OpenFisca
pnpm test-cases:compare --from france-158.0.0 --to france-159.0.0
```

### Synchronisation

```bash
# Importer les test cases vers les personas admin
pnpm sync:personas-from-test-cases

# Exporter les personas admin vers les test cases
pnpm sync:test-cases-from-personas
```

## Intégration CI/CD

### GitHub Actions

Les test cases sont exécutés automatiquement dans la CI/CD :

```yaml
# .github/workflows/test-cases.yml
name: Test Cases Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate schema
        run: pnpm test-cases:validate

      - name: Run test cases
        run: pnpm test-cases:run

      - name: Compare with snapshots
        run: pnpm test-cases:compare
```

### Alertes

Si une régression est détectée :
- Le build échoue
- Une notification est envoyée à l'équipe
- Le détail des différences est affiché dans les logs

## Coordination avec le dépôt Python

### Processus de synchronisation

1. **Modifications du format** : Doivent être discutées avec l'équipe Python
2. **Nouveaux test cases** : Peuvent être ajoutés indépendamment dans chaque dépôt
3. **Validation croisée** : Les test cases doivent passer dans les 2 dépôts
4. **RFC pour changements majeurs** : Utiliser le système RFC pour les évolutions du format

### Points de contact

- **Format JSON** : Discussion sur GitHub (issues/PR)
- **Validation experte** : Ateliers trimestriels communs
- **Bugs détectés** : Issue tracking partagé

## Support et questions

Pour toute question sur le format ou l'utilisation des test cases :

1. Consulter ce README
2. Consulter le schéma JSON (`schema.json`)
3. Voir les exemples dans `demenagement-logement/test-cases.json`
4. Créer une issue sur GitHub si nécessaire

## Changelog

### Version 1.0.0 (2025-01-10)

- Format initial
- Schéma JSON complet
- Scripts de validation et exécution
- Intégration avec personas admin
- Documentation complète
