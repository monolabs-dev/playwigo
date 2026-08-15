import type { ReactNode, ComponentProps } from 'react'

import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { cn } from '#/lib/utils.ts'

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

export function ProjectField({
  label,
  name,
  type = 'text',
  inputMode,
  value,
  onBlur,
  onChange,
  errors,
  hint,
  placeholder,
  autoFocus,
  autoComplete = 'off',
}: {
  label: string
  name: string
  type?: string
  inputMode?: ComponentProps<'input'>['inputMode']
  value: string
  onBlur: () => void
  onChange: (value: string) => void
  errors: unknown[]
  hint?: ReactNode
  placeholder?: string
  autoFocus?: boolean
  autoComplete?: string
}) {
  const message = firstError(errors)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${name}-error` : undefined}
        className={cn('h-11 rounded-xl px-3')}
      />
      {message ? (
        <p
          id={`${name}-error`}
          className="text-sm text-destructive"
          role="alert"
        >
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
