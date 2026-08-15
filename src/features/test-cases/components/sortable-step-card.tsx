import { type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import { formatStepActionLabel } from '#/features/test-cases/utils/step-actions.ts'
import type { TestCaseStepAction } from '#/features/test-cases/utils/step-actions.ts'
import { cn } from '#/lib/utils.ts'

function StepCardShell({
  index,
  totalSteps,
  dragHandle,
  className,
  children,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number
  totalSteps: number
  dragHandle?: ReactNode
  className?: string
  children: ReactNode
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
}) {
  return (
    <article className={cn('rounded-xl border bg-card p-3', className)}>
      <div className="mb-3 flex items-center gap-2">
        {dragHandle}
        <p className="text-sm font-medium text-muted-foreground">
          #{index + 1}
        </p>
        <div className="ml-auto flex items-center gap-0.5">
          {index > 0 && onMoveUp ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Move step up"
              onClick={onMoveUp}
            >
              <ArrowUp />
            </Button>
          ) : null}
          {index < totalSteps - 1 && onMoveDown ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Move step down"
              onClick={onMoveDown}
            >
              <ArrowDown />
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Delete step"
              className="text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>
      {children}
    </article>
  )
}

export function SortableStepCard({
  id,
  index,
  totalSteps,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: {
  id: string
  index: number
  totalSteps: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  children: ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <StepCardShell
        index={index}
        totalSteps={totalSteps}
        className={cn(
          'transition-shadow',
          isDragging && 'opacity-40 shadow-none',
        )}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label={`Reorder step ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      >
        {children}
      </StepCardShell>
    </div>
  )
}

export function StepDragPreview({
  step,
  index,
}: {
  step: { action: TestCaseStepAction }
  index: number
}) {
  return (
    <StepCardShell
      index={index}
      totalSteps={index + 1}
      className="cursor-grabbing shadow-lg ring-2 ring-primary/20"
      dragHandle={
        <span className="text-muted-foreground">
          <GripVertical className="size-4" />
        </span>
      }
    >
      <p className="truncate text-sm text-muted-foreground">
        {formatStepActionLabel(step.action)}
      </p>
    </StepCardShell>
  )
}
