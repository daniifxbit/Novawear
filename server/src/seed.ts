import { pathToFileURL } from 'node:url'
import { db, setSetting, getSetting, BANK_DEFAULT, type BankInfo } from './db.js'
import { buildCatalogue } from './catalogue.js'

/**
 * Seeds the 329 catalogue articles. Re-running is safe: seeded rows are
 * refreshed in place, so a soft-deleted article stays deleted and articles
 * added by the admin are never touched.
 */
export function seed(): { inserted: number; updated: number } {
  const products = buildCatalogue()
  const now = new Date().toISOString()

  const existing = new Set(
    (db.prepare("SELECT id FROM products WHERE source = 'seed'").all() as { id: string }[]).map((r) => r.id),
  )

  const insert = db.prepare(`
    INSERT INTO products (id, ref, name, cat_id, sub_id, price_cents, sizes, badge, description, image, pool, source, deleted, position, created_at)
    VALUES (@id, @ref, @name, @catId, @subId, @priceCents, @sizes, @badge, @description, @image, @pool, 'seed', 0, @position, @createdAt)
  `)
  const update = db.prepare(`
    UPDATE products SET
      ref = @ref, name = @name, cat_id = @catId, sub_id = @subId, price_cents = @priceCents,
      sizes = @sizes, badge = @badge, description = @description, image = @image, pool = @pool, position = @position
    WHERE id = @id AND source = 'seed'
  `)

  let inserted = 0
  let updated = 0

  db.transaction(() => {
    for (const p of products) {
      const row = {
        id: p.id,
        ref: p.ref,
        name: p.name,
        catId: p.catId,
        subId: p.subId,
        priceCents: p.priceCents,
        sizes: JSON.stringify(p.sizes),
        badge: p.badge,
        description: p.description,
        image: p.image,
        pool: JSON.stringify(p.pool),
        position: p.position,
        createdAt: now,
      }
      if (existing.has(p.id)) {
        update.run(row)
        updated++
      } else {
        insert.run(row)
        inserted++
      }
    }

    if (!getSetting<BankInfo | null>('bank', null)) setSetting('bank', BANK_DEFAULT)
    if (getSetting<number | null>('chf_rate', null) === null) setSetting('chf_rate', 0.94)
  })()

  return { inserted, updated }
}

const runAsScript = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (runAsScript) {
  const { inserted, updated } = seed()
  const total = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }
  console.log(`Catalogue seeded — ${inserted} ajoutés, ${updated} mis à jour, ${total.n} articles en base.`)
}
