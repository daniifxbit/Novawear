import { useShop } from '../shop'

export function Header() {
  const { catalog, view, navigate, query, setQuery, totals, productById } = useShop()
  const categories = catalog?.categories ?? []

  // The category tab stays lit while browsing that category or one of its articles.
  const activeCatId =
    view.name === 'cat' ? view.catId : view.name === 'product' ? (productById.get(view.id)?.catId ?? null) : null

  return (
    <header className="header">
      <div className="header__inner">
        <button className="brand" onClick={() => navigate({ name: 'home' })}>
          <img className="brand__logo" src="/assets/novawear-logo.png" alt="" />
          <span className="brand__text">
            <span className="brand__name">
              NOVA<em>WEAR</em>
            </span>
            <span className="brand__tagline">STYLE. CONFIDENCE. NOVA.</span>
          </span>
        </button>

        <div className="search">
          <span className="search__dot" aria-hidden="true" />
          <input
            className="search__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article, une référence…"
            aria-label="Rechercher un article"
          />
        </div>

        <div className="header__actions">
          <button
            className={totals.count ? 'cart-btn cart-btn--filled' : 'cart-btn'}
            onClick={() => navigate({ name: 'cart' })}
          >
            Panier · {String(totals.count).padStart(2, '0')}
          </button>
          <button className="track-btn" onClick={() => navigate({ name: 'track' })}>
            Suivi
          </button>
        </div>

        <nav className="header__nav" aria-label="Catégories">
          {categories.map((c) => (
            <button
              key={c.id}
              aria-current={activeCatId === c.id}
              onClick={() => navigate({ name: 'cat', catId: c.id, subId: null })}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
