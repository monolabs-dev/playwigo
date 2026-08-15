import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'
import {
  isActiveTestRunStatus,
  isTerminalTestRunStatus,
} from '#/features/test-cases/utils/run-status.ts'

const POLL_INTERVAL_MS = 1500

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

type RunTestCaseFn = (input: {
  data: { testCaseId: string }
}) => Promise<{ testCase: TestCaseSummary }>

export function useRunAllTestCases({
  runCaseFn,
  refreshTestCases,
  onTestCaseUpdated,
}: {
  runCaseFn: RunTestCaseFn
  refreshTestCases: () => Promise<TestCaseSummary[]>
  onTestCaseUpdated?: (testCase: TestCaseSummary) => void
}) {
  const [runningAll, setRunningAll] = useState(false)

  const waitForTestCaseCompletion = useCallback(
    async (testCaseId: string) => {
      while (true) {
        const nextCases = await refreshTestCases()
        const testCase = nextCases.find((item) => item.id === testCaseId)

        if (!testCase || !isActiveTestRunStatus(testCase.latestRunStatus)) {
          return testCase ?? null
        }

        await delay(POLL_INTERVAL_MS)
      }
    },
    [refreshTestCases],
  )

  const runTestCase = useCallback(
    async (testCase: TestCaseSummary) => {
      if (testCase.stepCount === 0) {
        toast.error('No steps to run', {
          description: `Add steps to “${testCase.name}” before running it.`,
        })
        return null
      }

      if (isActiveTestRunStatus(testCase.latestRunStatus)) {
        toast.info('Already running', {
          description: `${testCase.name} is still executing.`,
        })
        return null
      }

      try {
        const result = await runCaseFn({ data: { testCaseId: testCase.id } })
        onTestCaseUpdated?.(result.testCase)
        return result
      } catch (error) {
        toast.error('Unable to run test case', {
          description:
            error instanceof Error ? error.message : 'Try again in a moment.',
        })
        return null
      }
    },
    [onTestCaseUpdated, runCaseFn],
  )

  const runAll = useCallback(
    async (featureName: string, testCases: TestCaseSummary[]) => {
      const runnableCases = testCases.filter((testCase) => testCase.stepCount > 0)

      if (runnableCases.length === 0) {
        toast.error('No runnable test cases', {
          description: 'Add steps to at least one test case before running.',
        })
        return false
      }

      setRunningAll(true)

      try {
        let passed = 0
        let failed = 0

        for (const testCase of runnableCases) {
          const started = await runTestCase(testCase)
          if (!started) {
            continue
          }

          const completed = await waitForTestCaseCompletion(testCase.id)
          if (completed?.latestRunStatus === 'passed') {
            passed += 1
          } else if (
            completed &&
            isTerminalTestRunStatus(completed.latestRunStatus)
          ) {
            failed += 1
          }
        }

        if (failed === 0) {
          toast.success('All tests passed', {
            description: `${passed} test case${passed === 1 ? '' : 's'} passed in ${featureName}.`,
          })
        } else {
          toast.error('Some tests failed', {
            description: `${passed} passed, ${failed} failed in ${featureName}.`,
          })
        }

        return true
      } finally {
        setRunningAll(false)
      }
    },
    [runTestCase, waitForTestCaseCompletion],
  )

  return {
    runningAll,
    runAll,
    runTestCase,
  }
}
