import { useShop } from '../shop'

export function DoneView({ reference }: { reference: string }) {
  const { navigate } = useShop()

  return (
    <section className="done">
      <span className="done__tick" aria-hidden="true">
        ✓
      </span>
      <h1>Paiement déclaré</h1>
      <p>
        Ta commande <em>{reference}</em> est en attente de vérification. Les fonds restent en séquestre jusqu'à la
        livraison — garde cette référence, elle sert à suivre le colis.
      </p>
      <div className="done__actions">
        <button className="btn-gold" onClick={() => navigate({ name: 'track' })}>
          Suivre ma commande
        </button>
        <button className="btn-ghost" onClick={() => navigate({ name: 'home' })}>
          Retour au catalogue
        </button>
      </div>
    </section>
  )
}
