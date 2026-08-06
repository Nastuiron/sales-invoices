import { Router } from 'express'
import { simulateApiDelay } from '../middleware/delay.middleware.js'
import {
  simulateApiError,
} from '../middleware/simulated-error.middleware.js'

import {
  getInvoiceController,
  listInvoicesController,
  updateInvoiceStatusController,
} from '../controllers/invoice.controller.js'

export const invoiceRouter = Router()

invoiceRouter.use(simulateApiDelay)
invoiceRouter.use(simulateApiError)

invoiceRouter.use(simulateApiDelay)

invoiceRouter.get('/', listInvoicesController)
invoiceRouter.get('/:id', getInvoiceController)

invoiceRouter.patch(
  '/:id/status',
  updateInvoiceStatusController,
)
