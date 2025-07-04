# CHANGELOG

### 1.3.2 [#125](https://github.com/betagouv/aides-simplifiees-app/pull/125)

- Ajout de fonctionnalités :
  - Améliore le logging des tests
  - Améliore la gestion et le logging des scripts
- Corrections :
  - Corrections de typage
  - Corrections mineures de controlleurs et stores

### 1.3.1 [#123](https://github.com/betagouv/aides-simplifiees-app/pull/123)
- Ajout de fonctionnalités :
  - Configure et implémente des tests d'a11y
- Améliorations :
  - Optimise les appels à l'API reporting de Matomo
  - Améliore l'affichage des statistiques
  - Améliore le typage
- Corrections :
  - Corrige la détection du SSR dans le composant Crisp
  - Répare l'affichage de l'éligibilité dynamique avec publicodes

## 1.3.0 [#121](https://github.com/betagouv/aides-simplifiees-app/pull/121)
- Ajout de fonctionnalités :
  - Création de formulaires publicodes pour les aom de Bordeaux et de Rennes
  - Permet d'utiliser @publicodes/forms pour générer des formulaires dynamiques
  - Implémentation de l'automatisation du build de l'iframe
- Améliorations :
  - Modifications de wording du simulateur Déménagement
  - Amélioration du modèle publicodes innovation/entreprise
  - Évolutions statiques du frontend
- Corrections :
  - Wrappe le script d'intégration de l'iframe dans une iife pour éviter la pollution des variables globales importées

### 1.2.2 [#97](https://github.com/betagouv/aides-simplifiees-app/pull/97)
- Ajout de fonctionnalités :
  - Ajoute un marqueur pour les questions obligatoires
  - Améliore l'affichage de l'éligibilité et des montants
- Corrections :
  - Répare une regression sur l'affichage des tooltips
- Refactorisation :
  - Modifie la configuration typescript
  - Améliore le champ combobox

### 1.2.1 [#97](https://github.com/betagouv/aides-simplifiees-app/pull/97)
- Ajout de fonctionnalités :
- Détails :
  - Créé un workflow github pour les tests CI

## 1.2.0 [#96](https://github.com/betagouv/aides-simplifiees-app/pull/96)
- Ajout de fonctionnalités :
- Détails :
  - Ajoute un script de détection d'icônes dans le dossier /inertia
  - Permet d'administrer les types d'aide depuis l'admin
  - Améliore et étend la suite de test browser
  - Implémente des tests pour les modèles et controleurs
  - Configure le test coverage
  - Améliore la gestion des erreurs
  - Ajoute une propriété optionnelle "required" aux questions

### 1.1.1 [#94](https://github.com/betagouv/aides-simplifiees-app/pull/94)
- Ajout de fonctionnalités :
- Détails :
  - Améliorations du calcul du formulaire innovation
  - Permet de sauter des lignes dans les infobulles et descriptions des questions
  - Améliore la gestion des textes de lois depuis l'admin
  - Harmonise la nullabilité des champs des différents modèles
  - Permet de spécifier des choix exclusifs dans les questions

## 1.1.0 [#88](https://github.com/betagouv/aides-simplifiees-app/pull/88)
- Ajout de fonctionnalités :
- Détails :
  - Intégration d'un SRI dans dans le script de réintegration d'iframe
  - Refactorisation des règles publicodes pour les dispositifs innovation
  - Amélioration du debug de l'éligibilité via publicodes

### 1.0.2 [#78](https://github.com/betagouv/aides-simplifiees-app/pull/78)
- Améliore les règles publicodes et les explications du formulaire innovation

### 1.0.1 [#76](https://github.com/betagouv/aides-simplifiees-app/pull/76)

- Évolutions mineures
- Détail :
  - Met à jour le package.json pour spécifier la license et le nom du projet
  - Mises à jour de contenu mineures

# 1.0.0 [#73](https://github.com/betagouv/aides-simplifiees-app/pull/73)

- Ajouts de fonctionnalités
- Détail :
  - Ajout de Publicodes comme moteur possible pour les simulateurs
  - Ajout d’un module de gestion des simulateurs avec CRUD complet
  - Évolution du formalisme de description des formulaires (gestion des questions/étapes/pages)
  - Ajout de l'affichage d'infobulles pour les choix de réponses
  - Harmonisation des champs dans les modèles de données (notamment status, description, metaDescription)
  - Mise à jour des controlleurs et sérialisation des entités via DTOs (Data Transfer Objects)

