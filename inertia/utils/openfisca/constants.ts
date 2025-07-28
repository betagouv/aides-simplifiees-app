/**
 * Constants for OpenFisca calculations
 */

export enum Entites {
  Individus = 'individus',
  Menages = 'menages',
  FoyersFiscaux = 'foyers_fiscaux',
  Familles = 'familles',
}

// Entity IDs
export const INDIVIDU_ID = 'usager'
export const MENAGE_ID = `menage_${INDIVIDU_ID}`
export const FOYER_FISCAL_ID = `foyer_fiscal_${INDIVIDU_ID}`
export const FAMILLE_ID = `famille_${INDIVIDU_ID}`

// Error constants
export const UNDEFINED_ENTITY_ID = 'IDENTIFIANT_ENTITE_INCONNUE'
export const UNDEFINED_PERIOD_TYPE = 'PERIODE_DEFNITION_INCONNUE'

export const ETERNITY_PERIOD = 'ETERNITY'

// Default values
export const DEFAULT_NATIONALITY = 'FR'
export const DEFAULT_UNIVERSITY_LEVEL_MASTER = 'master_1'
export const DEFAULT_UNIVERSITY_LEVEL_TERMINALE = 'terminale'

// OpenFisca status values
export const LOGEMENT_STATUS = {
  LOCATAIRE_VIDE: 'locataire_vide',
  LOCATAIRE_MEUBLE: 'locataire_meuble',
  LOCATAIRE_FOYER: 'locataire_foyer',
  PROPRIETAIRE: 'proprietaire',
  LOGE_GRATUITEMENT: 'loge_gratuitement',
  SANS_DOMICILE: 'sans_domicile',
} as const

export const ACTIVITY_STATUS = {
  ACTIF: 'actif',
  CHOMEUR: 'chomeur',
} as const

// Form values mapping
export const FORM_VALUES = {
  STAGE: 'stage',
  ALTERNANCE: 'alternance',
  SALARIE_HORS_ALTERNANCE: 'salarie-hors-alternance',
  SANS_EMPLOI: 'sans-emploi',
  LOCATAIRE: 'locataire',
  PROPRIETAIRE: 'proprietaire',
  HEBERGE: 'heberge',
  SANS_DOMICILE: 'sans-domicile',
  LOGEMENT_NON_MEUBLE: 'logement-non-meuble',
  LOGEMENT_MEUBLE: 'logement-meuble',
  LOGEMENT_FOYER: 'logement-foyer',
  PARCOURSUP_NOUVELLE_REGION: 'parcoursup-nouvelle-region',
  MASTER_NOUVELLE_ZONE: 'master-nouvelle-zone',
  PAS_DE_MOBILITE: 'pas-de-mobilite',
} as const
