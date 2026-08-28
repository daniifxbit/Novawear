import { query, queryOne } from './db.js'
import { CATEGORIES } from './catalogue.js'

export interface ProductRow {
  id: string
  ref: string
  name: string
  cat_id: string
  sub_id: string
  price_cents: number
  /** jsonb — the driver hands these back already parsed. */
  sizes: string[]
  badge: string | null
  description: string
  image: string
  pool: string[]
  source: string
  deleted: boolean
  /** BIGINT — the driver returns it as a string; only used for ordering. */
  sort_order: string
  created_at: Date
}

export interface Product {
  id: string
  ref: string
  name: string
  catId: string
  catLabel: string
  subId: string
  subLabel: string
  priceCents: number
  sizes: string[]
  badge: string | null
  description: string
  image: string
  pool: string[]
  source: 'seed' | 'admin'
}

const catLabel = (catId: string) => CATEGORIES.find((c) => c.id === catId)?.label ?? catId
const subLabel = (catId: string, subId: string) =>
  CATEGORIES.find((c) => c.id === catId)?.subs.find((s) => s.id === subId)?.label ?? subId

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    catId: row.cat_id,
    catLabel: catLabel(row.cat_id),
    subId: row.sub_id,
    subLabel: subLabel(row.cat_id, row.sub_id),
    priceCents: row.price_cents,
    sizes: row.sizes,
    badge: row.badge,
    description: row.description,
    image: row.image,
    pool: row.pool,
    source: row.source === 'admin' ? 'admin' : 'seed',
  }
}

/**
 * Live catalogue, ordered exactly as the design does: articles added by the
 * admin first (newest first), then the seeded catalogue in generation order.
 * Admin rows carry a negative sort_order for that reason.
 */
export async function listProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>('SELECT * FROM products WHERE deleted = FALSE ORDER BY sort_order ASC')
  return rows.map(toProduct)
}

export async function findProduct(id: string): Promise<Product | null> {
  const row = await queryOne<ProductRow>('SELECT * FROM products WHERE id = $1 AND deleted = FALSE', [id])
  return row ? toProduct(row) : null
}

export const COUNTRIES = [
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'CH', label: 'Suisse' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

export const isCountryCode = (v: unknown): v is CountryCode =>
  typeof v === 'string' && COUNTRIES.some((c) => c.code === v)

export const countryLabel = (code: string) => COUNTRIES.find((c) => c.code === code)?.label ?? code

/** Shipping in cents — free over the per-country threshold, as in the design. */
export function shippingCents(subtotalCents: number, country: CountryCode): number {
  if (subtotalCents === 0) return 0
  if (country === 'FR') return subtotalCents >= 6000 ? 0 : 490
  if (country === 'BE') return subtotalCents >= 8000 ? 0 : 690
  return 990
}

export const DELIVERY_STAGES = [
  { id: 'valid', title: 'Paiement validé', desc: "Virement vérifié. Les fonds sont placés en séquestre, la boutique n'y a pas accès." },
  { id: 'prep', title: 'Colis en préparation', desc: 'Article contrôlé une dernière fois, emballé et étiqueté.' },
  { id: 'courier', title: 'Remis au livreur', desc: 'Le transporteur a pris en charge le colis.' },
  { id: 'transit', title: 'En transit', desc: 'Le colis circule vers ton adresse.' },
  { id: 'delivered', title: 'Livré · fonds débloqués', desc: 'Livraison confirmée : le séquestre libère le paiement à la boutique.' },
] as const

export const REJECTION_REASONS = [
  'Virement non reçu',
  'Montant incorrect',
  'Preuve illisible',
  'Référence absente',
  'Article épuisé',
] as const
