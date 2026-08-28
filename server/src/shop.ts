import { db } from './db.js'
import { CATEGORIES } from './catalogue.js'

export interface ProductRow {
  id: string
  ref: string
  name: string
  cat_id: string
  sub_id: string
  price_cents: number
  sizes: string
  badge: string | null
  description: string
  image: string
  pool: string
  source: string
  deleted: number
  position: number
  created_at: string
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
    sizes: JSON.parse(row.sizes),
    badge: row.badge,
    description: row.description,
    image: row.image,
    pool: JSON.parse(row.pool),
    source: row.source === 'admin' ? 'admin' : 'seed',
  }
}

/**
 * Live catalogue, ordered exactly as the design does: articles added by the
 * admin first (newest first), then the seeded catalogue in generation order.
 * Admin rows carry a negative position for that reason.
 */
export function listProducts(): Product[] {
  const rows = db
    .prepare('SELECT * FROM products WHERE deleted = 0 ORDER BY position ASC')
    .all() as ProductRow[]
  return rows.map(toProduct)
}

export function findProduct(id: string): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND deleted = 0').get(id) as ProductRow | undefined
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
