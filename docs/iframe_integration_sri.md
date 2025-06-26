# Sécurité SRI pour l'intégration iframe

## Qu'est-ce que SRI (Subresource Integrity) ?

SRI (Subresource Integrity) est un mécanisme de sécurité qui permet aux navigateurs de vérifier que les ressources qu'ils récupèrent (comme les scripts JavaScript) n'ont pas été altérées. Cela protège contre les attaques où un script externe pourrait être compromis.

## Comment ça fonctionne

Quand vous intégrez notre script iframe avec SRI :

```html
<script
  src="https://votre-domaine.fr/iframe-integration.js"
  data-simulateur="demenagement-logement"
  integrity="sha384-pWsCxETqtG8zVICx8IOmSGr/KVRL55v3OGmLHPe6M9SaaJTwHgBqkLyqL3JF0lg2"
  crossorigin="anonymous"
  defer>
</script>
```

Le navigateur :
1. Télécharge le script
2. Calcule son hash SHA-384
3. Compare avec le hash fourni dans l'attribut `integrity`
4. Exécute le script seulement si les hashs correspondent

## Workflow de développement

Les git hooks sont configurés automatiquement avec Husky lors de l'installation :
```bash
pnpm install  # Installe les dépendances et configure Husky
```

### 1. Modifier le code source
   Éditez `src/assets/iframe-integration.js` avec vos modifications.

### 2 Choisir la version
   Modifiez `IFRAME_SCRIPT_LATEST_VERSION` dans `config/iframe_integration.ts` :
   ```typescript
   export const IFRAME_SCRIPT_LATEST_VERSION = '2.0.0' // Votre nouvelle version
   ```

3. **Commit automatique**
   ```bash
   git add src/assets/iframe-integration.js
   git commit -m "feat: amélioration du script iframe"
   ```

   Le pre-commit hook va automatiquement :
   - ✅ Détecter les changements dans les fichiers iframe
   - 🔨 Lancer `pnpm build:iframe-integration`
   - 📦 Générer le fichier JavaScript avec la version appropriée
   - 🔐 Calculer et mettre à jour le hash SRI
   - 📁 Ajouter automatiquement les fichiers générés au commit
   - ❌ Échouer si des fichiers iframe ne sont pas synchronisés

### ⚙️ Fonctionnement du pre-commit hook (Husky)

Le hook vérifie automatiquement :
- `src/assets/iframe-integration.js` (source)
- `config/iframe_integration.ts` (configuration)
- `vite.iframe-integration.config.ts` (configuration de build)
- `public/assets/iframe-integration@*.js` (fichiers générés)

Si un de ces fichiers est dans le commit, le hook :
1. Lance le build iframe
2. Stage automatiquement les fichiers générés/modifiés
3. Vérifie qu'il n'y a pas de changements non-stagés restants
4. Échoue si la synchronisation n'est pas parfaite

## Scripts disponibles

- `pnpm build:iframe-integration` : Build du script iframe
- `scripts/generate-sri-hash.js` : Génère le hash SRI pour une version spécifique

## Gestion des versions et builds

### Structure de versioning

Toutes les versions sont conservées dans `public/assets/` :
- `iframe-integration@1.0.1.js`
- `iframe-integration@1.0.2.js`
- `iframe-integration@1.0.3.js`
- etc.

### Configuration centralisée

La configuration se trouve dans `config/iframe_integration.ts` :

```typescript
export const IFRAME_SCRIPT_LATEST_VERSION = '1.0.2'

export const IFRAME_SCRIPT_INTEGRITY_LIST = [
  {
    version: '1.0.1',
    integrity: 'sha384-pWsCxETqtG8zVICx8IOmSGr/KVRL55v3OGmLHPe6M9SaaJTwHgBqkLyqL3JF0lg2'
  },
  {
    version: '1.0.2',
    integrity: 'sha384-newHashForVersion1.0.2...'
  }
]
```

### Remplacement vs nouvelles versions

- **Nouvelle version** : Ajoute une nouvelle entrée dans la liste
- **Version existante** : Remplace le fichier et met à jour le hash SRI
- **Compatibilité** : Toutes les versions restent disponibles

### Protection contre les erreurs

Le système inclut des protections automatiques :

#### ✅ Pre-commit hook
- Détecte automatiquement les changements iframe
- Lance le build automatiquement
- Stage les fichiers générés
- Empêche les commits partiels/incohérents

#### ⚠️ Protection contre modifications accidentelles
Si vous modifiez le script mais gardez la même version, le build peut détecter l'incohérence.

### Débogage

Si le pre-commit hook échoue :

1. **Vérifiez les fichiers non-stagés** :
   ```bash
   git status
   ```

2. **Lancez le build manuellement** :
   ```bash
   pnpm build:iframe-integration
   ```

3. **Stagez les fichiers générés** :
   ```bash
   git add config/iframe_integration.ts public/assets/iframe-integration@*.js
   ```

4. **Relancez le commit** :
   ```bash
   git commit
   ```

Si la vérification CI échoue :
- Un build local doit être effectué et committé
- Le repo n'est pas synchronisé avec les sources

## Compatibilité navigateurs

SRI est supporté par tous les navigateurs modernes :
- Chrome 45+
- Firefox 43+
- Safari 11.1+
- Edge 17+

Pour les navigateurs plus anciens, l'attribut `integrity` est simplement ignoré et le script fonctionne normalement.
