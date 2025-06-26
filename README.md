# Interface graphique du simulateur aides-simplifiées

[Aides Simplifiées](https://aides.beta.numerique.gouv.fr/) est une plateforme permettant de simuler son éligibilité à plusieurs aides financières. Ce projet repose sur AdonisJS, Inertia.js, Vue.js et le système de design de l'État français (DSFR).

## Pré-requis

Pour exécuter ce projet, vous aurez besoin des éléments suivants :

- [Node.js](https://nodejs.org/fr) (obligatoire) version 20 ou supérieure ;
- [PostgreSQL](https://www.postgresql.org/) (obligatoire) pour la base de données.
- [NVM](https://github.com/nvm-sh/nvm) (recommandé) pour la gestion des versions de Node.js ;
- [PNPM](https://pnpm.io/fr/) (recommandé) pour la gestion des paquets.

## Structure du projet

- **Backend** : [AdonisJS](https://docs.adonisjs.com/) est utilisé pour gérer les API, la logique métier et les interactions avec la base de données.
- **Frontend** : [Vue.js](https://vuejs.org/) avec [Inertia.js](https://inertiajs.com/).
- **Design** : Intégration du [système de design de l'État français](https://www.systeme-de-design.gouv.fr/) avec le portage en vue de la bibliothèque [VueDsfr](https://vue-ds.fr/).

### Répertoires principaux

- `app/` : Contient les modèles, contrôleurs et services.
- `inertia/` : Composants Vue.js et pages Inertia.
- `tests/browser/` : Tests E2E avec Playwright, incluant les tests d'accessibilité.
- `database/` : Seeders et migrations pour la base de données.
- `config/` : Fichiers de configuration pour AdonisJS.

## Installation

### 1. Cloner le dépôt
```bash
git clone <url-du-repo>
cd aides-simplifiees-adonis
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 2.1 [Recommandation] Extensions VSCode
Installez les extensions de VSCode listées dans `.vscode/extensions.json` pour une meilleure expérience de développement.

### 2.2 [Recommandation] Réglages de VSCode
Utilisez les réglages de VSCode listés dans `.vscode/settings.example.json` pour configurer votre éditeur.
```bash
cp .vscode/settings.example.json .vscode/settings.json
```

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

### 4. Générer la clé d'application
```bash
node ace generate:key
```

### 5. Peupler la base de données

Assurez vous d'avoir PostgreSQL en cours d'exécution et créez une base de données. Ensuite, exécutez les migrations et les seeders :

```bash
node ace migration:fresh --seed
```

## Commandes disponibles

### Développement

Lancer le serveur en mode développement :
```bash
pnpm dev
```

### Build de production

Générer le build de production :
```bash
pnpm build
```

Servir le build de production :
```bash
pnpm start
```

### Tests

Lancer tous les tests :
```bash
pnpm test
```

### Tests d'accessibilité

Tests spécifiques aux parcours critiques d'accessibilité (RGAA 4.1) :
```bash
pnpm test:a11y:critical
```

Tous les tests d'accessibilité :
```bash
pnpm test:accessibility
# ou
pnpm test:a11y
```

Consulter les rapports d'accessibilité :
```bash
pnpm a11y:report
```

> 📊 Les tests d'accessibilité génèrent automatiquement des rapports détaillés dans `reports/accessibility/` et sont intégrés à la CI/CD pour valider la conformité RGAA sur chaque pull request.

### Lint et formatage

Linting du code :
```bash
pnpm lint
```

Formatage du code :
```bash
pnpm format
```

Vérification des types :
```bash
pnpm typecheck
```

### Scripts additionnels

Générer les icônes pour le projet ([voici pourquoi](https://vue-ds.fr/guide/icones#eviter-les-appels-reseaux-optionnel-pour-les-applications-internes)):
```bash
pnpm build:icons
```

Générer le script de redimensionnement d'iframe (versionné dans `config/iframe-integration.js`):
```bash
pnpm build:iframe-integration
```

Générer les fichiers publicodes :
```bash
pnpm build:publicodes
```

## Accessibilité

Ce projet respecte les standards d'accessibilité RGAA 4.1. Les tests d'accessibilité automatisés couvrent :

- ✅ **RGAA 1.1** : Images avec attribut `alt` approprié
- ✅ **RGAA 3.2** : Contraste des couleurs suffisant (≥ 4.5:1)
- ✅ **RGAA 8.9** : Étiquetage des champs de formulaire
- ✅ **RGAA 9.1** : Titres de page informatifs
- ✅ **RGAA 10.4** : Gestion du focus et visibilité
- ✅ **RGAA 11.1-11.13** : Formulaires accessibles
- ✅ **RGAA 12.6** : Landmarks et régions

Pour plus de détails, consultez le [guide des tests d'accessibilité](accessibility_tests.md).

## Contribution

Les contributions sont les bienvenues. Veuillez soumettre une pull request ou ouvrir une issue pour toute suggestion ou amélioration.

## Licence

Ce projet est sous licence AGPL-3.0. Veuillez consulter le fichier [LICENSE](LICENSE) pour plus de détails.
