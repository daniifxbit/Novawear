import fs from 'node:fs/promises'
import path from 'node:path'
import nodemailer, { type Transporter } from 'nodemailer'
import { db, OUTBOX_DIR } from './db.js'

export const MAIL_FROM = process.env.MAIL_FROM ?? 'NOVAWEAR <no-reply@novawear.local>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
export const PUBLIC_URL = (process.env.PUBLIC_URL ?? 'http://localhost:4000').replace(/\/+$/, '')

/** Link that opens the tracking page with the reference already filled in. */
export const trackingUrl = (ref: string) => `${PUBLIC_URL}/?suivi=${encodeURIComponent(ref)}`

function buildTransport(): { transport: Transporter; live: boolean } {
  const { SMTP_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env

  if (SMTP_URL) return { transport: nodemailer.createTransport(SMTP_URL), live: true }

  if (SMTP_HOST) {
    const port = Number(SMTP_PORT ?? 587)
    return {
      transport: nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS ?? '' } : undefined,
      }),
      live: true,
    }
  }

  // No SMTP server: build the message anyway and drop it in the outbox, so
  // nothing is lost and the content stays inspectable during development.
  return {
    transport: nodemailer.createTransport({ streamTransport: true, buffer: true }),
    live: false,
  }
}

const { transport, live: SMTP_CONFIGURED } = buildTransport()

export const mailIsLive = SMTP_CONFIGURED

export interface Mail {
  to: string
  subject: string
  html: string
  text: string
  /** Message type, recorded in the email log (e.g. "order_validated"). */
  kind: string
  orderRef?: string
}

function record(mail: Mail, status: 'sent' | 'written' | 'failed', detail: string) {
  db.prepare(
    'INSERT INTO emails (order_ref, recipient, subject, kind, status, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(mail.orderRef ?? null, mail.to, mail.subject, mail.kind, status, detail, new Date().toISOString())
}

/**
 * Sends one message. Never throws: a mail failure must not roll back an order
 * that was already accepted, so problems are logged and recorded instead.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!mail.to) return

  try {
    const info = await transport.sendMail({
      from: MAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (SMTP_CONFIGURED) {
      record(mail, 'sent', String(info.messageId ?? ''))
      return
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = path.join(OUTBOX_DIR, `${stamp}-${mail.kind}.eml`)
    await fs.writeFile(file, (info as { message: Buffer }).message)
    record(mail, 'written', file)
    console.log(`✉  ${mail.kind} → ${mail.to} (aucun SMTP configuré, écrit dans ${file})`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    record(mail, 'failed', detail)
    console.error(`✉  Échec d'envoi (${mail.kind} → ${mail.to}) : ${detail}`)
  }
}

/** Queues a message without making the caller wait on the SMTP round-trip. */
export function queueMail(mail: Mail): void {
  void sendMail(mail)
}
