import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import { createClient, listTestCases } from '@/api/client'
import type { TestCaseSummary, TestRunStatus } from '@/api/types'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { getAuth } from '@/lib/storage'
import { cn } from '@/lib/utils'

type TestCasesScreenProps = {
  featureId: string
  featureName: string
  onBack: () => void
  onSelect: (testCase: TestCaseSummary) => void
}

function statusClass(status: TestRunStatus | null) {
  switch (status) {
    case 'passed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'failed':
    case 'error':
      return 'border-destructive/30 bg-destructive/10 text-destructive'
    case 'running':
    case 'queued':
    case 'pending':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    default:
      return ''
  }
}

export function TestCasesScreen({
  featureId,
  featureName,
  onBack,
  onSelect,
}: TestCasesScreenProps) {
  const query = useQuery({
    queryKey: ['test-cases', featureId],
    queryFn: async () => {
      const auth = await getAuth()
      if (!auth) throw new Error('Not signed in')
      return listTestCases(createClient(auth.apiKey, auth.apiUrl), featureId)
    },
  })

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Test cases" subtitle={featureName} onBack={onBack} />
      <div className="flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Loading test cases…
          </p>
        ) : query.isError ? (
          <p className="px-3 py-6 text-center text-xs text-destructive">
            {(query.error as Error).message}
          </p>
        ) : query.data?.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No test cases yet. Create them in the web app, then record steps
            here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {query.data?.map((testCase) => (
              <li key={testCase.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/60"
                  onClick={() => onSelect(testCase)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {testCase.name}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1">
                      <Badge>{testCase.stepCount} steps</Badge>
                      {testCase.latestRunStatus ? (
                        <Badge
                          className={cn(statusClass(testCase.latestRunStatus))}
                        >
                          {testCase.latestRunStatus}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
