import crypto from 'node:crypto'
import fs from 'node:fs'
import { Router } from 'express'
import { db, getSetting, setSetting, BANK_DEFAULT, type BankInfo } from '../db.js'
import { CATEGORIES, DESCRIPTIONS, photoPath } from '../catalogue.js'
import {
  DELIVERY_STAGES,
  REJECTION_REASONS,
  countryLabel,
  listProducts,
  toProduct,
  type ProductRow,
} from '../shop.js'
import { IS_DEMO_CODE, checkCode, cookieName, isAuthenticated, issueSession, requireAdmin } from '../auth.js'
import { productImagePath, productImageUpload, productImageUrl, proofPath } from '../uploads.js'
import { orderMailData } from '../orderMail.js'
import { orderRejectedMail, orderStageMail, orderValidatedMail } from '../emails.js'
import { queueMail } from '../mailer.js'

export const adminRouter = Router()

/** Slows down brute-forcing of the access code without needing a store. */
const loginAttempts = new Map<string, { count: number; until: number }>()
const MAX_ATTEMPTS = 8
const LOCKOUT_MS = 15 * 60 * 1000

adminRouter.get('/session', (req, res) => {
  res.json({ authenticated: isAuthenticated(req), demoCode: IS_DEMO_CODE })
})

adminRouter.post('/login', (req, res) => {
  const ip = req.ip ?? 'unknown'
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans quelques minutes' })
    return
  }
  if (record && record.until <= now) loginAttempts.delete(ip)

  if (!checkCode((req.body as Record<string, unknown>)?.code)) {
    const current = loginAttempts.get(ip) ?? { count: 0, until: now + LOCKOUT_MS }
    loginAttempts.set(ip, { count: current.count + 1, until: current.until })
    res.status(401).json({ error: 'Code incorrect' })
    return
  }

  loginAttempts.delete(ip)
  const session = issueSession()
  res.cookie(cookieName, session.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: session.maxAge,
  })
  res.json({ authenticated: true, demoCode: IS_DEMO_CODE })
})

adminRouter.post('/logout', (_req, res) => {
  res.clearCookie(cookieName)
  res.json({ authenticated: false })
})

adminRouter.use(requireAdmin)

/* ------------------------------------------------------------------ orders */

interface OrderRow {
  id: string
  ref: string
  status: string
  stage: number
  reason: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_city: string
  customer_addr: string
  country_code: string
  items: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  proof_file: string | null
  proof_mime: string | null
  proof_name: string | null
  created_at: string
  updated_at: string
}

const serialiseOrder = (o: OrderRow) => ({
  id: o.id,
  ref: o.ref,
  status: o.status,
  stage: o.stage,
  reason: o.reason,
  customer: {
    name: o.customer_name,
    email: o.customer_email,
    phone: o.customer_phone,
    city: o.customer_city,
    addr: o.customer_addr,
    country: countryLabel(o.country_code),
  },
  items: JSON.parse(o.items),
  subtotalCents: o.subtotal_cents,
  shippingCents: o.shipping_cents,
  totalCents: o.total_cents,
  hasProof: !!o.proof_file,
  proofMime: o.proof_mime,
  proofName: o.proof_name,
  proofUrl: o.proof_file ? `/api/admin/orders/${o.id}/proof` : null,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
})

adminRouter.get('/orders', (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM orders WHERE status <> 'draft' ORDER BY created_at DESC")
    .all() as OrderRow[]

  const orders = rows.map(serialiseOrder)
  res.json({
    orders,
    stats: {
      pending: orders.filter((o) => o.status === 'pending').length,
      valid: orders.filter((o) => o.status === 'valid').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
      revenueCents: orders.filter((o) => o.status === 'valid').reduce((s, o) => s + o.totalCents, 0),
    },
    reasons: REJECTION_REASONS,
  })
})

function loadOrder(id: string): OrderRow | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ? AND status <> 'draft'").get(id) as OrderRow | undefined
}

function updateOrder(id: string, patch: Record<string, string | number>) {
  const keys = Object.keys(patch)
  const assignments = keys.map((k) => `${k} = @${k}`).join(', ')
  db.prepare(`UPDATE orders SET ${assignments}, updated_at = @updated_at WHERE id = @id`).run({
    ...patch,
    id,
    updated_at: new Date().toISOString(),
  })
}

adminRouter.post('/orders/:id/validate', (req, res) => {
  const order = loadOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable' })
    return
  }
  updateOrder(order.id, { status: 'valid', reason: '', stage: 0 })

  const mailData = orderMailData(order.id)
  if (mailData) queueMail(orderValidatedMail(mailData))

  res.json(serialiseOrder(loadOrder(order.id)!))
})

adminRouter.post('/orders/:id/reject', (req, res) => {
  const order = loadOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable' })
    return
  }
  const reason = String((req.body as Record<string, unknown>)?.reason ?? '').trim()
  if (!reason) {
    res.status(400).json({ error: 'Indique un motif avant de rejeter' })
    return
  }
  const trimmed = reason.slice(0, 500)
  updateOrder(order.id, { status: 'rejected', reason: trimmed })

  const mailData = orderMailData(order.id)
  if (mailData) queueMail(orderRejectedMail(mailData, trimmed))

  res.json(serialiseOrder(loadOrder(order.id)!))
})

adminRouter.post('/orders/:id/reopen', (req, res) => {
  const order = loadOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable' })
    return
  }
  updateOrder(order.id, { status: 'pending', reason: '' })
  res.json(serialiseOrder(loadOrder(order.id)!))
})

