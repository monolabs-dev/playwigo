import { createFileRoute } from '@tanstack/react-router'

import { SettingsLayout } from '#/features/settings/components/settings-layout.tsx'

export const Route = createFileRoute('/_app/_shell/settings')({
  component: SettingsLayout,
})
