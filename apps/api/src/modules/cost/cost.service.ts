import {
  costEstimateSchema,
  type CostEstimate,
  type PersonaId,
  type StopTourRecommendations,
  type TripPlan,
  type TripPreferences,
} from '@reel2route/contracts'

type PersonaRates = {
  domesticFlight: number
  shortHaulInternationalFlight: number
  longHaulInternationalFlight: number
  accommodationNight: number
  foodDay: number
  activityStop: number
  transportDay: number
}

const RATES: Record<PersonaId, PersonaRates> = {
  budget_explorer: {
    domesticFlight: 12_000,
    shortHaulInternationalFlight: 18_000,
    longHaulInternationalFlight: 75_000,
    accommodationNight: 3_500,
    foodDay: 2_500,
    activityStop: 1_000,
    transportDay: 1_200,
  },
  comfort_traveller: {
    domesticFlight: 20_000,
    shortHaulInternationalFlight: 30_000,
    longHaulInternationalFlight: 100_000,
    accommodationNight: 10_000,
    foodDay: 5_500,
    activityStop: 3_000,
    transportDay: 3_500,
  },
  premium_escape: {
    domesticFlight: 35_000,
    shortHaulInternationalFlight: 50_000,
    longHaulInternationalFlight: 160_000,
    accommodationNight: 28_000,
    foodDay: 12_000,
    activityStop: 7_500,
    transportDay: 10_000,
  },
}

const normalizeLocation = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const countryPart = (value: string) =>
  normalizeLocation(value.split(',').at(-1) ?? value)

type FlightBand =
  | 'same_destination'
  | 'domestic'
  | 'short_haul_international'
  | 'long_haul_international'
  | 'unknown'

const EUROPEAN_COUNTRIES = new Set([
  'france',
  'germany',
  'italy',
  'spain',
  'united kingdom',
  'uk',
  'netherlands',
  'belgium',
  'switzerland',
  'portugal',
  'austria',
])

const flightBand = (origin: string, destination: string | null): FlightBand => {
  if (destination === null) return 'unknown'
  if (normalizeLocation(origin) === normalizeLocation(destination)) {
    return 'same_destination'
  }
  const originCountry = countryPart(origin)
  const destinationCountry = countryPart(destination)
  if (originCountry === destinationCountry) return 'domestic'
  if (
    EUROPEAN_COUNTRIES.has(originCountry) &&
    EUROPEAN_COUNTRIES.has(destinationCountry)
  ) {
    return 'short_haul_international'
  }
  return 'long_haul_international'
}

const flightEstimate = (
  origin: string,
  destination: string | null,
  rates: PersonaRates,
) => {
  const band = flightBand(origin, destination)
  if (band === 'same_destination') return 0
  if (band === 'domestic') return rates.domesticFlight
  if (band === 'short_haul_international') {
    return rates.shortHaulInternationalFlight
  }
  return rates.longHaulInternationalFlight
}

const flightAssumption = (origin: string, destination: string | null) => {
  const band = flightBand(origin, destination)
  const labels: Record<FlightBand, string> = {
    same_destination: 'same destination; no flight added',
    domestic: 'domestic route band',
    short_haul_international: 'short-haul international route band',
    long_haul_international: 'long-haul international route band',
    unknown: 'unknown destination; conservative long-haul route band',
  }
  return `${origin} → ${destination ?? 'unknown destination'} is treated as a ${labels[band]}. Dates, airports, baggage, and booking window are unknown.`
}

const destinationMultiplier = (destination: string | null) => {
  const normalized = normalizeLocation(destination ?? '')
  if (normalized.includes('paris')) return 1.6
  if (normalized.includes('london') || normalized.includes('new york')) return 1.5
  if (normalized.includes('bali') || normalized.includes('ubud')) return 0.9
  if (normalized.includes('jaipur')) return 0.8
  return 1
}

const roomShare = (groupType: TripPreferences['groupType']) =>
  groupType === 'solo' ? 1 : 2

export class CostService {
  estimate(
    plan: TripPlan,
    preferences: TripPreferences,
    destination: string | null,
    recommendations: StopTourRecommendations[] = [],
  ): CostEstimate {
    const rates = RATES[plan.persona.id]
    const localPriceFactor = destinationMultiplier(destination)
    const nights = Math.max(0, preferences.days - 1)
    const stopCount = plan.days.reduce((total, day) => total + day.stops.length, 0)
    const selectedTourPrices = recommendations
      .map(({ tours }) =>
        tours.find(({ includedInEstimate }) => includedInEstimate)?.priceMinor,
      )
      .filter((price): price is number => price !== undefined)
    const unmatchedStops = Math.max(0, stopCount - selectedTourPrices.length)
    const activityCost =
      selectedTourPrices.reduce((total, price) => total + price, 0) +
      unmatchedStops * Math.round(rates.activityStop * localPriceFactor)
    const accommodation = Math.round(
      (rates.accommodationNight * localPriceFactor * nights) /
        roomShare(preferences.groupType),
    )
    const groupAssumption =
      preferences.groupType === 'solo'
        ? 'One traveller occupies one room.'
        : 'Accommodation is shared by two travellers; exact group size was not collected.'

    const lineItems = [
      {
        category: 'flights' as const,
        label: 'Indicative return flight',
        amountMinor: flightEstimate(preferences.origin, destination, rates),
        confidence: 'low' as const,
        assumption: flightAssumption(preferences.origin, destination),
      },
      {
        category: 'accommodation' as const,
        label: `${nights} nights of accommodation`,
        amountMinor: accommodation,
        confidence: 'medium' as const,
        assumption: `${plan.persona.accommodationStyle}. ${groupAssumption}`,
      },
      {
        category: 'activities' as const,
        label: `${stopCount} planned activities`,
        amountMinor: activityCost,
        confidence: selectedTourPrices.length === stopCount ? ('medium' as const) : ('low' as const),
        assumption: `${selectedTourPrices.length} stops use selected mock-tour prices; ${unmatchedStops} unmatched stops use a persona-level allowance.`,
      },
      {
        category: 'food' as const,
        label: `${preferences.days} days of food`,
        amountMinor: Math.round(
          rates.foodDay * localPriceFactor * preferences.days,
        ),
        confidence: 'medium' as const,
        assumption: `${plan.persona.diningStyle}. Includes a ${localPriceFactor.toFixed(1)}× destination price adjustment.`,
      },
      {
        category: 'local_transport' as const,
        label: `${preferences.days} days of local transport`,
        amountMinor: Math.round(
          rates.transportDay * localPriceFactor * preferences.days,
        ),
        confidence: 'medium' as const,
        assumption: `${plan.persona.transportStyle}. Includes a ${localPriceFactor.toFixed(1)}× destination price adjustment.`,
      },
    ]

    return costEstimateSchema.parse({
      currency: 'USD',
      lineItems,
      totalPerPersonMinor: lineItems.reduce(
        (total, item) => total + item.amountMinor,
        0,
      ),
      confidence: 'low',
      assumptions: [
        'All amounts are per person and stored in USD cents.',
        'Travel dates are unknown, so seasonal price changes are excluded.',
        `Accommodation, food, local transport, and unmatched activities use a ${localPriceFactor.toFixed(1)}× destination price adjustment.`,
        groupAssumption,
      ],
    })
  }
}