## 0.9.0 [#67](https://github.com/betagouv/aides-simplifiees-app/pull/67)

- Ajouts de fonctionnalités
- Détail :
  - Permet d'afficher une infobulle par choix au sein d'une question
- Modifications de contenu
- Détail :
  - En réponse à #57 : Dans le questionnaire déménagement, suppression de la question "difficulté à payer son loyer"
  - En réponse à #53 : Dans le questionnaire déménagement, suppression de la question de validation des réponses
  - En réponse à #36 : Dans le questionnaire déménagement, supprimer la section 'Votre foyer'
- Correctifs
- Détail :
  - Ajoute l'identifiant de la question à l'id d'un choix pour s'assurer de son unicité
  - Dans un champ de type 'number', n'applique la valeur définie par défaut que si le modèle est non-défini

### 0.8.10

Élargit le bouton de recherche de la combobox

### 0.8.9

- Modification mineure de contenu

### 0.8.8

- Modifications en production pour tests utilisateurs
- Détail :
  - Désactive le bloc résumé dans la page de résultats
  - Ajoute un bouton 'en savoir plus' dans la carte de lien vers le détail d'une aide pour plus d'emphase
  - Modifie la description de la question 'communes' du formulaire déménagement

### 0.8.7

- Ajout du bouton crisp hors iframe

### 0.8.6

- Rédaction du README.md

### 0.8.5

- Pages statiques 404 et 500

### 0.8.4

- Debugs divers sur les statistiques

### 0.8.3

- Debug de la feature de statistiques Matomo pour prendre en compte les formats [simulatorId][source] et [simulatorId]source (erreur legacy)

### 0.8.2

- Ajout de la page Cookies

### 0.8.1

- Ajout de dépendances ts pour la transpilation sous linux

# 0.8.0

- Refactorisations

## 0.7.2

- Script de build pour le resizer de l'iframe
- Détail :
  - Intégration d'un script de build pour le resizer de l'iframe dans `public/iframe-integration.js`

## 0.7.1

- Debug de Matomo
- Détail :
  - Ajout des variabls d'environnement MATOMO_SITE_ID, MATOMO_URL dans le middleware inertia
  - Ajout de la librairie vue-matomo

## 0.7.0

- Debug et intégration de la liste des simulateurs
- Détail :
  - Debug de la page d'affichage des aides
  - Création de la page de liste des simulateurs

## 0.6.0

- Intégration du flux de résultats
- Détail :
  - Intégration de la page de résultats
  - Adaptation des modèles (formSubmission)
  - Affichage dynamique des aides et résultats de simulation
  - Ajout d'un hash pour le partage des résultats

## 0.5.0

- Dsfr Link
- Détail :
  - Adaptation du layout du formulaire
  - Ajout d\'utils du formulaire

## 0.4.0

- Imports des utils et affichage du formulaire
- Détail :
  - Import des utils
  - Utilisation de prettier pour la mise en forme des fichiers
  - Ajout des questions et type de questions
  - Chargement dynamique du formulaire et correctif des stores

## 0.3.0

- Intégration du login et de l'interface d'administration
- Détail :
  - Intégration d'un module de login
  - Intégration d'un module d'administration CRUD des aides, des notions et des pages statiques
  - Intégration d'un module de markdown editor
  - Définition de seeders

## 0.2.0

- Refonte de la homepage et des pages statiques
- Détail :
  - Intégration des assests css / js / icones
  - Réintégration du contenu de la page d'accueil
  - Réintégration du contenu des pages statiques
  - Réintégration de la page statistiques

### 0.1.0

- (WIP) Refonte de la homepage
- Détail :
  - Réintégration du header et footer
  - Réintégration du contenu de la page d'accueil

### 0.0.1

- Installation du DSFR et début de migration de la homepage
- Détail :
  - Intégration d'un layout client
  - Génération de svg de test
  - Début de migration des components Vue du repo legacy : https://github.com/betagouv/aides-simulateur-front
