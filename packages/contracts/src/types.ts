import type { z } from 'zod'

import type {
  confidenceLevelSchema,
  budgetRangeSchema,
  contentAnalysisSchema,
  contentExtractionSchema,
  costCategorySchema,
  costEstimateSchema,
  costedTripPlanSchema,
  costLineItemSchema,
  evidenceSourceSchema,
  extractedActivitySchema,
  extractedPlaceSchema,
  healthResponseSchema,
  ingestContentRequestSchema,
  itineraryDaySchema,
  itineraryStopSchema,
  missingInformationSchema,
  groupTypeSchema,
  pacePreferenceSchema,
  placeCandidateSchema,
  placeCategorySchema,
  placeResolutionStatusSchema,
  personaIdSchema,
  personaProfileSchema,
  resolvedPlaceSchema,
  sourceContentSchema,
  sourceEvidenceSchema,
  sourcePlatformSchema,
  tripPreferencesSchema,
  tripPlanSchema,
  transcriptSegmentSchema,
  unavailableSourceFieldSchema,
} from './schemas.js'

export type SourcePlatform = z.infer<typeof sourcePlatformSchema>
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>
export type BudgetRange = z.infer<typeof budgetRangeSchema>
export type GroupType = z.infer<typeof groupTypeSchema>
export type PacePreference = z.infer<typeof pacePreferenceSchema>
export type PersonaId = z.infer<typeof personaIdSchema>
export type PersonaProfile = z.infer<typeof personaProfileSchema>
export type TripPreferences = z.infer<typeof tripPreferencesSchema>
export type ItineraryStop = z.infer<typeof itineraryStopSchema>
export type ItineraryDay = z.infer<typeof itineraryDaySchema>
export type TripPlan = z.infer<typeof tripPlanSchema>
export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>
export type CostCategory = z.infer<typeof costCategorySchema>
export type CostLineItem = z.infer<typeof costLineItemSchema>
export type CostEstimate = z.infer<typeof costEstimateSchema>
export type CostedTripPlan = z.infer<typeof costedTripPlanSchema>
export type PlaceCategory = z.infer<typeof placeCategorySchema>
export type ContentExtraction = z.infer<typeof contentExtractionSchema>
export type ExtractedPlace = z.infer<typeof extractedPlaceSchema>
export type ExtractedActivity = z.infer<typeof extractedActivitySchema>
export type MissingInformation = z.infer<typeof missingInformationSchema>
export type PlaceCandidate = z.infer<typeof placeCandidateSchema>
export type PlaceResolutionStatus = z.infer<typeof placeResolutionStatusSchema>
export type ResolvedPlace = z.infer<typeof resolvedPlaceSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type IngestContentRequest = z.infer<typeof ingestContentRequestSchema>
export type SourceContent = z.infer<typeof sourceContentSchema>
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>
export type UnavailableSourceField = z.infer<
  typeof unavailableSourceFieldSchema
>
