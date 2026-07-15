import type { z } from 'zod'

import type {
  confidenceLevelSchema,
  evidenceSourceSchema,
  healthResponseSchema,
  sourceEvidenceSchema,
  sourcePlatformSchema,
} from './schemas.js'

export type SourcePlatform = z.infer<typeof sourcePlatformSchema>
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>
