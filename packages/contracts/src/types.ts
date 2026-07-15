import type { z } from 'zod'

import type {
  confidenceLevelSchema,
  contentExtractionSchema,
  evidenceSourceSchema,
  extractedActivitySchema,
  extractedPlaceSchema,
  healthResponseSchema,
  ingestContentRequestSchema,
  missingInformationSchema,
  placeCategorySchema,
  sourceContentSchema,
  sourceEvidenceSchema,
  sourcePlatformSchema,
  transcriptSegmentSchema,
  unavailableSourceFieldSchema,
} from './schemas.js'

export type SourcePlatform = z.infer<typeof sourcePlatformSchema>
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>
export type PlaceCategory = z.infer<typeof placeCategorySchema>
export type ContentExtraction = z.infer<typeof contentExtractionSchema>
export type ExtractedPlace = z.infer<typeof extractedPlaceSchema>
export type ExtractedActivity = z.infer<typeof extractedActivitySchema>
export type MissingInformation = z.infer<typeof missingInformationSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type IngestContentRequest = z.infer<typeof ingestContentRequestSchema>
export type SourceContent = z.infer<typeof sourceContentSchema>
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>
export type UnavailableSourceField = z.infer<
  typeof unavailableSourceFieldSchema
>
