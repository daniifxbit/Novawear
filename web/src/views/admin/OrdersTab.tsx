import { useEffect, useState } from 'react'
import { api } from '../../api'
import { dateTime, eur } from '../../format'
import { useShop } from '../../shop'
import type { AdminOrder, AdminOrdersResponse } from '../../types'

const STATUS_CLASS: Record<string, string> = {
  pending: 'status',
  valid: 'status status--valid',
  rejected: 'status status--rejected',
}

export function OrdersTab({ onCount }: { onCount: (n: number) => void }) {
  const { catalog } = useShop()
  const stages = catalog?.stages ?? []

  const [data, setData] = useState<AdminOrdersResponse | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [reasonPick, setReasonPick] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const next = await api.admin.orders()
      setData(next)
      onCount(next.orders.length)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const apply = async (action: () => Promise<AdminOrder>) => {
    try {
      await action()
      setReason('')
      setReasonPick('')
      setReasonError(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible')
    }
  }

  if (error && !data) return <div className="empty-state">{error}</div>
  if (!data) return <div className="loading">Chargement des commandes…</div>

  const stats = [
    { label: 'En attente', value: String(data.stats.pending) },
    { label: 'Validées', value: String(data.stats.valid) },
    { label: 'Rejetées', value: String(data.stats.rejected) },
    { label: 'CA validé', value: eur(data.stats.revenueCents) },
  ]

  return (
    <>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className="stat__value">{s.value}</div>
          </div>
        ))}
      </div>

      {error && <span className="form-error">{error}</span>}

      {data.orders.length === 0 && (
        <div className="empty-state">
          Aucune commande pour le moment. Passe une commande côté boutique pour la voir apparaître ici.
        </div>
      )}

      <div className="orders">
        {data.orders.map((order) => {
          const open = openId === order.id
          const stage = Math.min(order.stage, Math.max(stages.length - 1, 0))
          const statusLabel =
            order.status === 'valid'
              ? stages[stage]?.title ?? 'VALIDÉE'
              : order.status === 'rejected'
                ? 'REJETÉE'
                : 'EN ATTENTE'

          return (
            <div className="order" key={order.id}>
              <div className="order__head">
                <div className="order__col">
                  <span className="order__ref">{order.ref}</span>
                  <span className="order__date">{dateTime(order.createdAt)}</span>
                </div>
                <div className="order__col">
                  <span className="order__customer">{order.customer.name}</span>
                  <span className="order__date">
                    {order.customer.email} · {order.customer.country}
                  </span>
                </div>
                <div className="order__col order__col--amount">
                  <span className="order__amount-label">Montant</span>
                  <span className="order__amount">{eur(order.totalCents)}</span>
                </div>
                <span className={STATUS_CLASS[order.status]}>{statusLabel}</span>
                <button
                  className="order__toggle"
                  onClick={() => {
                    setOpenId(open ? null : order.id)
                    setReason('')
                    setReasonPick('')
                    setReasonError(false)
                  }}
                >
                  {open ? 'Fermer' : 'Détail'}
                </button>
              </div>

              {open && (
                <div className="order__detail">
                  <div className="order__pane">
                    <span className="panel__label">Articles</span>
                    {order.items.map((item, i) => (
                      <div className="order__item" key={`${item.ref}-${item.size}-${i}`}>
                        <img src={item.image} alt={item.name} />
                        <div className="order__item-body">
                          <span className="order__item-name">{item.name}</span>
                          <span className="order__item-meta">
                            {item.ref} · Taille {item.size} · ×{item.qty}
                          </span>
                        </div>
                        <span className="order__item-total">{eur(item.priceCents * item.qty)}</span>
                      </div>
                    ))}
                    <div className="order__totals">
                      <div>
                        <span>Livraison</span>
                        <strong>{order.shippingCents ? eur(order.shippingCents) : 'Offerte'}</strong>
                      </div>
                      <div>
                        <span>Adresse</span>
                        <strong>
                          {[order.customer.addr, order.customer.city, order.customer.country]
                            .filter(Boolean)
                            .join(', ')}
                        </strong>
                      </div>
                      <div>
                        <span>Référence virement</span>
                        <strong className="gold">{order.ref}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="order__pane">
                    <span className="panel__label">Preuve de paiement</span>
                    {!order.hasProof && <span className="proof-missing">Aucune preuve jointe par le client.</span>}
                    {order.hasProof && order.proofMime === 'application/pdf' && (
                      <div className="proof-file">
                        <span className="pdf-mark">PDF</span>
                        <span className="proof-file__meta">
                          <span className="proof-file__name">{order.proofName ?? 'justificatif.pdf'}</span>
                          <a href={order.proofUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                            Ouvrir le justificatif →
                          </a>
                        </span>
                      </div>
                    )}
                    {order.hasProof && order.proofMime !== 'application/pdf' && (
                      <img className="proof-view" src={order.proofUrl ?? ''} alt="Preuve de paiement" />
                    )}

                    {order.status === 'pending' && (
                      <div className="decision">
                        <button
                          className="decision__validate"
                          onClick={() => void apply(() => api.admin.validate(order.id))}
                        >
                          Valider le paiement
                        </button>
                        <span className="decision__label">Rejeter — motif obligatoire</span>
                        <div className="decision__chips">
                          {data.reasons.map((r) => (
                            <button
                              key={r}
                              className={`chip chip--sm${reasonPick === r ? ' chip--active' : ''}`}
                              onClick={() => {
                                setReasonPick(r)
                                setReason(r)
                                setReasonError(false)
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value)
                            setReasonError(false)
                          }}
                          placeholder="Préciser le motif communiqué au client…"
                          rows={2}
                        />
                        <button
                          className="decision__reject"
                          onClick={() => {
                            if (!reason.trim()) {
                              setReasonError(true)
                              return
                            }
                            void apply(() => api.admin.reject(order.id, reason.trim()))
                          }}
                        >
                          Rejeter la commande
                        </button>
                        {reasonError && <span className="form-error">Indique un motif avant de rejeter</span>}
                      </div>
                    )}

                    {order.status === 'valid' && (
                      <div className="stage-box">
                        <div className="stage-box__head">
                          <span>Étape de livraison</span>
                          <span className="stage-box__escrow">
                            {stage >= stages.length - 1
                              ? 'Séquestre libéré · paiement acquis'
                              : "Fonds en séquestre jusqu'à la livraison"}
                          </span>
                        </div>
                        <span className="stage-box__title">{stages[stage]?.title}</span>
                        <span className="stage-box__desc">{stages[stage]?.desc}</span>
                        <div className="stage-box__chips">
                          {stages.map((s, i) => (
                            <button
                              key={s.id}
                              className={`chip chip--sm${i === stage ? ' chip--active' : ''}${i < stage ? ' chip--past' : ''}`}
                              onClick={() => void apply(() => api.admin.setStage(order.id, i))}
                            >
                              {i + 1}. {s.title}
                            </button>
                          ))}
                        </div>
                        {stage < stages.length - 1 && (
                          <button
                            className="stage-box__advance"
                            onClick={() => void apply(() => api.admin.setStage(order.id, stage + 1))}
                          >
                            Passer à l'étape suivante
                          </button>
                        )}
                      </div>
                    )}

                    {order.status !== 'pending' && (
                      <div className="decided">
                        <span>
                          {order.status === 'valid'
                            ? 'Paiement validé — commande à expédier.'
                            : `Rejetée — motif : ${order.reason || '—'}`}
                        </span>
                        <button className="btn-underline" onClick={() => void apply(() => api.admin.reopen(order.id))}>
                          Remettre en attente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
