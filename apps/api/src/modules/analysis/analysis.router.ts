import { ingestContentRequestSchema } from '@reel2route/contracts'
import { Router } from 'express'

import { parseRequest } from '../../middleware/request-validation.js'
import type { AnalysisService } from './analysis.service.js'

export const createAnalysisRouter = (
  analysisService: Pick<AnalysisService, 'analyze'>,
): Router => {
  const router = Router()

  router.post('/', async (request, response) => {
    const input = parseRequest(ingestContentRequestSchema, request.body)
    const analysis = await analysisService.analyze(input.url)

    response.status(200).json(analysis)
  })

  return router
}
