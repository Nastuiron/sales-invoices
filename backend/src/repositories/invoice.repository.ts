import { database, createTransaction } from '../database/database.js'
import type {
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  PaymentMethod,
  VatRate,
} from '../domain/invoices/invoice.types.js'

interface DocumentNumberRow {
  document_number: string
}

function getNextDocumentNumber(
  column: 'invoice_number' | 'credit_note_number',
  prefix: 'FAC' | 'AV',
  year: string,
): string {
  const previousDocument = database
    .prepare(`
      SELECT ${column} AS document_number
      FROM invoices
      WHERE ${column} LIKE ?
      ORDER BY ${column} DESC
      LIMIT 1
    `)
    .get(`${prefix}-${year}-%`) as unknown as
    | DocumentNumberRow
    | undefined

  const previousSequence =
    previousDocument === undefined
      ? 0
      : Number(
          previousDocument.document_number
            .split('-')
            .at(-1),
        )

  const nextSequence = previousSequence + 1

  return `${prefix}-${year}-${String(
    nextSequence,
  ).padStart(4, '0')}`
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus
}

export type InvoiceStatusUpdateCommand =
  | {
      invoiceId: string
      expectedStatus: InvoiceStatus
      nextStatus: 'issued'
      occurredAt: string
    }
  | {
      invoiceId: string
      expectedStatus: InvoiceStatus
      nextStatus: 'sent'
      occurredAt: string
    }
  | {
      invoiceId: string
      expectedStatus: InvoiceStatus
      nextStatus: 'paid'
      occurredAt: string
      amountPaidCents: number
      paymentMethod: PaymentMethod
      paymentReference?: string
    }
  | {
      invoiceId: string
      expectedStatus: InvoiceStatus
      nextStatus: 'credited'
      occurredAt: string
      creditNoteReason: string
    }

interface InvoiceRow {
  id: string
  invoice_number: string | null
  status: InvoiceStatus

  customer_id: string
  customer_name: string
  customer_email: string
  customer_street: string
  customer_postal_code: string
  customer_city: string
  customer_country: string
  customer_vat_number: string | null

  issue_date: string | null
  due_date: string | null
  sent_at: string | null
  paid_at: string | null

  currency: 'EUR'
  amount_paid_cents: number
  payment_method: PaymentMethod | null
  payment_reference: string | null

  purchase_order_reference: string | null
  notes: string | null

  credit_note_number: string | null
  credit_note_issued_at: string | null
  credit_note_reason: string | null

  created_at: string
  updated_at: string
}

interface InvoiceLineRow {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price_cents: number
  vat_rate: VatRate
}

function mapInvoiceLine(row: InvoiceLineRow): InvoiceLine {
  return {
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    vatRate: row.vat_rate,
  }
}

