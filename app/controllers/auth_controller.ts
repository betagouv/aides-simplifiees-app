import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import vine from '@vinejs/vine'

export default class AuthController {
  public async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  public async login({ request, response, auth, session }: HttpContext) {
    const loginSchema = vine.object({
      email: vine.string().email(),
      password: vine.string().minLength(6),
    })

    try {
      // Validate the request data
      const data = await vine.validate({
        schema: loginSchema,
        data: request.all(),
      })

      try {
        // Find the user by email and verify their password
        const user = await User.verifyCredentials(data.email, data.password)

        // Login the user
        await auth.use('web').login(user)

        // Redirect to admin dashboard
        return response.redirect().toRoute('admin.index')
      }
      catch (authError) {
        // Erreur d'authentification (utilisateur non trouvé ou mot de passe incorrect)
        session.flash('errors', { form: 'Identifiants invalides' })
        return response.redirect().back()
      }
    }
    catch (validationError: any) {
      // Erreur de validation (email ou mot de passe ne répondant pas aux critères)
      if (validationError.code === 'E_VALIDATION_ERROR') {
        // Transformer les erreurs de validation en format simplifié pour le frontend
        const formattedErrors: Record<string, string> = {}

        validationError.messages.forEach((error: any) => {
          formattedErrors[error.field] = error.message
        })

        // Flash les erreurs de validation
        session.flash('errors', formattedErrors)

        // Conserver l'email pour le remplir automatiquement
        session.flash('old', { email: request.input('email') })
      }
      else {
        // En cas d'autre erreur, envoyer un message générique
        session.flash('errors', { form: 'Une erreur est survenue lors de la connexion' })
      }

      return response.redirect().back()
    }
  }

  public async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/')
  }
}
