import {
  personaProfileSchema,
  type PersonaId,
  type PersonaProfile,
  type TripPreferences,
} from '@reel2route/contracts'

type PersonaDefinition = Omit<PersonaProfile, 'fitScore' | 'reason' | 'dailyStopTarget'> & {
  baseStops: number
}

const DEFINITIONS: readonly PersonaDefinition[] = [
  {
    id: 'budget_explorer',
    name: 'Budget Explorer',
    summary: 'Prioritises authentic experiences and value over convenience.',
    accommodationStyle: 'Well-reviewed hostels, guesthouses, or simple hotels',
    transportStyle: 'Public transport, walking, and shared rides',
    diningStyle: 'Local eateries, markets, and affordable regional food',
    activityPricePreference: 'budget',
    baseStops: 5,
  },
  {
    id: 'comfort_traveller',
    name: 'Comfort Traveller',
    summary: 'Balances memorable experiences with time, rest, and convenience.',
    accommodationStyle: 'Reliable mid-range hotels in convenient areas',
    transportStyle: 'A practical mix of cabs, walking, and public transport',
    diningStyle: 'A mix of trusted local restaurants and casual discoveries',
    activityPricePreference: 'moderate',
    baseStops: 4,
  },
  {
    id: 'premium_escape',
    name: 'Premium Escape',
    summary: 'Optimises for privacy, service quality, and standout experiences.',
    accommodationStyle: 'Boutique or luxury stays with strong service',
    transportStyle: 'Private transfers and pre-arranged transport',
    diningStyle: 'Destination dining and highly rated premium restaurants',
    activityPricePreference: 'premium',
    baseStops: 3,
  },
]

const budgetFit = (persona: PersonaId, preferences: TripPreferences) => {
  const matchingPersona: Record<TripPreferences['budgetRange'], PersonaId> = {
    budget: 'budget_explorer',
    moderate: 'comfort_traveller',
    premium: 'premium_escape',
  }
  return matchingPersona[preferences.budgetRange] === persona ? 35 : 10
}

const groupFit = (persona: PersonaId, group: TripPreferences['groupType']) => {
  if (group === 'solo' && persona === 'budget_explorer') return 15
  if ((group === 'couple' || group === 'family') && persona === 'comfort_traveller') return 15
  if (group === 'couple' && persona === 'premium_escape') return 15
  return 8
}

const stopTarget = (base: number, pace: TripPreferences['pace']) =>
  Math.min(7, Math.max(2, base + (pace === 'packed' ? 1 : pace === 'relaxed' ? -1 : 0)))

const reasonFor = (
  definition: PersonaDefinition,
  preferences: TripPreferences,
) =>
  `${definition.name} adapts the ${preferences.days}-day trip for ${preferences.groupType} travellers with a ${preferences.pace} pace, using ${definition.transportStyle.toLowerCase()} and ${definition.accommodationStyle.toLowerCase()}.`

export class PersonaService {
  generate(preferences: TripPreferences): PersonaProfile[] {
    return DEFINITIONS.map((definition) =>
      personaProfileSchema.parse({
        id: definition.id,
        name: definition.name,
        summary: definition.summary,
        accommodationStyle: definition.accommodationStyle,
        transportStyle: definition.transportStyle,
        diningStyle: definition.diningStyle,
        activityPricePreference: definition.activityPricePreference,
        dailyStopTarget: stopTarget(definition.baseStops, preferences.pace),
        fitScore: 40 + budgetFit(definition.id, preferences) + groupFit(definition.id, preferences.groupType),
        reason: reasonFor(definition, preferences),
      }),
    )
  }
}
