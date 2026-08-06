import { Router } from 'express'
import { simulateApiDelay } from '../middleware/delay.middleware.js'

import {
  getInvoiceController,
  listInvoicesController,
} from '../controllers/invoice.controller.js'

export const invoiceRouter = Router()

invoiceRouter.use(simulateApiDelay)

invoiceRouter.get('/', listInvoicesController)
invoiceRouter.get('/:id', getInvoiceController)