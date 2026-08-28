import { useEffect, useState } from 'react'
import { Drip } from '../components/Drip'
import { chf, eur } from '../format'
import { useShop } from '../shop'

export function ProductView({ id }: { id: string }) {
  const { productById, products, navigate, chfRate, addToCart } = useShop()
  const product = productById.get(id) ?? null

  const [mainImage, setMainImage] = useState(product?.image ?? '')
  const [chosenSize, setChosenSize] = useState<string | null>(null)
  const [added, setAdded] = useState('')

  useEffect(() => {
    setMainImage(product?.image ?? '')
    setChosenSize(null)
    setAdded('')
  }, [product])

  if (!product) {
    return (
      <section className="section">
        <div className="empty-state">Cet article n'est plus disponible.</div>
      </section>
    )
  }

  const thumbs = [product.image, ...product.pool.filter((img) => img !== product.image)].slice(0, 4)
  const related = products
    .filter((p) => p.catId === product.catId && p.subId === product.subId && p.id !== product.id)
    .slice(0, 5)

  const handleAdd = () => {
    const size = chosenSize ?? product.sizes[0]
    addToCart(product.id, size)
    setChosenSize(size)
    setAdded(`Ajouté · taille ${size}`)
  }

  return (
    <section className="section">
      <div className="breadcrumb" style={{ marginBottom: 24 }}>
        <button className="breadcrumb__link" onClick={() => navigate({ name: 'home' })}>
          Catalogue
        </button>
        <span className="breadcrumb__sep">/</span>
        <button
          className="breadcrumb__link"
          onClick={() => navigate({ name: 'cat', catId: product.catId, subId: null })}
        >
          {product.catLabel}
        </button>
        <span className="breadcrumb__sep">/</span>
        <button
          className="breadcrumb__link"
          style={{ color: 'var(--gold)' }}
          onClick={() => navigate({ name: 'cat', catId: product.catId, subId: product.subId })}
        >
          {product.subLabel}
        </button>
      </div>

      <div className="detail">
        <div className="detail__gallery">
          <div className="detail__main">
            <img src={mainImage} alt={product.name} />
            {product.badge && <span className="badge">{product.badge}</span>}
          </div>
          <div className="detail__thumbs">
            {thumbs.map((img) => (
              <button
                key={img}
                className={`detail__thumb${mainImage === img ? ' detail__thumb--active' : ''}`}
                onClick={() => setMainImage(img)}
              >
                <img src={img} alt="Autre vue" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="detail__info">
          <span className="detail__crumb">
            {product.catLabel} · {product.subLabel}
          </span>
          <h1 className="detail__name">{product.name}</h1>
          <Drip
            style={{ width: 140, margin: '18px 0 20px' }}
            runs={[
              { left: '18%', height: 14 },
              { left: '62%', height: 8 },
            ]}
          />

          <div className="detail__price">
            <strong>{eur(product.priceCents)}</strong>
            <span>{chf(product.priceCents, chfRate)} · indicatif Suisse</span>
          </div>

          <p className="detail__desc">{product.description}</p>

          <div className="detail__sizes">
            <span className="detail__sizes-label">Tailles disponibles</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`chip${chosenSize === size ? ' chip--active' : ''}`}
                  onClick={() => {
                    setChosenSize(size)
                    setAdded('')
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-gold detail__add" onClick={handleAdd}>
            Ajouter au panier
          </button>

          {added && (
            <div className="detail__added">
              <span>{added}</span>
              <button onClick={() => navigate({ name: 'cart' })}>Voir le panier →</button>
            </div>
          )}

          <dl className="detail__specs">
            <div>
              <dt>Référence</dt>
              <dd>{product.ref}</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>
                {product.catLabel} · {product.subLabel}
              </dd>
            </div>
            <div>
              <dt>Paiement</dt>
              <dd>Virement bancaire</dd>
            </div>
            <div>
              <dt>Livraison</dt>
              <dd>FR · BE 48 h · CH 3–5 j</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <div className="related">
          <div className="related__head">
            <h2>Dans la même sous-catégorie</h2>
            <button onClick={() => navigate({ name: 'cat', catId: product.catId, subId: product.subId })}>
              Tout voir →
            </button>
          </div>
          <div className="related__grid">
            {related.map((p) => (
              <button key={p.id} className="related__card" onClick={() => navigate({ name: 'product', id: p.id })}>
                <div className="product-card__media">
                  <img src={p.image} alt={p.name} loading="lazy" />
                </div>
                <div className="related__card-body">
                  <div className="related__card-name">{p.name}</div>
                  <div className="related__card-price">{eur(p.priceCents)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
