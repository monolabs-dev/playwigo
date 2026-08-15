import type { ReactNode } from 'react'

import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'

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

export function FeatureField({
  label,
  name,
  kind = 'input',
  value,
  onBlur,
  onChange,
  errors,
  hint,
  placeholder,
  autoFocus,
}: {
  label: string
  name: string
  kind?: 'input' | 'textarea'
  value: string
  onBlur: () => void
  onChange: (value: string) => void
  errors: unknown[]
  hint?: ReactNode
  placeholder?: string
  autoFocus?: boolean
}) {
  const message = firstError(errors)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {kind === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          autoComplete="off"
          autoFocus={autoFocus}
          spellCheck
          placeholder={placeholder}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${name}-error` : undefined}
          className="min-h-24 rounded-xl px-3 py-2.5"
        />
      ) : (
        <Input
          id={name}
          name={name}
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${name}-error` : undefined}
          className="h-11 rounded-xl px-3"
        />
      )}
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
