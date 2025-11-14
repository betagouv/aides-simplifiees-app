# Migration vers shared-test-cases en tant que git submodule

## Contexte

Le dossier `shared-test-cases/` a été extrait dans un dépôt Git séparé pour permettre le partage entre :
- Le dépôt Node.js/TypeScript (aides-simplifiees-app)
- Le dépôt Python (OpenFisca France)

## Dépôt créé

- **Nom** : `aides-simplifiees-shared-test-cases`
- **Localisation** : `/Users/lucaspoulain/Projects/aides-simplifiees-shared-test-cases`
- **GitHub** : À publier sur `https://github.com/betagouv/aides-simplifiees-shared-test-cases`

## Étapes de migration

### 1. Publier le dépôt sur GitHub

```bash
cd /Users/lucaspoulain/Projects/aides-simplifiees-shared-test-cases

# Créer le dépôt sur GitHub (via interface web ou gh CLI)
gh repo create betagouv/aides-simplifiees-shared-test-cases --public --source=. --remote=origin

# Pousser le code
git push -u origin main
```

### 2. Remplacer le dossier local par un git submodule

```bash
cd /Users/lucaspoulain/Projects/aides-simplifiees-app

# Sauvegarder le dossier actuel (au cas où)
mv shared-test-cases shared-test-cases.backup

# Ajouter comme git submodule
git submodule add https://github.com/betagouv/aides-simplifiees-shared-test-cases.git shared-test-cases
git submodule update --init --recursive

# Vérifier que tout fonctionne
pnpm typecheck
pnpm test tests/unit/shared-test-cases/

# Si OK, supprimer la sauvegarde
rm -rf shared-test-cases.backup

# Commiter le submodule
git add .gitmodules shared-test-cases
git commit -m "chore: migrate shared-test-cases to git submodule

- Extract shared-test-cases to separate repository
- Add as git submodule for sharing with Python repository
- Enables cross-repository test validation"
```

### 3. Mettre à jour les imports (si nécessaire)

Les imports existants devraient continuer à fonctionner :

```typescript
// Ces imports restent valides
import testCases from '../shared-test-cases/demenagement-logement/test-cases.json'
import { toApplicationSlug } from '../shared-test-cases/utils/format_conversion.js'
```

### 4. Utilisation pour les autres développeurs

Quand un développeur clone le dépôt :

```bash
git clone https://github.com/betagouv/aides-simplifiees-app.git
cd aides-simplifiees-app

# Initialiser les submodules
git submodule update --init --recursive
```

Ou en une seule commande :

```bash
git clone --recursive https://github.com/betagouv/aides-simplifiees-app.git
```

### 5. Mettre à jour le submodule

Pour récupérer les dernières modifications du dépôt shared-test-cases :

```bash
# Dans le dépôt principal
cd /Users/lucaspoulain/Projects/aides-simplifiees-app

# Mettre à jour le submodule
git submodule update --remote shared-test-cases

# Commiter la nouvelle version
git add shared-test-cases
git commit -m "chore: update shared-test-cases to latest version"
```

## Avantages

### Pour le dépôt Node.js
- Synchronisation automatique avec les test cases validés
- Versioning clair des test cases utilisés
- Possibilité de figer une version spécifique

### Pour le dépôt Python
- Accès au même format de test
- Validation croisée des calculs OpenFisca
- Source de vérité unique

### Pour l'équipe
- Un seul endroit pour maintenir les test cases
- Validation experte centralisée
- Traçabilité des changements
- CI/CD dans les deux dépôts

## Documentation

- **README du dépôt** : `shared-test-cases/README_REPO.md`
- **Documentation du format** : `shared-test-cases/README.md`
- **Schéma JSON** : `shared-test-cases/schema.json`

## Prochaines étapes

1. [ ] Créer le dépôt GitHub `betagouv/aides-simplifiees-shared-test-cases`
2. [ ] Publier le code initial
3. [ ] Migrer aides-simplifiees-app pour utiliser le submodule
4. [ ] Coordonner avec l'équipe Python OpenFisca
5. [ ] Ajouter validation CI/CD dans les deux dépôts
6. [ ] Documenter le processus de contribution
