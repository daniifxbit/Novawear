import { useEffect, useState } from 'react'
import { api } from '../api'
import { useShop } from '../shop'
import { BankTab } from './admin/BankTab'
import { OrdersTab } from './admin/OrdersTab'
import { ProductsTab } from './admin/ProductsTab'

type Tab = 'orders' | 'products' | 'bank'

export function AdminView() {
  const { navigate } = useShop()

  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [demoCode, setDemoCode] = useState(false)
  const [code, setCode] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('orders')
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    api.admin
      .session()
      .then((s) => {
        setAuthenticated(s.authenticated)
        setDemoCode(s.demoCode)
      })
      .catch(() => setAuthenticated(false))
  }, [])

  async function login() {
    try {
      const session = await api.admin.login(code)
      setAuthenticated(session.authenticated)
      setCode('')
      setLoginError('')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Code incorrect')
    }
  }

  async function logout() {
    await api.admin.logout().catch(() => undefined)
    setAuthenticated(false)
    navigate({ name: 'home' })
  }

  if (authenticated === null) {
    return (
      <section className="section">
        <div className="loading">Vérification de la session…</div>
      </section>
    )
  }

  if (!authenticated) {
    return (
      <section className="section">
        <div className="admin-login">
          <span className="admin-panel__title">Espace administrateur</span>
          <h1>Connexion</h1>
          <input
            className="input"
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setLoginError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void login()
            }}
            placeholder="Code d'accès"
            aria-label="Code d'accès"
          />
          <button className="admin-panel__submit" style={{ padding: 15 }} onClick={() => void login()}>
            Entrer
          </button>
          {demoCode && (
            <small>
              Démo : code <em>NOVA</em> — définis ADMIN_CODE pour une vraie authentification.
            </small>
          )}
          {loginError && <span className="form-error">{loginError}</span>}
        </div>
      </section>
    )
  }

  const tabs: [Tab, string][] = [
    ['orders', `Commandes · ${orderCount}`],
    ['products', 'Articles'],
    ['bank', 'Coordonnées bancaires'],
  ]

  return (
    <section className="section">
      <div className="admin-head">
        <div>
          <span className="admin-panel__title">Espace administrateur</span>
          <h1>Back-office</h1>
        </div>
        <div className="admin-head__tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={`chip${tab === id ? ' chip--active' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
          <button className="admin-logout" onClick={() => void logout()}>
            Quitter
          </button>
        </div>
      </div>

      {tab === 'orders' && <OrdersTab onCount={setOrderCount} />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'bank' && <BankTab />}
    </section>
  )
}
