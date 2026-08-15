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
  TestCaseStep,
  TestCaseSummary,
} from '#/features/test-cases/types/test-case.ts'

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
  const [loadedTestCaseId, setLoadedTestCaseId] = useState<string | null>(null)

  const testCaseId = testCase?.id
  const loading = !testCaseId || loadedTestCaseId !== testCaseId

  useEffect(() => {
    if (!open) {
      setLoadedTestCaseId(null)
      return
    }

    if (!testCaseId) {
      return
    }

    let cancelled = false

    void listFn({ data: { testCaseId } })
      .then((next) => {
        if (!cancelled) {
          setSteps(next)
          setTab(next.length === 0 ? 'editor' : 'steps')
          setLoadedTestCaseId(testCaseId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Unable to load steps')
          setSteps([])
          setTab('editor')
          setLoadedTestCaseId(testCaseId)
        }
      })

    return () => {
      cancelled = true
    }
  }, [listFn, open, testCaseId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
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

            {loading ? (
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : (
              <TestCaseStepsEditor
                key={testCase.id}
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
                {({
                  fields,
                  viewSteps,
                  isSubmitting,
                  isDirty,
                  addStep,
                  formId,
                }) => (
                  <>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <TabsContent value="steps" className="mt-0">
                        <TestCaseStepsView steps={viewSteps} />
                      </TabsContent>
                      <TabsContent
                        value="editor"
                        forceMount
                        hidden={tab !== 'editor'}
                        className="mt-0"
                      >
                        {fields}
                      </TabsContent>
                    </div>

                    <SheetFooter className="border-t">
                      {tab === 'steps' ? (
                        <SheetClose asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                          >
                            Close
                          </Button>
                        </SheetClose>
                      ) : (
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
                      )}
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
