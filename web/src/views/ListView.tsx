import { useMemo, useState } from 'react'
import { Drip } from '../components/Drip'
import { ProductCard } from '../components/ProductCard'
import { useShop } from '../shop'
import type { Product } from '../types'

const PRICE_FILTERS: [string, string, number | null, number][] = [
  ['all', 'Tous les prix', null, 0],
  ['a', 'Moins de 20 €', 0, 2000],
  ['b', '20 – 35 €', 2000, 3500],
  ['c', '35 – 60 €', 3500, 6000],
  ['d', 'Plus de 60 €', 6000, Number.MAX_SAFE_INTEGER],
]

const MAX_RESULTS = 120

export function ListView({ catId, subId }: { catId: string | null; subId: string | null }) {
  const { catalog, products, navigate, query, setQuery, chfRate } = useShop()
  const [size, setSize] = useState<string | null>(null)
  const [price, setPrice] = useState('all')

  const category = catalog?.categories.find((c) => c.id === catId) ?? null
  const term = query.trim().toLowerCase()

  const { list, sizeOptions } = useMemo(() => {
    const scope: Product[] = term ? products : products.filter((p) => p.catId === catId)
    let filtered = term
      ? scope.filter((p) => `${p.name} ${p.ref} ${p.subLabel} ${p.catLabel}`.toLowerCase().includes(term))
      : scope.filter((p) => !subId || p.subId === subId)

    if (size) filtered = filtered.filter((p) => p.sizes.includes(size))

    const range = PRICE_FILTERS.find((f) => f[0] === price)
    if (range && range[2] !== null) {
      filtered = filtered.filter((p) => p.priceCents >= range[2]! && p.priceCents < range[3])
    }

    return { list: filtered, sizeOptions: [...new Set(scope.flatMap((p) => p.sizes))] }
  }, [products, term, catId, subId, size, price])

  const subLabel = subId ? category?.subs.find((s) => s.id === subId)?.label ?? '' : ''
  const title = term ? `« ${query} »` : subLabel ? subLabel.toUpperCase() : category?.label ?? ''

  const resetFilters = () => {
    setSize(null)
    setPrice('all')
    setQuery('')
    if (catId) navigate({ name: 'cat', catId, subId: null })
  }

  return (
    <section className="section">
      <div className="breadcrumb" style={{ marginBottom: 18 }}>
        <button className="breadcrumb__link" onClick={() => navigate({ name: 'home' })}>
          Catalogue
        </button>
        <span className="breadcrumb__sep">/</span>
        <span className="breadcrumb__current">{term ? 'Recherche' : category?.label ?? ''}</span>
        {!term && subLabel && (
          <>
            <span className="breadcrumb__sep">/</span>
            <span style={{ color: 'var(--gold)' }}>{subLabel}</span>
          </>
        )}
      </div>

      <h1 className="list__title">{title}</h1>
      <Drip
        className="list__rule"
        runs={[
          { left: '12%', height: 13 },
          { left: '34%', height: 24 },
          { left: '57%', height: 8, faded: true },
        ]}
      />

      <div className="filters">
        <div className="filters__row">
          <span className="filters__label">Sous-catégorie</span>
          {!term &&
            category &&
            [{ id: '', label: 'Tout' }, ...category.subs].map((s) => (
              <button
                key={s.id || 'all'}
                className={`chip${(subId ?? '') === s.id ? ' chip--active' : ''}`}
                onClick={() => navigate({ name: 'cat', catId, subId: s.id || null })}
              >
                {s.label}
              </button>
            ))}
        </div>
        <div className="filters__row">
          <span className="filters__label">Taille</span>
          <button className={`chip${!size ? ' chip--active' : ''}`} onClick={() => setSize(null)}>
            Toutes
          </button>
          {sizeOptions.map((s) => (
            <button key={s} className={`chip${size === s ? ' chip--active' : ''}`} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="filters__row">
          <span className="filters__label">Prix</span>
          {PRICE_FILTERS.map(([id, label]) => (
            <button key={id} className={`chip${price === id ? ' chip--active' : ''}`} onClick={() => setPrice(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="results">
        <span>{list.length > 1 ? `${list.length} articles` : `${list.length} article`}</span>
        <button onClick={resetFilters}>Réinitialiser</button>
      </div>

      <div className="product-grid">
        {list.slice(0, MAX_RESULTS).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            chfRate={chfRate}
            onOpen={() => navigate({ name: 'product', id: product.id })}
          />
        ))}
      </div>

      {list.length === 0 && <div className="empty-state">Aucun article ne correspond à ces filtres.</div>}
    </section>
  )
}
