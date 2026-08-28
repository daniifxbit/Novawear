import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const SESSION_COOKIE = 'nw_admin'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

/**
 * The admin passphrase. Defaults to the design's demo code so a fresh clone
 * runs, but any real deployment must set ADMIN_CODE.
 */
export const ADMIN_CODE = (process.env.ADMIN_CODE ?? 'NOVA').trim()

export const IS_DEMO_CODE = ADMIN_CODE.toUpperCase() === 'NOVA'

/**
 * Signing key for session cookies. It must be configured in production:
 * serverless instances are created constantly, and a per-instance random key
 * would sign sessions no other instance can verify — logging the admin out on
 * essentially every request.
 */
const SECRET = process.env.SESSION_SECRET ?? fallbackSecret()

function fallbackSecret(): string {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('SESSION_SECRET est obligatoire en production — définis-le dans les variables d’environnement.')
  }
  return crypto.randomBytes(32).toString('hex')
}

const sign = (payload: string) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')

export function issueSession(): { value: string; maxAge: number } {
  const payload = String(Date.now() + SESSION_TTL_MS)
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_TTL_MS }
}

function isValidSession(token: unknown): boolean {
  if (typeof token !== 'string') return false
  const [payload, mac] = token.split('.')
  if (!payload || !mac) return false

  const expected = sign(payload)
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

  const expiry = Number(payload)
  return Number.isFinite(expiry) && expiry > Date.now()
}

/** Constant-time comparison of the submitted code against ADMIN_CODE. */
export function checkCode(submitted: unknown): boolean {
  if (typeof submitted !== 'string') return false
  const a = Buffer.from(submitted.trim().toUpperCase())
  const b = Buffer.from(ADMIN_CODE.toUpperCase())
  // Hash both sides so the comparison stays constant-time regardless of length.
  return crypto.timingSafeEqual(
    crypto.createHash('sha256').update(a).digest(),
    crypto.createHash('sha256').update(b).digest(),
  )
}

export const cookieName = SESSION_COOKIE

export function isAuthenticated(req: Request): boolean {
  return isValidSession(req.cookies?.[SESSION_COOKIE])
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Authentification administrateur requise' })
    return
  }
  next()
}
