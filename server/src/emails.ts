import { DELIVERY_STAGES, countryLabel } from './shop.js'
import { type BankInfo } from './db.js'
import { MAIL_FROM, PUBLIC_URL, trackingUrl, type Mail } from './mailer.js'

const GOLD = '#C39C6C'
const BG = '#060606'
const SURFACE = '#111111'
const TEXT = '#F5F5F5'
const MUTED = 'rgba(255,255,255,.55)'
// Email clients cannot be relied on to fetch web fonts, so the brand's Jost
// degrades to a neutral sans stack rather than a serif default.
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

export interface OrderMailData {
  ref: string
  customerName: string
  customerEmail: string
  countryCode: string
  items: { name: string; ref: string; size: string; qty: number; priceCents: number }[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
}

const eur = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Wraps body rows in the dark NOVAWEAR shell. */
function shell(title: string, bodyRows: string, footerNote: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${BG};font-family:${FONT};color:${TEXT};">

<tr><td style="padding:0 0 22px;">
  <div style="font-size:15px;font-weight:700;letter-spacing:.22em;color:${TEXT};">NOVA<span style="color:${GOLD};">WEAR</span></div>
  <div style="font-size:9px;letter-spacing:.34em;color:${MUTED};padding-top:5px;">STYLE. CONFIDENCE. NOVA.</div>
</td></tr>

<tr><td style="border-top:1px solid ${GOLD};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>

${bodyRows}

<tr><td style="padding:26px 0 0;border-top:1px solid rgba(255,255,255,.10);">
  <div style="font-size:11px;line-height:1.7;color:rgba(255,255,255,.4);">
    ${footerNote}<br>
    Paiement par virement bancaire uniquement · Livraison France, Belgique, Suisse.
  </div>
</td></tr>

</table>
</td></tr></table>
</body></html>`
}

const heading = (eyebrow: string, title: string) => `
<tr><td style="padding:26px 0 0;">
  <div style="font-size:10px;letter-spacing:.28em;color:${GOLD};text-transform:uppercase;">${escape(eyebrow)}</div>
  <div style="font-size:26px;font-weight:700;letter-spacing:-.02em;text-transform:uppercase;padding-top:12px;line-height:1.1;">${escape(title)}</div>
</td></tr>`

const paragraph = (html: string) => `
<tr><td style="padding:18px 0 0;font-size:14px;line-height:1.65;color:rgba(255,255,255,.68);">${html}</td></tr>`

function itemsTable(order: OrderMailData): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px;color:${TEXT};">
          ${escape(item.name)}<br>
          <span style="font-size:11px;color:${MUTED};">${escape(item.ref)} · Taille ${escape(item.size)} · ×${item.qty}</span>
        </td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:13px;color:${GOLD};white-space:nowrap;">
          ${eur(item.priceCents * item.qty)}
        </td>
      </tr>`,
    )
    .join('')

  return `
<tr><td style="padding:24px 0 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid rgba(255,255,255,.10);">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:10px;letter-spacing:.24em;color:${GOLD};text-transform:uppercase;padding-bottom:12px;">Ta commande</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
        <tr>
          <td style="padding:9px 0 0;font-size:12px;color:${MUTED};">Livraison ${escape(countryLabel(order.countryCode))}</td>
          <td align="right" style="padding:9px 0 0;font-size:12px;color:${TEXT};">${order.shippingCents ? eur(order.shippingCents) : 'Offerte'}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;font-size:11px;letter-spacing:.2em;color:${MUTED};text-transform:uppercase;">Total</td>
          <td align="right" style="padding:12px 0 0;font-size:19px;font-weight:700;color:${GOLD};">${eur(order.totalCents)}</td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>`
}

function bankBlock(bank: BankInfo, order: OrderMailData): string {
  const row = (label: string, value: string, highlight = false) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);">
        <div style="font-size:10px;letter-spacing:.2em;color:${MUTED};text-transform:uppercase;">${escape(label)}</div>
        <div style="font-size:${highlight ? '15px' : '14px'};color:${highlight ? GOLD : TEXT};font-weight:${highlight ? '700' : '400'};padding-top:4px;word-break:break-word;">${escape(value)}</div>
      </td>
    </tr>`

  return `
