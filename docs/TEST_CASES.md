# Documented test cases

These cases combine automated provider fixtures with live acceptance checks. Recorded output is representative, not a frozen promise: public content, model extraction, and Places data can change. Re-run each live URL before the Loom walkthrough and record the resulting trip ID.

## 1. YouTube travel video

**Input:** Jules Anderson, [5 days in Paris, France travel vlog exploring ALL the sights & hidden gems](https://www.youtube.com/watch?v=bzch3VfNREA)

**Persona answers:** Mumbai, India · 5 days · moderate · couple · balanced

**Representative extraction:**

```json
{
  "destinationGuess": "Paris, France",
  "places": [
    {
      "name": "Arc de Triomphe",
      "category": "landmark",
      "role": "independent_place",
      "parentPlaceName": null,
      "confidence": "high",
      "mentionCount": 3,
      "evidence": [
        {
          "source": "description",
          "text": "The Arc de Triomphe including rooftop views",
          "timestampSeconds": null
        }
      ]
    },
    {
      "name": "Eiffel Tower",
      "category": "landmark",
      "role": "independent_place",
      "parentPlaceName": null,
      "confidence": "high",
      "mentionCount": 3,
      "evidence": [
        {
          "source": "description",
          "text": "The best views of the Eiffel Tower sparkling at dark",
          "timestampSeconds": null
        }
      ]
    }
  ],
  "vibes": ["iconic", "romantic", "art-filled", "historic"],
  "missingInformation": [
    { "field": "hotel_area", "message": "No accommodation area is recommended." },
    { "field": "travel_dates", "message": "No travel dates are provided." }
  ]
}
```

**Observed live validation (July 15, 2026):** the source produced 22 place-like content mentions, 19 independently visitable candidates, and 13 resolved stops. Arc de Triomphe, Eiffel Tower, Notre-Dame, Panthéon, Jardin du Luxembourg, Musée d'Orsay, Palace of Versailles, Montmartre, Louvre Museum, Palais Garnier, Trocadéro, Mamiche, and Copains resolved. Ambiguous names such as a generic Seine cruise and cafés with competing branches remained visible in analysis but were not scheduled.

**Generated plan checks:**

- Exactly three options: Budget Explorer, Comfort Traveller, Premium Escape.
- The comfort option explains that its balanced pacing and mid-range assumptions match the supplied preference.
- All five days are populated from source-backed places. Thirteen validated stops are distributed `3, 3, 3, 2, 2` rather than being packed into the earliest days.
- Cost output contains flights, accommodation, activities, food, and local transport, plus total per person.
- Tour matches are labelled `mock`; packing advice is appropriate for three days and a couple.

**Pass condition:** `POST /api/trips` returns `200`, the evidence survives into the itinerary stop, all resolved coordinates validate, and `GET /api/trips/:tripId` returns the same payload.

## 2. Instagram Reel

Instagram public URLs are intentionally not pinned here because owners can delete or privatize a Reel and Instagram frequently changes unauthenticated access. For the recorded demo, paste a currently public travel Reel and add its exact URL and trip ID below.

**Recorded live URL:** `<add immediately before Loom>`  
**Recorded trip ID:** `<add immediately before Loom>`

**Automated fixture:** a public Reel page with `og:title`, `og:description`, `og:url`, and `instagram://media?id=ABC123` metadata. The provider normalizes this to platform `instagram`, external ID `ABC123`, caption text, canonical URL, and an empty transcript.

**Persona answers:** Mumbai · 4 days · budget · friends · packed

**Representative extraction:**

```json
{
  "destinationGuess": "Jaipur, Rajasthan",
  "places": [
    {
      "name": "Hawa Mahal",
      "category": "landmark",
      "role": "independent_place",
      "parentPlaceName": null,
      "confidence": "high",
      "mentionCount": 1,
      "evidence": [
        {
          "source": "caption",
          "text": "Sunrise at Hawa Mahal",
          "timestampSeconds": null
        }
      ]
    },
    {
      "name": "City Palace Jaipur",
      "category": "attraction",
      "role": "independent_place",
      "parentPlaceName": null,
      "confidence": "medium",
      "mentionCount": 1,
      "evidence": [
        {
          "source": "caption",
          "text": "then walking through City Palace",
          "timestampSeconds": null
        }
      ]
    }
  ],
  "vibes": ["colourful", "heritage", "photogenic"],
  "missingInformation": [
    { "field": "hotel_area", "message": "The caption does not recommend where to stay." },
    { "field": "transport_mode", "message": "Local transport is not shown in available metadata." }
  ]
}
```

**Generated plan checks:**

- Budget Explorer gets the strongest preference-match score, public/shared transport assumptions, and lower food/stay allowances.
- A packed preference permits more stops per day but never exceeds contract limits.
- Mock tours rank by destination/place/category, persona budget, and rating—not catalogue order.
- Bookability is the percentage of scheduled stops with at least one matched tour.

**Pass condition:** a public Reel with accessible metadata returns `200`; an inaccessible/private Reel returns a clear ingestion error rather than fabricated content.

## 3. Sparse content edge case

**Input fixture:** a valid public-Reel metadata page whose caption is `Weekend escape ✨` and contains no place, activity, or location tag.

**Persona answers:** Delhi · 2 days · premium · solo · relaxed

**Expected extraction:**

```json
{
  "destinationGuess": null,
  "places": [],
  "activities": [],
  "vibes": ["relaxed"],
  "missingInformation": [
    { "field": "destination", "message": "No destination can be established from the available content." },
    { "field": "hotel_area", "message": "No hotel or accommodation area is mentioned." },
    { "field": "transport_mode", "message": "No transport mode is mentioned." },
    { "field": "travel_dates", "message": "No travel dates are mentioned." }
  ]
}
```

**Expected product behavior:**

- The app does not hallucinate landmarks or send invented names to Google Places.
- It still returns the three persona shells only if the planning engine can represent empty days safely; every empty day clearly reflects missing source evidence.
- Activity cost is zero, tour recommendations are empty, and bookability is `0`.
- Flight and accommodation estimates are low confidence because the destination and dates are unknown.
- The result prominently invites the user to try a richer Reel rather than presenting an empty plan as complete.

**Pass condition:** no ungrounded place appears. A graceful, evidence-honest result or a specific insufficient-content domain response is preferable to a plausible-looking hallucination.

## Before recording

Run the complete regression suite, then execute each live case once:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

For the Loom, retain the live Instagram URL, trip IDs, screenshots, API response timestamps, and any provider limitations observed. This separates demonstrated behavior from representative documentation.
