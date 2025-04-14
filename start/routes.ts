/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const HomeController = () => import('#controllers/home_controller')
const ApiController = () => import('#controllers/api_controller')

router.get('/', [HomeController, 'home'])
router.get('/partenaires', [HomeController, 'partenaires'])
router.get('/integrer-nos-simulateurs', [HomeController, 'integrerNosSimulateurs'])
router.get('/contact', [HomeController, 'contact'])
router.get('/statistiques', [HomeController, 'statistiques'])

router.get('/api/statistics', [ApiController, 'statistics'])
