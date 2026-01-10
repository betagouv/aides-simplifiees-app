# Interface graphique du simulateur aides-simplifiées

[Aides Simplifiées](https://aides.beta.numerique.gouv.fr/) est une plateforme permettant de simuler son éligibilité à plusieurs aides financières. Ce projet repose sur AdonisJS, Inertia.js, Vue.js et le système de design de l'État français (DSFR).

## 📚 Documentation

Nous maintenons une documentation détaillée dans le dossier `docs/`. Voici les points d'entrée principaux :

- **🗺️ [Architecture globale](docs/architecture.md)** : Vue d'ensemble, stack technique et cartographie du projet. **À lire en premier**.
- **🏗️ [Infrastructure](docs/technical/infrastructure.md)** : Déploiement, Docker et environnements.
- **🧪 [Tests & Qualité](docs/technical/testing.md)** : Stratégie de tests (Japa, Vitest, Playwright, RGAA).

### Sections spécifiques
- **Business Features** : [Simulateurs](docs/features/simulateurs.md), [Aides](docs/features/aides.md)
- **Technique** : [Base de données](docs/technical/database.md), [Services](docs/technical/services.md), [Architecture Vue](docs/technical/views.md)
- **Intégrations** : [Publicodes](docs/integrations/publicodes.md), [Démarches Simplifiées](docs/integrations/demarches-simplifiees.md)

## Pré-requis

- [Node.js](https://nodejs.org/fr) (v20+)
- [PNPM](https://pnpm.io/fr/) (gestionnaire de paquets)
- [Docker](https://www.docker.com/) (pour la base de données et les services tiers)

## Installation rapide

1. **Cloner et installer**
   ```bash
   git clone <url-du-repo>
   cd aides-simplifiees-app
   pnpm install
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.template .env
   # configurer les variables dans .env selon vos besoins
   # voir docs/technical/infrastructure.md pour les détails
   ```

3. **Démarrer l'infrastructure**
   ```bash
   make dev
   ```
   *Lance PostgreSQL, OpenFisca et LexImpact via Docker.*

4. **Initialiser la base de données (la première fois seulement)**
   ```bash
   node ace migration:run --force
   node ace db:seed
   ```

5. **Lancer le serveur**
   ```bash
   pnpm dev
   ```
   Accédez à l'application sur [http://localhost:3333](http://localhost:3333).

## Commandes fréquentes

Voir toutes les commandes avec `make help`.

| Action | Commande | Description |
|--------|----------|-------------|
| **Infra** | `make dev` | Lance les conteneurs Docker nécessaires |
| **Dev** | `pnpm dev` | Lance le serveur Adonis + Vite |
| **Tests** | `pnpm test` | Lance tous les tests (Unit, E2E) |
| **Lint** | `pnpm lint` | Vérifie le style du code |
| **Format** | `pnpm format` | Formate le code |
| **DB Shell** | `make db-shell` | Accès SQL direct à la base de données |

## Licence

[AGPL-3.0](LICENSE)
