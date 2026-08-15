import { useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
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

export function TestAccountField({
  label,
  name,
  kind = 'input',
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
  kind?: 'input' | 'textarea'
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
  const [visible, setVisible] = useState(false)
  const message = firstError(errors)
  const isPassword = type === 'password'
  const inputType = isPassword && visible ? 'text' : type

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {kind === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          autoComplete={autoComplete}
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
        <div className="relative">
          <Input
            id={name}
            name={name}
            type={inputType}
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
            className={cn('h-11 rounded-xl px-3', isPassword && 'pr-11')}
          />
          {isPassword ? (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors duration-150 ease-out-strong fine-hover:text-foreground"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          ) : null}
        </div>
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
