import { ingestContentRequestSchema } from '@reel2route/contracts'
import { Router } from 'express'

import type { AnalysisService } from './analysis.service.js'

export const createAnalysisRouter = (
  analysisService: Pick<AnalysisService, 'analyze'>,
): Router => {
  const router = Router()

  router.post('/', async (request, response) => {
    const input = ingestContentRequestSchema.parse(request.body)
    const analysis = await analysisService.analyze(input.url)

    response.status(200).json(analysis)
  })

  return router
}
