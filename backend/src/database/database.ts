import {
  mkdirSync,
} from 'node:fs'
import {
  DatabaseSync,
} from 'node:sqlite'
import {
  fileURLToPath,
} from 'node:url'

const dataDirectory = fileURLToPath(
  new URL('../../data/', import.meta.url),
)

mkdirSync(dataDirectory, {
  recursive: true,
})

const databasePath = fileURLToPath(
  new URL(
    '../../data/invoices.db',
    import.meta.url,
  ),
)

export const database =
  new DatabaseSync(databasePath)

database.exec('PRAGMA foreign_keys = ON')
database.exec('PRAGMA journal_mode = WAL')

export function createTransaction<
  Arguments extends unknown[],
  Result,
>(
  operation: (
    ...args: Arguments
  ) => Result,
): (...args: Arguments) => Result {
  return (...args: Arguments): Result => {
    database.exec('BEGIN IMMEDIATE')

    try {
      const result = operation(...args)

      database.exec('COMMIT')

      return result
    } catch (error: unknown) {
      if (database.isTransaction) {
        database.exec('ROLLBACK')
      }

      throw error
    }
  }
}