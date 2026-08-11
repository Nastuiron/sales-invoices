import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createTransaction, database } from './database.js'

const migrationId = '001_create_invoices'

database.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )
`)

const alreadyApplied = database
  .prepare(
    'SELECT id FROM schema_migrations WHERE id = ?',
  )
  .get(migrationId)

if (alreadyApplied !== undefined) {
  console.log(`Migration déjà appliquée : ${migrationId}`)
} else {
  const migrationPath = fileURLToPath(
    new URL(
      './migrations/001_create_invoices.sql',
      import.meta.url,
    ),
  )

  const migrationSql = readFileSync(
    migrationPath,
    'utf8',
  )

  const applyMigration = createTransaction(() => {
    database.exec(migrationSql)

    database
      .prepare(`
        INSERT INTO schema_migrations (id, applied_at)
        VALUES (?, ?)
      `)
      .run(migrationId, new Date().toISOString())
  })

  applyMigration()

  console.log(`Migration appliquée : ${migrationId}`)
}

database.close()