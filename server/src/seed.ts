import { pathToFileURL } from 'node:url'
import { BANK_DEFAULT, ensureSchema, getSetting, pool, query, setSetting, withTransaction, type BankInfo } from './db.js'
import { buildCatalogue } from './catalogue.js'

/**
 * Creates the schema and seeds the 329 catalogue articles.
 *
 * Insert-only by default: once the shop owner has edited names and prices,
 * that data is theirs, so an existing row is never touched. `force` refreshes
 * seeded rows back to the generated catalogue — it discards those edits, so it
 * is reserved for `npm run seed:reset`.
 */
export async function seed(options: { force?: boolean } = {}): Promise<{ inserted: number; updated: number }> {
  await ensureSchema()

  const products = buildCatalogue()
  const existing = new Set(
    (await query<{ id: string }>("SELECT id FROM products WHERE source = 'seed'")).map((r) => r.id),
  )

  let inserted = 0
  let updated = 0

  await withTransaction(async (client) => {
    for (const p of products) {
      const values = [
        p.id,
        p.ref,
        p.name,
        p.catId,
        p.subId,
        p.priceCents,
        JSON.stringify(p.sizes),
        p.badge,
        p.description,
        p.image,
        JSON.stringify(p.pool),
        p.position,
      ]

      if (!existing.has(p.id)) {
        await client.query(
          `INSERT INTO products (id, ref, name, cat_id, sub_id, price_cents, sizes, badge, description, image, pool, sort_order, source, deleted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'seed', FALSE)`,
          values,
        )
        inserted++
      } else if (options.force) {
        await client.query(
          `UPDATE products SET
             ref = $2, name = $3, cat_id = $4, sub_id = $5, price_cents = $6, sizes = $7,
             badge = $8, description = $9, image = $10, pool = $11, sort_order = $12
           WHERE id = $1 AND source = 'seed'`,
          values,
        )
        updated++
      }
    }
  })

  if (!(await getSetting<BankInfo | null>('bank', null))) await setSetting('bank', BANK_DEFAULT)
  if ((await getSetting<number | null>('chf_rate', null)) === null) await setSetting('chf_rate', 0.94)

  return { inserted, updated }
}

const runAsScript = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false

if (runAsScript) {
  const force = process.argv.includes('--force')
  if (force) {
    console.warn('⚠  --force : les articles du catalogue d’origine repassent aux valeurs générées.')
    console.warn('   Toute modification faite depuis le back-office sur ces articles sera perdue.')
  }

  try {
    const { inserted, updated } = await seed({ force })
    const [{ count }] = await query<{ count: string }>('SELECT COUNT(*) AS count FROM products')
    console.log(`Catalogue — ${inserted} ajoutés, ${updated} réinitialisés, ${count} articles en base.`)
  } finally {
    await pool.end()
  }
}
