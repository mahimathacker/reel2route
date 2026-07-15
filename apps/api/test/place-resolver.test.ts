import type { ExtractedPlace } from '@reel2route/contracts'
import { describe, expect, it, vi } from 'vitest'

import { PlaceResolver } from '../src/modules/places/place-resolver.js'

const source: ExtractedPlace = {
  name: 'City Palace',
  category: 'landmark',
  context: 'A heritage stop',
  evidence: [{ source: 'title', text: 'City Palace guide', timestampSeconds: null }],
  confidence: 'high',
  mentionCount: 2,
}

const place = (id: string, name: string) => ({
  id,
  displayName: { text: name },
  formattedAddress: 'Jaipur, Rajasthan, India',
  location: { latitude: 26.9258, longitude: 75.8237 },
  primaryType: 'historical_landmark',
  types: ['historical_landmark'],
  rating: 4.5,
  priceLevel: 'PRICE_LEVEL_MODERATE' as const,
  googleMapsUri: `https://maps.google.com/?cid=${id}`,
})

describe('PlaceResolver', () => {
  it('resolves a strong name match and normalizes price level', async () => {
    const search = vi.fn().mockResolvedValue([place('city-palace', 'City Palace')])
    const resolver = new PlaceResolver({ search })

    const result = await resolver.resolve(source, 'Jaipur, India')

    expect(search).toHaveBeenCalledWith('City Palace, Jaipur, India')
    expect(result).toMatchObject({
      status: 'resolved',
      placeId: 'city-palace',
      resolutionConfidence: 'high',
      priceLevel: 2,
      rating: 4.5,
    })
  })

  it('keeps competing matches ambiguous instead of choosing silently', async () => {
    const resolver = new PlaceResolver({
      search: vi.fn().mockResolvedValue([
        place('one', 'City Palace'),
        place('two', 'City Palace'),
      ]),
    })

    const result = await resolver.resolve(source, null)

    expect(result.status).toBe('ambiguous')
    expect(result.placeId).toBeNull()
    expect(result.alternatives).toHaveLength(2)
  })

  it('preserves an extracted place when Google finds no candidates', async () => {
    const resolver = new PlaceResolver({ search: vi.fn().mockResolvedValue([]) })

    const result = await resolver.resolve(source, 'Jaipur')

    expect(result.status).toBe('not_found')
    expect(result.source).toEqual(source)
  })
})
