import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, api, type RowError } from '../../api'
import { eur } from '../../format'
import { useShop } from '../../shop'
import type { AdminProductsResponse } from '../../types'
import { EditArticleRow } from './EditArticleRow'

const BADGES: [string, string][] = [
  ['', 'Aucun'],
  ['NOUVEAU', 'Nouveau'],
  ['DERNIÈRES PIÈCES', 'Dernières pièces'],
  ['EXCLU', 'Exclu'],
]

interface Draft {
  name: string
  cat: string
  sub: string
  price: string
  sizes: string
  badge: string
}

export function ProductsTab() {
  const { catalog, reloadCatalog } = useShop()
  const categories = useMemo(() => catalog?.categories ?? [], [catalog])

  const [draft, setDraft] = useState<Draft>({
    name: '',
    cat: 'ts',
    sub: 'graph',
    price: '',
    sizes: 'S / M / L / XL',
    badge: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [data, setData] = useState<AdminProductsResponse | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importMsg, setImportMsg] = useState('')
  const [importErrors, setImportErrors] = useState<RowError[]>([])

  const load = useCallback(async (term: string) => {
    try {
      setData(await api.admin.products(term))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => void load(query), 200)
    return () => clearTimeout(timer)
  }, [query, load])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const currentCategory = categories.find((c) => c.id === draft.cat) ?? categories[0]

  async function submit() {
    if (!draft.name.trim() || !Number.parseFloat(draft.price.replace(',', '.'))) {
      setMessage('')
      setError('Nom et prix requis')
      return
    }
    try {
      await api.admin.addProduct(
        {
          name: draft.name,
          cat: draft.cat,
          sub: draft.sub,
          price: draft.price,
          sizes: draft.sizes,
          badge: draft.badge,
        },
        photo,
      )
      setDraft({ ...draft, name: '', price: '' })
      setPhoto(null)
      setError('')
      setMessage('Article ajouté au catalogue')
      reloadCatalog()
      await load(query)
    } catch (err) {
      setMessage('')
      setError(err instanceof Error ? err.message : 'Ajout impossible')
    }
  }

  async function remove(id: string) {
    try {
      await api.admin.deleteProduct(id)
      reloadCatalog()
      await load(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  async function restore() {
    try {
      await api.admin.restoreProducts()
      reloadCatalog()
      await load(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restauration impossible')
    }
  }

  async function importCsv(file: File) {
    setImportMsg('')
    setImportErrors([])
    try {
      const result = await api.admin.importProducts(file)
      setImportMsg(
        `${result.updated} article(s) mis à jour, ${result.unchanged} inchangé(s) sur ${result.rows} ligne(s).`,
      )
      reloadCatalog()
      await load(query)
    } catch (err) {
      setImportMsg('')
      setError(err instanceof Error ? err.message : 'Import impossible')
      if (err instanceof ApiError) setImportErrors(err.rowErrors)
    }
  }

  return (
    <div className="admin-two-col">
      <div className="admin-col">
      <div className="admin-panel">
        <span className="admin-panel__title">Catalogue en tableur</span>
        <span className="admin-panel__hint">
          Exporte les {data?.totalCount ?? 0} articles, corrige les noms, prix, tailles et badges dans ton tableur,
          puis réimporte le fichier. La colonne « id » identifie chaque article : ne la modifie pas.
        </span>
        <a className="admin-panel__submit admin-panel__submit--link" href={api.admin.exportUrl} download>
          Exporter le catalogue (CSV)
        </a>
        <label className="field">
          <span className="field__label">Réimporter un fichier</span>
          <input
            className="file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void importCsv(file)
            }}
          />
        </label>
        {importMsg && <span className="admin-panel__msg">{importMsg}</span>}
        {importErrors.length > 0 && (
          <ul className="import-errors">
            {importErrors.map((rowError) => (
              <li key={rowError.line}>
                Ligne {rowError.line} — {rowError.message}
              </li>
            ))}
          </ul>
        )}
        <span className="admin-panel__hint">
          Un fichier contenant la moindre erreur n'est pas appliqué du tout : corrige les lignes signalées et
          réimporte.
        </span>
      </div>

      <div className="admin-panel">
        <span className="admin-panel__title">Ajouter un article</span>

        <label className="field" style={{ gap: 6 }}>
          <span className="field__label">Nom</span>
          <input
            className="input input--compact"
            value={draft.name}
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value })
              setMessage('')
            }}
            placeholder="HOODIE ONYX"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Catégorie</span>
            <select
              className="select"
              value={draft.cat}
              onChange={(e) => {
                const next = categories.find((c) => c.id === e.target.value)
                if (next) setDraft({ ...draft, cat: next.id, sub: next.subs[0].id })
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
            <select
              className="select"
              value={draft.sub}
              onChange={(e) => setDraft({ ...draft, sub: e.target.value })}
            >
              {(currentCategory?.subs ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field field--narrow">
            <span className="field__label">Prix €</span>
            <input
              className="input input--compact"
              value={draft.price}
              onChange={(e) => {
                setDraft({ ...draft, price: e.target.value })
                setMessage('')
              }}
              placeholder="89,90"
            />
          </label>
          <label className="field field--wide">
            <span className="field__label">Tailles (séparées par /)</span>
            <input
              className="input input--compact"
              value={draft.sizes}
              onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
              placeholder="S / M / L / XL"
            />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="field__label">Badge</span>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {BADGES.map(([value, label]) => (
              <button
                key={value || 'none'}
                className={`chip chip--sm${draft.badge === value ? ' chip--active' : ''}`}
                onClick={() => setDraft({ ...draft, badge: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">Photo (ratio 4:5)</span>
          <input
            className="file-input"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        {photoPreview && <img className="photo-preview" src={photoPreview} alt="Aperçu" />}

        <button className="admin-panel__submit" onClick={() => void submit()}>
          Ajouter au catalogue
        </button>
        {message && <span className="admin-panel__msg">{message}</span>}
        {error && <span className="form-error">{error}</span>}
      </div>
      </div>

      <div className="admin-list">
        <div className="admin-list__head">
          <span className="admin-panel__title">Catalogue · {data?.totalCount ?? 0} articles</span>
          {!!data?.removedCount && (
            <button className="btn-underline" onClick={() => void restore()}>
              {data.removedCount === 1
                ? "Restaurer l'article supprimé"
                : `Restaurer les ${data.removedCount} articles supprimés`}
            </button>
          )}
        </div>

        <div className="admin-list__search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par nom, référence ou sous-catégorie…"
            aria-label="Filtrer le catalogue"
          />
        </div>

        <div className="admin-list__rows">
          {(data?.products ?? []).map((p) =>
            editingId === p.id ? (
              <EditArticleRow
                key={p.id}
                product={p}
                categories={categories}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null)
                  reloadCatalog()
                  void load(query)
                }}
              />
            ) : (
              <div className="admin-row" key={p.id}>
                <img src={p.image} alt={p.name} loading="lazy" />
                <div className="admin-row__body">
                  <span className="admin-row__name">{p.name}</span>
                  <span className="admin-row__meta">
                    {p.ref} · {p.catLabel} · {p.subLabel}
                  </span>
                </div>
                <span className="admin-row__price">{eur(p.priceCents)}</span>
                <button className="admin-row__delete" onClick={() => setEditingId(p.id)}>
                  Modifier
                </button>
                <button className="admin-row__delete" onClick={() => void remove(p.id)}>
                  Supprimer
                </button>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
