import { z } from 'zod'

import {
  TEST_CASE_SELECTOR_TYPES,
  TEST_CASE_STEP_ACTIONS,
  fieldsForAction,
} from '#/features/test-cases/utils/step-actions.ts'

export const loginFlowStepActionSchema = z.enum(TEST_CASE_STEP_ACTIONS)
export const loginFlowSelectorTypeSchema = z.enum(TEST_CASE_SELECTOR_TYPES)

const optionalStepText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? null : value))
    .optional()
    .nullable()

export const loginFlowStepInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    action: loginFlowStepActionSchema,
    selectorType: loginFlowSelectorTypeSchema.optional().nullable(),
    selector: optionalStepText(2000, 'Selector is too long'),
    value: optionalStepText(4000, 'Value is too long'),
  })
  .superRefine((step, ctx) => {
    const fields = fieldsForAction(step.action)

    if (fields.selector && !step.selector) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selector is required',
        path: ['selector'],
      })
    }

    if (fields.value && !step.value) {
      ctx.addIssue({
        code: 'custom',
        message: 'Value is required',
        path: ['value'],
      })
    }
  })

export const loginFlowStepFormSchema = z
  .object({
    clientId: z.string().min(1),
    id: z.string().min(1).optional(),
    action: loginFlowStepActionSchema,
    selectorType: loginFlowSelectorTypeSchema,
    selector: z.string().trim().max(2000, 'Selector is too long'),
    value: z.string().trim().max(4000, 'Value is too long'),
  })
  .superRefine((step, ctx) => {
    const fields = fieldsForAction(step.action)

    if (fields.selector && step.selector.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selector is required',
        path: ['selector'],
      })
    }

    if (fields.value && step.value.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Value is required',
        path: ['value'],
      })
    }
  })

export const loginFlowStepsFormSchema = z.object({
  steps: z.array(loginFlowStepFormSchema).max(50, 'Too many steps'),
})

export const getProjectLoginFlowSchema = z.object({
  projectId: z.string().min(1),
})

export const listLoginFlowStepsSchema = z.object({
  loginFlowId: z.string().min(1),
})

export const replaceLoginFlowStepsSchema = z.object({
  loginFlowId: z.string().min(1),
  steps: z.array(loginFlowStepInputSchema).max(50, 'Too many steps'),
})

export type LoginFlowStepFormValue = z.input<typeof loginFlowStepFormSchema>
export type ReplaceLoginFlowStepsInput = z.input<
  typeof replaceLoginFlowStepsSchema
>
export type ReplaceLoginFlowStepsValues = z.output<
  typeof replaceLoginFlowStepsSchema
>
