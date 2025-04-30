// @ts-check
import { icons as riCollection } from '@iconify-json/ri'

/**
 * Liste de nom d’icônes **sans** le préfixe de la collection Remix Icons qui sont utilisées dans l’application
 * @type {string[]}
 */
const riIconNames = [
  'arrow-left-line',
  'arrow-left-right-line',
  'arrow-right-line',
  'refresh-line',
  'menu-line',
  'eye-line',
  'eye-off-line',
  'arrow-right-down-line',
  'bank-card-line',
  'chat-check-line',
  'chat-delete-line',
  'calendar-event-line',
  'calendar-2-line',
  'edit-box-line',
  'external-link-line',
  'flashlight-line',
  'flag-line',
  'government-line',
  'information-line',
  'mail-line',
  'money-euro-circle-line',
  'play-line',
  'question-line',
  'restart-line',
  'scales-3-line',
  'shopping-bag-line',
  'sun-line',
  'login-box-line',
  'logout-box-line',
]

/**
 * Liste de tuples [collectionDIcônes, tableauDeNomsDIcônesUtiliséesDansLApplication]
 * @type {[import('@iconify/vue').IconifyJSON, string[]][]}
 */
export const collectionsToFilter = [
  [riCollection, riIconNames],
]
