import { MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Separator } from '#/components/ui/separator.tsx'
import {
  SELECTOR_TYPE_LABELS,
  TEST_CASE_SELECTOR_TYPES,
  formatSelectorSummary,
  type TestCaseSelectorType,
} from '#/features/test-cases/utils/step-actions.ts'
import { cn } from '#/lib/utils.ts'

function isSelectorType(value: string): value is TestCaseSelectorType {
  return (TEST_CASE_SELECTOR_TYPES as readonly string[]).includes(value)
}

export function StepSelectorField({
  id,
  type,
  query,
  invalid,
  errorId,
  error,
  onTypeChange,
  onQueryChange,
  onBlur,
}: {
  id: string
  type: TestCaseSelectorType
  query: string
  invalid?: boolean
  errorId?: string
  error?: string | null
  onTypeChange: (type: TestCaseSelectorType) => void
  onQueryChange: (query: string) => void
  onBlur: () => void
}) {
  const summary = formatSelectorSummary(type, query)

  function handlePickElement() {
    toast.info('Element picking is only available in the browser extension')
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Selector</Label>
      <Popover onOpenChange={(next) => !next && onBlur()}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-invalid={invalid}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 text-left font-mono text-sm outline-none transition-colors',
              'hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              'dark:bg-input/30',
              invalid &&
                'border-destructive ring-3 ring-destructive/20 dark:border-destructive/50',
              !summary && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{summary ?? 'Choose a selector'}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 gap-3 p-3"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement | null
            if (target?.closest('[data-slot="select-content"]')) {
              event.preventDefault()
            }
          }}
        >
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full"
            onClick={handlePickElement}
          >
            <MousePointer2 />
            Pick an element
          </Button>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-type`}>Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                if (isSelectorType(value)) {
                  onTypeChange(value)
                }
              }}
            >
              <SelectTrigger id={`${id}-type`} className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEST_CASE_SELECTOR_TYPES.map((selectorType) => (
                  <SelectItem key={selectorType} value={selectorType}>
                    {SELECTOR_TYPE_LABELS[selectorType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${id}-query`}>Query</Label>
            <Input
              id={`${id}-query`}
              name={`${id}-query`}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onBlur={onBlur}
              placeholder={
                type === 'id'
                  ? 'email'
                  : type === 'class'
                    ? 'btn-primary'
                    : 'locator'
              }
              spellCheck={false}
              autoComplete="off"
              aria-invalid={invalid}
              className="h-8 font-mono"
            />
          </div>
        </PopoverContent>
      </Popover>
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
