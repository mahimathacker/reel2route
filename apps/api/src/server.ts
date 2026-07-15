import { app } from './app.js'
import { env } from './config/env.js'

const server = app.listen(env.PORT, () => {
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
