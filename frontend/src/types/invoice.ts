export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'paid'
  | 'credited'

export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'direct_debit'
  | 'cheque'

export interface InvoiceSummary {
  id: string
  invoiceNumber?: string
  status: InvoiceStatus

  customer: {
    id: string
    name: string
  }

  issueDate?: string
  dueDate?: string
  currency: 'EUR'

  subtotalCents: number
  vatAmountCents: number
  totalCents: number
  amountPaidCents: number
  remainingAmountCents: number

  isOverdue: boolean
}

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
  vatRate: 0 | 5.5 | 10 | 20
}

export interface CreditNoteReference {
  number: string
  issuedAt: string
  reason: string
}

export interface InvoiceDetails {
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

  subtotalCents: number
  vatAmountCents: number
  totalCents: number
  remainingAmountCents: number

  isOverdue: boolean
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus
}

export type UpdateInvoiceStatusInput =
  | {
      status: 'issued'
    }
  | {
      status: 'sent'
    }
  | {
      status: 'paid'
      payment: {
        amountCents: number
        method: PaymentMethod
        reference?: string
      }
    }
  | {
      status: 'credited'
      creditNote: {
        reason: string
      }
    }

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiListResponse<T> {
  data: T[]
  meta: {
    count: number
  }
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}