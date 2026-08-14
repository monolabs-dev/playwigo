import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

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

export function AuthField({
  label,
  name,
  type,
  autoComplete,
  value,
  onBlur,
  onChange,
  errors,
  hint,
}: {
  label: string
  name: string
  type: string
  autoComplete: string
  value: string
  onBlur: () => void
  onChange: (value: string) => void
  errors: unknown[]
  hint?: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  const message = firstError(errors)
  const isPassword = type === 'password'
  const inputType = isPassword && visible ? 'text' : type

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${name}-error` : undefined}
          className={cn('h-11 rounded-xl px-3', isPassword && 'pr-11')}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] fine-hover:text-foreground"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {message ? (
        <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
