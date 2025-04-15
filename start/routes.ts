/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HomeController = () => import('#controllers/home_controller')
const ApiController = () => import('#controllers/api_controller')
const AdminController = () => import('#controllers/admin_controller')
const ContentController = () => import('#controllers/content_controller')
const AuthController = () => import('#controllers/auth_controller')

// Auth routes
router.get('/login', [AuthController, 'showLogin'])
router.post('/login', [AuthController, 'login'])
router.post('/logout', [AuthController, 'logout'])

router.get('/', [HomeController, 'home'])
router.get('/partenaires', [HomeController, 'partenaires'])
router.get('/integrer-nos-simulateurs', [HomeController, 'integrerNosSimulateurs'])
router.get('/contact', [HomeController, 'contact'])
router.get('/statistiques', [HomeController, 'statistiques'])

router.get('/api/statistics', [ApiController, 'statistics'])

// Routes publiques
router.get('/content/pages', [ContentController, 'listPages'])
router.get('/content/:slug', [ContentController, 'showPage'])
router.get('/notions', [ContentController, 'listNotions'])
router.get('/notions/:slug', [ContentController, 'showNotion'])
router.get('/aides', [ContentController, 'listAides'])
router.get('/aides/:slug', [ContentController, 'showAide'])

// Routes d'administration protégées
router.group(() => {
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
  router.get('/admin/notions/create', [AdminController, 'createNotion']).as('admin.notions.create')
  router.post('/admin/notions', [AdminController, 'storeNotion']).as('admin.notions.store')
  router.get('/admin/notions/:id/edit', [AdminController, 'editNotion']).as('admin.notions.edit')
  router.post('/admin/notions/:id', [AdminController, 'updateNotion']).as('admin.notions.update')
  router.delete('/admin/notions/:id', [AdminController, 'deleteNotion']).as('admin.notions.delete')

  // CRUD pour les Aides
  router.get('/admin/aides', [AdminController, 'listAides']).as('admin.aides.index')
  router.get('/admin/aides/create', [AdminController, 'createAide']).as('admin.aides.create')
  router.post('/admin/aides', [AdminController, 'storeAide']).as('admin.aides.store')
  router.get('/admin/aides/:id/edit', [AdminController, 'editAide']).as('admin.aides.edit')
  router.post('/admin/aides/:id', [AdminController, 'updateAide']).as('admin.aides.update')
  router.delete('/admin/aides/:id', [AdminController, 'deleteAide']).as('admin.aides.delete')
})
  .middleware([middleware.admin()])
