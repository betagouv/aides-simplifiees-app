import type { InertiaForm } from '@inertiajs/vue3'

declare global {

  interface SerializedSimulateur {
    /** auto-generated */
    id: number
    updatedAt: string
    /** common */
    title: string
    slug: string
    status: string
    description: string
    metaDescription: string
    /** specifics */
    pictogramPath: string
  }

  type SimulateurForm = InertiaForm<Omit<SerializedSimulateur, 'id' | 'updatedAt'>>

  interface SerializedAide {
    /** auto-generated */
    id: number
    updatedAt: string
    /** common */
    title: string
    slug: string
    status: string
    description: string
    metaDescription: string
    /** specifics */
    content: string
    type: string
    usage: string
    instructeur: string
    textesLoi: TexteLoi[]
  }

  type AideForm = InertiaForm<Omit<SerializedAide, 'id' | 'updatedAt'>>

  interface SerializedPage {
    /** auto-generated */
    id: number
    updatedAt: string
    /** common */
    title: string
    slug: string
    status: string
    description: string
    metaDescription: string
    /** specifics */
    content: string
  }

  type PageForm = InertiaForm<Omit<SerializedPage, 'id' | 'updatedAt'>>

  interface SerializedNotion {
    /** auto-generated */
    id: number
    updatedAt: string
    /** common */
    title: string
    slug: string
    status: string
    description: string
    metaDescription: string
    /** specifics */
    content: string
  }

  type NotionForm = InertiaForm<Omit<SerializedNotion, 'id' | 'updatedAt'>>
}

export {}
