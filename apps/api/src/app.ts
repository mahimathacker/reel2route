import { healthResponseSchema } from '@reel2route/contracts'
import cors from 'cors'
import express from 'express'

import { errorHandler } from './middleware/error-handler.js'
import { createIngestionRouter } from './modules/ingestion/ingestion.router.js'
import type { IngestionService } from './modules/ingestion/ingestion.service.js'

type AppDependencies = {
  ingestionService: Pick<IngestionService, 'ingest'>
  webOrigin: string
}

const healthResponse = healthResponseSchema.parse({
  status: 'ok',
  service: 'reel2route-api',
})

export const createApp = ({ ingestionService, webOrigin }: AppDependencies) => {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({ origin: webOrigin }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.status(200).json(healthResponse)
  })
  app.use('/api/ingestions', createIngestionRouter(ingestionService))
  app.use(errorHandler)

  return app
}