<tr><td style="padding:22px 0 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid ${GOLD};">
    <tr><td style="padding:20px;">
      <div style="font-size:10px;letter-spacing:.24em;color:${GOLD};text-transform:uppercase;padding-bottom:6px;">Coordonnées du compte</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row('Titulaire du compte', bank.holder)}
        ${row('IBAN', bank.iban, true)}
        ${row('BIC / SWIFT', bank.bic)}
        ${bank.bankName ? row('Banque', bank.bankName) : ''}
        ${row('Montant à virer', eur(order.totalCents), true)}
        ${row('Référence à indiquer', order.ref, true)}
      </table>
      <div style="font-size:11px;line-height:1.6;color:rgba(255,255,255,.45);padding-top:14px;">
        La référence <span style="color:${GOLD};">${escape(order.ref)}</span> doit figurer dans le libellé du virement,
        sinon le paiement ne peut pas être rattaché à ta commande.
      </div>
    </td></tr>
  </table>
</td></tr>`
}

function button(label: string, href: string): string {
  return `
<tr><td style="padding:24px 0 0;">
  <a href="${escape(href)}" style="display:inline-block;background:${GOLD};color:${BG};font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:15px 22px;">${escape(label)}</a>
</td></tr>`
}

const ESCROW_LINE =
  'Les fonds restent en séquestre jusqu’à la livraison : la boutique n’y a pas accès avant que le colis soit entre tes mains.'

/* -------------------------------------------------------------- messages */

export function orderDeclaredMail(order: OrderMailData, bank: BankInfo): Mail {
  const url = trackingUrl(order.ref)
  const html = shell(
    `Commande ${order.ref}`,
    heading('Paiement déclaré', 'On a bien reçu ta commande') +
      paragraph(
        `Bonjour ${escape(order.customerName)},<br><br>` +
          `Ta commande <span style="color:${GOLD};">${escape(order.ref)}</span> est enregistrée et ton justificatif de virement nous est parvenu. ` +
          `Nous vérifions le paiement, en général sous 24 h ouvrées. ${ESCROW_LINE}`,
      ) +
      itemsTable(order) +
      bankBlock(bank, order) +
      paragraph(
        'Ces coordonnées sont rappelées ici au cas où le virement resterait à faire, ou serait à refaire.',
      ) +
      button('Suivre ma commande', url),
    `Garde la référence ${escape(order.ref)} : elle sert à suivre le colis.`,
  )

  const text = [
    `Bonjour ${order.customerName},`,
    '',
    `Ta commande ${order.ref} est enregistrée et ton justificatif de virement nous est parvenu.`,
    `Nous vérifions le paiement, en général sous 24 h ouvrées. ${ESCROW_LINE}`,
    '',
    `Total à virer : ${eur(order.totalCents)}`,
    `Titulaire : ${bank.holder}`,
    `IBAN : ${bank.iban}`,
    `BIC : ${bank.bic}`,
    bank.bankName ? `Banque : ${bank.bankName}` : '',
    `Référence à indiquer dans le libellé : ${order.ref}`,
    '',
    `Suivi : ${url}`,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    to: order.customerEmail,
    subject: `Commande ${order.ref} — paiement déclaré`,
    html,
    text,
    kind: 'order_declared',
    orderRef: order.ref,
  }
}

export function orderValidatedMail(order: OrderMailData): Mail {
  const url = trackingUrl(order.ref)
  const html = shell(
    `Commande ${order.ref} validée`,
    heading('Paiement validé', 'Ton virement est vérifié') +
      paragraph(
        `Bonjour ${escape(order.customerName)},<br><br>` +
          `Le virement pour la commande <span style="color:${GOLD};">${escape(order.ref)}</span> est bien arrivé. ` +
          `Ton colis passe en préparation. ${ESCROW_LINE}`,
      ) +
      itemsTable(order) +
      button('Suivre ma commande', url),
    'Tu recevras un email à chaque étape de la livraison.',
  )

  const text = [
    `Bonjour ${order.customerName},`,
    '',
    `Le virement pour la commande ${order.ref} est bien arrivé. Ton colis passe en préparation.`,
    ESCROW_LINE,
    '',
    `Montant : ${eur(order.totalCents)}`,
    `Suivi : ${url}`,
  ].join('\n')

  return {
    to: order.customerEmail,
    subject: `Commande ${order.ref} — paiement validé`,
    html,
    text,
    kind: 'order_validated',
    orderRef: order.ref,
  }
}

export function orderRejectedMail(order: OrderMailData, reason: string): Mail {
  const url = trackingUrl(order.ref)
  const html = shell(
    `Commande ${order.ref}`,
    heading('Paiement non validé', 'Ta commande n’a pas pu être confirmée') +
      paragraph(
        `Bonjour ${escape(order.customerName)},<br><br>` +
          `Nous n’avons pas pu valider le paiement de la commande <span style="color:${GOLD};">${escape(order.ref)}</span>.`,
      ) +
      `<tr><td style="padding:20px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};border:1px solid rgba(255,255,255,.10);">
          <tr><td style="padding:18px 20px;">
            <div style="font-size:10px;letter-spacing:.24em;color:${GOLD};text-transform:uppercase;">Motif</div>
            <div style="font-size:14px;color:${TEXT};padding-top:8px;">${escape(reason)}</div>
          </td></tr>
        </table>
      </td></tr>` +
      paragraph(
        'Les fonds éventuellement reçus te sont restitués. Réponds à cet email pour relancer la commande — nous la remettons en attente sans que tu aies à la repasser.',
      ) +
      button('Voir ma commande', url),
    'Une question ? Réponds simplement à cet email.',
  )

  const text = [
    `Bonjour ${order.customerName},`,
    '',
    `Nous n'avons pas pu valider le paiement de la commande ${order.ref}.`,
    `Motif : ${reason}`,
    '',
    'Les fonds éventuellement reçus te sont restitués. Réponds à cet email pour relancer la commande.',
    `Suivi : ${url}`,
  ].join('\n')

  return {
    to: order.customerEmail,
    subject: `Commande ${order.ref} — paiement non validé`,
    html,
    text,
    kind: 'order_rejected',
    orderRef: order.ref,
  }
}

