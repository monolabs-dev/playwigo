import { useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import {
  SortableStepCard,
  StepDragPreview,
} from '#/features/test-cases/components/sortable-step-card.tsx'
import { StepSelectorField } from '#/features/test-cases/components/step-selector-field.tsx'
import {
  loginFlowStepFormSchema,
  loginFlowStepsFormSchema,
} from '#/features/login-flows/schemas/login-flow-step.ts'
import { replaceLoginFlowSteps } from '#/features/login-flows/server/login-flows.ts'
import type {
  LoginFlowStep,
  LoginFlowSummary,
} from '#/features/login-flows/types/login-flow.ts'
import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'
import { loginFlowValuePlaceholder } from '#/features/login-flows/utils/login-flow-variables.ts'
import {
  STEP_ACTION_LABELS,
  TEST_CASE_STEP_ACTIONS,
  fieldsForAction,
  normalizeSelectorType,
  normalizeStepAction,
  valuePlaceholderForAction,
  type TestCaseSelectorType,
  type TestCaseStepAction,
} from '#/features/test-cases/utils/step-actions.ts'
import { cn } from '#/lib/utils.ts'

export type LoginFlowStepFormValue = {
  clientId: string
  id?: string
  action: TestCaseStepAction
  selectorType: TestCaseSelectorType
  selector: string
  value: string
  outputVariable: string
  config: StepConfigJson
}

function firstError(errors: unknown[]) {
  const error = errors[0]
  if (!error) {
    return null
  }
  if (typeof error === 'string') {
    return error
  }
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return null
}

const LOGIN_FLOW_STEP_ACTIONS = TEST_CASE_STEP_ACTIONS.filter(
  (action) =>
    action !== 'setVariable' &&
    action !== 'extractText' &&
    action !== 'httpRequest',
) as TestCaseStepAction[]

function isStepAction(value: string): value is TestCaseStepAction {
  return (LOGIN_FLOW_STEP_ACTIONS as readonly string[]).includes(value)
}

function createStep(index: number): LoginFlowStepFormValue {
  if (index === 0) {
    return {
      clientId: crypto.randomUUID(),
      action: 'goto',
      selectorType: 'css',
      selector: '',
      value: '{{loginUrl}}',
      outputVariable: '',
      config: null,
    }
  }

  return {
    clientId: crypto.randomUUID(),
    action: 'fill',
    selectorType: 'css',
    selector: '',
    value: '',
    outputVariable: '',
    config: null,
  }
}

export function toLoginFlowStepFormValues(
  steps: LoginFlowStep[],
): LoginFlowStepFormValue[] {
  return steps.map((step) => ({
    clientId: step.id,
    id: step.id,
    action: normalizeStepAction(step.action),
    selectorType: normalizeSelectorType(step.selectorType),
    selector: step.selector ?? '',
    value: step.value ?? '',
    outputVariable: step.outputVariable ?? '',
    config: (step.config as StepConfigJson) ?? null,
  }))
}

function FieldError({ id, errors }: { id: string; errors: unknown[] }) {
  const message = firstError(errors)
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-xs text-destructive" role="alert">
      {message}
    </p>
  )
}

function placeholderForStep(action: TestCaseStepAction) {
  return loginFlowValuePlaceholder(action) ?? valuePlaceholderForAction(action)
}

