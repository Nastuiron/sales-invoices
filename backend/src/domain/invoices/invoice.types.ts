export const INVOICE_STATUSES = [
  'draft',
  'issued',
  'sent',
  'paid',
  'credited',
] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PAYMENT_METHODS = [
  'bank_transfer',
  'card',
  'direct_debit',
  'cheque',
] as const

export interface CreditNoteReference {
  number: string
  issuedAt: string
  reason: string
}

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type VatRate = 0 | 5.5 | 10 | 20

export interface PostalAddress {
  street: string
  postalCode: string
  city: string
  country: string
}

export interface InvoiceCustomer {
  id: string
  name: string
  email: string
  billingAddress: PostalAddress
  vatNumber?: string
}

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPriceCents: number
  vatRate: VatRate
}

export interface Invoice {
  id: string
  invoiceNumber?: string
  status: InvoiceStatus

  customer: InvoiceCustomer
  lines: InvoiceLine[]

  issueDate?: string
  dueDate?: string
  sentAt?: string
  paidAt?: string


  currency: 'EUR'
  amountPaidCents: number
  paymentMethod?: PaymentMethod
  paymentReference?: string

  purchaseOrderReference?: string
  notes?: string
  creditNote?: CreditNoteReference

  createdAt: string
  updatedAt: string
}