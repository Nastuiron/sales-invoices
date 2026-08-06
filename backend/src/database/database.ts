import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import Database from 'better-sqlite3'

const dataDirectory = fileURLToPath(
  new URL('../../data/', import.meta.url),
)

mkdirSync(dataDirectory, {
  recursive: true,
})

const databasePath = fileURLToPath(
  new URL('../../data/invoices.db', import.meta.url),
)

export const database = new Database(databasePath)

database.pragma('foreign_keys = ON')
database.pragma('journal_mode = WAL')