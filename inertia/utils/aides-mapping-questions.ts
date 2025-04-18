export const individusQuestionsVariables: { [aidesSimplifieesKey: string]: OpenFiscaMapping } = {
  'locapass-eligibilite': {
    openfiscaVariableName: 'locapass_eligibilite',
    period: 'MONTH',
  },
  // 'locapass': {},
  // 'mobilite-master-1-eligibilite': {},
  'mobilite-master-1': {
    openfiscaVariableName: 'aide_mobilite_master',
    period: 'MONTH',
  },
  // 'mobilite-parcoursup-eligibilite': {},
  'mobilite-parcoursup': {
    openfiscaVariableName: 'aide_mobilite_parcoursup',
    period: 'MONTH',
  },
}

export const famillesQuestionsVariables: { [aidesSimplifieesKey: string]: OpenFiscaMapping } = {
  'aide-personnalisee-logement': {
    openfiscaVariableName: 'apl',
    period: 'MONTH',
  },
  // 'aide-personnalisee-logement-eligibilite' cas particulier à l'éligibilité
  // non défini en une règle complète éligibilité d'un point de vue légal :
  // dépend de différents profils de demandeurs, de logements et de loyers
  // 'aides_logement_primo_accedant_eligibilite'
  // 'aides_logement_foyer_chambre_non_rehabilite_eligibilite'
  // 'aides_logement_foyer_personne_agee_eligibilite' (a priori hors scope aides-simplifiées)
  // 'logement_conventionne'
  // ...
}

export const menagesQuestionsVariables: { [aidesSimplifieesKey: string]: OpenFiscaMapping } = {
  'garantie-visale-eligibilite': {
    openfiscaVariableName: 'visale_eligibilite',
    period: 'MONTH',
  },
  'garantie-visale': {
    // ATTENTION : À conditionner à visale_eligibilite (et impact colocation sur le résultat)
    openfiscaVariableName: 'visale_montant_max',
    period: 'MONTH',
  },
}

export const foyersFiscauxQuestionsVariables: { [aidesSimplifieesKey: string]: OpenFiscaMapping } =
  {}
