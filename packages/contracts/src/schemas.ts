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

export const ingestContentRequestSchema = z
  .object({
    url: z.string().trim().pipe(z.url()),
  })
  .strict()

export const transcriptSegmentSchema = z
  .object({
    text: z.string().trim().min(1),
    startSeconds: z.number().nonnegative(),
    durationSeconds: z.number().nonnegative().optional(),
  })
  .strict()

export const unavailableSourceFieldSchema = z.enum([
  'title',
  'description',
  'transcript',
  'caption',
  'location_tags',
  'author',
  'published_at',
])

export const sourceContentSchema = z
  .object({
    platform: sourcePlatformSchema,
    canonicalUrl: z.url(),
    externalId: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(500).nullable(),
    description: z.string().trim().max(50_000).nullable(),
    transcript: z.array(transcriptSegmentSchema).max(10_000),
    caption: z.string().trim().max(10_000).nullable(),
    locationTags: z.array(z.string().trim().min(1).max(200)).max(25),
    author: z.string().trim().min(1).max(500).nullable(),
    publishedAt: z.iso.datetime().nullable(),
    unavailableFields: z.array(unavailableSourceFieldSchema),
  })
  .strict()

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
    timestampSeconds: z.number().nonnegative().optional(),
  })
  .strict()
