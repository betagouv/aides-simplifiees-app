import type { Page, PageProps } from "@inertiajs/core";

interface SharedProps extends PageProps {
  matomoUrl?: string
  matomoSiteId?: string
  auth?: {
    user: {
      id: number
      email: string
      fullName?: string
    } | null
  }
}

export default SharedProps;

declare module "@inertiajs/vue3" {
  export function usePage(): Page<SharedProps>;
}
