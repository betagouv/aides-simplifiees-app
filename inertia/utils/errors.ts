export class UnknownVariableError extends Error {
  // unconsistency between the form and the calculation:
  // the user set a value to an input in the form
  // but the input id is not expected by the current web API request builder
  constructor(formInputId: string) {
    super(`Champ inconnu : ${formInputId}`)
    this.name = 'UnknownVariableError'
  }
}

export class UnknownEntityError extends Error {
  // unconsistency in the request builder
  constructor(formInputId: string) {
    super(`Entité inconnue pour le champ : ${formInputId}`)
    this.name = 'UnknownEntityError'
  }
}

export class UnknownPeriodError extends Error {
  // unconsistency in the request builder
  constructor(formInputId: string) {
    super(`Période inconnue pour le champ : ${formInputId}`)
    this.name = 'UnknownPeriodError'
  }
}

export class UndefinedValueError extends Error {
  // the user didn't set a value in the form
  constructor(formInputId: string) {
    super(`Valeur inconnue pour le champ : ${formInputId}`)
    this.name = 'UndefinedValueError'
  }
}

export class UnexpectedValueError extends Error {
  // unconsistency between the form and the calculation:
  // the user set a value in the form
  // but the value type is not expected by the current web API request builder
  constructor(formInputId: string) {
    super(`Valeur de type inattendu pour le champ : ${formInputId}`)
    this.name = 'UnexpectedValueError'
  }
}

export class UnexpectedValueUpdateError extends Error {
  // unconsistency in the mapping
  // or unexpected case where multiple inputs are defined by the same web API request key
  constructor(formInputId: string) {
    super(`Valeur déjà définie dans la requête pour la cible du champ : ${formInputId}`)
    this.name = 'UnexpectedValueUpdateError'
  }
}
