/* eslint-disable perfectionist/sort-imports */
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import LoggingService from '#services/logging_service'

export default class AuthController {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  public async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  public async login({ request, response, auth, session }: HttpContext) {
    const timer = this.loggingService.startTimer('user_login_attempt')

    const loginSchema = vine.object({
      email: vine.string().email(),
      password: vine.string().minLength(6),
    })

    try {
      // Log login attempt
      this.loggingService.logAuthAttempt('login_attempt', { request, response, auth, session } as HttpContext, {
        email: request.input('email'),
      })

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

        // Log successful login
        this.loggingService.logAuthAttempt('login_success', { request, response, auth, session } as HttpContext, {
          userId: user.id,
          userEmail: user.email,
        })

        timer.stopWithMessage(`User ${user.email} logged in successfully`)

        // Redirect to admin dashboard
        return response.redirect().toRoute('/admin')
      }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (authError) {
        // Log failed authentication
        this.loggingService.logAuthAttempt('login_failure', { request, response, auth, session } as HttpContext, {
          email: data.email,
          reason: 'invalid_credentials',
        })

        timer.stopWithMessage(`Login failed for ${data.email}: invalid credentials`)

        // Erreur d'authentification (utilisateur non trouvé ou mot de passe incorrect)
        session.flash('errors', { form: 'Identifiants invalides' })
        return response.redirect().back()
      }
    }
    catch (validationError: any) {
      timer.stopWithMessage(`Login failed: validation error`)

      // Log validation error
      this.loggingService.logWarning('Login validation failed', { request, response, auth, session } as HttpContext, {
        validationErrors: validationError.messages,
        email: request.input('email'),
      })

      // Erreur de validation (email ou mot de passe ne répondant pas aux critères)
      if (validationError.code === 'E_VALIDATION_ERROR') {
        // Transformer les erreurs de validation en format simplifié pour le frontend
        const formattedErrors: Record<string, string> = {}

        validationError.messages.forEach((error: any) => {
          formattedErrors[error.field] = error.message
        })

        // Flash les erreurs de validation
        session.flash('errors', formattedErrors)
      }
      else {
        // En cas d'autre erreur, envoyer un message générique
        session.flash('errors', { form: 'Une erreur est survenue lors de la connexion' })
      }

      return response.redirect().back()
    }
  }

  public async logout({ response, auth, request }: HttpContext) {
    const timer = this.loggingService.startTimer('user_logout')

    // Log logout attempt
    this.loggingService.logAuthAttempt('logout', { request, response, auth } as HttpContext, {
      userId: auth.user?.id,
      userEmail: auth.user?.email,
    })

    await auth.use('web').logout()

    timer.stopWithMessage('User logged out successfully')

    return response.redirect().toPath('/')
  }
}
