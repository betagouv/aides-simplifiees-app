import type { RawPublicodes } from 'publicodes'

export async function getPublicodesRules(simulateurSlug: string): Promise<RawPublicodes<string>> {
  // Use dynamic import to load the rules based on the simulateurSlug
  switch (simulateurSlug) {
    case 'entreprise-innovation':
      return import('~publicodes/entreprise-innovation').then(module => module.default)
    case 'aom-rennes':
      return import('~publicodes/aom-rennes').then(module => module.default)
    case 'aom-bordeaux':
      return import('~publicodes/aom-bordeaux').then(module => module.default)
    default:
      throw new Error(`No rules found for simulateur: ${simulateurSlug}`)
  }
}
