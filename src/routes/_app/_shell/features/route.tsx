import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_shell/features')({
  component: FeaturesLayout,
})

function FeaturesLayout() {
  return <Outlet />
}
