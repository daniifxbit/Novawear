import { LEGAL_DOCS } from '../legal/content'
import { useShop } from '../shop'

export function Footer() {
  const { navigate } = useShop()

  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__brand">
          <div className="footer__brand-row">
            <img src="/assets/novawear-logo.png" alt="" />
            <span className="brand__name">
              NOVA<em>WEAR</em>
            </span>
          </div>
          <span className="footer__tagline">Style. Confidence. Nova.</span>
          <span className="footer__note">
            Paiement par virement bancaire uniquement. Commande expédiée après vérification du virement.
          </span>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">Livraison France</span>
          <span>Colissimo suivi · 48 h</span>
          <span>Offerte dès 60 €</span>
          <span>Retour 14 jours</span>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">Livraison Belgique</span>
          <span>bpost · 2–3 jours</span>
          <span>Offerte dès 80 €</span>
          <span>Retour 14 jours</span>
        </div>

        <div className="footer__col">
          <span className="footer__col-title">Livraison Suisse</span>
          <span>Poste CH · 3–5 jours</span>
          <span>Prix CHF indicatifs (1 € ≈ 0,94 CHF)</span>
          <span>Douane à charge du client</span>
        </div>
      </div>

      <nav className="footer__legal" aria-label="Informations légales">
        {LEGAL_DOCS.map((doc) => (
          <button key={doc.id} onClick={() => navigate({ name: 'legal', doc: doc.id })}>
            {doc.navLabel}
          </button>
        ))}
      </nav>

      <div className="footer__bar">
        <span>© 2026 Novawear — Revente sélective</span>
        <span className="footer__bar-right">
          <span>Virement bancaire · Authenticité vérifiée</span>
          <button className="footer__admin" onClick={() => navigate({ name: 'admin' })}>
            Admin
          </button>
        </span>
      </div>
    </footer>
  )
}
