# CHANGELOG

# 1.0.1 [#76](https://github.com/betagouv/aides-simplifiees-app/pull/76)
* Évolutions mineures
* Détail :
  * Met à jour le package.json pour spécifier la license et le nom du projet
  * Mises à jour de contenu mineures


# 1.0.0 [#73](https://github.com/betagouv/aides-simplifiees-app/pull/73)
* Ajouts de fonctionnalités
* Détail :
  * Ajout de Publicodes comme moteur possible pour les simulateurs
  * Ajout d’un module de gestion des simulateurs avec CRUD complet
  * Évolution du formalisme de description des formulaires (gestion des questions/étapes/pages)
  * Ajout de l'affichage d'infobulles pour les choix de réponses
  * Harmonisation des champs dans les modèles de données (notamment status, description, metaDescription)
  * Mise à jour des controlleurs et sérialisation des entités via DTOs (Data Transfer Objects)

## 0.9.0 [#67](https://github.com/betagouv/aides-simplifiees-app/pull/67)
* Ajouts de fonctionnalités
* Détail :
  * Permet d'afficher une infobulle par choix au sein d'une question
* Modifications de contenu
* Détail :
  * En réponse à #57 : Dans le questionnaire déménagement, suppression de la question "difficulté à payer son loyer"
  * En réponse à #53 : Dans le questionnaire déménagement, suppression de la question de validation des réponses
  * En réponse à #36 : Dans le questionnaire déménagement, supprimer la section 'Votre foyer'
* Correctifs
* Détail :
  * Ajoute l'identifiant de la question à l'id d'un choix pour s'assurer de son unicité
  * Dans un champ de type 'number', n'applique la valeur définie par défaut que si le modèle est non-défini

### 0.8.10
Élargit le bouton de recherche de la combobox

### 0.8.9
* Modification mineure de contenu

### 0.8.8
* Modifications en production pour tests utilisateurs
* Détail :
  * Désactive le bloc résumé dans la page de résultats
  * Ajoute un bouton 'en savoir plus' dans la carte de lien vers le détail d'une aide pour plus d'emphase
  * Modifie la description de la question 'communes' du formulaire déménagement

### 0.8.7
* Ajout du bouton crisp hors iframe

### 0.8.6
* Rédaction du README.md

### 0.8.5
* Pages statiques 404 et 500

### 0.8.4
* Debugs divers sur les statistiques

### 0.8.3
* Debug de la feature de statistiques Matomo pour prendre en compte les formats [simulatorId][source] et [simulatorId]source (erreur legacy)

### 0.8.2
* Ajout de la page Cookies

### 0.8.1
* Ajout de dépendances ts pour la transpilation sous linux

# 0.8.0
* Refactorisations

## 0.7.2
* Script de build pour le resizer de l'iframe
* Détail :
  * Intégration d'un script de build pour le resizer de l'iframe dans `public/iframe-integration.js`

## 0.7.1
* Debug de Matomo
* Détail :
  * Ajout des  variabls d'environnement MATOMO_SITE_ID, MATOMO_URL dans le middleware inertia
  * Ajout de la librairie vue-matomo

## 0.7.0
* Debug et intégration de la liste des simulateurs
* Détail :
  * Debug de la page d'affichage des aides
  * Création de la page de liste des simulateurs

## 0.6.0
* Intégration du flux de résultats
* Détail :
  * Intégration de la page de résultats
  * Adaptation des modèles (formSubmission)
  * Affichage dynamique des aides et résultats de simulation
  * Ajout d'un hash pour le partage des résultats


## 0.5.0
* Dsfr Link
* Détail :
  * Adaptation du layout du formulaire
  * Ajout d\'utils du formulaire

## 0.4.0
* Imports des utils et affichage du formulaire
* Détail :
  * Import des utils
  * Utilisation de prettier pour la mise en forme des fichiers
  * Ajout des questions et type de questions
  * Chargement dynamique du formulaire et correctif des stores

## 0.3.0
* Intégration du login et de l'interface d'administration
* Détail :
  * Intégration d'un module de login
  * Intégration d'un module d'administration CRUD des aides, des notions et des pages statiques
  * Intégration d'un module de markdown editor
  * Définition de seeders

## 0.2.0
* Refonte de la homepage et des pages statiques
* Détail :
  * Intégration des assests css / js / icones
  * Réintégration du contenu de la page d'accueil
  * Réintégration du contenu des pages statiques
  * Réintégration de la page statistiques


### 0.1.0
* (WIP) Refonte de la homepage
* Détail :
  * Réintégration du header et footer
  * Réintégration du contenu de la page d'accueil


### 0.0.1

* Installation du DSFR et début de migration de la homepage
* Détail :
  * Intégration d'un layout client
  * Génération de svg de test
  * Début de migration des components Vue du repo legacy : https://github.com/betagouv/aides-simulateur-front
