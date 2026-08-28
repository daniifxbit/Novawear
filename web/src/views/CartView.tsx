import { chf, eur } from '../format'
import { useShop } from '../shop'

export function CartView() {
  const { catalog, totals, setQty, removeLine, navigate, country, setCountry, chfRate } = useShop()
  const countries = catalog?.countries ?? []
  const countryLabel = countries.find((c) => c.code === country)?.label ?? country

  return (
    <section className="narrow">
      <h1 className="page-title">Panier</h1>
      <div className="page-rule" />

      {totals.entries.length === 0 ? (
        <div className="cart__empty">
          <span>Ton panier est vide.</span>
          <button className="btn-gold" onClick={() => navigate({ name: 'home' })}>
            Voir le catalogue
          </button>
        </div>
      ) : (
        <div className="cart__layout">
          <div className="cart__lines">
            {totals.entries.map((entry, index) => (
              <div className="cart__line" key={`${entry.productId}-${entry.size}`}>
                <div className="cart__thumb">
                  <img src={entry.product.image} alt={entry.product.name} />
                </div>
                <div className="cart__line-body">
                  <div className="cart__line-name">{entry.product.name}</div>
                  <div className="cart__line-meta">
                    {entry.product.ref} · Taille {entry.size}
                  </div>
                  <div className="cart__line-actions">
                    <div className="qty">
                      <button onClick={() => setQty(index, entry.qty - 1)} aria-label="Retirer une unité">
                        −
                      </button>
                      <span>{entry.qty}</span>
                      <button onClick={() => setQty(index, entry.qty + 1)} aria-label="Ajouter une unité">
                        +
                      </button>
                    </div>
                    <span className="cart__line-total">{eur(entry.product.priceCents * entry.qty)}</span>
                    <button className="cart__remove" onClick={() => removeLine(index)}>
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="summary">
            <span className="summary__label">Récapitulatif</span>
            <div className="summary__rows">
              <div>
                <span>Sous-total</span>
                <strong>{eur(totals.subtotalCents)}</strong>
              </div>
              <div>
                <span>Livraison ({countryLabel})</span>
                <strong>{totals.shippingCents ? eur(totals.shippingCents) : 'Offerte'}</strong>
              </div>
            </div>

            <div className="summary__country">
              <span>Pays de livraison</span>
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

            <div className="summary__total">
              <span>Total</span>
              <div style={{ textAlign: 'right' }}>
                <div className="summary__amount">{eur(totals.totalCents)}</div>
                <div className="summary__amount-chf">{chf(totals.totalCents, chfRate)}</div>
              </div>
            </div>

            <button className="btn-gold btn-gold--wide" onClick={() => navigate({ name: 'checkout' })}>
              Payer par virement
            </button>
            <span className="summary__note">
              Seul moyen de paiement accepté : le virement bancaire. Les coordonnées du compte s'affichent à l'étape
              suivante.
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
