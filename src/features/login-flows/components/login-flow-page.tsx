import { useCallback, useEffect, useState } from 'react'
import { LogIn, Plus, Save } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { LoginFlowStepsEditor } from '#/features/login-flows/components/login-flow-steps-editor.tsx'
import {
  getProjectLoginFlow,
  listLoginFlowSteps,
} from '#/features/login-flows/server/login-flows.ts'
import type {
  LoginFlowStep,
  LoginFlowSummary,
} from '#/features/login-flows/types/login-flow.ts'
import { LOGIN_FLOW_VARIABLES } from '#/features/login-flows/utils/login-flow-variables.ts'

export function LoginFlowPage() {
  const { project } = useActiveProject()
  const getFlowFn = useServerFn(getProjectLoginFlow)
  const listStepsFn = useServerFn(listLoginFlowSteps)
  const [loginFlow, setLoginFlow] = useState<LoginFlowSummary | null>(null)
  const [steps, setSteps] = useState<LoginFlowStep[]>([])
  const [loading, setLoading] = useState(true)

  const loadPage = useCallback(async () => {
    setLoading(true)

    try {
      const flow = await getFlowFn({ data: { projectId: project.id } })
      const nextSteps = await listStepsFn({ data: { loginFlowId: flow.id } })
      setLoginFlow(flow)
      setSteps(nextSteps)
    } catch {
      toast.error('Unable to load login flow')
    } finally {
      setLoading(false)
    }
  }, [getFlowFn, listStepsFn, project.id])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Available variables
          </CardTitle>
          <CardDescription>
            Use these placeholders in step values. They are replaced with the
            selected test account when a test case runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-3">
            {LOGIN_FLOW_VARIABLES.map((variable) => (
              <div
                key={variable.token}
                className="rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <dt>
                  <code className="text-sm font-medium">{variable.token}</code>
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {variable.description}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {loading || !loginFlow ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <LogIn className="size-4 text-muted-foreground" />
                {loginFlow.name}
              </CardTitle>
              <CardDescription>
                Runs automatically before test case steps when a test account is
                attached.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <LoginFlowStepsEditor
              key={`${loginFlow.id}-${loginFlow.updatedAt.toString()}-${steps.length}`}
              loginFlowId={loginFlow.id}
              initialSteps={steps}
              onSaved={async (result) => {
                setLoginFlow(result.loginFlow)
                setSteps(result.steps)
                toast.success('Login flow saved', {
                  description: `${result.steps.length} ${result.steps.length === 1 ? 'step' : 'steps'}.`,
                })
              }}
            >
              {({ fields, isSubmitting, isDirty, addStep, formId }) => (
                <div className="space-y-4">
                  {fields}
                  <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={addStep}
                    >
                      <Plus />
                      Add step
                    </Button>
                    <Button
                      type="submit"
                      form={formId}
                      disabled={isSubmitting || !isDirty}
                      className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                    >
                      <Save />
                      {isSubmitting ? 'Saving…' : 'Save login flow'}
                    </Button>
                  </div>
                </div>
              )}
            </LoginFlowStepsEditor>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
