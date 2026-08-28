import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data')

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
export const PROOF_DIR = path.join(UPLOAD_DIR, 'proofs')
export const PRODUCT_IMG_DIR = path.join(UPLOAD_DIR, 'products')

for (const dir of [DATA_DIR, UPLOAD_DIR, PROOF_DIR, PRODUCT_IMG_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}

export const db = new Database(path.join(DATA_DIR, 'novawear.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id           TEXT PRIMARY KEY,
    ref          TEXT NOT NULL,
    name         TEXT NOT NULL,
    cat_id       TEXT NOT NULL,
    sub_id       TEXT NOT NULL,
    price_cents  INTEGER NOT NULL,
    sizes        TEXT NOT NULL,          -- JSON array of strings
    badge        TEXT,
    description  TEXT NOT NULL,
    image        TEXT NOT NULL,
    pool         TEXT NOT NULL,          -- JSON array of image paths
    source       TEXT NOT NULL,          -- 'seed' | 'admin'
    deleted      INTEGER NOT NULL DEFAULT 0,
    position     INTEGER NOT NULL,       -- admin additions use negative values so they sort first
    created_at   TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_cat ON products (cat_id, sub_id);
  CREATE INDEX IF NOT EXISTS idx_products_live ON products (deleted, position);

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    ref             TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL,       -- 'draft' | 'pending' | 'valid' | 'rejected'
    stage           INTEGER NOT NULL DEFAULT 0,
    reason          TEXT NOT NULL DEFAULT '',
    customer_name   TEXT NOT NULL,
    customer_email  TEXT NOT NULL,
    customer_phone  TEXT NOT NULL DEFAULT '',
    customer_city   TEXT NOT NULL DEFAULT '',
    customer_addr   TEXT NOT NULL,
    country_code    TEXT NOT NULL,
    items           TEXT NOT NULL,       -- JSON array of line items
    subtotal_cents  INTEGER NOT NULL,
    shipping_cents  INTEGER NOT NULL,
    total_cents     INTEGER NOT NULL,
    proof_file      TEXT,                -- filename inside data/uploads/proofs
    proof_mime      TEXT,
    proof_name      TEXT,                -- original filename, shown to the admin
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at);

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

export function getSetting<T>(key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

export function setSetting(key: string, value: unknown): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, JSON.stringify(value))
}

export interface BankInfo {
  holder: string
  iban: string
  bic: string
  bankName: string
}

export const BANK_DEFAULT: BankInfo = {
  holder: 'NOVAWEAR SAS',
  iban: 'FR76 3000 4000 0300 0012 3456 789',
  bic: 'BNPAFRPPXXX',
  bankName: 'BNP Paribas — Paris 11e',
}

/** Order references start at NW-<year>-1041, as in the design. */
export const FIRST_ORDER_SEQ = 1041

export function nextOrderRef(): string {
  const year = new Date().getFullYear()
  const seq = getSetting<number>('order_seq', FIRST_ORDER_SEQ)
  setSetting('order_seq', seq + 1)
  return `NW-${year}-${String(seq).padStart(4, '0')}`
}
