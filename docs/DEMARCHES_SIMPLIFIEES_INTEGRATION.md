# Intégration avec Démarches Simplifiées

Cette documentation explique comment utiliser l'intégration avec Démarches Simplifiées pour permettre aux utilisateurs de préremplir automatiquement leur dossier avec les réponses du simulateur.

## Vue d'ensemble

L'intégration permet de :
1. Configurer une association entre une aide et une démarche sur demarches-simplifiees.fr
2. Mapper les questions du simulateur aux champs de la démarche
3. Créer automatiquement un dossier prérempli pour l'utilisateur

## Configuration d'une aide (Interface d'administration)

### 1. Accéder à la configuration

Rendez-vous dans l'interface d'administration des aides :
- `/admin/aides` pour voir la liste
- Cliquez sur "Modifier" pour une aide existante
- Descendez jusqu'à la section "Intégration avec Démarches Simplifiées"

### 2. Activer l'intégration

- **Activer l'association** : Sélectionnez "Oui"
- **ID de la démarche** : Saisissez l'identifiant numérique de votre démarche sur demarches-simplifiees.fr
  - Exemple : `12345`
  - Vous pouvez le trouver dans l'URL de votre démarche : `https://demarches-simplifiees.fr/admin/procedures/12345`

### 3. Configurer le mapping des champs

Pour chaque champ que vous souhaitez préremplir :

1. Cliquez sur "Ajouter un mapping"
2. Renseignez :
   - **Clé du champ DS** : L'identifiant en base64 du champ dans Démarches Simplifiées
     - Format : `champ_Q2hhbXAtMTx0MjM2OX==`
     - Vous pouvez l'obtenir via l'API de schéma DS : `/preremplir/<nom-demarche>/schema`
   - **ID de la question** : L'identifiant de la question dans votre fichier JSON du simulateur
     - Exemple : `statut-professionnel`
     - Trouvable dans `public/forms/{simulateur-slug}.json`

3. Répétez pour chaque champ à préremplir

### 4. Sauvegarder

Cliquez sur "Enregistrer" pour sauvegarder la configuration.

## Comment obtenir les clés des champs Démarches Simplifiées

### Méthode 1 : Via l'API de schéma

Rendez-vous sur : `https://www.demarches-simplifiees.fr/preremplir/<nom-demarche>/schema`

Cette page vous donnera :
- La liste complète des champs de votre démarche
- Leur identifiant stable (la clé en base64)
- Leur type et description

### Méthode 2 : Via la page de préremplissage

Rendez-vous sur : `https://www.demarches-simplifiees.fr/preremplir/<nom-demarche>`

Cette page vous montre :
- Les champs disponibles au préremplissage
- Des exemples d'utilisation
- L'URL de préremplissage en GET
- Un exemple de requête POST

## Utilisation côté utilisateur

Une fois configuré, l'utilisateur verra automatiquement :

1. **Sur la page de détail d'une aide** : Un bouton "Réaliser ma démarche avec Démarches Simplifiées"
2. **En cliquant** : Un dossier prérempli est créé sur demarches-simplifiees.fr
3. **Redirection** : L'utilisateur est redirigé vers son dossier prérempli dans un nouvel onglet

## Architecture technique

### Flux de données

```
Utilisateur termine simulateur
    → Réponses stockées dans FormSubmission (avec hash)
    → Utilisateur consulte une aide
    → Voit le bouton DS (si aide.dsEnabled)
    → Clique sur le bouton
    → Frontend appelle /api/demarches-simplifiees/prefill
    → Backend récupère les réponses via le hash
    → Backend mappe les réponses aux champs DS
    → Backend appelle l'API DS en POST
    → DS retourne l'URL du dossier prérempli
    → Frontend ouvre l'URL dans un nouvel onglet
```

### Composants

#### Backend

- **Migration** : `database/migrations/1730400000000_add_demarches_simplifiees_to_aides.ts`
  - Ajoute 3 colonnes à la table `aides` : `ds_enabled`, `ds_demarche_id`, `ds_field_mapping`

- **Modèle** : `app/models/aide.ts`
  - Propriétés : `dsEnabled`, `dsDemarcheId`, `dsFieldMapping`

- **Contrôleur API** : `app/controllers/api/demarches_simplifiees_controller.ts`
  - Méthode `createPrefilledDossier` : Gère la création du dossier prérempli

- **Route** : `POST /api/demarches-simplifiees/prefill`

#### Frontend

- **Composant** : `inertia/components/aides/DemarchesSimplifiedButton.vue`
  - Affiche le bouton et gère l'appel API

- **Interface admin** : `inertia/components/admin/AideForm.vue`
  - Section de configuration DS avec mappings

- **Intégration** : `inertia/pages/content/aides/resultats-aide.vue`
  - Affiche le bouton sur la page de détail d'une aide

### Types de données

Le mapping des champs est stocké sous forme JSON :
```json
{
  "champ_Q2hhbXAtMTx0MjM2OX==": "statut-professionnel",
  "champ_Q2hhbXAtMjx0MjM2OX==": "date-naissance"
}
```

## Gestion des types de réponses

Le système gère automatiquement différents types de réponses :

- **Texte simple** : Passé tel quel
- **Nombres** : Passés tel quel
- **Booléens** : true/false
- **Combobox** : Le système extrait automatiquement la valeur du JSON
- **Tableaux (checkboxes)** : Passés tels quels (DS gère les tableaux)

## Dépannage

### Le bouton ne s'affiche pas

Vérifiez :
- L'aide a `dsEnabled = true`
- L'aide a un `dsDemarcheId` renseigné
- L'utilisateur est sur une page de résultats (avec un hash de submission valide)

### Erreur lors de la création du dossier

Vérifiez :
- L'ID de la démarche DS est correct
- Les clés des champs DS sont valides
- La démarche est en mode "opendata" sur DS
- La démarche n'est pas close

### Les champs ne sont pas préremplis correctement

Vérifiez :
- Le mapping entre les clés DS et les IDs de questions
- Les IDs de questions correspondent bien à ceux du JSON du formulaire
- Les types de données correspondent (texte, nombre, booléen)

## Limitations

- Les dossiers créés sont orphelins jusqu'à ce que l'utilisateur s'authentifie
- Seuls les champs configurés dans le mapping sont préremplis
- L'intégration nécessite que la démarche soit en opendata sur DS
- Les fichiers joints ne peuvent pas être préremplis via cette API

## Référence API Démarches Simplifiées

Documentation officielle : [https://doc.demarches-simplifiees.fr/pour-aller-plus-loin/api-de-preremplissage](https://doc.demarches-simplifiees.fr/pour-aller-plus-loin/api-de-preremplissage)

