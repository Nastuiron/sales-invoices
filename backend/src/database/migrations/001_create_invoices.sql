CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'issued', 'sent', 'paid', 'credited')
  ),

  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_street TEXT NOT NULL,
  customer_postal_code TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_country TEXT NOT NULL,
  customer_vat_number TEXT,

  issue_date TEXT,
  due_date TEXT,
  sent_at TEXT,
  paid_at TEXT,

  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  amount_paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (
    amount_paid_cents >= 0
  ),

  payment_method TEXT CHECK (
    payment_method IS NULL
    OR payment_method IN (
      'bank_transfer',
      'card',
      'direct_debit',
      'cheque'
    )
  ),
  payment_reference TEXT,

  purchase_order_reference TEXT,
  notes TEXT,

  credit_note_number TEXT UNIQUE,
  credit_note_issued_at TEXT,
  credit_note_reason TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  CHECK (
    status != 'credited'
    OR (
      credit_note_number IS NOT NULL
      AND credit_note_issued_at IS NOT NULL
      AND credit_note_reason IS NOT NULL
    )
  )
);

CREATE TABLE invoice_lines (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  vat_rate REAL NOT NULL CHECK (vat_rate IN (0, 5.5, 10, 20)),

  FOREIGN KEY (invoice_id)
    REFERENCES invoices(id)
    ON DELETE CASCADE
);

CREATE INDEX invoices_status_index
  ON invoices(status);

CREATE INDEX invoices_customer_name_index
  ON invoices(customer_name);

CREATE INDEX invoice_lines_invoice_id_index
  ON invoice_lines(invoice_id);