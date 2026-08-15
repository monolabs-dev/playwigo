import type { ReactNode } from 'react'

import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'

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

export function TestCaseField({
  label,
  name,
  value,
  onBlur,
  onChange,
  errors,
  hint,
  placeholder,
  autoFocus,
  inputMode,
}: {
  label: string
  name: string
  value: string
  onBlur: () => void
  onChange: (value: string) => void
  errors: unknown[]
  hint?: ReactNode
  placeholder?: string
  autoFocus?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  const message = firstError(errors)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="text"
        autoComplete="off"
        autoFocus={autoFocus}
        spellCheck={false}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${name}-error` : undefined}
        className="h-11 rounded-xl px-3"
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
