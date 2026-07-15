# API cost estimate at 100K MAU

This is a back-of-the-envelope monthly model in USD, using public list prices checked on July 15, 2026. It estimates external API usage, not cloud compute, storage, observability, taxes, support, or engineering time.

## Assumptions

| Assumption | Value |
| --- | ---: |
| Monthly active users | 100,000 |
| Users generating one trip per month | 40% |
| Trips generated | 40,000 |
| YouTube share | 70% / 28,000 trips |
| Instagram share | 30% / 12,000 trips |
| Extracted places resolved per trip | 8 |
| LLM input per trip | 6,000 tokens |
| LLM output per trip | 1,500 tokens |
| Tour provider | Local mock catalogue |
| Cache hit rate in baseline | 0% |

Forty percent conversion is intentionally explicit; MAU alone does not equal an API-heavy trip generation. The baseline excludes caching because the submitted local application does not implement Redis or another shared cache.

## Monthly estimate

| Layer | Calculation | Monthly cost |
| --- | --- | ---: |
| OpenAI input | 40K × 6K = 240M tokens × $0.25/M | $60 |
| OpenAI output | 40K × 1.5K = 60M tokens × $2.00/M | $120 |
| YouTube metadata | 28K `videos.list` calls | $0 direct fee |
| Google Places | 320K Text Search Enterprise requests | $9,625 |
| Mock tours | Local JSON and ranking | $0 |
| Instagram metadata | Public-page fetches | $0 provider fee |
| **Estimated external API total** | | **$9,805/month** |

That is approximately **$0.098 per MAU** or **$0.245 per generated trip**. Google Places accounts for roughly 98% of the external API total, so place-call discipline matters far more than small prompt savings in this model.

## Calculation details

### LLM extraction

The default model is `gpt-5-mini`. Its [official model page](https://developers.openai.com/api/docs/models/gpt-5-mini) lists $0.25 per million input tokens and $2.00 per million output tokens.

```text
Input:  40,000 × 6,000 = 240,000,000 tokens → $60
Output: 40,000 × 1,500 =  60,000,000 tokens → $120
Total:                                              $180
```

This assumes one structured extraction call per trip. The deterministic persona, itinerary, cost, tour, packing, and bookability stages add no LLM tokens. Retries, unusually long transcripts, cached-input discounts, and future model-price changes are excluded.

### YouTube Data API

The [YouTube quota table](https://developers.google.com/youtube/v3/determine_quota_cost) assigns one quota unit to `videos.list`. At 28,000 YouTube trips per month, average use is about 933 units/day, below the commonly allocated 10,000 daily units.

There is no direct per-call charge in this estimate. Traffic bursts, other YouTube endpoints, duplicate retries, and changes to the project's assigned quota still require monitoring; a quota-extension request may be needed as usage patterns grow.

### Google Places

The application requests rating and price level in addition to basic place data. Google bills a request at the highest field tier used, so this estimate conservatively treats it as Text Search Enterprise. See the official [Places SKU field rules](https://developers.google.com/maps/billing-and-pricing/sku-details) and [Maps Platform price list](https://developers.google.com/maps/billing-and-pricing/pricing).

At eight place resolutions for each of 40,000 trips:

```text
Requests:                         320,000
First 1,000 monthly requests:       free
Next 99,000 at $35 / 1,000:       $3,465
Next 220,000 at $28 / 1,000:      $6,160
Total:                            $9,625
```

The exact bill depends on billing account, region, negotiated discounts, field masks, and Google's current tiers. Ambiguous-result retries would increase usage; rejected extractions and cache hits would reduce it.

### Tours and Instagram

The submitted tour catalogue is local JSON, so it has no provider-call fee. A real affiliate integration may be free at request time but introduce approval requirements, rate limits, attribution rules, commission economics, and availability risk; those are commercial terms rather than assumed API costs.

Unauthenticated Instagram page fetching has no published per-request charge, but it is operationally fragile. Production could incur proxy, retry, anti-abuse, or licensed-content-provider costs. Those are not silently counted as zero infrastructure cost—they are simply unknown until a compliant ingestion route is selected.

## Practical optimization scenario

A production cache keyed by canonical URL, source revision, extraction version, and place query could plausibly avoid 35% of Places calls. At 208,000 requests:

```text
Google Places: $3,465 + $3,024 = $6,489
LLM:                                  $180
Optimized external API total:        $6,669/month
Savings versus baseline:             $3,136/month
```

This is why Redis was not added to the local take-home but is the first production scaling recommendation. Before implementation, measure duplicate URL frequency, safe cache lifetime, invalidation needs, and whether caching provider responses is permitted by current terms.

Other high-value controls:

- deduplicate extracted place names before resolution;
- cap places per trip and ask users to confirm ambiguous matches;
- use the smallest Google field mask needed at each stage;
- store resolved place IDs and refresh only stale attributes;
- hash normalized source content to avoid repeating LLM extraction;
- enforce per-user generation limits and retry budgets;
- record cost per successful trip, not only request count.

## Sensitivity

| Scenario | Trips/month | Places/trip | Approx. external total |
| --- | ---: | ---: | ---: |
| Lower engagement | 20,000 | 8 | $5,235 |
| Baseline | 40,000 | 8 | $9,805 |
| More extracted places | 40,000 | 12 | $14,285 |
| Baseline with 35% Places cache hit | 40,000 | 8 | $6,669 |

The sensitivity table keeps the same token assumptions and current tiered prices. It shows that place count, generation rate, and cache effectiveness should be product metrics from day one.
