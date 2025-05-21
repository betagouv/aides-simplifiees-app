/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { IFRAME_SCRIPT_VERSION } from '#config/iframe_integration'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

/**
 * Import Controllers
 */
const ApiController = () => import('#controllers/api_controller')
const AdminController = () => import('#controllers/admin_controller')
const AuthController = () => import('#controllers/auth_controller')
const DynamicContentController = () => import('#controllers/dynamic_content_controller')
const SimulateurController = () => import('#controllers/simulateur_controller')
const StaticPagesController = () => import('#controllers/static_pages_controller')

/**
 * Authentification routes
 */
router.get('/login', [AuthController, 'showLogin'])
router.post('/login', [AuthController, 'login'])
router.post('/logout', [AuthController, 'logout'])

/**
 * Static Pages
 */
router.get('/', [StaticPagesController, 'home'])
router.get('/partenaires', [StaticPagesController, 'partenaires'])
router.get('/integrer-nos-simulateurs', [StaticPagesController, 'integrerNosSimulateurs'])
router.get('/contact', [StaticPagesController, 'contact'])
router.get('/statistiques', [StaticPagesController, 'statistiques'])
router.get('/cookies', [StaticPagesController, 'cookies'])

/**
 * API Routes
 */
router.get('/api/statistics', [ApiController, 'statistics'])
router.get('/api/autocomplete/communes', [ApiController, 'autocompleteCommunes'])
router.post('/api/calculate', [ApiController, 'openFiscaCalculate'])
router.post('/api/store-form-data', [ApiController, 'storeFormData'])

/**
 * Assets
 */
router.get('/iframe-integration.js', ({ response }) => {
  response.redirect(`/assets/iframe-integration@${IFRAME_SCRIPT_VERSION}.js`)
})

/**
 * Dynamic Content
 */
router.get('/content/:page_slug', [DynamicContentController, 'renderPage'])
router.get('/notions', [DynamicContentController, 'renderPublicNotionsList'])
router.get('/notions/:notion_slug', [DynamicContentController, 'renderNotion'])
router.get('/aides', [DynamicContentController, 'renderPublicAidesList'])
router.get('/aides/:aide_slug', [DynamicContentController, 'renderAide'])

/**
 * Simulateurs
 */
router.get('/simulateurs', [SimulateurController, 'renderPublicSimulateursList'])
router
  .group(() => {
    router
      .get('/simulateurs/:simulateur_slug', [SimulateurController, 'renderSimulateur'])
      .middleware([
        middleware.resumeQuery(),
      ])
    router.get('/simulateurs/:simulateur_slug/recapitulatif', [SimulateurController, 'renderRecapitulatif'])
    router.get('/simulateurs/:simulateur_slug/resultats', [SimulateurController, 'renderResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash', [SimulateurController, 'renderResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/mock-hash', [SimulateurController, 'renderResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug', [DynamicContentController, 'renderResultatsAide'])
    router.get('/simulateurs/:simulateur_slug/notions/:notion_slug', [DynamicContentController, 'renderSimulationNotion'])
  })
  .middleware([
    middleware.preserveDebugParam(),
    middleware.preserveIframeParam(),
  ])

/**
 * Admin Routes
 */
router
  .group(() => {
    /**
     * Dashboard
     */
    router.get('/admin', [AdminController, 'dashboard'])

    /**
     * CRUD pour les Pages
     */
    router.get('/admin/pages', [AdminController, 'renderListPages'])
    router.get('/admin/pages/create', [AdminController, 'renderCreatePage'])
    router.get('/admin/pages/:id', [AdminController, 'renderEditPage'])
    router.post('/admin/pages', [AdminController, 'createPage'])
    router.put('/admin/pages/:id', [AdminController, 'updatePage'])
    router.delete('/admin/pages/:id', [AdminController, 'deletePage'])

    /**
     * CRUD pour les Notions
     */
    router.get('/admin/notions', [AdminController, 'renderPublicNotionsList'])
    router.get('/admin/notions/create', [AdminController, 'renderCreateNotion'])
    router.get('/admin/notions/:id', [AdminController, 'renderEditNotion'])
    router.post('/admin/notions', [AdminController, 'createNotion'])
    router.put('/admin/notions/:id', [AdminController, 'updateNotion'])
    router.delete('/admin/notions/:id', [AdminController, 'deleteNotion'])

    /**
     * CRUD pour les Aides
     */
    router.get('/admin/aides', [AdminController, 'renderPublicAidesList'])
    router.get('/admin/aides/create', [AdminController, 'renderCreateAide'])
    router.get('/admin/aides/:id', [AdminController, 'renderEditAide'])
    router.post('/admin/aides', [AdminController, 'createAide'])
    router.put('/admin/aides/:id', [AdminController, 'updateAide'])
    router.delete('/admin/aides/:id', [AdminController, 'deleteAide'])

    /**
     * CRUD pour les Simulateurs
     */
    router.get('/admin/simulateurs', [AdminController, 'renderListSimulateurs'])
    router.get('/admin/simulateurs/create', [AdminController, 'renderCreateSimulateur'])
    router.get('/admin/simulateurs/:id', [AdminController, 'renderEditSimulateur'])
    router.post('/admin/simulateurs', [AdminController, 'createSimulateur'])
    router.put('/admin/simulateurs/:id', [AdminController, 'updateSimulateur'])
    router.delete('/admin/simulateurs/:id', [AdminController, 'deleteSimulateur'])
  })
  .middleware([middleware.admin()])