export function orderStageMail(order: OrderMailData, stageIndex: number): Mail | null {
  const stage = DELIVERY_STAGES[stageIndex]
  // Stage 0 duplicates the validation email, so it is not announced twice.
  if (!stage || stageIndex === 0) return null

  const url = trackingUrl(order.ref)
  const delivered = stageIndex === DELIVERY_STAGES.length - 1

  const html = shell(
    `Commande ${order.ref} — ${stage.title}`,
    heading('Suivi de commande', stage.title) +
      paragraph(
        `Bonjour ${escape(order.customerName)},<br><br>` +
          `Commande <span style="color:${GOLD};">${escape(order.ref)}</span> : ${escape(stage.desc)}`,
      ) +
      paragraph(
        delivered
          ? 'Le séquestre libère le paiement à la boutique. Merci pour ta commande — tu disposes de 14 jours pour un retour.'
          : ESCROW_LINE,
      ) +
      button('Suivre ma commande', url),
    delivered ? 'Retour possible sous 14 jours.' : 'Tu recevras un email à chaque étape.',
  )

  const text = [
    `Bonjour ${order.customerName},`,
    '',
    `Commande ${order.ref} : ${stage.title}`,
    stage.desc,
    '',
    delivered
      ? 'Le séquestre libère le paiement à la boutique. Retour possible sous 14 jours.'
      : ESCROW_LINE,
    `Suivi : ${url}`,
  ].join('\n')

  return {
    to: order.customerEmail,
    subject: `Commande ${order.ref} — ${stage.title}`,
    html,
    text,
    kind: `order_stage_${stage.id}`,
    orderRef: order.ref,
  }
}

export function adminNewOrderMail(order: OrderMailData, to: string): Mail {
  const html = shell(
    `Nouvelle commande ${order.ref}`,
    heading('Back-office', 'Nouvelle commande à vérifier') +
      paragraph(
        `<strong style="color:${TEXT};">${escape(order.customerName)}</strong> — ${escape(order.customerEmail)}<br>` +
          `Référence <span style="color:${GOLD};">${escape(order.ref)}</span> · ${escape(countryLabel(order.countryCode))}`,
      ) +
      itemsTable(order) +
      button('Ouvrir le back-office', `${PUBLIC_URL}/`),
    `Envoyé à ${escape(to)} depuis ${escape(MAIL_FROM)}.`,
  )

  const text = [
    'Nouvelle commande à vérifier',
    '',
    `Référence : ${order.ref}`,
    `Client : ${order.customerName} (${order.customerEmail})`,
    `Pays : ${countryLabel(order.countryCode)}`,
    `Total : ${eur(order.totalCents)}`,
    '',
    `Back-office : ${PUBLIC_URL}/`,
  ].join('\n')

  return {
    to,
    subject: `Nouvelle commande ${order.ref} — ${eur(order.totalCents)}`,
    html,
    text,
    kind: 'admin_new_order',
    orderRef: order.ref,
  }
}
