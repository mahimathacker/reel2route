import { describe, expect, it } from 'vitest'

import { PersonaService } from '../src/modules/persona/persona.service.js'

describe('PersonaService', () => {
  it('always generates the three distinct assignment personas', () => {
    const personas = new PersonaService().generate({
      origin: 'Mumbai, India',
      days: 4,
      budgetRange: 'moderate',
      groupType: 'couple',
      pace: 'balanced',
    })

    expect(personas.map(({ id }) => id)).toEqual([
      'budget_explorer',
      'comfort_traveller',
      'premium_escape',
    ])
    expect(personas[1]?.fitScore).toBeGreaterThan(personas[0]?.fitScore ?? 0)
    expect(personas[1]?.reason).toContain('4-day trip for couple travellers')
  })

  it('changes stop targets without erasing persona differences', () => {
    const service = new PersonaService()
    const base = {
      origin: 'Delhi, India',
      days: 3,
      budgetRange: 'budget' as const,
      groupType: 'solo' as const,
    }
    const relaxed = service.generate({ ...base, pace: 'relaxed' })
    const packed = service.generate({ ...base, pace: 'packed' })

    expect(packed.map(({ dailyStopTarget }) => dailyStopTarget)).toEqual(
      relaxed.map(({ dailyStopTarget }) => dailyStopTarget + 2),
    )
    expect(new Set(relaxed.map(({ dailyStopTarget }) => dailyStopTarget)).size).toBe(3)
  })

  it('ranks the persona matching the selected budget highest', () => {
    const personas = new PersonaService().generate({
      origin: 'London, UK',
      days: 5,
      budgetRange: 'premium',
      groupType: 'couple',
      pace: 'relaxed',
    })

    const highest = personas.reduce((best, current) =>
      current.fitScore > best.fitScore ? current : best,
    )
    expect(highest.id).toBe('premium_escape')
  })
})
