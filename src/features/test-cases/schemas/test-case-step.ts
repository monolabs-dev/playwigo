import { z } from 'zod'

import {
  TEST_CASE_SELECTOR_TYPES,
  TEST_CASE_STEP_ACTIONS,
  fieldsForAction,
} from '#/features/test-cases/utils/step-actions.ts'

export const testCaseStepActionSchema = z.enum(TEST_CASE_STEP_ACTIONS)
export const testCaseSelectorTypeSchema = z.enum(TEST_CASE_SELECTOR_TYPES)

const optionalStepText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length === 0 ? null : value))
    .optional()
    .nullable()

export const testCaseStepInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    action: testCaseStepActionSchema,
    selectorType: testCaseSelectorTypeSchema.optional().nullable(),
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

export const testCaseStepFormSchema = z
  .object({
    clientId: z.string().min(1),
    id: z.string().min(1).optional(),
    action: testCaseStepActionSchema,
    selectorType: testCaseSelectorTypeSchema,
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

export const testCaseStepsFormSchema = z.object({
  steps: z.array(testCaseStepFormSchema).max(100, 'Too many steps'),
})

export const listTestCaseStepsSchema = z.object({
  testCaseId: z.string().min(1),
})

export const replaceTestCaseStepsSchema = z.object({
  testCaseId: z.string().min(1),
  steps: z.array(testCaseStepInputSchema).max(100, 'Too many steps'),
})

export type TestCaseStepFormValue = z.input<typeof testCaseStepFormSchema>
export type ReplaceTestCaseStepsInput = z.input<
  typeof replaceTestCaseStepsSchema
>
export type ReplaceTestCaseStepsValues = z.output<
  typeof replaceTestCaseStepsSchema
>
