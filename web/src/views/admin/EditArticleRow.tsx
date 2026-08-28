import { useEffect, useState } from 'react'
import { api } from '../../api'
import type { Category, Product } from '../../types'

const BADGES: [string, string][] = [
  ['', 'Aucun'],
  ['NOUVEAU', 'Nouveau'],
  ['DERNIÈRES PIÈCES', 'Dernières pièces'],
  ['EXCLU', 'Exclu'],
]

/** Inline editor shown in place of an article row in the back-office list. */
export function EditArticleRow({
  product,
  categories,
  onSaved,
  onCancel,
}: {
  product: Product
  categories: Category[]
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(product.name)
  const [ref, setRef] = useState(product.ref)
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2).replace('.', ','))
  const [sizes, setSizes] = useState(product.sizes.join(' / '))
  const [badge, setBadge] = useState(product.badge ?? '')
  const [cat, setCat] = useState(product.catId)
  const [sub, setSub] = useState(product.subId)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!photo) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const currentCategory = categories.find((c) => c.id === cat) ?? categories[0]

  async function save() {
    setBusy(true)
    try {
      await api.admin.updateProduct(product.id, { name, ref, price, sizes, badge, cat, sub }, photo)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-edit">
      <div className="admin-edit__head">
        <img src={preview ?? product.image} alt="" />
        <label className="field" style={{ flex: 1, gap: 6 }}>
          <span className="field__label">Nom</span>
          <input className="input input--compact" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field" style={{ flex: '0 1 150px', gap: 6 }}>
          <span className="field__label">Référence</span>
          <input className="input input--compact" value={ref} onChange={(e) => setRef(e.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label className="field field--narrow">
          <span className="field__label">Prix €</span>
          <input className="input input--compact" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="field field--wide">
          <span className="field__label">Tailles (séparées par /)</span>
          <input className="input input--compact" value={sizes} onChange={(e) => setSizes(e.target.value)} />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Catégorie</span>
          <select
            className="select"
            value={cat}
            onChange={(e) => {
              const next = categories.find((c) => c.id === e.target.value)
              if (next) {
                setCat(next.id)
                setSub(next.subs[0].id)
              }
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Sous-catégorie</span>
          <select className="select" value={sub} onChange={(e) => setSub(e.target.value)}>
            {(currentCategory?.subs ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="field__label">Badge</span>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {BADGES.map(([value, label]) => (
            <button
              key={value || 'none'}
              className={`chip chip--sm${badge === value ? ' chip--active' : ''}`}
              onClick={() => setBadge(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Remplacer la photo</span>
        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="admin-edit__actions">
        <button className="admin-panel__submit" style={{ flex: 1 }} onClick={() => void save()} disabled={busy}>
          Enregistrer
        </button>
        <button className="admin-row__delete" onClick={onCancel}>
          Annuler
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
