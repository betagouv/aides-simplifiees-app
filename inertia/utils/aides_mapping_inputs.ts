// mapping client/public/forms/demenagement-logement.json
// to aides-calculatrice-back (openfisca-france here)
// checked with openfisca-france v169.16.16

import {
  dispatchEtudiantMobilite,
  dispatchSituationLogement,
  dispatchSituationProfessionnelle,
  dispatchTypeLogement,
} from './calculate_aides'

export const individusVariables: { [aidesSimplifieesKey: string]: AidesSimplifieesMapping } = {
  'date-naissance': {
    // '2000-01-01'
    openfiscaVariableName: 'date_naissance',
    period: 'ETERNITY',
  },
  'handicap': {
    // 'non-handicap' TODO: move to boolean value
    openfiscaVariableName: 'handicap',
    period: 'MONTH',
  },
  'boursier': {
    openfiscaVariableName: 'boursier',
    period: 'MONTH',
  },

  // APL, Locapass (eligibility) and Aide mobilité master 1 look for any bourse ('boursier')
  'montant-bourse-superieur': {
    // could also be 'bourse_enseignement_sup'
    openfiscaVariableName: 'bourse_criteres_sociaux',
    period: 'MONTH',
  },

  'salaire-imposable': {
    // '20000' TODO: move to month value or multiple month values?
    openfiscaVariableName: 'salaire_imposable',
    period: 'YEAR_ROLLING',
  },
  'montant-chomage': {
    // imposable
    openfiscaVariableName: 'chomage_imposable',
    period: 'MONTH',
  },
  'montant-ca-micro-entreprise': {
    openfiscaVariableName: 'rpns_imposables',
    period: 'YEAR',
  },
  'statut-marital': {
    // 'celibataire'
    openfiscaVariableName: 'statut_marital',
    // no need for dispatch - simulator choices are already equal to openfisca enum
    // possible values: https://legislation.fr.openfisca.org/statut_marital
    period: 'MONTH',
  },
  'statut-professionnel': {
    // 'salarie'
    // no need for dispatch - simulator choices are already equal to openfisca enum
    // possible values: https://legislation.fr.openfisca.org/activite
    openfiscaVariableName: 'activite',
    period: 'MONTH',
  },
  'situation-professionnelle': {
    // "salarie-hors-alternance"
    dispatch: dispatchSituationProfessionnelle,
    period: 'MONTH',
    // TODO: check 'situation-professionnelle' values as some also match 'statut-professionnel' values
  },
  'nombre-personnes-logement': {
    // int
    exclude: true,
  },
  'type-revenus': {
    // checkbox => multiple choices
    exclude: true,
  },
  'etudiant-mobilite': {
    dispatch: dispatchEtudiantMobilite,
    period: 'MONTH',
  },
  'confirmation-end': {
    // end of survey
    exclude: true,
  },
}

export const menagesVariables: { [aidesSimplifieesKey: string]: AidesSimplifieesMapping } = {
  'code-postal-nouvelle-ville': {
    // '75015' code INSEE
    openfiscaVariableName: 'depcom',
    period: 'MONTH',
  },
  'colocation': {
    // 'colocation-non' TODO: move to boolean value
    openfiscaVariableName: 'coloc',
    period: 'MONTH',
  },

  'loyer-montant-charges': {
    // for Garantie visale (not APL)
    openfiscaVariableName: 'charges_locatives',
    period: 'MONTH',
  },
  'loyer-montant-mensuel': {
    // '700' TODO: move to number value
    openfiscaVariableName: 'loyer',
    period: 'MONTH',
  },
  'situation-logement': {
    // 'locataire'
    dispatch: dispatchSituationLogement,
    period: 'MONTH',
  },
  'primo-accedant': {
    // TODO: include in situation-logement?
    exclude: true,
  },
  'type-logement': {
    // 'logement-foyer'
    // TODO: check what we mean by "type-logement" (foyer, chambre... or conventionne / not conventionne)
    // we have : "id": "logement-foyer", "title": "Foyer (résidence CROUS, etc.)"
    // but other types like logement_meuble can also be conventionné (then remove calsulate-aides.ts specific code for 'logement_conventionne')
    dispatch: dispatchTypeLogement,
    period: 'MONTH',
  },
  'logement-conventionne': {
    openfiscaVariableName: 'logement_conventionne',
    period: 'MONTH',
  },
}

export const famillesVariables: { [aidesSimplifieesKey: string]: AidesSimplifieesMapping } = {
  'logement-parente-proprietaire': {
    openfiscaVariableName: 'proprietaire_proche_famille',
    period: 'MONTH',
  },
  'montant-bourse-lycee': {
    openfiscaVariableName: 'bourse_lycee',
    period: 'MONTH',
  },
}

export const foyersFiscauxVariables: { [aidesSimplifieesKey: string]: AidesSimplifieesMapping } = {}
