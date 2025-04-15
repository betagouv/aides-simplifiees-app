import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import env from '#start/env'

export default class UserSeeder extends BaseSeeder {
  async run() {
    // Récupération du mot de passe admin depuis l'env
    const adminPassword = env.get('ADMIN_PASSWORD', '')

    // Vérification si l'admin existe déjà
    const existingAdmin = await User.findBy('email', 'aides-simplifiees@numerique.gouv.fr')

    if (!existingAdmin) {
      // Création d'un nouvel utilisateur admin
      await User.create({
        fullName: 'Administrateur',
        email: 'aides-simplifiees@numerique.gouv.fr',
        password: adminPassword, // Sera automatiquement hashé par le mixin AuthFinder
        isAdmin: true,
      })

      console.log('✓ Admin user created')
    } else {
      // Mise à jour de l'utilisateur existant si nécessaire
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true
        await existingAdmin.save()
        console.log('✓ Admin user updated with isAdmin')
      } else {
        console.log('✓ Admin user already exists')
      }
    }
  }
}
