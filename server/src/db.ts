import pg from 'pg'

const { Pool } = pg

const CONNECTION_STRING = process.env.DATABASE_URL

if (!CONNECTION_STRING) {
  throw new Error(
    'DATABASE_URL manquant. Exemple local : postgresql://novawear@localhost:5433/novawear\n' +
      'Sur Vercel, utilise la chaîne de connexion « pooled » fournie par Neon / Vercel Postgres.',
  )
}

const isLocal = /@(localhost|127\.0\.0\.1)/.test(CONNECTION_STRING)

/**
 * One pool per instance. Serverless functions are short-lived and numerous, so
 * the pool stays tiny and idle connections are dropped quickly; the pooled
 * (pgbouncer) connection string is what keeps this from exhausting Postgres.
 */
export const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 5,
  idleTimeoutMillis: process.env.VERCEL ? 5_000 : 30_000,
  connectionTimeoutMillis: 10_000,
})

export type Params = readonly unknown[]

export async function query<T>(text: string, params: Params = []): Promise<T[]> {
  const result = await pool.query(text, params as unknown[])
  return result.rows as T[]
}

export async function queryOne<T>(text: string, params: Params = []): Promise<T | undefined> {
  const rows = await query<T>(text, params)
  return rows[0]
}

/** Runs a statement and returns how many rows it touched. */
export async function exec(text: string, params: Params = []): Promise<number> {
  const result = await pool.query(text, params as unknown[])
  return result.rowCount ?? 0
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const value = await fn(client)
    await client.query('COMMIT')
    return value
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** Order references start at NW-<year>-1041, as in the design. */
export const FIRST_ORDER_SEQ = 1041

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id           TEXT PRIMARY KEY,
    ref          TEXT NOT NULL,
    name         TEXT NOT NULL,
    cat_id       TEXT NOT NULL,
    sub_id       TEXT NOT NULL,
    price_cents  INTEGER NOT NULL,
    sizes        JSONB NOT NULL,
    badge        TEXT,
    description  TEXT NOT NULL,
    image        TEXT NOT NULL,
    pool         JSONB NOT NULL,
    source       TEXT NOT NULL,
    deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    -- Articles added from the back-office sort first via a negative epoch
    -- milliseconds value, which overflows a 32-bit integer.
    sort_order   BIGINT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  ALTER TABLE products ALTER COLUMN sort_order TYPE BIGINT;

  CREATE INDEX IF NOT EXISTS idx_products_cat ON products (cat_id, sub_id);
  CREATE INDEX IF NOT EXISTS idx_products_live ON products (deleted, sort_order);

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    ref             TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL,
    stage           INTEGER NOT NULL DEFAULT 0,
    reason          TEXT NOT NULL DEFAULT '',
    customer_name   TEXT NOT NULL,
    customer_email  TEXT NOT NULL,
    customer_phone  TEXT NOT NULL DEFAULT '',
    customer_city   TEXT NOT NULL DEFAULT '',
    customer_addr   TEXT NOT NULL,
    country_code    TEXT NOT NULL,
    items           JSONB NOT NULL,
    subtotal_cents  INTEGER NOT NULL,
    shipping_cents  INTEGER NOT NULL,
    total_cents     INTEGER NOT NULL,
    proof_file      TEXT,
    proof_mime      TEXT,
    proof_name      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status, created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders (lower(ref));

  -- Uploaded bytes live here rather than on disk: serverless instances have no
  -- persistent filesystem, and this keeps the deployment to a single service.
  CREATE TABLE IF NOT EXISTS files (
    id          TEXT PRIMARY KEY,
    kind        TEXT NOT NULL,
    mime        TEXT NOT NULL,
    filename    TEXT NOT NULL,
    bytes       BYTEA NOT NULL,
    size_bytes  INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value JSONB NOT NULL
  );

  CREATE TABLE IF NOT EXISTS emails (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_ref  TEXT,
    recipient  TEXT NOT NULL,
    subject    TEXT NOT NULL,
    kind       TEXT NOT NULL,
    status     TEXT NOT NULL,
    detail     TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_emails_order ON emails (order_ref, created_at);

  -- Login throttling has to be shared: in-memory counters are useless when
  -- every request may hit a different instance.
  CREATE TABLE IF NOT EXISTS login_attempts (
    ip     TEXT PRIMARY KEY,
    count  INTEGER NOT NULL,
    until  TIMESTAMPTZ NOT NULL
  );

  CREATE SEQUENCE IF NOT EXISTS order_ref_seq START ${FIRST_ORDER_SEQ};
`

export async function ensureSchema(): Promise<void> {
  await pool.query(SCHEMA)
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await queryOne<{ value: T }>('SELECT value FROM settings WHERE key = $1', [key])
  return row ? row.value : fallback
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await exec(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
    [key, JSON.stringify(value)],
  )
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

/** Atomic: a Postgres sequence, so concurrent checkouts cannot collide. */
export async function nextOrderRef(): Promise<string> {
  const row = await queryOne<{ nextval: string }>("SELECT nextval('order_ref_seq')")
  const seq = Number(row?.nextval ?? FIRST_ORDER_SEQ)
  return `NW-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`
}
