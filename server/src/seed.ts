import { pathToFileURL } from 'node:url'
import { db, setSetting, getSetting, BANK_DEFAULT, type BankInfo } from './db.js'
import { buildCatalogue } from './catalogue.js'

/**
 * Seeds the 329 catalogue articles.
 *
 * Insert-only by default, and it runs on every boot: once the shop owner has
 * edited names and prices, that data is theirs, so an existing row is never
 * touched. `force` refreshes seeded rows back to the generated catalogue —
 * it discards those edits, so it is reserved for `npm run seed:reset`.
 */
export function seed(options: { force?: boolean } = {}): { inserted: number; updated: number } {
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
      if (!existing.has(p.id)) {
        insert.run(row)
        inserted++
      } else if (options.force) {
        update.run(row)
        updated++
      }
    }

    if (!getSetting<BankInfo | null>('bank', null)) setSetting('bank', BANK_DEFAULT)
    if (getSetting<number | null>('chf_rate', null) === null) setSetting('chf_rate', 0.94)
  })()

  return { inserted, updated }
}

const runAsScript = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (runAsScript) {
  const force = process.argv.includes('--force')
  if (force) {
    console.warn('⚠  --force : les articles du catalogue d’origine repassent aux valeurs générées.')
    console.warn('   Toute modification faite depuis le back-office sur ces articles sera perdue.')
  }

  const { inserted, updated } = seed({ force })
  const total = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }
  console.log(`Catalogue — ${inserted} ajoutés, ${updated} réinitialisés, ${total.n} articles en base.`)
}
