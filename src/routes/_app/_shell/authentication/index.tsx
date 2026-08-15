import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_shell/authentication/')({
  beforeLoad: () => {
    throw redirect({ to: '/authentication/accounts' })
  },
})
