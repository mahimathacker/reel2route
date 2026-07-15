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

export const placeCategorySchema = z.enum([
  'neighbourhood',
  'restaurant',
  'hotel',
  'viewpoint',
  'attraction',
  'landmark',
  'activity',
  'other',
])

export const placeResolutionStatusSchema = z.enum([
  'resolved',
  'ambiguous',
  'not_found',
])

export const budgetRangeSchema = z.enum(['budget', 'moderate', 'premium'])
export const groupTypeSchema = z.enum(['solo', 'couple', 'friends', 'family'])
export const pacePreferenceSchema = z.enum(['relaxed', 'balanced', 'packed'])
export const personaIdSchema = z.enum([
  'budget_explorer',
  'comfort_traveller',
  'premium_escape',
])

export const tripPreferencesSchema = z
  .object({
    origin: z.string().trim().min(2).max(200),
    days: z.number().int().min(1).max(14),
    budgetRange: budgetRangeSchema,
    groupType: groupTypeSchema,
    pace: pacePreferenceSchema,
  })
  .strict()

export const personaProfileSchema = z
  .object({
    id: personaIdSchema,
    name: z.string().trim().min(1).max(100),
    summary: z.string().trim().min(1).max(300),
    accommodationStyle: z.string().trim().min(1).max(150),
    transportStyle: z.string().trim().min(1).max(150),
    diningStyle: z.string().trim().min(1).max(150),
    activityPricePreference: budgetRangeSchema,
    dailyStopTarget: z.number().int().min(2).max(7),
    fitScore: z.number().int().min(0).max(100),
    reason: z.string().trim().min(1).max(500),
  })
  .strict()

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
    timestampSeconds: z.number().nonnegative().nullable(),
  })
  .strict()

export const itineraryStopSchema = z
  .object({
    order: z.number().int().positive(),
    placeId: z.string().trim().min(1),
    name: z.string().trim().min(1).max(300),
    category: placeCategorySchema,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    suggestedActivity: z.string().trim().min(1).max(300).nullable(),
    durationMinutes: z.number().int().min(30).max(480),
    reason: z.string().trim().min(1).max(500),
    evidence: z.array(sourceEvidenceSchema).min(1).max(5),
  })
  .strict()

export const itineraryDaySchema = z
  .object({
    day: z.number().int().positive(),
    theme: z.string().trim().min(1).max(150),
    paceNote: z.string().trim().min(1).max(300),
    stops: z.array(itineraryStopSchema).max(7),
  })
  .strict()

export const tripPlanSchema = z
  .object({
    persona: personaProfileSchema,
    title: z.string().trim().min(1).max(150),
    summary: z.string().trim().min(1).max(500),
    days: z.array(itineraryDaySchema).min(1).max(14),
    unscheduledPlaces: z.array(z.string().trim().min(1).max(300)).max(30),
  })
  .strict()

export const costCategorySchema = z.enum([
  'flights',
  'accommodation',
  'activities',
  'food',
  'local_transport',
])

export const costLineItemSchema = z
  .object({
    category: costCategorySchema,
    label: z.string().trim().min(1).max(150),
    amountMinor: z.number().int().nonnegative(),
    confidence: confidenceLevelSchema,
    assumption: z.string().trim().min(1).max(500),
  })
  .strict()

export const costEstimateSchema = z
  .object({
    currency: z.literal('USD'),
    lineItems: z.array(costLineItemSchema).length(5),
    totalPerPersonMinor: z.number().int().nonnegative(),
    confidence: confidenceLevelSchema,
    assumptions: z.array(z.string().trim().min(1).max(500)).min(1).max(10),
  })
  .strict()

export const costedTripPlanSchema = z
  .object({
    plan: tripPlanSchema,
    cost: costEstimateSchema,
  })
  .strict()

export const extractedPlaceSchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    category: placeCategorySchema,
    context: z.string().trim().min(1).max(500),
    evidence: z.array(sourceEvidenceSchema).min(1).max(5),
    confidence: confidenceLevelSchema,
    mentionCount: z.number().int().positive(),
  })
  .strict()

export const extractedActivitySchema = z
  .object({
    name: z.string().trim().min(1).max(300),
    placeName: z.string().trim().min(1).max(300).nullable(),
    evidence: z.array(sourceEvidenceSchema).min(1).max(5),
    confidence: confidenceLevelSchema,
  })
  .strict()

export const missingInformationSchema = z
  .object({
    field: z.enum([
      'destination',
      'trip_duration',
      'hotel_area',
      'origin',
      'transport_mode',
      'travel_dates',
    ]),
    message: z.string().trim().min(1).max(300),
  })
  .strict()

export const contentExtractionSchema = z
  .object({
    destinationGuess: z.string().trim().min(1).max(300).nullable(),
    places: z.array(extractedPlaceSchema).max(30),
    activities: z.array(extractedActivitySchema).max(30),
    vibes: z.array(z.string().trim().min(1).max(100)).max(10),
    missingInformation: z.array(missingInformationSchema).max(6),
  })
  .strict()

export const placeCandidateSchema = z
  .object({
    placeId: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
    formattedAddress: z.string().trim().min(1).nullable(),
  })
  .strict()

export const resolvedPlaceSchema = z
  .object({
    source: extractedPlaceSchema,
    status: placeResolutionStatusSchema,
    resolutionConfidence: confidenceLevelSchema.nullable(),
    placeId: z.string().trim().min(1).nullable(),
    displayName: z.string().trim().min(1).nullable(),
    formattedAddress: z.string().trim().min(1).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    primaryType: z.string().trim().min(1).nullable(),
    types: z.array(z.string().trim().min(1)),
    rating: z.number().min(0).max(5).nullable(),
    priceLevel: z.number().int().min(0).max(4).nullable(),
    googleMapsUri: z.url().nullable(),
    alternatives: z.array(placeCandidateSchema).max(3),
  })
  .strict()

export const contentAnalysisSchema = z
  .object({
    source: sourceContentSchema,
    extraction: contentExtractionSchema,
    resolvedPlaces: z.array(resolvedPlaceSchema).max(30),
  })
  .strict()
