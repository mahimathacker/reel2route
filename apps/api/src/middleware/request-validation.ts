import type { z } from 'zod'

export class RequestValidationError extends Error {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super('The request is invalid')
    this.name = 'RequestValidationError'
  }
}

export const parseRequest = <Output>(schema: z.ZodType<Output>, value: unknown): Output => {
  const result = schema.safeParse(value)

  if (!result.success) throw new RequestValidationError(result.error.issues)

  return result.data
}
