import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CircleDot,
  Crosshair,
  GripVertical,
  Loader2,
  Plus,
  Square,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  STEP_ACTION_LABELS,
  TEST_CASE_SELECTOR_TYPES,
  TEST_CASE_STEP_ACTIONS,
  fieldsForAction,
  type BufferedStep,
  type TestCaseLoginPrelude,
  type TestCaseStepAction,
} from '@/api/types'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  sendMessage,
  type ExtensionResponse,
  type SessionSnapshot,
} from '@/lib/messaging'
import { createEmptyStep } from '@/lib/validate-steps'
import { cn } from '@/lib/utils'

type StepsScreenProps = {
  testCaseId: string
  testCaseName: string
  testCaseBaseUrl: string | null
  onBack: () => void
  onUnauthorized: () => void
}

function SortableStepCard({
  step,
  expanded,
  picking,
  onToggle,
  onChange,
  onRemove,
  onPick,
}: {
  step: BufferedStep
  expanded: boolean
  picking: boolean
  onToggle: () => void
  onChange: (next: BufferedStep) => void
  onRemove: () => void
  onPick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.clientId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fields = fieldsForAction(step.action)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-border bg-card',
        isDragging && 'opacity-70 shadow-md',
        picking && 'ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-center gap-1 px-1.5 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggle}
        >
          <div className="flex items-center gap-1.5">
            <Badge className="shrink-0">{STEP_ACTION_LABELS[step.action]}</Badge>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {fields.selector
                ? step.selector || '—'
                : fields.value
                  ? step.value || '—'
                  : step.outputVariable || '—'}
            </span>
          </div>
          {step.warning ? (
            <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
              {step.warning}
            </p>
          ) : null}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Delete step"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-2 border-t border-border px-2.5 py-2.5">
          <div className="space-y-1">
            <Label>Action</Label>
            <Select
              value={step.action}
              onChange={(e) => {
                const action = e.target.value as TestCaseStepAction
                onChange({
                  ...createEmptyStep(action, {
                    clientId: step.clientId,
                    id: step.id,
                  }),
                  ...(fieldsForAction(action).selector
                    ? {
                        selector: step.selector,
                        selectorType: step.selectorType,
                      }
                    : {}),
                  ...(fieldsForAction(action).value
                    ? { value: step.value }
                    : {}),
                })
              }}
            >
              {TEST_CASE_STEP_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {STEP_ACTION_LABELS[action]}
                </option>
              ))}
            </Select>
          </div>

          {fields.selector ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label>Selector</Label>
                <Button
                  type="button"
                  variant={picking ? 'default' : 'outline'}
                  size="sm"
                  onClick={onPick}
                >
                  <Crosshair className="size-3.5" />
                  {picking ? 'Picking…' : 'Pick'}
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Select
                  className="w-[88px] shrink-0"
                  value={step.selectorType}
                  onChange={(e) =>
                    onChange({
                      ...step,
                      selectorType: e.target
                        .value as BufferedStep['selectorType'],
                    })
                  }
                >
                  {TEST_CASE_SELECTOR_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                <Input
                  className="font-mono text-xs"
                  value={step.selector}
                  onChange={(e) =>
                    onChange({ ...step, selector: e.target.value })
                  }
                  placeholder="css / id / xpath…"
                />
              </div>
            </div>
          ) : null}

          {fields.value ? (
            <div className="space-y-1">
              <Label>Value</Label>
              <Input
                value={step.value}
                onChange={(e) => onChange({ ...step, value: e.target.value })}
                placeholder="Value"
              />
            </div>
          ) : null}

          {fields.outputVariable ? (
            <div className="space-y-1">
              <Label>Output variable</Label>
              <Input
                value={step.outputVariable}
                onChange={(e) =>
                  onChange({ ...step, outputVariable: e.target.value })
                }
                placeholder="otp"
              />
            </div>
          ) : null}

          {step.action === 'setVariable' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={
                    (step.config as { name?: string } | null)?.name ?? ''
                  }
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        name: e.target.value,
                        value:
                          (step.config as { value?: string } | null)?.value ??
                          '',
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Value</Label>
                <Input
                  value={
                    (step.config as { value?: string } | null)?.value ?? ''
                  }
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        name:
                          (step.config as { name?: string } | null)?.name ??
                          '',
                        value: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          {step.action === 'extractText' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Attribute</Label>
                <Input
                  value={
                    (step.config as { attribute?: string | null } | null)
                      ?.attribute ?? ''
                  }
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        attribute: e.target.value || null,
                        regex:
                          (step.config as { regex?: string | null } | null)
                            ?.regex ?? null,
                      },
                    })
                  }
                  placeholder="optional"
                />
              </div>
              <div className="space-y-1">
                <Label>Regex</Label>
                <Input
                  value={
                    (step.config as { regex?: string | null } | null)?.regex ??
                    ''
                  }
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        attribute:
                          (step.config as { attribute?: string | null } | null)
                            ?.attribute ?? null,
                        regex: e.target.value || null,
                      },
                    })
                  }
                  placeholder="optional"
                />
              </div>
            </div>
          ) : null}

          {step.action === 'httpRequest' ? (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <Select
                  className="w-[96px] shrink-0"
                  value={
                    (step.config as { method?: string } | null)?.method ??
                    'GET'
                  }
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        ...(step.config as object),
                        method: e.target.value as
                          | 'GET'
                          | 'POST'
                          | 'PUT'
                          | 'PATCH'
                          | 'DELETE',
                        url:
                          (step.config as { url?: string } | null)?.url ?? '',
                      },
                    })
                  }
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </Select>
                <Input
                  value={(step.config as { url?: string } | null)?.url ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...step,
                      config: {
                        method:
                          (step.config as { method?: 'GET' } | null)?.method ??
                          'GET',
                        url: e.target.value,
                      },
                    })
                  }
                  placeholder="https://…"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function StepsScreen({
  testCaseId,
  testCaseName,
  testCaseBaseUrl,
  onBack,
  onUnauthorized,
}: StepsScreenProps) {
  const [session, setSession] = useState<SessionSnapshot | null>(null)
  const [loginPrelude, setLoginPrelude] =
    useState<TestCaseLoginPrelude>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const refresh = useCallback(async () => {
    const snap = await sendMessage<SessionSnapshot>({ type: 'GET_SESSION' })
    setSession(snap)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const result = await sendMessage<
        ExtensionResponse & {
          data?: SessionSnapshot & { loginPrelude?: TestCaseLoginPrelude }
        }
      >({
        type: 'LOAD_STEPS',
        testCaseId,
        baseUrl: testCaseBaseUrl,
      })
      if (cancelled) return
      if (!result.ok) {
        if (result.code === 'unauthorized') onUnauthorized()
        toast.error(result.error ?? 'Failed to load steps')
        setLoading(false)
        return
      }
      const data = result.data
      if (data) {
        setSession({
          tabId: data.tabId,
          testCaseId: data.testCaseId,
          recording: data.recording,
          picking: data.picking,
          pickClientId: data.pickClientId,
          steps: data.steps,
          dirty: data.dirty,
        })
        setLoginPrelude(data.loginPrelude ?? null)
      }
      setLoading(false)
    })()

    const onMessage = (message: { type?: string }) => {
      if (message?.type === 'SESSION_UPDATED') {
        void refresh()
      }
    }
    browser.runtime.onMessage.addListener(onMessage)
    return () => {
      cancelled = true
      browser.runtime.onMessage.removeListener(onMessage)
    }
  }, [testCaseId, testCaseBaseUrl, onUnauthorized, refresh])

  async function updateSteps(steps: BufferedStep[], dirty = true) {
    setSession((prev) => (prev ? { ...prev, steps, dirty } : prev))
    await sendMessage({ type: 'SET_STEPS', steps, dirty })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !session || active.id === over.id) return
    const oldIndex = session.steps.findIndex((s) => s.clientId === active.id)
    const newIndex = session.steps.findIndex((s) => s.clientId === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    await updateSteps(arrayMove(session.steps, oldIndex, newIndex))
  }

  async function handleRecordToggle() {
    if (!session) return
    if (session.recording) {
      const result = await sendMessage<ExtensionResponse>({
        type: 'STOP_RECORDING',
      })
      if (!result.ok) toast.error(result.error ?? 'Failed to stop')
      await refresh()
      return
    }
    const result = await sendMessage<ExtensionResponse>({
      type: 'START_RECORDING',
    })
    if (!result.ok) {
      toast.error(result.error ?? 'Failed to start recording')
      return
    }
    toast.message('Recording — interact with the active tab · Alt/⌥+click = hover')
    await refresh()
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await sendMessage<ExtensionResponse>({ type: 'SAVE_STEPS' })
      if (!result.ok) {
        if (result.code === 'unauthorized') {
          onUnauthorized()
          return
        }
        toast.error(result.error ?? 'Save failed')
        return
      }
      toast.success('Steps saved')
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDiscard() {
    const result = await sendMessage<ExtensionResponse>({ type: 'DISCARD_STEPS' })
    if (!result.ok) {
      toast.error(result.error ?? 'Discard failed')
      return
    }
    toast.message('Changes discarded')
    await refresh()
  }

  async function handlePick(clientId: string) {
    if (session?.picking && session.pickClientId === clientId) {
      await sendMessage({ type: 'STOP_PICK' })
      await refresh()
      return
    }
    setExpandedId(clientId)
    const result = await sendMessage<ExtensionResponse>({
      type: 'START_PICK',
      clientId,
    })
    if (!result.ok) {
      toast.error(result.error ?? 'Pick failed')
      return
    }
    toast.message('Click an element · hold Alt/⌥ + click for Hover · Esc to cancel')
    await refresh()
  }

  if (loading || !session) {
    return (
      <div className="flex h-full flex-col">
        <AppHeader title={testCaseName} subtitle="Steps" onBack={onBack} />
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">
          Loading steps…
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        title={testCaseName}
        subtitle={session.dirty ? 'Unsaved changes' : 'Steps'}
        onBack={onBack}
        actions={
          <Button
            type="button"
            variant={session.recording ? 'destructive' : 'default'}
            size="sm"
            onClick={() => void handleRecordToggle()}
          >
            {session.recording ? (
              <>
                <Square className="size-3.5 fill-current" />
                Stop
              </>
            ) : (
              <>
                <CircleDot className="size-3.5" />
                Record
              </>
            )}
          </Button>
        }
      />

      {session.recording ? (
        <div className="border-b border-border bg-violet-500/10 px-3 py-1.5 text-[11px] text-muted-foreground">
          Recording… Normal click = Click ·{' '}
          <kbd className="rounded border border-border bg-background px-1 font-mono text-[10px]">
            Alt
          </kbd>
          /
          <kbd className="rounded border border-border bg-background px-1 font-mono text-[10px]">
            ⌥
          </kbd>{' '}
          + click = Hover
        </div>
      ) : null}

      {loginPrelude ? (
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          Login prelude ({loginPrelude.stepCount} steps via{' '}
          {loginPrelude.testAccountName}) runs automatically and is not edited
          here.
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddOpen((v) => !v)}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
          {addOpen ? (
            <div className="absolute top-full left-0 z-20 mt-1 max-h-56 w-52 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
              {TEST_CASE_STEP_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  onClick={() => {
                    const step = createEmptyStep(action)
                    void updateSteps([...session.steps, step])
                    setExpandedId(step.clientId)
                    setAddOpen(false)
                  }}
                >
                  {STEP_ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex-1" />
        {session.dirty ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleDiscard()}
          >
            Discard
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!session.dirty || saving}
          onClick={() => void handleSave()}
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {session.steps.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            No steps yet. Hit Record and interact with the page, or add a step
            manually.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void handleDragEnd(event)}
          >
            <SortableContext
              items={session.steps.map((s) => s.clientId)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1.5">
                {session.steps.map((step) => (
                  <SortableStepCard
                    key={step.clientId}
                    step={step}
                    expanded={expandedId === step.clientId}
                    picking={
                      Boolean(session.picking) &&
                      session.pickClientId === step.clientId
                    }
                    onToggle={() =>
                      setExpandedId((id) =>
                        id === step.clientId ? null : step.clientId,
                      )
                    }
                    onChange={(next) => {
                      void updateSteps(
                        session.steps.map((s) =>
                          s.clientId === next.clientId ? next : s,
                        ),
                      )
                    }}
                    onRemove={() => {
                      void updateSteps(
                        session.steps.filter(
                          (s) => s.clientId !== step.clientId,
                        ),
                      )
                    }}
                    onPick={() => void handlePick(step.clientId)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
