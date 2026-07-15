import { tripPlanningResponseSchema, type TripPlanningResponse, type TripPreferences } from '@reel2route/contracts'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
type ApiErrorBody = { error?: { message?: string } }

export const createTrip = async (url: string, preferences: TripPreferences): Promise<TripPlanningResponse> => {
  const response = await fetch(`${API_URL}/api/trips`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url, preferences }), signal: AbortSignal.timeout(90_000) })
  const body: unknown = await response.json()
  if (!response.ok) throw new Error((body as ApiErrorBody).error?.message ?? 'The trip planning service is unavailable.')
  return tripPlanningResponseSchema.parse(body)
}
