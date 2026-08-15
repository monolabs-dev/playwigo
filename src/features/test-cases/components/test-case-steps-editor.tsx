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
  testCaseStepFormSchema,
  testCaseStepsFormSchema,
} from '#/features/test-cases/schemas/test-case-step.ts'
import { replaceTestCaseSteps } from '#/features/test-cases/server/test-cases.ts'
import type {
  TestCaseStep,
  TestCaseSummary,
} from '#/features/test-cases/types/test-case.ts'
import {
  STEP_ACTION_LABELS,
  TEST_CASE_STEP_ACTIONS,
  fieldsForAction,
  normalizeSelectorType,
  normalizeStepAction,
  valuePlaceholderForAction,
  formatStepActionLabel,
  type TestCaseSelectorType,
  type TestCaseStepAction,
} from '#/features/test-cases/utils/step-actions.ts'
import { cn } from '#/lib/utils.ts'

export type StepFormValue = {
  clientId: string
  id?: string
  action: TestCaseStepAction
  selectorType: TestCaseSelectorType
  selector: string
  value: string
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

function isStepAction(value: string): value is TestCaseStepAction {
  return (TEST_CASE_STEP_ACTIONS as readonly string[]).includes(value)
}

function createStep(
  index: number,
  defaultBaseUrl: string | null,
): StepFormValue {
  if (index === 0) {
    return {
      clientId: crypto.randomUUID(),
      action: 'goto',
      selectorType: 'css',
      selector: '',
      value: defaultBaseUrl ?? '',
    }
  }

  return {
    clientId: crypto.randomUUID(),
    action: 'click',
    selectorType: 'id',
    selector: '',
    value: '',
  }
}

export function toStepFormValues(steps: TestCaseStep[]): StepFormValue[] {
  return steps.map((step) => ({
    clientId: step.id,
    id: step.id,
    action: normalizeStepAction(step.action),
    selectorType: normalizeSelectorType(step.selectorType),
    selector: step.selector ?? '',
    value: step.value ?? '',
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

export function TestCaseStepsEditor({
  formId = 'test-case-steps-form',
  testCaseId,
  defaultBaseUrl,
  initialSteps,
  children,
  onSaved,
}: {
  formId?: string
  testCaseId: string
  defaultBaseUrl: string | null
  initialSteps: TestCaseStep[]
  children: (state: {
    fields: ReactNode
    viewSteps: Array<{
      id: string
      action: string
      selector: string | null
      selectorType: string | null
      value: string | null
      screenshotUrl: string | null
    }>
    isSubmitting: boolean
    isDirty: boolean
    addStep: () => void
    formId: string
  }) => ReactNode
  onSaved: (result: {
    testCase: TestCaseSummary
    steps: TestCaseStep[]
  }) => void | Promise<void>
}) {
  const router = useRouter()
  const replaceFn = useServerFn(replaceTestCaseSteps)
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
      steps: toStepFormValues(initialSteps),
    },
    validators: {
      onSubmit: testCaseStepsFormSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      try {
        const steps = value.steps.map((step) => {
          const parsed = testCaseStepFormSchema.parse(step)
          const fields = fieldsForAction(parsed.action)

          return {
            id: parsed.id,
            action: parsed.action,
            selectorType: fields.selector ? parsed.selectorType : null,
            selector: fields.selector ? parsed.selector : null,
            value: fields.value ? parsed.value : null,
          }
        })

        const saved = await replaceFn({
          data: { testCaseId, steps },
        })

        form.reset({ steps: toStepFormValues(saved.steps) })
        await onSaved(saved)
        await router.invalidate({ sync: true })
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to save steps. Try again.',
        )
      }
    },
  })

  function addStep() {
    const current = form.getFieldValue('steps')
    form.setFieldValue('steps', [
      ...current,
      createStep(current.length, defaultBaseUrl),
    ])
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
                <p className="text-sm font-medium">No steps yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a step to tell Playwright what to do.
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
                              const fields = fieldsForAction(action)

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
                                        {TEST_CASE_STEP_ACTIONS.map(
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

                                  {fields.selector ? (
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

                                  {fields.value ? (
                                    <div
                                      className={cn(
                                        'space-y-1.5',
                                        fields.selector && 'sm:col-span-2',
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
                                              placeholder={valuePlaceholderForAction(
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
      {([isSubmitting, isDirty, formSteps]) =>
        children({
          fields,
          viewSteps: formSteps.map((step) => {
            const saved = step.id
              ? initialSteps.find((item) => item.id === step.id)
              : undefined
            const fieldsForStep = fieldsForAction(
              normalizeStepAction(step.action),
            )

            return {
              id: step.id ?? step.clientId,
              action: formatStepActionLabel(step.action),
              selector: fieldsForStep.selector ? step.selector || null : null,
              selectorType: fieldsForStep.selector ? step.selectorType : null,
              value: fieldsForStep.value ? step.value || null : null,
              screenshotUrl: saved?.screenshotUrl ?? null,
            }
          }),
          isSubmitting,
          isDirty,
          addStep,
          formId,
        })
      }
    </form.Subscribe>
  )
}
