import crypto from 'node:crypto'
import { Router } from 'express'
import {
  BANK_DEFAULT,
  exec,
  getSetting,
  query,
  queryOne,
  setSetting,
  withTransaction,
  type BankInfo,
} from '../db.js'
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
import {
  csvUpload,
  deleteFile,
  productImageId,
  productImageUpload,
  productImageUrl,
  readFile,
  storeFile,
} from '../uploads.js'
import { parseCsv, toCsv } from '../csv.js'
import { orderMailData } from '../orderMail.js'
import { orderRejectedMail, orderStageMail, orderValidatedMail } from '../emails.js'
import { queueMail } from '../mailer.js'

export const adminRouter = Router()

const MAX_ATTEMPTS = 8
const LOCKOUT_MINUTES = 15

adminRouter.get('/session', (req, res) => {
  res.json({ authenticated: isAuthenticated(req), demoCode: IS_DEMO_CODE })
})

/**
 * Login throttling lives in Postgres: with serverless instances an in-memory
 * counter would reset constantly and let an attacker keep guessing.
 */
adminRouter.post('/login', async (req, res, next) => {
  try {
    const ip = req.ip ?? 'unknown'

    await exec('DELETE FROM login_attempts WHERE until <= now()')
    const record = await queryOne<{ count: number }>('SELECT count FROM login_attempts WHERE ip = $1', [ip])

    if (record && record.count >= MAX_ATTEMPTS) {
      res.status(429).json({ error: 'Trop de tentatives — réessaie dans quelques minutes' })
      return
    }

    if (!checkCode((req.body as Record<string, unknown>)?.code)) {
      await exec(
        `INSERT INTO login_attempts (ip, count, until)
         VALUES ($1, 1, now() + interval '${LOCKOUT_MINUTES} minutes')
         ON CONFLICT (ip) DO UPDATE SET count = login_attempts.count + 1`,
        [ip],
      )
      res.status(401).json({ error: 'Code incorrect' })
      return
    }

    await exec('DELETE FROM login_attempts WHERE ip = $1', [ip])

    const session = issueSession()
    res.cookie(cookieName, session.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
      maxAge: session.maxAge,
    })
    res.json({ authenticated: true, demoCode: IS_DEMO_CODE })
  } catch (err) {
    next(err)
  }
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
  items: {
    productId: string
    ref: string
    name: string
    size: string
    qty: number
    priceCents: number
    image: string
  }[]
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  proof_file: string | null
  proof_mime: string | null
  proof_name: string | null
  created_at: Date
  updated_at: Date
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
  items: o.items,
  subtotalCents: o.subtotal_cents,
  shippingCents: o.shipping_cents,
  totalCents: o.total_cents,
  hasProof: !!o.proof_file,
  proofMime: o.proof_mime,
  proofName: o.proof_name,
  proofUrl: o.proof_file ? `/api/admin/orders/${o.id}/proof` : null,
  createdAt: o.created_at.toISOString(),
  updatedAt: o.updated_at.toISOString(),
})

adminRouter.get('/orders', async (_req, res, next) => {
  try {
    const rows = await query<OrderRow>("SELECT * FROM orders WHERE status <> 'draft' ORDER BY created_at DESC")
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
  } catch (err) {
    next(err)
  }
})

const loadOrder = (id: string) =>
  queryOne<OrderRow>("SELECT * FROM orders WHERE id = $1 AND status <> 'draft'", [id])

async function updateOrder(id: string, patch: Record<string, string | number>) {
  const keys = Object.keys(patch)
  const assignments = keys.map((key, i) => `${key} = $${i + 2}`).join(', ')
  await exec(`UPDATE orders SET ${assignments}, updated_at = now() WHERE id = $1`, [id, ...keys.map((k) => patch[k])])
}

