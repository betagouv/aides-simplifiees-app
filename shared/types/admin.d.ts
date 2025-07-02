import type AdminAideController from '#controllers/admin/admin_aide_controller'
import type AdminNotionController from '#controllers/admin/admin_notion_controller'
import type AdminSimulateurController from '#controllers/admin/admin_simulateur_controller'
import type AdminTypeAideController from '#controllers/admin/admin_type_aide_controller'
import type { InferPageProps } from '@inertiajs/vue3'
import type { InertiaForm } from '@inertiajs/vue3'

declare global {

  /**
   * UserForm is a generic type that takes a type T and returns an InertiaForm
   * with the properties of T except for 'id' and 'updatedAt', which are auto generated.
   */
  type UserForm<T> = InertiaForm<Omit<T, 'id' | 'updatedAt'>>

  type SimulateurFormType = UserForm<InferPageProps<AdminSimulateurController, 'edit'>['simulateur']>

  type AideFormType = UserForm<InferPageProps<AdminAideController, 'edit'>['aide']>

  type PageFormType = UserForm<InferPageProps<AdminPageController, 'edit'>['page']>

  type NotionFormType = UserForm<InferPageProps<AdminNotionController, 'edit'>['notion']>

  type TypeAideFormType = UserForm<InferPageProps<AdminTypeAideController, 'edit'>['typeAide']>

}

export {}
