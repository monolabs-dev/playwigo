export const LOGIN_FLOW_VARIABLES = [
  { token: '{{email}}', description: 'Test account email' },
  { token: '{{password}}', description: 'Test account password' },
  { token: '{{loginUrl}}', description: 'Test account login URL' },
] as const

export type LoginFlowVariableValues = {
  email: string
  password: string
  loginUrl: string
}

const VARIABLE_PATTERN = /\{\{(email|password|loginUrl)\}\}/g

export function substituteLoginFlowVariables(
  value: string | null | undefined,
  variables: LoginFlowVariableValues,
) {
  if (!value) {
    return value ?? null
  }

  return value.replace(VARIABLE_PATTERN, (match, key: string) => {
    switch (key) {
      case 'email':
        return variables.email
      case 'password':
        return variables.password
      case 'loginUrl':
        return variables.loginUrl
      default:
        return match
    }
  })
}

export function substituteLoginFlowStep<
  T extends {
    selector: string | null
    value: string | null
  },
>(step: T, variables: LoginFlowVariableValues) {
  return {
    ...step,
    selector: substituteLoginFlowVariables(step.selector, variables),
    value: substituteLoginFlowVariables(step.value, variables),
  }
}

export function loginFlowValuePlaceholder(action: string) {
  if (action === 'goto' || action === 'expectToHaveUrl') {
    return '{{loginUrl}}'
  }

  if (action === 'fill') {
    return '{{email}} or {{password}}'
  }

  return undefined
}
