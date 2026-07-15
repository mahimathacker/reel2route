import { readFile } from 'node:fs/promises'

import { z } from 'zod'

const tourCatalogueEntrySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    destination: z.enum(['jaipur', 'paris', 'bali', 'global']),
    placeNames: z.array(z.string().min(1)),
    categories: z.array(z.string().min(1)).min(1),
    personas: z.array(
      z.enum(['budget_explorer', 'comfort_traveller', 'premium_escape']),
    ),
    budgetRange: z.enum(['budget', 'moderate', 'premium']),
    priceMinor: z.number().int().nonnegative(),
    durationMinutes: z.number().int().min(30).max(720),
    rating: z.number().min(0).max(5),
  })
  .strict()

export type TourCatalogueEntry = z.infer<typeof tourCatalogueEntrySchema>

const catalogueSchema = z.array(tourCatalogueEntrySchema).min(20).max(30)

export const loadTourCatalogue = async (): Promise<TourCatalogueEntry[]> => {
  const url = new URL('../../../data/tours.json', import.meta.url)
  const contents = await readFile(url, 'utf8')
  return catalogueSchema.parse(JSON.parse(contents))
}
