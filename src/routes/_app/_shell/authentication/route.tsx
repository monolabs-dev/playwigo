import { createFileRoute } from '@tanstack/react-router'

import { AuthenticationLayout } from '#/features/authentication/components/authentication-layout.tsx'

export const Route = createFileRoute('/_app/_shell/authentication')({
  component: AuthenticationLayout,
})
