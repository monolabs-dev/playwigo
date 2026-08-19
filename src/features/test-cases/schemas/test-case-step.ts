import { z } from 'zod'

import type { StepConfigJson } from '#/features/test-cases/types/step-config.ts'
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

const variableNameSchema = z
  .string()
  .trim()
  .min(1, 'Variable name is required')
  .max(64, 'Variable name is too long')
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*$/,
    'Use letters, numbers, and underscores only',
  )

export const setVariableConfigSchema = z.object({
  name: variableNameSchema,
  value: z.string().max(4000, 'Value is too long'),
})

export const extractTextConfigSchema = z.object({
  attribute: optionalStepText(200, 'Attribute is too long'),
  regex: optionalStepText(500, 'Regex is too long'),
})

export const httpRequestConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().trim().min(1, 'URL is required').max(4000, 'URL is too long'),
  headers: z
    .record(z.string(), z.string().max(2000))
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  body: optionalStepText(10000, 'Body is too long'),
  jsonPath: optionalStepText(500, 'JSON path is too long'),
  regex: optionalStepText(500, 'Regex is too long'),
  expectStatus: z
    .number()
    .int()
    .min(100)
    .max(599)
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  retry: z
    .object({
      attempts: z.number().int().min(1).max(20),
      intervalMs: z.number().int().min(100).max(30000),
    })
    .optional()
    .nullable()
    .transform((value) => value ?? null),
})

export const stepConfigValueSchema = z.union([
  setVariableConfigSchema,
  extractTextConfigSchema,
  httpRequestConfigSchema,
  z.null(),
])

export const stepConfigJsonSchema = stepConfigValueSchema.optional()

function refineStepFields(
  step: {
    action: z.infer<typeof testCaseStepActionSchema>
    selector?: string | null
    value?: string | null
    outputVariable?: string | null
    config?: StepConfigJson
  },
  ctx: z.RefinementCtx,
) {
  const fields = fieldsForAction(step.action)

  const selectorEmpty =
    step.selector == null ||
    (typeof step.selector === 'string' && step.selector.length === 0)
  const valueEmpty =
    step.value == null ||
    (typeof step.value === 'string' && step.value.length === 0)

  if (fields.selector && selectorEmpty) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selector is required',
      path: ['selector'],
    })
  }

  if (fields.value && valueEmpty) {
    ctx.addIssue({
      code: 'custom',
      message: 'Value is required',
      path: ['value'],
    })
  }

  if (fields.outputVariable) {
    const output = step.outputVariable
    if (
      output == null ||
      (typeof output === 'string' && output.trim().length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Output variable is required',
        path: ['outputVariable'],
      })
    } else if (
      typeof output === 'string' &&
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(output.trim())
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use letters, numbers, and underscores only',
        path: ['outputVariable'],
      })
    }
  }

  if (fields.config) {
    if (step.action === 'setVariable') {
      const parsed = setVariableConfigSchema.safeParse(step.config)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: ['config', ...issue.path],
          })
        }
      }
    } else if (step.action === 'extractText') {
      const parsed = extractTextConfigSchema.safeParse(step.config ?? {})
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: ['config', ...issue.path],
          })
        }
      }
    } else if (step.action === 'httpRequest') {
      const parsed = httpRequestConfigSchema.safeParse(step.config)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: ['config', ...issue.path],
          })
        }
      }
    }
  }
}

export const testCaseStepInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    action: testCaseStepActionSchema,
    selectorType: testCaseSelectorTypeSchema.optional().nullable(),
    selector: optionalStepText(2000, 'Selector is too long'),
    value: optionalStepText(4000, 'Value is too long'),
    outputVariable: optionalStepText(64, 'Output variable is too long'),
    config: stepConfigJsonSchema,
  })
  .superRefine((step, ctx) => {
    refineStepFields(step, ctx)
  })

export const testCaseStepFormSchema = z
  .object({
    clientId: z.string().min(1),
    id: z.string().min(1).optional(),
    action: testCaseStepActionSchema,
    selectorType: testCaseSelectorTypeSchema,
    selector: z.string().trim().max(2000, 'Selector is too long'),
    value: z.string().trim().max(4000, 'Value is too long'),
    outputVariable: z.string().trim().max(64, 'Output variable is too long'),
    config: stepConfigValueSchema,
  })
  .superRefine((step, ctx) => {
    refineStepFields(step, ctx)
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