export function LoginFlowStepsEditor({
  formId = 'login-flow-steps-form',
  loginFlowId,
  initialSteps,
  children,
  onSaved,
}: {
  formId?: string
  loginFlowId: string
  initialSteps: LoginFlowStep[]
  children: (state: {
    fields: ReactNode
    isSubmitting: boolean
    isDirty: boolean
    addStep: () => void
    formId: string
  }) => ReactNode
  onSaved: (result: {
    loginFlow: LoginFlowSummary
    steps: LoginFlowStep[]
  }) => void | Promise<void>
}) {
  const router = useRouter()
  const replaceFn = useServerFn(replaceLoginFlowSteps)
  const [error, setError] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const form = useForm({
    defaultValues: {
      steps: toLoginFlowStepFormValues(initialSteps),
    },
    validators: {
      onSubmit: loginFlowStepsFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const steps = value.steps.map((step) => {
          const parsed = loginFlowStepFormSchema.parse(step)
          const fields = fieldsForAction(parsed.action)

          return {
            id: parsed.id,
            action: parsed.action,
            selectorType: fields.selector ? parsed.selectorType : null,
            selector: fields.selector ? parsed.selector : null,
            value: fields.value ? parsed.value : null,
            outputVariable: fields.outputVariable
              ? parsed.outputVariable || null
              : null,
            config: fields.config ? (parsed.config ?? null) : null,
          }
        })

        const saved = await replaceFn({
          data: { loginFlowId, steps },
        })

        form.reset({ steps: toLoginFlowStepFormValues(saved.steps) })
        await onSaved(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save login flow. Try again.',
        )
      }
    },
  })

  function addStep() {
    const current = form.getFieldValue('steps')
    form.setFieldValue('steps', [...current, createStep(current.length)])
  }

  function moveStep(from: number, to: number) {
    const current = form.getFieldValue('steps')
    if (to < 0 || to >= current.length || from === to) {
      return
    }

    const next = [...current]
    const [moved] = next.splice(from, 1)
    if (!moved) {
      return
    }
    next.splice(to, 0, moved)
    form.setFieldValue('steps', next)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveStepId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveStepId(null)

    if (!over || active.id === over.id) {
      return
    }

    const current = form.getFieldValue('steps')
    const oldIndex = current.findIndex((step) => step.clientId === active.id)
    const newIndex = current.findIndex((step) => step.clientId === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    form.setFieldValue('steps', arrayMove(current, oldIndex, newIndex))
  }

  function removeStep(index: number) {
    const current = form.getFieldValue('steps')
    form.setFieldValue(
      'steps',
      current.filter((_, itemIndex) => itemIndex !== index),
    )
  }

  const fields = (
    <form
      id={formId}
      method="post"
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="steps">
        {(field) => (
          <>
            <p className="text-sm text-muted-foreground">
              {field.state.value.length}{' '}
              {field.state.value.length === 1 ? 'step' : 'steps'}
            </p>

            {field.state.value.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                <p className="text-sm font-medium">No login steps yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add steps to sign in before test cases run.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveStepId(null)}
              >
                <SortableContext
                  items={field.state.value.map((step) => step.clientId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {field.state.value.map((step, index) => (
                      <SortableStepCard
                        key={step.clientId}
                        id={step.clientId}
                        index={index}
                        totalSteps={field.state.value.length}
                        onMoveUp={() => moveStep(index, index - 1)}
                        onMoveDown={() => moveStep(index, index + 1)}
                        onRemove={() => removeStep(index)}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <form.Field name={`steps[${index}].action`}>
                            {(actionField) => {
                              const action = normalizeStepAction(
                                actionField.state.value,
                              )
                              const stepFields = fieldsForAction(action)

                              return (
                                <>
                                  <div className="space-y-1.5">
                                    <Label htmlFor={actionField.name}>
                                      Action
                                    </Label>
                                    <Select
                                      value={action}
                                      onValueChange={(value) => {
                                        if (isStepAction(value)) {
                                          actionField.handleChange(value)
                                        }
                                      }}
                                    >
                                      <SelectTrigger
                                        id={actionField.name}
                                        className="h-8 w-full"
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LOGIN_FLOW_STEP_ACTIONS.map(
                                          (stepAction) => (
                                            <SelectItem
                                              key={stepAction}
                                              value={stepAction}
                                            >
                                              {STEP_ACTION_LABELS[stepAction]}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {stepFields.selector ? (
                                    <form.Field
                                      name={`steps[${index}].selectorType`}
                                    >
                                      {(typeField) => (
                                        <form.Field
                                          name={`steps[${index}].selector`}
                                        >
                                          {(selectorField) => (
                                            <StepSelectorField
                                              id={`steps-${index}-selector`}
                                              type={normalizeSelectorType(
                                                typeField.state.value,
                                              )}
                                              query={selectorField.state.value}
                                              invalid={Boolean(
                                                firstError(
                                                  selectorField.state.meta
                                                    .errors,
                                                ),
                                              )}
                                              errorId={`${selectorField.name}-error`}
                                              error={firstError(
                                                selectorField.state.meta.errors,
                                              )}
                                              onTypeChange={
                                                typeField.handleChange
                                              }
                                              onQueryChange={
                                                selectorField.handleChange
                                              }
                                              onBlur={selectorField.handleBlur}
                                            />
                                          )}
                                        </form.Field>
                                      )}
                                    </form.Field>
                                  ) : null}

                                  {stepFields.value ? (
                                    <div
                                      className={cn(
                                        'space-y-1.5',
                                        stepFields.selector && 'sm:col-span-2',
                                      )}
                                    >
                                      <form.Field
                                        name={`steps[${index}].value`}
                                      >
                                        {(valueField) => (
                                          <>
                                            <Label htmlFor={valueField.name}>
                                              Value
                                            </Label>
                                            <Input
                                              id={valueField.name}
                                              name={valueField.name}
                                              value={valueField.state.value}
                                              onBlur={valueField.handleBlur}
                                              onChange={(event) =>
                                                valueField.handleChange(
                                                  event.target.value,
                                                )
                                              }
                                              placeholder={placeholderForStep(
                                                action,
                                              )}
                                              spellCheck={false}
                                              autoComplete="off"
                                              aria-invalid={Boolean(
                                                firstError(
                                                  valueField.state.meta.errors,
                                                ),
                                              )}
                                              className="h-8"
                                            />
                                            <FieldError
                                              id={`${valueField.name}-error`}
                                              errors={
                                                valueField.state.meta.errors
                                              }
                                            />
                                          </>
                                        )}
                                      </form.Field>
                                    </div>
                                  ) : null}
                                </>
                              )
                            }}
                          </form.Field>
                        </div>
                      </SortableStepCard>
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                  {(() => {
                    if (!activeStepId) {
                      return null
                    }

                    const activeIndex = field.state.value.findIndex(
                      (step) => step.clientId === activeStepId,
                    )
                    const activeStep = field.state.value[activeIndex]

                    if (!activeStep) {
                      return null
                    }

                    return (
                      <StepDragPreview step={activeStep} index={activeIndex} />
                    )
                  })()}
                </DragOverlay>
              </DndContext>
            )}
          </>
        )}
      </form.Field>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )

  return (
    <form.Subscribe
      selector={(state) =>
        [state.isSubmitting, state.isDirty, state.values.steps] as const
      }
    >
      {([isSubmitting, isDirty]) =>
        children({
          fields,
          isSubmitting,
          isDirty,
          addStep,
          formId,
        })
      }
    </form.Subscribe>
  )
}
