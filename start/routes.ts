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
router.get('/content/:page_slug', [DynamicContentController, 'showPage'])
router.get('/notions', [DynamicContentController, 'listNotions'])
router.get('/notions/:notion_slug', [DynamicContentController, 'showNotion'])
router.get('/aides', [DynamicContentController, 'listAides'])
router.get('/aides/:aide_slug', [DynamicContentController, 'showAide'])

/**
 * Simulateurs
 */
router.get('/simulateurs', [SimulateurController, 'listSimulateurs'])
// Specific simulateur routes
router
  .group(() => {
    router
      .get('/simulateurs/:simulateur_slug', [SimulateurController, 'showSimulateur'])
      .middleware([
        middleware.resumeQuery(),
      ])
    router.get('/simulateurs/:simulateur_slug/recapitulatif', [SimulateurController, 'showRecapitulatif'])
    router.get('/simulateurs/:simulateur_slug/resultats-intermediaire', [SimulateurController, 'showResultatsIntermediaire'])
    router.get('/simulateurs/:simulateur_slug/resultats', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/mock-hash', [SimulateurController, 'showResultats'])
    router.get('/simulateurs/:simulateur_slug/resultats/:hash/aides/:aide_slug', [DynamicContentController, 'showResultatsAide'])
    router.get('/simulateurs/:simulateur_slug/notions/:notion_slug', [DynamicContentController, 'showSimulateurNotion'])
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
    // Dashboard
    router.get('/admin', [AdminController, 'dashboard']).as('admin.index')

    // CRUD pour les Pages
    router.get('/admin/pages', [AdminController, 'listPages']).as('admin.pages.index')
    router.get('/admin/pages/create', [AdminController, 'createPage']).as('admin.pages.create')
    router.post('/admin/pages', [AdminController, 'storePage']).as('admin.pages.store')
    router.get('/admin/pages/:id/edit', [AdminController, 'editPage']).as('admin.pages.edit')
    router.post('/admin/pages/:id', [AdminController, 'updatePage']).as('admin.pages.update')

    // CRUD pour les Notions
    router.get('/admin/notions', [AdminController, 'listNotions']).as('admin.notions.index')
    router
      .get('/admin/notions/create', [AdminController, 'createNotion'])
      .as('admin.notions.create')
    router.post('/admin/notions', [AdminController, 'storeNotion']).as('admin.notions.store')
    router.get('/admin/notions/:id/edit', [AdminController, 'editNotion']).as('admin.notions.edit')
    router.post('/admin/notions/:id', [AdminController, 'updateNotion']).as('admin.notions.update')
    router
      .delete('/admin/notions/:id', [AdminController, 'deleteNotion'])
      .as('admin.notions.delete')

    // CRUD pour les Aides
    router.get('/admin/aides', [AdminController, 'listAides']).as('admin.aides.index')
    router.get('/admin/aides/create', [AdminController, 'createAide']).as('admin.aides.create')
    router.post('/admin/aides', [AdminController, 'storeAide']).as('admin.aides.store')
    router.get('/admin/aides/:id/edit', [AdminController, 'editAide']).as('admin.aides.edit')
    router.post('/admin/aides/:id', [AdminController, 'updateAide']).as('admin.aides.update')
    router.delete('/admin/aides/:id', [AdminController, 'deleteAide']).as('admin.aides.delete')
  })
  .middleware([middleware.admin()])
