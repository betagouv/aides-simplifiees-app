// @ts-check
import { icons as riCollection } from '@iconify-json/ri'

/**
 * Liste de nom d’icônes **sans** le préfixe de la collection Remix Icons qui sont utilisées dans l’application
 * @type {string[]}
 */
const riIconNames = [
  'add-line',
  'arrow-left-line',
  'arrow-left-right-line',
  'arrow-right-down-line',
  'arrow-right-line',
  'bank-card-line',
  'calendar-2-line',
  'calendar-event-line',
  'chat-check-line',
  'chat-delete-line',
  'close-fill',
  'close-line',
  'delete-bin-2-line',
  'edit-box-line',
  'edit-line',
  'error-warning-line',
  'external-link-line',
  'eye-line',
  'eye-off-line',
  'flag-line',
  'flashlight-line',
  'government-line',
  'home-4-line',
  'information-line',
  'login-box-line',
  'logout-box-line',
  'magic-line',
  'mail-line',
  'match',
  'menu-line',
  'money-euro-circle-line',
  'play-line',
  'question-line',
  'questionnaire-fill',
  'refresh-line',
  'restart-line',
  'save-line',
  'scales-3-line',
  'shopping-bag-line',
  'split',
  'sun-line',
  'truck-line',
]

/**
 * Liste de tuples [collectionDIcônes, tableauDeNomsDIcônesUtiliséesDansLApplication]
 * @type {[import('@iconify/vue').IconifyJSON, string[]][]}
 */
export const collectionsToFilter = [
  [riCollection, riIconNames],
]
