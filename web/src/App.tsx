import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ShopProvider, useShop } from './shop'
import { AdminView } from './views/AdminView'
import { CartView } from './views/CartView'
import { CheckoutView } from './views/CheckoutView'
import { DoneView } from './views/DoneView'
import { Home } from './views/Home'
import { ListView } from './views/ListView'
import { ProductView } from './views/ProductView'
import { TrackView } from './views/TrackView'

function CurrentView() {
  const { view, catalog, error } = useShop()

  if (error) {
    return (
      <section className="section">
        <div className="empty-state">{error}</div>
      </section>
    )
  }

  if (!catalog) return <div className="loading">Chargement du catalogue…</div>

  switch (view.name) {
    case 'home':
      return <Home />
    case 'cat':
      return <ListView catId={view.catId} subId={view.subId} />
    case 'product':
      return <ProductView id={view.id} />
    case 'cart':
      return <CartView />
    case 'checkout':
      return <CheckoutView />
    case 'done':
      return <DoneView reference={view.ref} />
    case 'track':
      return <TrackView initialRef={view.ref} />
    case 'admin':
      return <AdminView />
  }
}

function Shell() {
  return (
    <div className="app">
      <Header />
      <CurrentView />
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  )
}
