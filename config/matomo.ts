import env from '#start/env'

const matomoConfig = {
  url: env.get('MATOMO_URL', 'https://stats.beta.gouv.fr'),
  token: env.get('MATOMO_TOKEN', 'something_secret'),
  siteId: env.get('MATOMO_SITE_ID', '199'),

  // Mapping des IDs de simulateurs vers leurs titres
  simulatorTitles: {
    'demenagement-logement': 'Déménagement & Logement',
    'entreprise-innovation': 'Aide à l’innovation pour les entreprises',
  },
}

export default matomoConfig
