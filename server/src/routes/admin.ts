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
import { csvUpload, productImagePath, productImageUpload, productImageUrl, proofPath } from '../uploads.js'
import { parseCsv, toCsv } from '../csv.js'
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

export const BADGES = ['NOUVEAU', 'DERNIÈRES PIÈCES', 'EXCLU'] as const

type Taxonomy =
  | { ok: false; error: string }
  | { ok: true; category: (typeof CATEGORIES)[number]; subCategory: (typeof CATEGORIES)[number]['subs'][number] }

/** Resolves a category/subcategory from either its id or its printed label. */
function resolveTaxonomy(catValue: string, subValue: string): Taxonomy {
  const key = catValue.trim().toLowerCase()
  const category =
    CATEGORIES.find((c) => c.id.toLowerCase() === key) ??
    CATEGORIES.find((c) => c.label.toLowerCase() === key)
  if (!category) return { ok: false, error: `Catégorie inconnue : « ${catValue} »` }

  const subKey = subValue.trim().toLowerCase()
  const subCategory =
    category.subs.find((s) => s.id.toLowerCase() === subKey) ??
    category.subs.find((s) => s.label.toLowerCase() === subKey)
  if (!subCategory) {
    return { ok: false, error: `Sous-catégorie inconnue pour ${category.label} : « ${subValue} »` }
  }

  return { ok: true, category, subCategory }
}

const parsePrice = (value: string) => Number.parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
const parseSizes = (value: string) =>
  value
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)

adminRouter.patch('/products/:id', productImageUpload.single('photo'), (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').get(req.params.id) as
    | ProductRow
    | undefined
  if (!row) {
    res.status(404).json({ error: 'Article introuvable' })
    return
  }

  const body = req.body as Record<string, string | undefined>
  const patch: Record<string, string | number | null> = {}

  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) {
      res.status(400).json({ error: 'Le nom ne peut pas être vide' })
      return
    }
    patch.name = name.toUpperCase()
  }

  if (body.ref !== undefined) {
    const ref = body.ref.trim()
    if (!ref) {
      res.status(400).json({ error: 'La référence ne peut pas être vide' })
      return
    }
    patch.ref = ref.toUpperCase()
  }

  if (body.price !== undefined) {
    const price = parsePrice(body.price)
    if (!Number.isFinite(price) || price <= 0) {
      res.status(400).json({ error: 'Prix invalide' })
      return
    }
    patch.price_cents = Math.round(price * 100)
  }

  if (body.sizes !== undefined) {
    const sizes = parseSizes(body.sizes)
    if (sizes.length === 0) {
      res.status(400).json({ error: 'Indique au moins une taille' })
      return
    }
    patch.sizes = JSON.stringify(sizes)
  }

  if (body.badge !== undefined) {
    const badge = body.badge.trim().toUpperCase()
    if (badge && !BADGES.includes(badge as (typeof BADGES)[number])) {
      res.status(400).json({ error: `Badge inconnu : « ${body.badge} »` })
      return
    }
    patch.badge = badge || null
  }

  if (body.cat !== undefined || body.sub !== undefined) {
    const resolved = resolveTaxonomy(body.cat ?? row.cat_id, body.sub ?? row.sub_id)
    if (!resolved.ok) {
      res.status(400).json({ error: resolved.error })
      return
    }
    patch.cat_id = resolved.category.id
    patch.sub_id = resolved.subCategory.id
    // The blurb follows the category it was written for.
    if (resolved.category.id !== row.cat_id) patch.description = DESCRIPTIONS[resolved.category.id]
  }

  if (req.file) {
    const image = productImageUrl(req.file.filename)
    patch.image = image
    patch.pool = JSON.stringify([image])

    const previous = row.image.startsWith('/api/media/products/') ? row.image.split('/').pop() : null
    if (previous) fs.rm(productImagePath(previous), { force: true }, () => {})
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'Aucune modification' })
    return
  }

  const assignments = Object.keys(patch)
    .map((column) => `${column} = @${column}`)
    .join(', ')
  db.prepare(`UPDATE products SET ${assignments} WHERE id = @id`).run({ ...patch, id: row.id })

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(row.id) as ProductRow
  res.json({ product: toProduct(updated) })
})

const CSV_HEAD = ['id', 'ref', 'nom', 'prix_eur', 'tailles', 'badge', 'categorie', 'sous_categorie']

