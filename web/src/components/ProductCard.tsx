import { chf, eur } from '../format'
import type { Product } from '../types'

export function ProductCard({
  product,
  chfRate,
  onOpen,
}: {
  product: Product
  chfRate: number
  onOpen: () => void
}) {
  return (
    <button className="product-card" onClick={onOpen}>
      <div className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="badge">{product.badge}</span>}
      </div>
      <div className="product-card__body">
        <div className="product-card__crumb">
          {product.catLabel} · {product.subLabel}
        </div>
        <div className="product-card__name">{product.name}</div>
        <div className="size-tags">
          {product.sizes.map((size) => (
            <span key={size}>{size}</span>
          ))}
        </div>
        <div className="product-card__foot">
          <div>
            <div className="product-card__eur">{eur(product.priceCents)}</div>
            <div className="product-card__chf">{chf(product.priceCents, chfRate)}</div>
          </div>
          <span className="product-card__ref">{product.ref}</span>
        </div>
      </div>
    </button>
  )
}
