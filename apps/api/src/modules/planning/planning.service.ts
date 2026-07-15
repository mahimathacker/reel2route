import {
  tripPlanningResponseSchema,
  type ContentAnalysis,
  type CostEstimate,
  type PackingSuggestion,
  type TourMatchedPlan,
  type TripPlan,
  type TripPlanningResponse,
  type TripPreferences,
} from '@reel2route/contracts'

type AnalysisPort = { analyze(url: string): Promise<ContentAnalysis> }
type ItineraryPort = {
  generate(analysis: ContentAnalysis, preferences: TripPreferences): TripPlan[]
}
type TourPort = { matchPlan(plan: TripPlan): TourMatchedPlan }
type CostPort = {
  estimate(
    plan: TripPlan,
    preferences: TripPreferences,
    destination: string | null,
    recommendations: TourMatchedPlan['recommendations'],
  ): CostEstimate
}
type PackingPort = { suggest(preferences: TripPreferences): PackingSuggestion }
type PersistencePort = {
  save(
    sourceUrl: string,
    preferences: TripPreferences,
    payload: Pick<TripPlanningResponse, 'analysis' | 'options'>,
  ): { tripId: string; createdAt: string }
  findById(tripId: string): TripPlanningResponse | null
}

export class TripNotFoundError extends Error {
  constructor() {
    super('The saved trip was not found')
    this.name = 'TripNotFoundError'
  }
}

export class PlanningService {
  constructor(
    private readonly analysis: AnalysisPort,
    private readonly itinerary: ItineraryPort,
    private readonly tours: TourPort,
    private readonly costs: CostPort,
    private readonly packing: PackingPort,
    private readonly persistence: PersistencePort,
  ) {}

  async create(
    url: string,
    preferences: TripPreferences,
  ): Promise<TripPlanningResponse> {
    const analysis = await this.analysis.analyze(url)
    const packingSuggestion = this.packing.suggest(preferences)
    const options = this.itinerary.generate(analysis, preferences).map((plan) => {
      const matched = this.tours.matchPlan(plan)
      const cost = this.costs.estimate(
        plan,
        preferences,
        analysis.extraction.destinationGuess,
        matched.recommendations,
      )

      return {
        plan,
        cost,
        recommendations: matched.recommendations,
        bookabilityScore: matched.bookabilityScore,
        packingSuggestion,
      }
    })

    const identity = this.persistence.save(url, preferences, { analysis, options })
    return tripPlanningResponseSchema.parse({
      ...identity,
      preferences,
      analysis,
      options,
    })
  }

  get(tripId: string): TripPlanningResponse {
    const trip = this.persistence.findById(tripId)
    if (trip === null) throw new TripNotFoundError()
    return trip
  }
}