adminRouter.post('/orders/:id/stage', (req, res) => {
  const order = loadOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable' })
    return
  }
  if (order.status !== 'valid') {
    res.status(409).json({ error: 'Valide le paiement avant de suivre la livraison' })
    return
  }
  const stage = Number((req.body as Record<string, unknown>)?.stage)
  if (!Number.isInteger(stage) || stage < 0 || stage >= DELIVERY_STAGES.length) {
    res.status(400).json({ error: 'Étape de livraison invalide' })
    return
  }
  // Only announce a stage the buyer has not been told about yet, so correcting
  // a mis-click backwards does not send a second "your parcel shipped" email.
  const isNewStage = stage > order.stage
  updateOrder(order.id, { stage })

  if (isNewStage) {
    const mailData = orderMailData(order.id)
    const mail = mailData ? orderStageMail(mailData, stage) : null
    if (mail) queueMail(mail)
  }

  res.json(serialiseOrder(loadOrder(order.id)!))
})

adminRouter.get('/orders/:id/proof', (req, res) => {
  const order = loadOrder(req.params.id)
  if (!order?.proof_file) {
    res.status(404).json({ error: 'Aucune preuve jointe' })
    return
  }
  res.type(order.proof_mime ?? 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(order.proof_name ?? 'justificatif')}"`)
  res.sendFile(proofPath(order.proof_file))
})

/* -------------------------------------------------------------------- bank */

adminRouter.get('/bank', (_req, res) => {
  res.json({ bank: getSetting<BankInfo>('bank', BANK_DEFAULT), defaults: BANK_DEFAULT })
})

adminRouter.put('/bank', (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>
  const holder = String(body.holder ?? '').trim()
  const iban = String(body.iban ?? '').trim().toUpperCase()
  const bic = String(body.bic ?? '').trim().toUpperCase()
  const bankName = String(body.bankName ?? '').trim()

  if (!holder || !iban || !bic) {
    res.status(400).json({ error: 'Titulaire, IBAN et BIC obligatoires' })
    return
  }

  const bank: BankInfo = { holder, iban, bic, bankName }
  setSetting('bank', bank)
  res.json({ bank })
})

/* ---------------------------------------------------------------- products */

const ADMIN_LIST_LIMIT = 80

adminRouter.get('/products', (req, res) => {
  const term = String(req.query.q ?? '').trim().toLowerCase()
  const all = listProducts()
  const matching = term
    ? all.filter((p) => `${p.name} ${p.ref} ${p.subLabel}`.toLowerCase().includes(term))
    : all

  const removed = db
    .prepare("SELECT COUNT(*) AS n FROM products WHERE deleted = 1 AND source = 'seed'")
    .get() as { n: number }

  res.json({
    products: matching.slice(0, ADMIN_LIST_LIMIT),
    matchCount: matching.length,
    totalCount: all.length,
    removedCount: removed.n,
  })
})

adminRouter.post('/products', productImageUpload.single('photo'), (req, res) => {
  const body = req.body as Record<string, string | undefined>
  const name = String(body.name ?? '').trim()
  const price = Number.parseFloat(String(body.price ?? '').replace(',', '.'))

  if (!name || !Number.isFinite(price) || price <= 0) {
    res.status(400).json({ error: 'Nom et prix requis' })
    return
  }

  const category = CATEGORIES.find((c) => c.id === body.cat) ?? CATEGORIES[0]
  const subCategory = category.subs.find((s) => s.id === body.sub) ?? category.subs[0]
  const sizes = String(body.sizes ?? '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)

  if (sizes.length === 0) {
    res.status(400).json({ error: 'Indique au moins une taille' })
    return
  }

  const adminCount = db.prepare("SELECT COUNT(*) AS n FROM products WHERE source = 'admin'").get() as { n: number }
  const image = req.file ? productImageUrl(req.file.filename) : photoPath(1)
  const now = new Date().toISOString()
  const id = 'x' + crypto.randomUUID()

  db.prepare(`
    INSERT INTO products (id, ref, name, cat_id, sub_id, price_cents, sizes, badge, description, image, pool, source, deleted, position, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 0, ?, ?)
  `).run(
    id,
    `NW-${category.code}-${901 + adminCount.n}`,
    name.toUpperCase(),
    category.id,
    subCategory.id,
    Math.round(price * 100),
    JSON.stringify(sizes),
    body.badge ? String(body.badge) : null,
    DESCRIPTIONS[category.id],
    image,
    JSON.stringify([image]),
    -Date.now(), // negative position: newest admin article sorts first
    now,
  )

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow
  res.status(201).json({ product: toProduct(row) })
})

adminRouter.delete('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as ProductRow | undefined
  if (!row) {
    res.status(404).json({ error: 'Article introuvable' })
    return
  }

  if (row.source === 'admin') {
    // Articles added from the back-office are removed for good, along with their photo.
    db.prepare('DELETE FROM products WHERE id = ?').run(row.id)
    const filename = row.image.startsWith('/api/media/products/') ? row.image.split('/').pop() : null
    if (filename) fs.rm(productImagePath(filename), { force: true }, () => {})
  } else {
    // Catalogue articles are hidden, and can be restored in bulk.
    db.prepare('UPDATE products SET deleted = 1 WHERE id = ?').run(row.id)
  }

  res.json({ ok: true })
})

adminRouter.post('/products/restore', (_req, res) => {
  const result = db.prepare("UPDATE products SET deleted = 0 WHERE deleted = 1 AND source = 'seed'").run()
  res.json({ restored: result.changes })
})
