import { useEffect, useState } from 'react'
import { api } from '../api'
import { eur } from '../format'
import { useShop } from '../shop'
import type { CheckoutDraft } from '../types'

interface Form {
  name: string
  email: string
  phone: string
  city: string
  addr: string
}

const EMPTY: Form = { name: '', email: '', phone: '', city: '', addr: '' }

export function CheckoutView() {
  const { catalog, cart, totals, country, setCountry, navigate, clearCart } = useShop()
  const countries = catalog?.countries ?? []
  const countryLabel = countries.find((c) => c.code === country)?.label ?? country

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<Form>(EMPTY)
  const [draft, setDraft] = useState<CheckoutDraft | null>(null)
  // Identifies what a draft was created from, so stepping back and forth
  // without changing anything reuses it instead of burning a new reference.
  const [draftKey, setDraftKey] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // An empty cart has nothing to pay for — send the shopper back to it.
  useEffect(() => {
    if (totals.entries.length === 0 && step === 1) navigate({ name: 'cart' })
  }, [totals.entries.length, step, navigate])

  useEffect(() => {
    if (!proof || proof.type === 'application/pdf') {
      setProofPreview(null)
      return
    }
    const url = URL.createObjectURL(proof)
    setProofPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [proof])

  const update = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function goToPayment() {
    if (!form.name.trim() || !form.email.trim() || !form.addr.trim()) {
      setError('Nom, email et adresse requis')
      return
    }
    const key = JSON.stringify({ form, country, cart })
    if (draft && draftKey === key) {
      setStep(2)
      setError('')
      window.scrollTo(0, 0)
      return
    }

    setBusy(true)
    setError('')
    try {
      const created = await api.checkout({ customer: form, country, items: cart })
      setDraft(created)
      setDraftKey(key)
      setStep(2)
      window.scrollTo(0, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de préparer la commande')
    } finally {
      setBusy(false)
    }
  }

  async function confirmPayment() {
    if (!draft) return
    if (!proof) {
      setError('Joins la preuve de virement')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { ref } = await api.confirmPayment(draft.orderId, proof)
      clearCart()
      navigate({ name: 'done', ref })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation impossible')
    } finally {
      setBusy(false)
    }
  }

  const bankRows = draft
    ? [
        { label: 'Titulaire du compte', value: draft.bank.holder, highlight: false },
        { label: 'IBAN', value: draft.bank.iban, highlight: true },
        { label: 'BIC / SWIFT', value: draft.bank.bic, highlight: false },
        { label: 'Banque', value: draft.bank.bankName || '—', highlight: false },
        { label: 'Montant à virer', value: eur(draft.totalCents), highlight: true },
        { label: 'Référence à indiquer', value: draft.ref, highlight: true },
      ]
    : []

  return (
    <section className="checkout">
      <div className="breadcrumb" style={{ marginBottom: 18 }}>
        <button className="breadcrumb__link" onClick={() => navigate({ name: 'cart' })}>
          Panier
        </button>
        <span className="breadcrumb__sep">/</span>
        <span style={{ color: 'var(--gold)' }}>Paiement par virement</span>
      </div>

      <h1 className="checkout__title">{step === 1 ? 'Coordonnées de livraison' : 'Virement bancaire'}</h1>
      <div className="checkout__steps">
        <i className="is-reached" />
        <i className={step >= 2 ? 'is-reached' : undefined} />
      </div>

      {step === 1 ? (
        <>
          <div className="checkout__form">
            <label className="field">
              <span className="field__label">Nom et prénom</span>
              <input className="input" value={form.name} onChange={update('name')} placeholder="Alex Dupont" />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="alex@email.com"
              />
            </label>
            <label className="field">
              <span className="field__label">Téléphone</span>
              <input className="input" value={form.phone} onChange={update('phone')} placeholder="+33 6 12 34 56 78" />
            </label>
            <label className="field">
              <span className="field__label">Ville et code postal</span>
              <input className="input" value={form.city} onChange={update('city')} placeholder="75011 Paris" />
            </label>
            <label className="field span-2">
              <span className="field__label">Adresse de livraison</span>
              <input className="input" value={form.addr} onChange={update('addr')} placeholder="12 rue de la Roquette" />
            </label>
            <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span className="field__label">Pays</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {countries.map((c) => (
                  <button
                    key={c.code}
                    className={`chip${country === c.code ? ' chip--active' : ''}`}
                    onClick={() => setCountry(c.code)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="checkout__submit-row">
            <button className="btn-gold" style={{ padding: '16px 24px' }} onClick={goToPayment} disabled={busy}>
              Afficher les coordonnées bancaires
            </button>
            {error && <span className="form-error">{error}</span>}
          </div>
        </>
      ) : (
        draft && (
          <div className="checkout__pay">
            <div className="bank-card">
              <span className="summary__label">Coordonnées du compte</span>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bankRows.map((row) => (
                  <div className="bank-card__row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd className={row.highlight ? 'highlight' : undefined}>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <span className="bank-card__note">
                Indique impérativement la référence <em>{draft.ref}</em> dans le libellé du virement, sinon la commande
                ne peut pas être rattachée.
              </span>
            </div>

            <div className="pay-col">
              <div className="panel">
                <span className="panel__label">Preuve de paiement</span>
                <span className="panel__hint">
                  Joins la capture ou le PDF de l'ordre de virement. La commande passe en attente de vérification.
                </span>
                <input
                  className="file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    setProof(e.target.files?.[0] ?? null)
                    setError('')
                  }}
                />
                {proofPreview && (
                  <div className="proof-chip">
                    <img src={proofPreview} alt="Aperçu de la preuve" />
                    <span className="proof-chip__label">Preuve jointe</span>
                  </div>
                )}
                {proof?.type === 'application/pdf' && (
                  <div className="proof-chip proof-chip--pdf">
                    <span className="pdf-mark">PDF</span>
                    <span className="proof-chip__meta">
                      <span className="proof-chip__label">Preuve jointe</span>
                      <span className="proof-chip__name">{proof.name}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="panel">
                <span className="panel__label">Commande</span>
                <div className="recap-row">
                  <span>{totals.count} article(s)</span>
                  <strong>{eur(draft.subtotalCents)}</strong>
                </div>
                <div className="recap-row">
                  <span>Livraison {countryLabel}</span>
                  <strong>{draft.shippingCents ? eur(draft.shippingCents) : 'Offerte'}</strong>
                </div>
                <div className="recap-total">
                  <span>À virer</span>
                  <strong>{eur(draft.totalCents)}</strong>
                </div>
              </div>

              <button
                className="btn-gold"
                style={{ padding: '17px 24px' }}
                onClick={confirmPayment}
                disabled={busy}
              >
                J'ai effectué le virement · confirmer
              </button>
              {error && <span className="form-error">{error}</span>}
              <button className="back-link" onClick={() => setStep(1)}>
                ← Modifier mes coordonnées
              </button>
            </div>
          </div>
        )
      )}
    </section>
  )
}