adminRouter.post('/orders/:id/validate', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id)
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' })
      return
    }

    await updateOrder(order.id, { status: 'valid', reason: '', stage: 0 })

    const mailData = await orderMailData(order.id)
    if (mailData) queueMail(orderValidatedMail(mailData))

    res.json(serialiseOrder((await loadOrder(order.id))!))
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/orders/:id/reject', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id)
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
    await updateOrder(order.id, { status: 'rejected', reason: trimmed })

    const mailData = await orderMailData(order.id)
    if (mailData) queueMail(orderRejectedMail(mailData, trimmed))

    res.json(serialiseOrder((await loadOrder(order.id))!))
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/orders/:id/reopen', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id)
    if (!order) {
      res.status(404).json({ error: 'Commande introuvable' })
      return
    }
    await updateOrder(order.id, { status: 'pending', reason: '' })
    res.json(serialiseOrder((await loadOrder(order.id))!))
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/orders/:id/stage', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id)
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
    await updateOrder(order.id, { stage })

    if (isNewStage) {
      const mailData = await orderMailData(order.id)
      const mail = mailData ? orderStageMail(mailData, stage) : null
      if (mail) queueMail(mail)
    }

    res.json(serialiseOrder((await loadOrder(order.id))!))
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/orders/:id/proof', async (req, res, next) => {
  try {
    const order = await loadOrder(req.params.id)
    const file = order?.proof_file ? await readFile(order.proof_file) : undefined
    if (!file) {
      res.status(404).json({ error: 'Aucune preuve jointe' })
      return
    }
    res.type(file.mime)
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(file.bytes)
  } catch (err) {
    next(err)
  }
})

/* -------------------------------------------------------------------- bank */

adminRouter.get('/bank', async (_req, res, next) => {
  try {
    res.json({ bank: await getSetting<BankInfo>('bank', BANK_DEFAULT), defaults: BANK_DEFAULT })
  } catch (err) {
    next(err)
  }
})

adminRouter.put('/bank', async (req, res, next) => {
  try {
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
    await setSetting('bank', bank)
    res.json({ bank })
  } catch (err) {
    next(err)
  }
})

/* ---------------------------------------------------------------- products */

const ADMIN_LIST_LIMIT = 80

export const BADGES = ['NOUVEAU', 'DERNIÈRES PIÈCES', 'EXCLU'] as const

type Taxonomy =
  | { ok: false; error: string }
  | { ok: true; category: (typeof CATEGORIES)[number]; subCategory: (typeof CATEGORIES)[number]['subs'][number] }

/** Resolves a category/subcategory from either its id or its printed label. */
function resolveTaxonomy(catValue: string, subValue: string): Taxonomy {
  const key = catValue.trim().toLowerCase()
  const category =
    CATEGORIES.find((c) => c.id.toLowerCase() === key) ?? CATEGORIES.find((c) => c.label.toLowerCase() === key)
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

adminRouter.get('/products', async (req, res, next) => {
  try {
    const term = String(req.query.q ?? '').trim().toLowerCase()
    const all = await listProducts()
    const matching = term
      ? all.filter((p) => `${p.name} ${p.ref} ${p.subLabel}`.toLowerCase().includes(term))
      : all

    const removed = await queryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM products WHERE deleted = TRUE AND source = 'seed'",
    )

    res.json({
      products: matching.slice(0, ADMIN_LIST_LIMIT),
      matchCount: matching.length,
      totalCount: all.length,
      removedCount: Number(removed?.count ?? 0),
    })
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/products', productImageUpload.single('photo'), async (req, res, next) => {
  try {
    const body = req.body as Record<string, string | undefined>
    const name = String(body.name ?? '').trim()
    const price = parsePrice(String(body.price ?? ''))

    if (!name || !Number.isFinite(price) || price <= 0) {
      res.status(400).json({ error: 'Nom et prix requis' })
      return
    }

    const category = CATEGORIES.find((c) => c.id === body.cat) ?? CATEGORIES[0]
    const subCategory = category.subs.find((s) => s.id === body.sub) ?? category.subs[0]
    const sizes = parseSizes(String(body.sizes ?? ''))

    if (sizes.length === 0) {
      res.status(400).json({ error: 'Indique au moins une taille' })
      return
    }

    const adminCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) AS count FROM products WHERE source = 'admin'",
    )
    const image = req.file ? productImageUrl(await storeFile('product', req.file)) : photoPath(1)
    const id = 'x' + crypto.randomUUID()

    await exec(
      `INSERT INTO products (id, ref, name, cat_id, sub_id, price_cents, sizes, badge, description, image, pool, source, deleted, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'admin', FALSE, $12)`,
      [
        id,
        `NW-${category.code}-${901 + Number(adminCount?.count ?? 0)}`,
        name.toUpperCase(),
        category.id,
        subCategory.id,
        Math.round(price * 100),
        JSON.stringify(sizes),
        body.badge ? String(body.badge) : null,
        DESCRIPTIONS[category.id],
        image,
        JSON.stringify([image]),
        -Date.now(), // negative sort_order: newest admin article sorts first
      ],
    )

    const row = (await queryOne<ProductRow>('SELECT * FROM products WHERE id = $1', [id]))!
    res.status(201).json({ product: toProduct(row) })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/products/:id', productImageUpload.single('photo'), async (req, res, next) => {
  try {
    const row = await queryOne<ProductRow>('SELECT * FROM products WHERE id = $1 AND deleted = FALSE', [
      req.params.id,
    ])
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
      const image = productImageUrl(await storeFile('product', req.file))
      patch.image = image
      patch.pool = JSON.stringify([image])

      const previous = productImageId(row.image)
      if (previous) await deleteFile(previous)
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: 'Aucune modification' })
      return
    }

    const keys = Object.keys(patch)
    const assignments = keys.map((key, i) => `${key} = $${i + 2}`).join(', ')
    await exec(`UPDATE products SET ${assignments} WHERE id = $1`, [row.id, ...keys.map((k) => patch[k])])

    const updated = (await queryOne<ProductRow>('SELECT * FROM products WHERE id = $1', [row.id]))!
    res.json({ product: toProduct(updated) })
  } catch (err) {
    next(err)
  }
})

