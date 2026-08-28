import { Drip } from '../components/Drip'
import { useShop } from '../shop'

const ESCROW_STEPS = [
  ['01', 'Tu vires le montant', 'Le virement part vers le compte de séquestre, avec ta référence de commande en libellé.'],
  ['02', 'Les fonds sont bloqués', "Nous vérifions le virement et préparons le colis. L'argent est immobilisé, pas encaissé."],
  ['03', 'Le colis part', 'Remise au transporteur, puis suivi étape par étape depuis ta référence.'],
  ['04', 'Livraison confirmée', 'À la réception, et seulement là, le séquestre libère le paiement à la boutique.'],
]

export function Home() {
  const { catalog, products, navigate } = useShop()
  const categories = catalog?.categories ?? []

  const cards = categories.map((c) => {
    const list = products.filter((p) => p.catId === c.id)
    return {
      id: c.id,
      label: c.label,
      subLine: c.subs.map((s) => s.label).join(' · '),
      count: list.length,
      image: list.length ? list[list.length - 1].image : '/assets/photos/img001.jpg',
    }
  })

  return (
    <>
      <section className="hero">
        <div className="hero__veil" />
        <div className="hero__inner">
          <div className="hero__head">
            <span className="hero__kicker">Streetwear premium · France · Belgique · Suisse</span>
            <h1 className="hero__title">
              <span className="hero__title-top">STYLE.</span>
              <span className="hero__title-bottom">confidence.</span>
            </h1>
          </div>

          <div className="hero__grid">
            <div className="hero__pitch">
              <h2>
                Une pièce,
                <br />
                un seul exemplaire
              </h2>
              <p>
                Chaque article du catalogue est sourcé à l'unité et vérifié avant mise en ligne. Ce qui part ne revient
                pas.
              </p>
              <div className="hero__note">
                <i />
                <span>Authenticité vérifiée · expédition 48 h</span>
              </div>
            </div>

            <div className="hero__subject">
              <div className="hero__frame">
                <div>
                  <img src="/assets/photos/img145.jpg" alt="Sélection NOVAWEAR" />
                </div>
                <button
                  className="hero__badge"
                  onClick={() => navigate({ name: 'cat', catId: categories[0]?.id ?? 'ts', subId: null })}
                >
                  Voir le
                  <br />
                  catalogue
                </button>
              </div>
            </div>

            <div className="hero__aside">
              <span className="hero__stock">{products.length} pièces en stock</span>
              <div className="hero__card">
                <span className="hero__card-label">Paiement</span>
                <strong className="gold">Virement bancaire</strong>
                <small>Coordonnées et référence fournies au panier.</small>
              </div>
              <div className="hero__card hero__card--gold">
                <span className="hero__card-label">Livraison</span>
                <strong>FR · BE · CH</strong>
                <small>48 h en France et Belgique.</small>
              </div>
            </div>
          </div>

          <Drip
            className="hero__rule"
            runs={[
              { left: '23%', height: 15 },
              { left: '48%', height: 31 },
              { left: '62%', height: 9 },
              { left: '78%', height: 21 },
            ]}
          />
        </div>
      </section>

      <section className="home-catalogue">
        <div className="section-head">
          <h2>Le catalogue</h2>
          <span>
            {categories.length} catégories · {products.length} pièces en stock
          </span>
        </div>
        <div className="cat-grid">
          {cards.map((card) => (
            <button
              key={card.id}
              className="cat-card"
              onClick={() => navigate({ name: 'cat', catId: card.id, subId: null })}
            >
              <div className="cat-card__media">
                <img src={card.image} alt={card.label} loading="lazy" />
                <div className="cat-card__overlay">
                  <div className="cat-card__name">{card.label}</div>
                  <div className="cat-card__rule" />
                  <div className="cat-card__subs">{card.subLine}</div>
                </div>
              </div>
              <div className="cat-card__foot">
                <span>{card.count} pièces</span>
                <em>Voir →</em>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="escrow">
        <div className="escrow__inner">
          <div className="escrow__copy">
            <span className="eyebrow">Paiement sécurisé · séquestre</span>
            <h2>Ton argent reste bloqué jusqu'à la livraison</h2>
            <Drip
              style={{ width: 180, marginTop: 4 }}
              runs={[
                { left: '22%', height: 13 },
                { left: '58%', height: 22 },
              ]}
            />
            <p>
              Ton virement n'arrive pas directement sur le compte de la boutique : il est placé sur un compte de
              séquestre. NOVAWEAR ne touche rien tant que le colis n'est pas entre tes mains. Si la livraison échoue,
              les fonds te sont rendus.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <button className="btn-gold btn-gold--sm" onClick={() => navigate({ name: 'track' })}>
                Suivre ma commande
              </button>
            </div>
          </div>

          <div className="escrow__steps">
            {ESCROW_STEPS.map(([num, title, desc]) => (
              <div className="escrow__step" key={num}>
                <span>{num}</span>
                <span className="escrow__step-body">
                  <strong>{title}</strong>
                  <span>{desc}</span>
                </span>
              </div>
            ))}
            <span className="escrow__foot">
              Le séquestre est déclenché à la vérification du virement. Aucun frais supplémentaire pour l'acheteur.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