function mapInvoice(
  row: InvoiceRow,
  lines: InvoiceLine[],
): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number ?? undefined,
    status: row.status,

    customer: {
      id: row.customer_id,
      name: row.customer_name,
      email: row.customer_email,
      billingAddress: {
        street: row.customer_street,
        postalCode: row.customer_postal_code,
        city: row.customer_city,
        country: row.customer_country,
      },
      vatNumber: row.customer_vat_number ?? undefined,
    },

    lines,

    issueDate: row.issue_date ?? undefined,
    dueDate: row.due_date ?? undefined,
    sentAt: row.sent_at ?? undefined,
    paidAt: row.paid_at ?? undefined,

    currency: row.currency,
    amountPaidCents: row.amount_paid_cents,
    paymentMethod: row.payment_method ?? undefined,
    paymentReference:
      row.payment_reference ?? undefined,

    purchaseOrderReference:
      row.purchase_order_reference ?? undefined,
    notes: row.notes ?? undefined,

    creditNote:
      row.credit_note_number !== null &&
      row.credit_note_issued_at !== null &&
      row.credit_note_reason !== null
        ? {
            number: row.credit_note_number,
            issuedAt: row.credit_note_issued_at,
            reason: row.credit_note_reason,
          }
        : undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findAllInvoices(
  filters: InvoiceFilters = {},
): Invoice[] {
  const conditions: string[] = []
  const parameters: Record<string, string> = {}

  if (
    filters.search !== undefined &&
    filters.search.trim() !== ''
  ) {
    conditions.push(`
      (
        LOWER(COALESCE(invoice_number, '')) LIKE @search
        OR LOWER(customer_name) LIKE @search
        OR LOWER(COALESCE(purchase_order_reference, ''))
          LIKE @search
      )
    `)

    parameters.search =
      `%${filters.search.trim().toLowerCase()}%`
  }

  if (filters.status !== undefined) {
    conditions.push('status = @status')
    parameters.status = filters.status
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

  const invoiceRows = database
    .prepare(`
      SELECT *
      FROM invoices
      ${whereClause}
      ORDER BY
        COALESCE(issue_date, created_at) DESC,
        created_at DESC
    `)
    .all(parameters) as unknown as InvoiceRow[]

  if (invoiceRows.length === 0) {
    return []
  }

  const invoiceIds = invoiceRows.map((row) => row.id)
  const placeholders = invoiceIds
    .map(() => '?')
    .join(', ')

  const lineRows = database
    .prepare(`
      SELECT *
      FROM invoice_lines
      WHERE invoice_id IN (${placeholders})
      ORDER BY rowid
    `)
    .all(...invoiceIds) as unknown as InvoiceLineRow[]

  const linesByInvoiceId = new Map<string, InvoiceLine[]>()

  for (const row of lineRows) {
    const lines = linesByInvoiceId.get(row.invoice_id) ?? []

    lines.push(mapInvoiceLine(row))
    linesByInvoiceId.set(row.invoice_id, lines)
  }

  return invoiceRows.map((row) =>
    mapInvoice(
      row,
      linesByInvoiceId.get(row.id) ?? [],
    ),
  )
}

export function findInvoiceById(
  invoiceId: string,
): Invoice | undefined {
  const invoiceRow = database
    .prepare(`
      SELECT *
      FROM invoices
      WHERE id = ?
    `)
    .get(invoiceId) as unknown as
  | InvoiceRow
  | undefined

  if (invoiceRow === undefined) {
    return undefined
  }

  const lineRows = database
    .prepare(`
      SELECT *
      FROM invoice_lines
      WHERE invoice_id = ?
      ORDER BY rowid
    `)
    .all(invoiceId) as unknown as InvoiceLineRow[]

  return mapInvoice(
    invoiceRow,
    lineRows.map(mapInvoiceLine),
  )
}

export function updateInvoiceStatus(
  command: InvoiceStatusUpdateCommand,
): Invoice | undefined {
  const executeUpdate = createTransaction(() => {
    let changes = 0

    if (command.nextStatus === 'issued') {
      const year = command.occurredAt.slice(0, 4)

      const invoiceNumber = getNextDocumentNumber(
        'invoice_number',
        'FAC',
        year,
      )

      const result = database
        .prepare(`
          UPDATE invoices
          SET
            status = @nextStatus,
            invoice_number = @invoiceNumber,
            issue_date = COALESCE(
              issue_date,
              substr(@occurredAt, 1, 10)
            ),
            updated_at = @occurredAt
          WHERE id = @invoiceId
            AND status = @expectedStatus
        `)
        .run({
          invoiceId: command.invoiceId,
          expectedStatus: command.expectedStatus,
          nextStatus: command.nextStatus,
          invoiceNumber,
          occurredAt: command.occurredAt,
        })

      changes = Number(result.changes)
    }

    if (command.nextStatus === 'sent') {
      const result = database
        .prepare(`
          UPDATE invoices
          SET
            status = @nextStatus,
            sent_at = @occurredAt,
            updated_at = @occurredAt
          WHERE id = @invoiceId
            AND status = @expectedStatus
        `)
        .run({
          invoiceId: command.invoiceId,
          expectedStatus: command.expectedStatus,
          nextStatus: command.nextStatus,
          occurredAt: command.occurredAt,
        })

      changes = Number(result.changes)
    }

    if (command.nextStatus === 'paid') {
      const result = database
        .prepare(`
          UPDATE invoices
          SET
            status = @nextStatus,
            amount_paid_cents = @amountPaidCents,
            payment_method = @paymentMethod,
            payment_reference = @paymentReference,
            paid_at = @occurredAt,
            updated_at = @occurredAt
          WHERE id = @invoiceId
            AND status = @expectedStatus
        `)
        .run({
          invoiceId: command.invoiceId,
          expectedStatus: command.expectedStatus,
          nextStatus: command.nextStatus,
          amountPaidCents: command.amountPaidCents,
          paymentMethod: command.paymentMethod,
          paymentReference:
            command.paymentReference ?? null,
          occurredAt: command.occurredAt,
        })

      changes = Number(result.changes)
    }

    if (command.nextStatus === 'credited') {
      const year = command.occurredAt.slice(0, 4)

      const creditNoteNumber = getNextDocumentNumber(
        'credit_note_number',
        'AV',
        year,
      )

      const result = database
        .prepare(`
          UPDATE invoices
          SET
            status = @nextStatus,
            credit_note_number = @creditNoteNumber,
            credit_note_issued_at = @occurredAt,
            credit_note_reason = @creditNoteReason,
            updated_at = @occurredAt
          WHERE id = @invoiceId
            AND status = @expectedStatus
        `)
        .run({
          invoiceId: command.invoiceId,
          expectedStatus: command.expectedStatus,
          nextStatus: command.nextStatus,
          creditNoteNumber,
          creditNoteReason:
            command.creditNoteReason,
          occurredAt: command.occurredAt,
        })

      changes = Number(result.changes)
    }

    if (changes !== 1) {
      return undefined
    }

    return findInvoiceById(command.invoiceId)
  })

  return executeUpdate()
}