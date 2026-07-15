import { createApp } from './app.js'
import { env } from './config/env.js'
import { ingestionService } from './modules/ingestion/ingestion.composition.js'

const app = createApp({ ingestionService, webOrigin: env.WEB_ORIGIN })

const server = app.listen(env.PORT, (error) => {
  if (error) {
    console.error(`Failed to start the API on port ${env.PORT}`, error)
    process.exitCode = 1
    return
  }

  console.log(`Reel2Route API listening on http://localhost:${env.PORT}`)
})

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`${signal} received; closing the API server`)

  server.close((error) => {
    if (error) {
      console.error('Failed to close the API server cleanly', error)
      process.exitCode = 1
    }
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
