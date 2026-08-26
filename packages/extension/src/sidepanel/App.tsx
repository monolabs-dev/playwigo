import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Toaster } from 'sonner'

import type {
  FeatureSummary,
  Project,
  TestCaseSummary,
} from '@/api/types'
import { sendMessage } from '@/lib/messaging'
import { getAuth, navStorage, type NavState } from '@/lib/storage'
import { FeaturesScreen } from '@/screens/features-screen'
import { LoginScreen } from '@/screens/login-screen'
import { ProjectsScreen } from '@/screens/projects-screen'
import { StepsScreen } from '@/screens/steps-screen'
import { TestCasesScreen } from '@/screens/test-cases-screen'

type Route =
  | { name: 'login' }
  | { name: 'projects' }
  | {
      name: 'features'
      projectId: string
      projectName: string
    }
  | {
      name: 'test-cases'
      projectId: string
      projectName: string
      featureId: string
      featureName: string
    }
  | {
      name: 'steps'
      projectId: string
      projectName: string
      featureId: string
      featureName: string
      testCaseId: string
      testCaseName: string
      testCaseBaseUrl: string | null
    }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function routeFromNav(nav: NavState): Route | null {
  if (!nav.projectId || !nav.projectName) return null
  if (!nav.featureId || !nav.featureName) {
    return {
      name: 'features',
      projectId: nav.projectId,
      projectName: nav.projectName,
    }
  }
  if (!nav.testCaseId || !nav.testCaseName) {
    return {
      name: 'test-cases',
      projectId: nav.projectId,
      projectName: nav.projectName,
      featureId: nav.featureId,
      featureName: nav.featureName,
    }
  }
  return {
    name: 'steps',
    projectId: nav.projectId,
    projectName: nav.projectName,
    featureId: nav.featureId,
    featureName: nav.featureName,
    testCaseId: nav.testCaseId,
    testCaseName: nav.testCaseName,
    testCaseBaseUrl: nav.testCaseBaseUrl,
  }
}

function persistRoute(route: Route) {
  const base: NavState = {
    projectId: null,
    projectName: null,
    featureId: null,
    featureName: null,
    testCaseId: null,
    testCaseName: null,
    testCaseBaseUrl: null,
  }

  if (route.name === 'login' || route.name === 'projects') {
    void navStorage.setValue(base)
    return
  }

  const next: NavState = {
    ...base,
    projectId: route.projectId,
    projectName: route.projectName,
  }

  if (route.name === 'features') {
    void navStorage.setValue(next)
    return
  }

  next.featureId = route.featureId
  next.featureName = route.featureName

  if (route.name === 'test-cases') {
    void navStorage.setValue(next)
    return
  }

  next.testCaseId = route.testCaseId
  next.testCaseName = route.testCaseName
  next.testCaseBaseUrl = route.testCaseBaseUrl
  void navStorage.setValue(next)
}

function AppInner() {
  const [ready, setReady] = useState(false)
  const [route, setRoute] = useState<Route>({ name: 'login' })

  useEffect(() => {
    void (async () => {
      const auth = await getAuth()
      if (!auth) {
        setRoute({ name: 'login' })
        setReady(true)
        return
      }
      const nav = await navStorage.getValue()
      setRoute(routeFromNav(nav) ?? { name: 'projects' })
      setReady(true)
    })()
  }, [])

  const go = useCallback((next: Route) => {
    setRoute(next)
    persistRoute(next)
  }, [])

  const handleUnauthorized = useCallback(() => {
    void sendMessage({ type: 'CLEAR_AUTH' })
    queryClient.clear()
    go({ name: 'login' })
  }, [go])

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (route.name === 'login') {
    return (
      <LoginScreen
        onSuccess={() => {
          queryClient.clear()
          go({ name: 'projects' })
        }}
      />
    )
  }

  if (route.name === 'projects') {
    return (
      <ProjectsScreen
        onSelect={(project: Project) =>
          go({
            name: 'features',
            projectId: project.id,
            projectName: project.name,
          })
        }
        onSignOut={() => {
          void sendMessage({ type: 'CLEAR_AUTH' })
          queryClient.clear()
          go({ name: 'login' })
        }}
      />
    )
  }

  if (route.name === 'features') {
    return (
      <FeaturesScreen
        projectId={route.projectId}
        projectName={route.projectName}
        onBack={() => go({ name: 'projects' })}
        onSelect={(feature: FeatureSummary) =>
          go({
            name: 'test-cases',
            projectId: route.projectId,
            projectName: route.projectName,
            featureId: feature.id,
            featureName: feature.name,
          })
        }
      />
    )
  }

  if (route.name === 'test-cases') {
    return (
      <TestCasesScreen
        featureId={route.featureId}
        featureName={route.featureName}
        onBack={() =>
          go({
            name: 'features',
            projectId: route.projectId,
            projectName: route.projectName,
          })
        }
        onSelect={(testCase: TestCaseSummary) =>
          go({
            name: 'steps',
            projectId: route.projectId,
            projectName: route.projectName,
            featureId: route.featureId,
            featureName: route.featureName,
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            testCaseBaseUrl: testCase.baseUrl,
          })
        }
      />
    )
  }

  return (
    <StepsScreen
      testCaseId={route.testCaseId}
      testCaseName={route.testCaseName}
      testCaseBaseUrl={route.testCaseBaseUrl}
      onBack={() =>
        go({
          name: 'test-cases',
          projectId: route.projectId,
          projectName: route.projectName,
          featureId: route.featureId,
          featureName: route.featureName,
        })
      }
      onUnauthorized={handleUnauthorized}
    />
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster position="bottom-center" richColors closeButton />
    </QueryClientProvider>
  )
}
