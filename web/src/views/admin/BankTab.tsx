import { useEffect, useState } from 'react'
import { api } from '../../api'
import type { BankInfo } from '../../types'

const FIELDS: [keyof BankInfo, string][] = [
  ['holder', 'Titulaire du compte'],
  ['iban', 'IBAN'],
  ['bic', 'BIC / SWIFT'],
  ['bankName', 'Banque'],
]

export function BankTab() {
  const [bank, setBank] = useState<BankInfo | null>(null)
  const [defaults, setDefaults] = useState<BankInfo | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.admin
      .bank()
      .then((res) => {
        setBank(res.bank)
        setDefaults(res.defaults)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Chargement impossible'))
  }, [])

  if (error && !bank) return <div className="empty-state">{error}</div>
  if (!bank || !defaults) return <div className="loading">Chargement des coordonnées…</div>

  const save = async () => {
    try {
      const res = await api.admin.saveBank(bank)
      setBank(res.bank)
      setMessage('Coordonnées enregistrées — actives dès le prochain paiement')
      setError('')
    } catch (err) {
      setMessage('')
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    }
  }

  return (
    <div className="admin-two-col admin-two-col--bank">
      <div className="admin-panel admin-panel--bank">
        <span className="admin-panel__title">Compte de réception des virements</span>
        <span className="admin-panel__hint">
          Ces informations s'affichent au client à l'étape de paiement. La référence de commande est générée
          automatiquement.
        </span>
        {FIELDS.map(([key, label]) => (
          <label className="field" key={key} style={{ gap: 6 }}>
            <span className="field__label">{label}</span>
            <input
              className="input input--dark"
              value={bank[key]}
              placeholder={defaults[key]}
              onChange={(e) => {
                setBank({ ...bank, [key]: e.target.value })
                setMessage('')
                setError('')
              }}
            />
          </label>
        ))}
        <button className="admin-panel__submit" onClick={() => void save()}>
          Enregistrer les coordonnées
        </button>
        {message && <span className="admin-panel__msg">{message}</span>}
        {error && <span className="form-error">{error}</span>}
        <button
          className="btn-underline"
          onClick={() => {
            setBank({ ...defaults })
            setMessage('')
            setError('')
          }}
        >
          Revenir aux valeurs de démo
        </button>
      </div>

      <div className="bank-card">
        <span className="admin-panel__title">Aperçu côté client</span>
        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map(([key, label]) => (
            <div className="bank-card__row" key={key}>
              <dt>{label}</dt>
              <dd>{bank[key] || '—'}</dd>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <dt className="field__label">Référence à indiquer</dt>
            <dd className="highlight" style={{ margin: 0 }}>
              NW-2026-XXXX
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
