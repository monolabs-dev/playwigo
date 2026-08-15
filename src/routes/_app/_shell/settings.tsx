import { createFileRoute } from '@tanstack/react-router'

import { ProjectSettingsPage } from '#/features/projects/components/project-settings-page.tsx'

export const Route = createFileRoute('/_app/_shell/settings')({
  component: ProjectSettingsPage,
  head: () => ({
    meta: [{ title: 'Project settings — Playwigo' }],
  }),
})
