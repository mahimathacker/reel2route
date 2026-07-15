import { ingestContentRequestSchema } from '@reel2route/contracts'
import { Router } from 'express'

import type { IngestionService } from './ingestion.service.js'

type IngestionServicePort = Pick<IngestionService, 'ingest'>

export const createIngestionRouter = (
  ingestionService: IngestionServicePort,
): Router => {
  const router = Router()

  router.post('/', async (request, response) => {
    const input = ingestContentRequestSchema.parse(request.body)
    const content = await ingestionService.ingest(input.url)

    response.status(200).json(content)
  })

  return router
}
