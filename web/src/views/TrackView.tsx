import { useState } from 'react'
import { api } from '../api'
import { dateTime, eur } from '../format'
import { useShop } from '../shop'
import type { TrackedOrder } from '../types'

export function TrackView() {
  const { catalog } = useShop()
  const stages = catalog?.stages ?? []

  const [input, setInput] = useState('')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function lookup() {
    const ref = input.trim()
    if (!ref) {
      setError('Saisis ta référence de commande')
      setOrder(null)
      return
    }
    setBusy(true)
    try {
      setOrder(await api.track(ref))
      setError('')
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : `Aucune commande trouvée pour ${ref}`)
    } finally {
      setBusy(false)
    }
  }

  const stage = order ? Math.min(order.stage, Math.max(stages.length - 1, 0)) : 0
  const delivered = order?.status === 'valid' && stage >= stages.length - 1

  return (
    <section className="track">
      <span className="eyebrow">Suivi de commande</span>
      <h1>Où est mon colis ?</h1>
      <div className="track__rule" />
      <p className="track__lede">
        Saisis la référence reçue à la commande (format NW-2026-1041). Elle figure aussi dans le libellé de ton
        virement.
      </p>

      <div className="track__form">
        <input
          className="input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void lookup()
          }}
          placeholder="NW-2026-1041"
          aria-label="Référence de commande"
        />
        <button className="btn-gold" onClick={() => void lookup()} disabled={busy}>
          Vérifier
        </button>
      </div>

      {error && <span className="track__err">{error}</span>}

      {order && (
        <div className="track__result">
          <div className="track__head">
            <div className="track__ref">
              <strong>{order.ref}</strong>
              <span>
                {dateTime(order.createdAt)} · {order.itemCount} article(s)
              </span>
            </div>
            <div className="track__amount">
              <span>Montant</span>
              <strong>{eur(order.totalCents)}</strong>
            </div>
            <span className="track__escrow">
              {delivered ? 'Fonds débloqués à la boutique' : 'Fonds bloqués en séquestre'}
            </span>
          </div>

          {order.status === 'pending' && (
            <div className="track__message">
              Virement en cours de vérification. Ton paiement est déjà en séquestre : le suivi de livraison démarre dès
              la validation.
            </div>
          )}

          {order.status === 'rejected' && (
            <div className="track__rejected">
              <strong>Commande rejetée</strong>
              <span>Motif : {order.reason || '—'}</span>
              <small>Les fonds en séquestre te sont restitués. Contacte-nous pour relancer la commande.</small>
            </div>
          )}

          <div className="timeline">
            {stages.map((s, i) => {
              const done = order.status === 'valid' && i < stage
              const current = order.status === 'valid' && i === stage
              const modifier = done ? ' timeline__step--done' : current ? ' timeline__step--current' : ''
              return (
                <div className={`timeline__step${modifier}`} key={s.id}>
                  <div className="timeline__marker">
                    <span className="timeline__dot" />
                    {i < stages.length - 1 && <span className="timeline__line" />}
                  </div>
                  <div className="timeline__body">
                    <span className="timeline__label">{s.title}</span>
                    <span className="timeline__desc">{s.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
