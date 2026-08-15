import { useEffect, useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs.tsx'
import { TestCaseStepsEditor } from '#/features/test-cases/components/test-case-steps-editor.tsx'
import { TestCaseStepsView } from '#/features/test-cases/components/test-case-steps-view.tsx'
import { listTestCaseSteps } from '#/features/test-cases/server/test-cases.ts'
import type {
  TestCaseLoginPrelude,
  TestCaseStep,
  TestCaseSummary,
} from '#/features/test-cases/types/test-case.ts'
import {
  stepListHasRun,
  toStepViewItems,
} from '#/features/test-cases/utils/step-view-items.ts'
import { isActiveTestRunStatus } from '#/features/test-cases/utils/run-status.ts'

const POLL_INTERVAL_MS = 1500

export function TestCaseStepsSheet({
  testCase,
  open,
  onOpenChange,
  onSaved,
}: {
  testCase: TestCaseSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (testCase: TestCaseSummary) => void
}) {
  const listFn = useServerFn(listTestCaseSteps)
  const [tab, setTab] = useState('steps')
  const [steps, setSteps] = useState<TestCaseStep[]>([])
  const [loginPrelude, setLoginPrelude] = useState<TestCaseLoginPrelude | null>(
    null,
  )
  const [loadingSteps, setLoadingSteps] = useState(false)

  const testCaseId = testCase?.id
  const isRunning = isActiveTestRunStatus(testCase?.latestRunStatus)
  const runRevision = [
    testCaseId,
    testCase?.latestRunStatus,
    testCase?.latestRunAt ? String(testCase.latestRunAt) : '',
    testCase?.latestRunDurationMs,
  ].join(':')

  useEffect(() => {
    if (!open) {
      return
    }

    if (!testCaseId) {
      return
    }

    let cancelled = false
    setLoadingSteps(true)

    void listFn({ data: { testCaseId } })
      .then((next) => {
        if (!cancelled) {
          setSteps(next.steps)
          setLoginPrelude(next.loginPrelude)
          setTab(next.steps.length === 0 ? 'editor' : 'steps')
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Unable to load steps')
          setSteps([])
          setTab('editor')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSteps(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [listFn, open, runRevision, testCaseId])

  useEffect(() => {
    if (!open || !testCaseId || !isRunning) {
      return
    }

    const interval = window.setInterval(() => {
      void listFn({ data: { testCaseId } })
        .then((next) => {
          setSteps(next.steps)
          setLoginPrelude(next.loginPrelude)
        })
        .catch(() => {})
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [isRunning, listFn, open, testCaseId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-hidden p-0 data-[side=right]:w-2/5 data-[side=right]:max-w-none data-[side=right]:sm:max-w-none">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="font-display text-xl font-semibold tracking-tight">
            {testCase?.name ?? 'Test case steps'}
          </SheetTitle>
          <SheetDescription>
            Create and manage steps for this test case.
          </SheetDescription>
        </SheetHeader>

        {open && testCase ? (
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="px-4 pt-3">
              <TabsList className="w-full">
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
              </TabsList>
            </div>

            {loadingSteps ? (
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : tab === 'steps' ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <TabsContent value="steps" className="mt-0">
                    <TestCaseStepsView
                      steps={toStepViewItems(steps)}
                      loginPrelude={loginPrelude}
                      hasRun={
                        stepListHasRun(steps) ||
                        loginPrelude?.runStatus !== null ||
                        testCase.latestRunStatus !== null
                      }
                    />
                  </TabsContent>
                </div>
                <SheetFooter className="border-t">
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                    >
                      Close
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </>
            ) : (
              <TestCaseStepsEditor
                key={`${testCase.id}-${runRevision}`}
                testCaseId={testCase.id}
                defaultBaseUrl={testCase.baseUrl}
                initialSteps={steps}
                onSaved={async (result) => {
                  setSteps(result.steps)
                  onSaved(result.testCase)
                  toast.success('Steps saved', {
                    description: `${result.steps.length} ${result.steps.length === 1 ? 'step' : 'steps'} in “${result.testCase.name}”.`,
                  })
                }}
              >
                {({ fields, isSubmitting, isDirty, addStep, formId }) => (
                  <>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <TabsContent
                        value="editor"
                        forceMount
                        className="mt-0"
                      >
                        {fields}
                      </TabsContent>
                    </div>

                    <SheetFooter className="border-t">
                      <div className="flex w-full items-center gap-2">
                        <SheetClose asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                          >
                            Close
                          </Button>
                        </SheetClose>
                        <Button
                          type="button"
                          className="flex-1 transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                          disabled={isSubmitting}
                          onClick={addStep}
                        >
                          <Plus />
                          Add step
                        </Button>
                        <Button
                          type="submit"
                          form={formId}
                          variant="outline"
                          disabled={isSubmitting || !isDirty}
                          className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                        >
                          <Save />
                          {isSubmitting ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </SheetFooter>
                  </>
                )}
              </TestCaseStepsEditor>
            )}
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