adminRouter.get('/products/export.csv', (_req, res) => {
  const rows = listProducts().map((p) => [
    p.id,
    p.ref,
    p.name,
    (p.priceCents / 100).toFixed(2).replace('.', ','),
    p.sizes.join(' / '),
    p.badge ?? '',
    p.catId,
    p.subId,
  ])

  res.type('text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="novawear-catalogue-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(toCsv(CSV_HEAD, rows))
})

adminRouter.post('/products/import', csvUpload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Joins un fichier CSV' })
    return
  }

  const rows = parseCsv(req.file.buffer.toString('utf8'))
  if (rows.length < 2) {
    res.status(400).json({ error: 'Le fichier est vide ou ne contient que l’en-tête' })
    return
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  const column = (name: string) => header.indexOf(name)
  const idAt = column('id')
  const refAt = column('ref')

  if (idAt === -1 && refAt === -1) {
    res.status(400).json({ error: 'Le fichier doit contenir une colonne « id » ou « ref »' })
    return
  }

  const at = {
    name: column('nom'),
    price: column('prix_eur'),
    sizes: column('tailles'),
    badge: column('badge'),
    cat: column('categorie'),
    sub: column('sous_categorie'),
  }

  const errors: { line: number; message: string }[] = []
  let updated = 0
  let unchanged = 0

  const findRow = (id: string, ref: string): ProductRow | undefined => {
    if (id) {
      const byId = db.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').get(id) as ProductRow | undefined
      if (byId) return byId
    }
    if (ref) {
      return db.prepare('SELECT * FROM products WHERE ref = ? AND deleted = 0').get(ref) as ProductRow | undefined
    }
    return undefined
  }

  // One transaction: a file with bad rows updates nothing, so the admin can
  // fix the spreadsheet and retry against a known state.
  const apply = db.transaction(() => {
    for (let i = 1; i < rows.length; i++) {
      const line = i + 1
      const cells = rows[i]
      const cell = (index: number) => (index >= 0 ? (cells[index] ?? '').trim() : '')

      const id = cell(idAt)
      const ref = cell(refAt)
      const row = findRow(id, ref)
      if (!row) {
        errors.push({ line, message: `Aucun article ne correspond à « ${id || ref} »` })
        continue
      }

      const patch: Record<string, string | number | null> = {}

      const name = cell(at.name)
      if (at.name >= 0) {
        if (!name) {
          errors.push({ line, message: 'Nom vide' })
          continue
        }
        patch.name = name.toUpperCase()
      }

      if (at.price >= 0) {
        const price = parsePrice(cell(at.price))
        if (!Number.isFinite(price) || price <= 0) {
          errors.push({ line, message: `Prix invalide : « ${cell(at.price)} »` })
          continue
        }
        patch.price_cents = Math.round(price * 100)
      }

      if (at.sizes >= 0) {
        const sizes = parseSizes(cell(at.sizes))
        if (sizes.length === 0) {
          errors.push({ line, message: 'Aucune taille' })
          continue
        }
        patch.sizes = JSON.stringify(sizes)
      }

      if (at.badge >= 0) {
        const badge = cell(at.badge).toUpperCase()
        if (badge && !BADGES.includes(badge as (typeof BADGES)[number])) {
          errors.push({ line, message: `Badge inconnu : « ${cell(at.badge)} »` })
          continue
        }
        patch.badge = badge || null
      }

      if (at.cat >= 0 || at.sub >= 0) {
        const resolved = resolveTaxonomy(at.cat >= 0 ? cell(at.cat) : row.cat_id, at.sub >= 0 ? cell(at.sub) : row.sub_id)
        if (!resolved.ok) {
          errors.push({ line, message: resolved.error })
          continue
        }
        patch.cat_id = resolved.category.id
        patch.sub_id = resolved.subCategory.id
        if (resolved.category.id !== row.cat_id) patch.description = DESCRIPTIONS[resolved.category.id]
      }

      if (refAt >= 0 && ref && ref.toUpperCase() !== row.ref) patch.ref = ref.toUpperCase()

      // Drop columns whose value already matches, so re-importing an untouched
      // export reports "unchanged" instead of claiming 329 updates.
      for (const key of Object.keys(patch)) {
        if (patch[key] === (row as unknown as Record<string, unknown>)[key]) delete patch[key]
      }

      if (Object.keys(patch).length === 0) {
        unchanged++
        continue
      }

      const assignments = Object.keys(patch)
        .map((col) => `${col} = @${col}`)
        .join(', ')
      db.prepare(`UPDATE products SET ${assignments} WHERE id = @id`).run({ ...patch, id: row.id })
      updated++
    }

    if (errors.length > 0) throw new Error('rollback')
  })

  try {
    apply()
  } catch {
    res.status(400).json({
      error: `${errors.length} ligne(s) en erreur — aucune modification appliquée`,
      errors: errors.slice(0, 20),
      errorCount: errors.length,
    })
    return
  }

  res.json({ updated, unchanged, rows: rows.length - 1 })
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
