import { createFileRoute } from '@tanstack/react-router'

import { FeaturesPage } from '#/features/features/components/features-page.tsx'

export const Route = createFileRoute('/_app/_shell/features/')({
  component: FeaturesPage,
  head: () => ({
    meta: [{ title: 'Features — Playwigo' }],
  }),
})