const CSV_HEAD = ['id', 'ref', 'nom', 'prix_eur', 'tailles', 'badge', 'categorie', 'sous_categorie']

adminRouter.get('/products/export.csv', async (_req, res, next) => {
  try {
    const rows = (await listProducts()).map((p) => [
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
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="novawear-catalogue-${new Date().toISOString().slice(0, 10)}.csv"`,
    )
    res.send(toCsv(CSV_HEAD, rows))
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/products/import', csvUpload.single('file'), async (req, res, next) => {
  try {
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

    // One transaction: a file with bad rows updates nothing, so the admin can
    // fix the spreadsheet and retry against a known state.
    try {
      await withTransaction(async (client) => {
        for (let i = 1; i < rows.length; i++) {
          const line = i + 1
          const cells = rows[i]
          const cell = (index: number) => (index >= 0 ? (cells[index] ?? '').trim() : '')

          const id = cell(idAt)
          const ref = cell(refAt)

          const found = await client.query<ProductRow>(
            'SELECT * FROM products WHERE deleted = FALSE AND (($1 <> \'\' AND id = $1) OR ($1 = \'\' AND $2 <> \'\' AND ref = $2))',
            [id, ref],
          )
          const row = found.rows[0]
          if (!row) {
            errors.push({ line, message: `Aucun article ne correspond à « ${id || ref} »` })
            continue
          }

          const patch: Record<string, string | number | null> = {}

          if (at.name >= 0) {
            const name = cell(at.name)
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
            const resolved = resolveTaxonomy(
              at.cat >= 0 ? cell(at.cat) : row.cat_id,
              at.sub >= 0 ? cell(at.sub) : row.sub_id,
            )
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
            const current = (row as unknown as Record<string, unknown>)[key]
            const next = patch[key]
            const same =
              key === 'sizes' ? JSON.stringify(current) === next : current === next
            if (same) delete patch[key]
          }

          if (Object.keys(patch).length === 0) {
            unchanged++
            continue
          }

          const keys = Object.keys(patch)
          const assignments = keys.map((key, index) => `${key} = $${index + 2}`).join(', ')
          await client.query(`UPDATE products SET ${assignments} WHERE id = $1`, [
            row.id,
            ...keys.map((k) => patch[k]),
          ])
          updated++
        }

        if (errors.length > 0) throw new Error('rollback')
      })
    } catch (err) {
      if (errors.length === 0) throw err
      res.status(400).json({
        error: `${errors.length} ligne(s) en erreur — aucune modification appliquée`,
        errors: errors.slice(0, 20),
        errorCount: errors.length,
      })
      return
    }

    res.json({ updated, unchanged, rows: rows.length - 1 })
  } catch (err) {
    next(err)
  }
})

adminRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const row = await queryOne<ProductRow>('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (!row) {
      res.status(404).json({ error: 'Article introuvable' })
      return
    }

    if (row.source === 'admin') {
      // Articles added from the back-office are removed for good, along with their photo.
      await exec('DELETE FROM products WHERE id = $1', [row.id])
      const fileId = productImageId(row.image)
      if (fileId) await deleteFile(fileId)
    } else {
      // Catalogue articles are hidden, and can be restored in bulk.
      await exec('UPDATE products SET deleted = TRUE WHERE id = $1', [row.id])
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/products/restore', async (_req, res, next) => {
  try {
    const restored = await exec("UPDATE products SET deleted = FALSE WHERE deleted = TRUE AND source = 'seed'")
    res.json({ restored })
  } catch (err) {
    next(err)
  }
})
