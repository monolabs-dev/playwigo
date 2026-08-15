import { createFileRoute } from '@tanstack/react-router'

import { FeatureDetailPage } from '#/features/features/components/feature-detail-page.tsx'

export const Route = createFileRoute('/_app/_shell/features/$featureId')({
  component: FeatureDetailPage,
  head: () => ({
    meta: [{ title: 'Feature — Playwigo' }],
  }),
})
