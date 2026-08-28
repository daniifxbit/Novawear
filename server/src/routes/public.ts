import crypto from 'node:crypto'
import { Router } from 'express'
import { exec, getSetting, nextOrderRef, queryOne, BANK_DEFAULT, type BankInfo } from '../db.js'
import { CATEGORIES } from '../catalogue.js'
import {
  COUNTRIES,
  DELIVERY_STAGES,
  countryLabel,
  findProduct,
  isCountryCode,
  listProducts,
  shippingCents,
} from '../shop.js'
import { proofUpload, readFile, storeFile } from '../uploads.js'
import { orderMailData } from '../orderMail.js'
import { adminNewOrderMail, orderDeclaredMail } from '../emails.js'
import { ADMIN_EMAIL, queueMail } from '../mailer.js'

export const publicRouter = Router()

const MAX_QTY_PER_LINE = 20
const MAX_LINES = 40

publicRouter.get('/catalog', async (_req, res, next) => {
  try {
    res.json({
      categories: CATEGORIES.map((c) => ({
        id: c.id,
        code: c.code,
        label: c.label,
        subs: c.subs.map((s) => ({ id: s.id, label: s.label })),
      })),
      products: await listProducts(),
      countries: COUNTRIES,
      stages: DELIVERY_STAGES,
      chfRate: await getSetting<number>('chf_rate', 0.94),
    })
  } catch (err) {
    next(err)
  }
})

/**
 * Product photos added from the back-office. Public catalogue content, and
 * immutable once written — a new upload gets a new id — so it can be cached
 * hard by the CDN.
 */
publicRouter.get('/media/products/:id', async (req, res, next) => {
  try {
    const file = await readFile(req.params.id)
    if (!file) {
      res.status(404).json({ error: 'Fichier introuvable' })
      return
    }
    res.type(file.mime)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(file.bytes)
  } catch (err) {
    next(err)
  }
})

interface IncomingLine {
  productId: string
  size: string
  qty: number
}

interface OrderItem {
  productId: string
  ref: string
  name: string
  size: string
  qty: number
  priceCents: number
  image: string
}

function parseLines(raw: unknown): IncomingLine[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'Panier vide'
  if (raw.length > MAX_LINES) return 'Trop d’articles dans le panier'

  const lines: IncomingLine[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return 'Ligne de panier invalide'
    const { productId, size, qty } = entry as Record<string, unknown>
    if (typeof productId !== 'string' || typeof size !== 'string') return 'Ligne de panier invalide'
    const n = Number(qty)
    if (!Number.isInteger(n) || n < 1 || n > MAX_QTY_PER_LINE) return 'Quantité invalide'
    lines.push({ productId, size, qty: n })
  }
  return lines
}

/**
 * Step 1 → 2 of the checkout. Prices, shipping and the order reference are all
 * computed here, never trusted from the client, and the bank details are only
 * handed out once a valid draft order exists.
 */
