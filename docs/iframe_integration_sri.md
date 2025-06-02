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

### 1. Modifier le code
Éditez `src/assets/iframe-integration.js` avec vos modifications.

### 2. Choisir la version
Modifiez `IFRAME_SCRIPT_LATEST_VERSION` dans `config/iframe_integration.ts` :

```typescript
export const IFRAME_SCRIPT_LATEST_VERSION = '1.0.4' // Votre nouvelle version
```

### 3. Build automatique
Lancez le script de build :

```bash
pnpm build:iframe-integration
```

Ce script :
- Utilise la version définie dans `IFRAME_SCRIPT_LATEST_VERSION`
- Construit le fichier JavaScript avec cette version
- Génère le hash SRI
- Met à jour (ou ajoute) l'entrée dans `IFRAME_SCRIPT_INTEGRITY_LIST`
- Remplace le fichier existant si la version existe déjà

### 4. Commit
Commitez les changements (fichier JS + config).

## Gestion des versions

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

### Remplacement de versions

- **Nouvelle version** : Ajoute une nouvelle entrée dans la liste
- **Version existante** : Remplace le fichier et met à jour le hash SRI
- **Compatibilité** : Toutes les versions restent disponibles

## Scripts disponibles

- `bin/build-iframe-integration.js` : Script principal de build (utilise la version du config)
- `bin/generate-sri-hash.js` : Génère le hash SRI pour une version spécifique
- `bin/update-iframe-version.js` : Met à jour la version dans la config

## Commandes manuelles (si nécessaire)

```bash
# Générer le hash pour une version spécifique
node bin/generate-sri-hash.js 1.0.5

# Mettre à jour manuellement la version
node bin/update-iframe-version.js 1.0.5

# Forcer la mise à jour d'une version existante (DANGER - non recommandé)
node bin/generate-sri-hash.js 1.0.5 --force
```

## Protection contre les modifications accidentelles

Le système inclut une protection pour éviter les erreurs courantes :

### ❌ Erreur détectée automatiquement

Si vous modifiez le script mais gardez la même version, le build échouera :

```
❌ Error: Version 1.0.2 already exists with a different integrity hash!
   Existing hash: sha384-oldHash...
   New hash:      sha384-newHash...

This could indicate that:
1. The script content has changed but you kept the same version
2. You should increment the version number instead

To fix this:
- Change IFRAME_SCRIPT_LATEST_VERSION to a new version (e.g., increment from 1.0.2)
- Or revert your changes if they were unintentional
```

### ✅ Solutions recommandées

1. **Incrémenter la version** : Changez `IFRAME_SCRIPT_LATEST_VERSION` vers `1.0.3`
2. **Annuler les modifications** : Revertez vos changements si c'était une erreur

### ⚠️ Option de force (urgence uniquement)

En cas d'urgence absolue, vous pouvez forcer la mise à jour :

```bash
node bin/generate-sri-hash.js 1.0.2 --force
```

**⚠️ ATTENTION** : Ceci peut casser les intégrations existantes utilisant cette version !

## Avantages de cette approche

1. **Contrôle total** : Vous choisissez la version (patch, minor, major)
2. **Protection** : Empêche les modifications accidentelles de versions publiées
3. **Historique complet** : Toutes les versions sont conservées
4. **Compatibilité** : Les anciens intégrateurs continuent de fonctionner
5. **Sécurité** : Chaque version a son hash SRI vérifié
6. **Flexibilité** : Option de force pour les cas d'urgence
7. **Versioning Git** : Tous les builds sont versionnés dans le repo

## Compatibilité navigateurs

SRI est supporté par tous les navigateurs modernes :
- Chrome 45+
- Firefox 43+
- Safari 11.1+
- Edge 17+

Pour les navigateurs plus anciens, l'attribut `integrity` est simplement ignoré et le script fonctionne normalement.
