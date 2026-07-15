import { healthResponseSchema } from '@reel2route/contracts'
import cors from 'cors'
import express from 'express'

import { env } from './config/env.js'

export const app = express()

const healthResponse = healthResponseSchema.parse({
  status: 'ok',
  service: 'reel2route-api',
})

app.disable('x-powered-by')
app.use(
  cors({
    origin: env.WEB_ORIGIN,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.status(200).json(healthResponse)
})
