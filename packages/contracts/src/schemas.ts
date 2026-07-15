import { z } from 'zod'

export const sourcePlatformSchema = z.enum(['youtube', 'instagram'])

export const evidenceSourceSchema = z.enum([
  'title',
  'description',
  'transcript',
  'caption',
  'location_tag',
])

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low'])

export const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    service: z.literal('reel2route-api'),
  })
  .strict()

export const sourceEvidenceSchema = z
  .object({
    source: evidenceSourceSchema,
    text: z.string().trim().min(1).max(500),
    timestampSeconds: z.number().finite().nonnegative().optional(),
  })
  .strict()
