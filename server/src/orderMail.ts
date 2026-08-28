import { queryOne } from './db.js'
import type { OrderMailData } from './emails.js'

interface Row {
  ref: string
  customer_name: string
  customer_email: string
  country_code: string
  items: OrderMailData['items']
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
}

/** Reads back just what the email templates need for one order. */
export async function orderMailData(orderId: string): Promise<OrderMailData | null> {
  const row = await queryOne<Row>(
    `SELECT ref, customer_name, customer_email, country_code, items,
            subtotal_cents, shipping_cents, total_cents
     FROM orders WHERE id = $1`,
    [orderId],
  )

  if (!row) return null

  return {
    ref: row.ref,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    countryCode: row.country_code,
    items: row.items,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
  }
}
