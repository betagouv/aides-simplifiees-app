import User from '#models/user'
import env from '#start/env'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class UserSeeder extends BaseSeeder {
  async run() {
    // Récupération du mot de passe admin depuis l'env
    // Configure in .env
    const adminPassword = env.get('ADMIN_PASSWORD')
    const adminLogin = env.get('ADMIN_LOGIN')
    // Vérification si l'admin existe déjà
    const existingAdmin = await User.findBy('email', adminLogin)

    if (!existingAdmin) {
      // Création d'un nouvel utilisateur admin
      await User.create({
        fullName: 'Administrateur',
        email: adminLogin,
        password: adminPassword, // Sera automatiquement hashé par le mixin AuthFinder
        isAdmin: true,
      })

      console.log('✓ Admin user created')
    }
    else {
      // Mise à jour de l'utilisateur existant si nécessaire
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true
        await existingAdmin.save()
        console.log('✓ Admin user updated with isAdmin')
      }
      else {
        console.log('✓ Admin user already exists')
      }
    }
  }
}
