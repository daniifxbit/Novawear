import { db } from './db.js'
import type { OrderMailData } from './emails.js'

interface Row {
  ref: string
  customer_name: string
  customer_email: string
  country_code: string
  items: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
}

/** Reads back just what the email templates need for one order. */
export function orderMailData(orderId: string): OrderMailData | null {
  const row = db
    .prepare(`
      SELECT ref, customer_name, customer_email, country_code, items,
             subtotal_cents, shipping_cents, total_cents
      FROM orders WHERE id = ?
    `)
    .get(orderId) as Row | undefined

  if (!row) return null

  return {
    ref: row.ref,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    countryCode: row.country_code,
    items: JSON.parse(row.items),
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
  }
}
