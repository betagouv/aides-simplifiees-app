import type AdminAideController from '#controllers/admin/admin_aide_controller'
import type AdminSimulateurController from '#controllers/admin/admin_simulateur_controller'
import type { InferPageProps } from '@inertiajs/vue3'
import type { InertiaForm } from '@inertiajs/vue3'

declare global {

  /**
   * UserForm is a generic type that takes a type T and returns an InertiaForm
   * with the properties of T except for 'id' and 'updatedAt', which are auto generated.
   */
  type UserForm<T> = InertiaForm<Omit<T, 'id' | 'updatedAt'>>

  type SimulateurForm = UserForm<InferPageProps<AdminSimulateurController, 'edit'>['simulateur']>

  type AideForm = UserForm<InferPageProps<AdminAideController, 'edit'>['aide']>

  type PageForm = UserForm<InferPageProps<AdminAideController, 'edit'>['page']>

  type NotionForm = UserForm<InferPageProps<AdminAideController, 'edit'>['notion']>
}

export {}
