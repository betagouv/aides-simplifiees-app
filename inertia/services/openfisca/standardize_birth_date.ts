/**
 * Standardise la date de naissance pour optimiser le cache Nginx
 * Convertit toutes les dates de naissance en "1er janvier de l'année correspondant à l'âge"
 * Cela permet à deux personnes du même âge d'avoir la même date dans la requête
 */
export function standardizeBirthDate(request: OpenFiscaCalculationRequest): void {
  // Parcourir tous les individus dans la requête
  for (const individuId in request.individus) {
    const individu = request.individus[individuId]

    // Vérifier si une date de naissance est définie
    if (individu.date_naissance) {
      const today = new Date()
      const currentYear = today.getFullYear()

      // Récupérer la date de naissance originale (format: YYYY-MM-DD)
      // La clé est généralement "ETERNITY"
      const period = Object.keys(individu.date_naissance)[0]
      const originalBirthDate = individu.date_naissance[period] as string

      if (originalBirthDate) {
        // Calculer l'âge réel à partir de la date originale de façon précise
        const birthDate = new Date(originalBirthDate)

        // Calcul correct de l'âge en tenant compte du mois et du jour
        let age = today.getFullYear() - birthDate.getFullYear()

        // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }

        // Créer une nouvelle date standardisée : 1er janvier de l'année correspondant à l'âge
        const standardizedYear = currentYear - age
        const standardizedDate = `${standardizedYear}-01-01`

        // Remplacer la date de naissance dans la requête
        individu.date_naissance[period] = standardizedDate
      }
    }
  }
}
