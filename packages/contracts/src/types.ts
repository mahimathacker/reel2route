import type { z } from 'zod'

import type {
  confidenceLevelSchema,
  evidenceSourceSchema,
  sourceEvidenceSchema,
  sourcePlatformSchema,
} from './schemas.js'

export type SourcePlatform = z.infer<typeof sourcePlatformSchema>
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>
