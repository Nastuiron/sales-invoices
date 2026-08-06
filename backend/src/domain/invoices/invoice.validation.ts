import { calculateInvoiceAmounts } from './invoice.calculations.js'
import type { Invoice } from './invoice.types.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getInvoiceEmissionErrors(
  invoice: Invoice,
): string[] {
  const errors: string[] = []

  if (invoice.status !== 'draft') {
    errors.push('Seul un brouillon peut être émis.')
  }

  if (invoice.customer.name.trim() === '') {
    errors.push('Le nom du client est obligatoire.')
  }

  if (!EMAIL_PATTERN.test(invoice.customer.email)) {
    errors.push("L'adresse email du client est invalide.")
  }

  const { billingAddress } = invoice.customer

  if (
    billingAddress.street.trim() === '' ||
    billingAddress.postalCode.trim() === '' ||
    billingAddress.city.trim() === '' ||
    billingAddress.country.trim() === ''
  ) {
    errors.push(
      "L'adresse de facturation du client est incomplète.",
    )
  }

  if (invoice.lines.length === 0) {
    errors.push('La facture doit contenir au moins une ligne.')
  }

  invoice.lines.forEach((line, index) => {
    const lineNumber = index + 1

    if (line.description.trim() === '') {
      errors.push(
        `La description de la ligne ${lineNumber} est obligatoire.`,
      )
    }

    if (line.quantity <= 0) {
      errors.push(
        `La quantité de la ligne ${lineNumber} doit être supérieure à zéro.`,
      )
    }

    if (line.unitPriceCents <= 0) {
      errors.push(
        `Le prix de la ligne ${lineNumber} doit être supérieur à zéro.`,
      )
    }
  })

  if (invoice.issueDate === undefined) {
    errors.push("La date d'émission est obligatoire.")
  }

  if (invoice.dueDate === undefined) {
    errors.push("La date d'échéance est obligatoire.")
  }

  if (
    invoice.issueDate !== undefined &&
    invoice.dueDate !== undefined &&
    invoice.dueDate < invoice.issueDate
  ) {
    errors.push(
      "La date d'échéance ne peut pas précéder la date d'émission.",
    )
  }

  const { totalCents } = calculateInvoiceAmounts(invoice)

  if (totalCents <= 0) {
    errors.push(
      'Le montant total de la facture doit être supérieur à zéro.',
    )
  }

  return errors
}

export function canIssueInvoice(invoice: Invoice): boolean {
  return getInvoiceEmissionErrors(invoice).length === 0
}

export function getInvoicePaymentErrors(
  invoice: Invoice,
): string[] {
  const errors: string[] = []

  if (invoice.status !== 'sent') {
    errors.push(
      'Seule une facture envoyée peut être marquée comme réglée.',
    )
  }

  const { remainingAmountCents } =
    calculateInvoiceAmounts(invoice)

  if (remainingAmountCents > 0) {
    errors.push(
      'La facture ne peut pas être marquée comme réglée tant que son solde est positif.',
    )
  }

  if (remainingAmountCents < 0) {
    errors.push(
      'Le montant réglé ne peut pas dépasser le total de la facture.',
    )
  }

  if (invoice.paymentMethod === undefined) {
    errors.push('Le moyen de paiement est obligatoire.')
  }

  return errors
}

export function canMarkInvoiceAsPaid(
  invoice: Invoice,
): boolean {
  return getInvoicePaymentErrors(invoice).length === 0
}