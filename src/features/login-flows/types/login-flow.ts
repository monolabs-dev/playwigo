export type LoginFlowSummary = {
  id: string
  projectId: string
  name: string
  description: string | null
  stepCount: number
  createdAt: Date
  updatedAt: Date
}

import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'

export type LoginFlowStep = {
  id: string
  loginFlowId: string
  sortOrder: number
  action: string
  selector: string | null
  selectorType: string | null
  value: string | null
  config: StepConfigJson
  outputVariable: string | null
  createdAt: Date
  updatedAt: Date
}
