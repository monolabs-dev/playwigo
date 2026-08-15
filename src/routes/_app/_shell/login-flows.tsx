import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_shell/login-flows')({
  beforeLoad: () => {
    throw redirect({ to: '/authentication/login-flow' })
  },
})
