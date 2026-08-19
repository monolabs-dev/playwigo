import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'
import type { TestCaseStepAction } from '#/features/test-cases/utils/step-actions.ts'
import { BUILTIN_TEMPLATE_TOKENS } from '#/lib/step-template.ts'

export type StepConfigValue = StepConfigJson

export function defaultConfigForAction(
  action: TestCaseStepAction,
): StepConfigValue {
  switch (action) {
    case 'setVariable':
      return { name: '', value: '' }
    case 'extractText':
      return { attribute: '', regex: '' }
    case 'httpRequest':
      return {
        method: 'GET',
        url: '',
        headers: null,
        body: '',
        jsonPath: '',
        regex: '',
        expectStatus: null,
        retry: { attempts: 5, intervalMs: 2000 },
      }
    default:
      return null
  }
}

export function TemplateHint() {
  return (
    <p className="text-[11px] text-muted-foreground">
      Supports{' '}
      <code className="rounded bg-muted px-1">{'{{var}}'}</code> and generators
      like{' '}
      {BUILTIN_TEMPLATE_TOKENS.slice(0, 3)
        .map((token) => token.token)
        .join(', ')}
      .
    </p>
  )
}

function asRecord(config: StepConfigValue): Record<string, unknown> {
  if (config && typeof config === 'object') {
    return config as Record<string, unknown>
  }
  return {}
}

export function StepConfigFields({
  action,
  config,
  outputVariable,
  onConfigChange,
  onOutputVariableChange,
}: {
  action: TestCaseStepAction
  config: StepConfigValue
  outputVariable: string
  onConfigChange: (config: StepConfigValue) => void
  onOutputVariableChange: (value: string) => void
}) {
  const record = asRecord(config)

  if (action === 'setVariable') {
    return (
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Variable name</Label>
          <Input
            value={typeof record.name === 'string' ? record.name : ''}
            onChange={(event) =>
              onConfigChange({
                name: event.target.value,
                value: typeof record.value === 'string' ? record.value : '',
              })
            }
            placeholder="signupEmail"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Value</Label>
          <Input
            value={typeof record.value === 'string' ? record.value : ''}
            onChange={(event) =>
              onConfigChange({
                name: typeof record.name === 'string' ? record.name : '',
                value: event.target.value,
              })
            }
            placeholder="{{$email}}"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
          <TemplateHint />
        </div>
      </div>
    )
  }

  if (action === 'extractText') {
    return (
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Output variable</Label>
          <Input
            value={outputVariable}
            onChange={(event) => onOutputVariableChange(event.target.value)}
            placeholder="otp"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Attribute (optional)</Label>
          <Input
            value={typeof record.attribute === 'string' ? record.attribute : ''}
            onChange={(event) =>
              onConfigChange({
                attribute: event.target.value,
                regex: typeof record.regex === 'string' ? record.regex : '',
              })
            }
            placeholder="Leave empty for inner text"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Regex capture (optional)</Label>
          <Input
            value={typeof record.regex === 'string' ? record.regex : ''}
            onChange={(event) =>
              onConfigChange({
                attribute:
                  typeof record.attribute === 'string' ? record.attribute : '',
                regex: event.target.value,
              })
            }
            placeholder="code is (\\d+)"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    )
  }

  if (action === 'httpRequest') {
    const retry =
      record.retry && typeof record.retry === 'object'
        ? (record.retry as { attempts?: number; intervalMs?: number })
        : { attempts: 5, intervalMs: 2000 }

    const update = (patch: {
      method?: string
      url?: string
      body?: string
      jsonPath?: string
      regex?: string
      retry?: { attempts: number; intervalMs: number }
    }) => {
      onConfigChange({
        method: (patch.method ??
          (typeof record.method === 'string' ? record.method : 'GET')) as
          | 'GET'
          | 'POST'
          | 'PUT'
          | 'PATCH'
          | 'DELETE',
        url: patch.url ?? (typeof record.url === 'string' ? record.url : ''),
        headers: null,
        body:
          patch.body ?? (typeof record.body === 'string' ? record.body : ''),
        jsonPath:
          patch.jsonPath ??
          (typeof record.jsonPath === 'string' ? record.jsonPath : ''),
        regex:
          patch.regex ?? (typeof record.regex === 'string' ? record.regex : ''),
        expectStatus:
          typeof record.expectStatus === 'number' ? record.expectStatus : null,
        retry: patch.retry ?? {
          attempts: retry.attempts ?? 5,
          intervalMs: retry.intervalMs ?? 2000,
        },
      })
    }

    return (
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Output variable</Label>
          <Input
            value={outputVariable}
            onChange={(event) => onOutputVariableChange(event.target.value)}
            placeholder="otp"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Method</Label>
          <Select
            value={typeof record.method === 'string' ? record.method : 'GET'}
            onValueChange={(method) => update({ method })}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(
                (method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>URL</Label>
          <Input
            value={typeof record.url === 'string' ? record.url : ''}
            onChange={(event) => update({ url: event.target.value })}
            placeholder="{{otpEndpoint}}?email={{$email}}"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
          <TemplateHint />
        </div>
        <div className="space-y-1.5">
          <Label>JSON path (optional)</Label>
          <Input
            value={typeof record.jsonPath === 'string' ? record.jsonPath : ''}
            onChange={(event) => update({ jsonPath: event.target.value })}
            placeholder="data.code"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Regex (optional)</Label>
          <Input
            value={typeof record.regex === 'string' ? record.regex : ''}
            onChange={(event) => update({ regex: event.target.value })}
            placeholder="(\\d{6})"
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Retry attempts</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={retry.attempts ?? 5}
            onChange={(event) =>
              update({
                retry: {
                  attempts: Number(event.target.value) || 1,
                  intervalMs: retry.intervalMs ?? 2000,
                },
              })
            }
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Retry interval (ms)</Label>
          <Input
            type="number"
            min={100}
            max={30000}
            value={retry.intervalMs ?? 2000}
            onChange={(event) =>
              update({
                retry: {
                  attempts: retry.attempts ?? 5,
                  intervalMs: Number(event.target.value) || 1000,
                },
              })
            }
            className="h-8"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Body (optional)</Label>
          <Input
            value={typeof record.body === 'string' ? record.body : ''}
            onChange={(event) => update({ body: event.target.value })}
            placeholder='{"email":"{{$email}}"}'
            className="h-8"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    )
  }

  return null
}
