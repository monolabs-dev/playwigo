import { BUILTIN_TEMPLATE_TOKENS } from '#/lib/step-template.ts'

export const LOGIN_FLOW_VARIABLES = [
  { token: '{{email}}', description: 'Test account email' },
  { token: '{{password}}', description: 'Test account password' },
  { token: '{{loginUrl}}', description: 'Test account login URL' },
  ...BUILTIN_TEMPLATE_TOKENS,
] as const

export function loginFlowValuePlaceholder(action: string) {
  if (action === 'goto' || action === 'expectToHaveUrl') {
    return '{{loginUrl}}'
  }

  if (action === 'fill') {
    return '{{email}} or {{password}}'
  }

  return undefined
}
