/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { IFRAME_SCRIPT_LATEST_VERSION } from '#config/iframe_integration'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

/**
 * Global controllers
 */
const ApiController = () => import('#controllers/api/api_controller')
const AuthController = () => import('#controllers/auth_controller')

/**
 * Static pages controllers
 */
const StaticPagesController = () => import('#controllers/static_pages_controller')

/**
 * Admin content controllers
 */
const AdminDashboardController = () => import('#controllers/admin/admin_dashboard_controller')
const AdminPageController = () => import('#controllers/admin/admin_page_controller')
const AdminNotionController = () => import('#controllers/admin/admin_notion_controller')
const AdminAideController = () => import('#controllers/admin/admin_aide_controller')
const AdminSimulateurController = () => import('#controllers/admin/admin_simulateur_controller')

/**
 * Public dynamic content controllers
 */
const SimulateurController = () => import('#controllers/content/simulateur_controller')
const PagesController = () => import('#controllers/content/page_controller')
const NotionController = () => import('#controllers/content/notion_controller')
const AideController = () => import('#controllers/content/aide_controller')

/**
 * Authentification routes
 */
router.get('/login', [AuthController, 'showLogin'])
router.post('/login', [AuthController, 'login'])
router.post('/logout', [AuthController, 'logout'])

/**
 * Static Pages
 */
router.get('/', [StaticPagesController, 'showHome'])
router.get('/partenaires', [StaticPagesController, 'showPartenaires'])
router.get('/integrer-nos-simulateurs', [StaticPagesController, 'showIntegrerNosSimulateurs'])
router.get('/contact', [StaticPagesController, 'showContact'])
router.get('/statistiques', [StaticPagesController, 'showStatistiques'])
router.get('/cookies', [StaticPagesController, 'showCookies'])

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
  response.redirect(`/assets/iframe-integration@${IFRAME_SCRIPT_LATEST_VERSION}.js`)
})

/**
 * Admin Routes
 */
router
  .group(() => {
    /**
     * Dashboard
     */
    router.get('/admin', [AdminDashboardController, 'dashboard'])

    /**
     * CRUD pour les Pages
     */
    router.get('/admin/pages', [AdminPageController, 'index'])
    router.get('/admin/pages/create', [AdminPageController, 'create'])
    router.get('/admin/pages/:id/edit', [AdminPageController, 'edit'])
    router.post('/admin/pages', [AdminPageController, 'store'])
    router.put('/admin/pages/:id', [AdminPageController, 'update'])
    router.delete('/admin/pages/:id', [AdminPageController, 'destroy'])

    /**
     * CRUD pour les Notions
     */
    router.get('/admin/notions', [AdminNotionController, 'index'])
    router.get('/admin/notions/create', [AdminNotionController, 'create'])
    router.get('/admin/notions/:id/edit', [AdminNotionController, 'edit'])
    router.post('/admin/notions', [AdminNotionController, 'store'])
    router.put('/admin/notions/:id', [AdminNotionController, 'update'])
    router.delete('/admin/notions/:id', [AdminNotionController, 'destroy'])

    /**
     * CRUD pour les Aides
     */
    router.get('/admin/aides', [AdminAideController, 'index'])
    router.get('/admin/aides/create', [AdminAideController, 'create'])
    router.get('/admin/aides/:id/edit', [AdminAideController, 'edit'])
    router.post('/admin/aides', [AdminAideController, 'store'])
    router.put('/admin/aides/:id', [AdminAideController, 'update'])
    router.delete('/admin/aides/:id', [AdminAideController, 'destroy'])

    /**
     * CRUD pour les Simulateurs
     */
    router.get('/admin/simulateurs', [AdminSimulateurController, 'index'])
    router.get('/admin/simulateurs/create', [AdminSimulateurController, 'create'])
    router.get('/admin/simulateurs/:id/edit', [AdminSimulateurController, 'edit'])
    router.post('/admin/simulateurs', [AdminSimulateurController, 'store'])
    router.put('/admin/simulateurs/:id', [AdminSimulateurController, 'update'])
    router.delete('/admin/simulateurs/:id', [AdminSimulateurController, 'destroy'])
  })
  .middleware([middleware.admin()])

/**
 * Dynamic Content
 */
router.get('/content/:page_slug', [PagesController, 'show'])
router.get('/notions', [NotionController, 'index'])
router.get('/notions/:notion_slug', [NotionController, 'show'])
router.get('/aides', [AideController, 'index'])
router.get('/aides/:aide_slug', [AideController, 'show'])

/**
 * Simulateurs
 */
router.get('/simulateurs', [SimulateurController, 'index'])
router
  .group(() => {
    router
      .get('/simulateurs/:simulateur_slug', [SimulateurController, 'show'])
      .middleware([
        middleware.resumeQuery(),
      ])
    router.get('/simulateurs/:simulateur_slug/recapitulatif', [SimulateurController, 'showRecapitulatif'])
    router.get('/simulateurs/:simulateur_slug/resultats', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/mock-hash', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug', [AideController, 'showWithResults'])
    router.get('/simulateurs/:simulateur_slug/notions/:notion_slug', [NotionController, 'showWithSimulateur'])
  })
  .middleware([
    middleware.preserveDebugParam(),
    middleware.preserveIframeParam(),
  ])
