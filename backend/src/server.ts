import { app } from './app.js'
import { database } from './database/database.js'

const port = Number(process.env.PORT ?? 3000)

const server = app.listen(port, () => {
  console.log(
    `API disponible sur http://localhost:${port}`,
  )
})

let isShuttingDown = false

function shutdown(signal: string): void {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true

  console.log(
    `Signal ${signal} reçu, arrêt du serveur...`,
  )

  const forcedShutdown = setTimeout(() => {
    console.error(
      "L'arrêt gracieux a dépassé le délai autorisé.",
    )

    server.closeAllConnections()

    if (database.open) {
      database.close()
    }

    process.exit(1)
  }, 10_000)

  forcedShutdown.unref()

  server.close((error) => {
    clearTimeout(forcedShutdown)

    if (database.open) {
      database.close()
    }

    if (error !== undefined) {
      console.error(
        "Une erreur est survenue pendant l'arrêt.",
        error,
      )

      process.exit(1)
    }

    console.log(
      'Serveur et connexion SQLite arrêtés.',
    )

    process.exit(0)
  })
}

process.once('SIGINT', () => {
  shutdown('SIGINT')
})

process.once('SIGTERM', () => {
  shutdown('SIGTERM')
})