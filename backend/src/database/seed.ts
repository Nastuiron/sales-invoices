import { createTransaction, database } from './database.js'
import { invoiceSeedData } from './seeds/invoices.seed.js'

const insertInvoice = database.prepare(`
  INSERT OR IGNORE INTO invoices (
    id,
    invoice_number,
    status,

    customer_id,
    customer_name,
    customer_email,
    customer_street,
    customer_postal_code,
    customer_city,
    customer_country,
    customer_vat_number,

    issue_date,
    due_date,
    sent_at,
    paid_at,

    currency,
    amount_paid_cents,
    payment_method,
    payment_reference,

    purchase_order_reference,
    notes,

    credit_note_number,
    credit_note_issued_at,
    credit_note_reason,

    created_at,
    updated_at
  )
  VALUES (
    @id,
    @invoiceNumber,
    @status,

    @customerId,
    @customerName,
    @customerEmail,
    @customerStreet,
    @customerPostalCode,
    @customerCity,
    @customerCountry,
    @customerVatNumber,

    @issueDate,
    @dueDate,
    @sentAt,
    @paidAt,

    @currency,
    @amountPaidCents,
    @paymentMethod,
    @paymentReference,

    @purchaseOrderReference,
    @notes,

    @creditNoteNumber,
    @creditNoteIssuedAt,
    @creditNoteReason,

    @createdAt,
    @updatedAt
  )
`)

const insertInvoiceLine = database.prepare(`
  INSERT OR IGNORE INTO invoice_lines (
    id,
    invoice_id,
    description,
    quantity,
    unit_price_cents,
    vat_rate
  )
  VALUES (
    @id,
    @invoiceId,
    @description,
    @quantity,
    @unitPriceCents,
    @vatRate
  )
`)

const seedDatabase = createTransaction(() => {
  for (const invoice of invoiceSeedData) {
    insertInvoice.run({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber ?? null,
      status: invoice.status,

      customerId: invoice.customer.id,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      customerStreet:
        invoice.customer.billingAddress.street,
      customerPostalCode:
        invoice.customer.billingAddress.postalCode,
      customerCity:
        invoice.customer.billingAddress.city,
      customerCountry:
        invoice.customer.billingAddress.country,
      customerVatNumber:
        invoice.customer.vatNumber ?? null,

      issueDate: invoice.issueDate ?? null,
      dueDate: invoice.dueDate ?? null,
      sentAt: invoice.sentAt ?? null,
      paidAt: invoice.paidAt ?? null,

      currency: invoice.currency,
      amountPaidCents: invoice.amountPaidCents,
      paymentMethod: invoice.paymentMethod ?? null,
      paymentReference:
        invoice.paymentReference ?? null,

      purchaseOrderReference:
        invoice.purchaseOrderReference ?? null,
      notes: invoice.notes ?? null,

      creditNoteNumber:
        invoice.creditNote?.number ?? null,
      creditNoteIssuedAt:
        invoice.creditNote?.issuedAt ?? null,
      creditNoteReason:
        invoice.creditNote?.reason ?? null,

      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    })

    for (const line of invoice.lines) {
      insertInvoiceLine.run({
        id: line.id,
        invoiceId: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        vatRate: line.vatRate,
      })
    }
  }
})

try {
  seedDatabase()

  const result = database
    .prepare(`
      SELECT COUNT(*) AS count
      FROM invoices
    `)
    .get()

  if (
    result === undefined
    || typeof result.count !== 'number'
  ) {
    throw new Error(
      'Impossible de compter les factures générées.',
    )
  }

  console.log(
    `Jeu de données disponible : ${result.count} factures`,
  )
} finally {
  database.close()
}