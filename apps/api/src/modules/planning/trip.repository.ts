import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import {
  tripPlanningResponseSchema,
  type TripPlanningResponse,
  type TripPreferences,
} from '@reel2route/contracts'
import { z } from 'zod'

type TripPayload = Pick<TripPlanningResponse, 'analysis' | 'options'>

const storedRowSchema = z.object({
  id: z.uuid(),
  created_at: z.iso.datetime(),
  payload_json: z.string(),
})

export const openTripDatabase = (path: string) => {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const database = new DatabaseSync(path, { timeout: 5_000 })
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      preferences_json TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS trips_created_at_idx ON trips(created_at DESC);
  `)
  return database
}

export class TripRepository {
  readonly #insert
  readonly #find

  constructor(private readonly database: DatabaseSync) {
    this.#insert = database.prepare(`
      INSERT INTO trips (id, source_url, preferences_json, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    this.#find = database.prepare(
      'SELECT id, created_at, payload_json FROM trips WHERE id = ?',
    )
  }

  save(
    sourceUrl: string,
    preferences: TripPreferences,
    payload: TripPayload,
  ) {
    const tripId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    this.#insert.run(
      tripId,
      sourceUrl,
      JSON.stringify(preferences),
      JSON.stringify(payload),
      createdAt,
    )
    return { tripId, createdAt }
  }

  findById(tripId: string): TripPlanningResponse | null {
    const row = this.#find.get(tripId)
    if (row === undefined) return null
    const stored = storedRowSchema.parse(row)
    return tripPlanningResponseSchema.parse({
      tripId: stored.id,
      createdAt: stored.created_at,
      ...JSON.parse(stored.payload_json),
    })
  }

  close() {
    this.database.close()
  }
}
