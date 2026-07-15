import type { TripPlan, TripPreferences } from '@reel2route/contracts'
import { describe, expect, it } from 'vitest'

import { CostService } from '../src/modules/cost/cost.service.js'
import { PersonaService } from '../src/modules/persona/persona.service.js'

const preferences: TripPreferences = {
  origin: 'Mumbai, India',
  days: 4,
  budgetRange: 'moderate',
  groupType: 'couple',
  pace: 'balanced',
}

const planFor = (personaIndex: number): TripPlan => ({
  persona: new PersonaService().generate(preferences)[personaIndex]!,
  title: 'Jaipur plan',
  summary: 'A validated plan.',
  days: Array.from({ length: 4 }, (_, index) => ({
    day: index + 1,
    theme: 'Heritage',
    paceNote: 'Balanced day',
    stops:
      index === 0
        ? [
            {
              order: 1,
              placeId: 'city-palace',
              name: 'City Palace',
              category: 'landmark',
              latitude: 26.9258,
              longitude: 75.8237,
              suggestedActivity: null,
              durationMinutes: 120,
              reason: 'From the reel.',
              evidence: [
                { source: 'title', text: 'City Palace', timestampSeconds: null },
              ],
            },
          ]
        : [],
  })),
  unscheduledPlaces: [],
})

describe('CostService', () => {
  it('produces a complete per-person breakdown in integer minor units', () => {
    const estimate = new CostService().estimate(
      planFor(1),
      preferences,
      'Jaipur, India',
    )

    expect(estimate.lineItems.map(({ category }) => category)).toEqual([
      'flights',
      'accommodation',
      'activities',
      'food',
      'local_transport',
    ])
    expect(estimate.totalPerPersonMinor).toBe(
      estimate.lineItems.reduce((total, item) => total + item.amountMinor, 0),
    )
    expect(estimate.lineItems.find(({ category }) => category === 'flights')).toMatchObject({
      amountMinor: 20_000,
      confidence: 'low',
    })
  })

  it('makes premium plans more expensive than budget plans', () => {
    const service = new CostService()
    const budget = service.estimate(planFor(0), preferences, 'Jaipur, India')
    const premium = service.estimate(planFor(2), preferences, 'Jaipur, India')

    expect(premium.totalPerPersonMinor).toBeGreaterThan(
      budget.totalPerPersonMinor,
    )
  })

  it('does not add a flight when origin and destination match', () => {
    const estimate = new CostService().estimate(
      planFor(0),
      { ...preferences, origin: 'Jaipur, India' },
      'Jaipur, India',
    )

    expect(
      estimate.lineItems.find(({ category }) => category === 'flights')
        ?.amountMinor,
    ).toBe(0)
  })
})