publicRouter.post('/checkout', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const customer = (body.customer ?? {}) as Record<string, unknown>

    const name = String(customer.name ?? '').trim()
    const email = String(customer.email ?? '').trim()
    const addr = String(customer.addr ?? '').trim()
    const phone = String(customer.phone ?? '').trim()
    const city = String(customer.city ?? '').trim()

    if (!name || !email || !addr) {
      res.status(400).json({ error: 'Nom, email et adresse requis' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse email invalide' })
      return
    }
    if (!isCountryCode(body.country)) {
      res.status(400).json({ error: 'Pays de livraison invalide' })
      return
    }

    const lines = parseLines(body.items)
    if (typeof lines === 'string') {
      res.status(400).json({ error: lines })
      return
    }

    const items: OrderItem[] = []
    for (const line of lines) {
      const product = await findProduct(line.productId)
      if (!product) {
        res.status(409).json({ error: 'Un article du panier n’est plus disponible' })
        return
      }
      if (!product.sizes.includes(line.size)) {
        res.status(409).json({ error: `Taille indisponible pour ${product.name}` })
        return
      }
      items.push({
        productId: product.id,
        ref: product.ref,
        name: product.name,
        size: line.size,
        qty: line.qty,
        priceCents: product.priceCents,
        image: product.image,
      })
    }

    const subtotal = items.reduce((sum, it) => sum + it.priceCents * it.qty, 0)
    const shipping = shippingCents(subtotal, body.country)
    const id = crypto.randomUUID()
    const ref = await nextOrderRef()

    await exec(
      `INSERT INTO orders (
        id, ref, status, stage, reason,
        customer_name, customer_email, customer_phone, customer_city, customer_addr, country_code,
        items, subtotal_cents, shipping_cents, total_cents
      ) VALUES ($1, $2, 'draft', 0, '', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id, ref, name, email, phone, city, addr, body.country,
        JSON.stringify(items), subtotal, shipping, subtotal + shipping,
      ],
    )

    res.json({
      orderId: id,
      ref,
      bank: await getSetting<BankInfo>('bank', BANK_DEFAULT),
      subtotalCents: subtotal,
      shippingCents: shipping,
      totalCents: subtotal + shipping,
      countryLabel: countryLabel(body.country),
    })
  } catch (err) {
    next(err)
  }
})

/** Step 2 → confirmation: attach the transfer receipt and hand the order to the admin. */
publicRouter.post('/checkout/:id/confirm', proofUpload.single('proof'), async (req, res, next) => {
  try {
    const row = await queryOne<{ id: string; ref: string; status: string }>(
      'SELECT id, ref, status FROM orders WHERE id = $1',
      [req.params.id],
    )

    if (!row) {
      res.status(404).json({ error: 'Commande introuvable' })
      return
    }
    if (row.status !== 'draft') {
      res.status(409).json({ error: 'Cette commande a déjà été confirmée' })
      return
    }
    if (!req.file) {
      res.status(400).json({ error: 'Joins la preuve de virement' })
      return
    }

    const fileId = await storeFile('proof', req.file)

    await exec(
      `UPDATE orders SET status = 'pending', proof_file = $1, proof_mime = $2, proof_name = $3, updated_at = now()
       WHERE id = $4`,
      [fileId, req.file.mimetype, req.file.originalname, row.id],
    )

    const order = await orderMailData(row.id)
    if (order) {
      queueMail(orderDeclaredMail(order, await getSetting<BankInfo>('bank', BANK_DEFAULT)))
      if (ADMIN_EMAIL) queueMail(adminNewOrderMail(order, ADMIN_EMAIL))
    }

    res.json({ ref: row.ref })
  } catch (err) {
    next(err)
  }
})

/**
 * Public order tracking. Deliberately narrow: it returns the delivery state and
 * nothing that identifies the buyer (no name, address, email or receipt).
 */
publicRouter.get('/track', async (req, res, next) => {
  try {
    const ref = String(req.query.ref ?? '').trim()
    if (!ref) {
      res.status(400).json({ error: 'Saisis ta référence de commande' })
      return
    }

    const row = await queryOne<{
      ref: string
      status: string
      stage: number
      reason: string
      items: { qty: number }[]
      total_cents: number
      created_at: Date
    }>(
      `SELECT ref, status, stage, reason, items, total_cents, created_at
       FROM orders WHERE lower(ref) = lower($1) AND status <> 'draft'`,
      [ref],
    )

    if (!row) {
      res.status(404).json({ error: `Aucune commande trouvée pour ${ref}` })
      return
    }

    res.json({
      ref: row.ref,
      status: row.status,
      stage: row.stage,
      reason: row.reason,
      itemCount: row.items.reduce((sum, it) => sum + it.qty, 0),
      totalCents: row.total_cents,
      createdAt: row.created_at.toISOString(),
    })
  } catch (err) {
    next(err)
  }
})
