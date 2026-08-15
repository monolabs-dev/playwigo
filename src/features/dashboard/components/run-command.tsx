import { useCallback, useEffect, useMemo, useState } from 'react'
import { CirclePlay, Loader2 } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { useRunAllTestCases } from '#/features/test-cases/hooks/use-run-all-test-cases.ts'
import {
  listProjectTestCasesFn,
  runTestCase,
} from '#/features/test-cases/server/test-cases.ts'
import type {
  ProjectTestCaseSummary,
  TestCaseSummary,
} from '#/features/test-cases/types/test-case.ts'
import { runStatusLabel } from '#/features/test-cases/utils/run-display.ts'
import {
  isActiveTestRunStatus,
} from '#/features/test-cases/utils/run-status.ts'

type FeatureGroup = {
  featureId: string
  featureName: string
  testCases: ProjectTestCaseSummary[]
  runnableCount: number
}

function groupByFeature(testCases: ProjectTestCaseSummary[]): FeatureGroup[] {
  const groups = new Map<string, FeatureGroup>()

  for (const testCase of testCases) {
    const existing = groups.get(testCase.featureId)

    if (existing) {
      existing.testCases.push(testCase)
      if (testCase.stepCount > 0) {
        existing.runnableCount += 1
      }
      continue
    }

    groups.set(testCase.featureId, {
      featureId: testCase.featureId,
      featureName: testCase.featureName,
      testCases: [testCase],
      runnableCount: testCase.stepCount > 0 ? 1 : 0,
    })
  }

  return [...groups.values()]
}

export function RunCommand() {
  const { project, runCommandOpen, setRunCommandOpen } = useActiveProject()
  const listFn = useServerFn(listProjectTestCasesFn)
  const runCaseFn = useServerFn(runTestCase)
  const [testCases, setTestCases] = useState<ProjectTestCaseSummary[]>([])
  const [loading, setLoading] = useState(false)

  const refreshTestCases = useCallback(async () => {
    const next = await listFn({ data: { projectId: project.id } })
    setTestCases(next)
    return next
  }, [listFn, project.id])

  const handleTestCaseUpdated = useCallback((testCase: TestCaseSummary) => {
    setTestCases((current) =>
      current.map((item) =>
        item.id === testCase.id ? { ...item, ...testCase } : item,
      ),
    )
  }, [])

  const { runningAll, runAll, runTestCase: runSingleTestCase } = useRunAllTestCases({
    runCaseFn,
    refreshTestCases,
    onTestCaseUpdated: handleTestCaseUpdated,
  })

  useEffect(() => {
    if (!runCommandOpen) {
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)

      try {
        const next = await listFn({ data: { projectId: project.id } })
        if (!cancelled) {
          setTestCases(next)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [listFn, project.id, runCommandOpen])

  const featureGroups = useMemo(() => groupByFeature(testCases), [testCases])

  async function handleRunTestCase(testCase: ProjectTestCaseSummary) {
    setRunCommandOpen(false)
    await runSingleTestCase(testCase)
  }

  async function handleRunFeature(group: FeatureGroup) {
    setRunCommandOpen(false)
    await runAll(group.featureName, group.testCases)
  }

  return (
    <CommandDialog
      open={runCommandOpen}
      onOpenChange={setRunCommandOpen}
      title="Run tests"
      description="Search and run test cases"
    >
      <Command>
        <CommandInput placeholder="Search features and test cases…" />
        <CommandList>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading test cases…
            </div>
          ) : testCases.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No test cases yet. Add test cases under Features, then run them
              here.
            </div>
          ) : (
            <>
              <CommandEmpty>No test case matches that search.</CommandEmpty>
              {featureGroups.map((group) => (
                <CommandGroup key={group.featureId} heading={group.featureName}>
                  {group.runnableCount > 0 ? (
                    <CommandItem
                      value={`run all ${group.featureName}`}
                      disabled={runningAll}
                      onSelect={() => void handleRunFeature(group)}
                    >
                      <CirclePlay />
                      <span className="min-w-0 flex-1 truncate">
                        Run all in {group.featureName}
                      </span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                        {group.runnableCount}
                      </span>
                    </CommandItem>
                  ) : null}
                  {group.testCases.map((testCase) => {
                    const isRunning = isActiveTestRunStatus(testCase.latestRunStatus)
                    const isRunnable = testCase.stepCount > 0 && !isRunning
                    const statusLabel = isRunning
                      ? runStatusLabel(testCase.latestRunStatus)
                      : testCase.stepCount === 0
                        ? 'No steps'
                        : runStatusLabel(testCase.latestRunStatus)

                    return (
                      <CommandItem
                        key={testCase.id}
                        value={`${group.featureName} ${testCase.name}`}
                        disabled={!isRunnable || runningAll}
                        onSelect={() => void handleRunTestCase(testCase)}
                      >
                        <CirclePlay />
                        <span className="min-w-0 flex-1 truncate">
                          {testCase.name}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {statusLabel}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
