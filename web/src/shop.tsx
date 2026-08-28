import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import type { LegalDocId } from './legal/content'
import type { Catalog, CartLine, Product } from './types'

const CART_KEY = 'nw_cart_v1'
const COUNTRY_KEY = 'nw_country_v1'

export type View =
  | { name: 'home' }
  | { name: 'cat'; catId: string | null; subId: string | null }
  | { name: 'product'; id: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'done'; ref: string }
  | { name: 'track'; ref?: string }
  | { name: 'admin' }
  | { name: 'legal'; doc: LegalDocId }

/**
 * Emails link back as `/?suivi=NW-2026-1041`. The app is a single view with no
 * router, so the parameter is read once at boot and then cleared from the URL.
 */
function initialView(): View {
  if (typeof window === 'undefined') return { name: 'home' }
  const ref = new URLSearchParams(window.location.search).get('suivi')
  if (!ref) return { name: 'home' }
  window.history.replaceState(null, '', window.location.pathname)
  return { name: 'track', ref }
}

interface CartEntry extends CartLine {
  product: Product
}

interface Totals {
  entries: CartEntry[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  count: number
}

interface ShopValue {
  catalog: Catalog | null
  error: string | null
  products: Product[]
  productById: Map<string, Product>
  reloadCatalog: () => void

  view: View
  navigate: (view: View) => void
  query: string
  setQuery: (q: string) => void

  cart: CartLine[]
  addToCart: (productId: string, size: string) => void
  setQty: (index: number, qty: number) => void
  removeLine: (index: number) => void
  clearCart: () => void
  totals: Totals

  country: string
  setCountry: (code: string) => void
  chfRate: number
}

const ShopContext = createContext<ShopValue | null>(null)

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.productId === 'string' && typeof l?.size === 'string' && Number.isInteger(l?.qty) && l.qty > 0,
    )
  } catch {
    return []
  }
}

/** Shipping mirrors the server's rules so the cart can price itself instantly. */
function shippingCents(subtotalCents: number, country: string): number {
  if (subtotalCents === 0) return 0
  if (country === 'FR') return subtotalCents >= 6000 ? 0 : 490
  if (country === 'BE') return subtotalCents >= 8000 ? 0 : 690
  return 990
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>(initialView)
  const [query, setQueryState] = useState('')
  const [cart, setCart] = useState<CartLine[]>(readCart)
  const [country, setCountryState] = useState(() => localStorage.getItem(COUNTRY_KEY) ?? 'FR')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    api
      .catalog()
      .then((data) => {
        if (!cancelled) {
          setCatalog(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Catalogue indisponible')
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(COUNTRY_KEY, country)
  }, [country])

  const products = useMemo(() => catalog?.products ?? [], [catalog])
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const navigate = useCallback((next: View) => {
    setView(next)
    window.scrollTo(0, 0)
  }, [])

  /**
   * Typing in the header search jumps straight to the results grid; clearing it
   * returns to the current category, or home when there is none.
   */
  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value)
      setView((current) => {
        if (value) {
          const catId = current.name === 'cat' ? current.catId : null
          return { name: 'cat', catId, subId: null }
        }
        if (current.name === 'cat') return current.catId ? { ...current, subId: null } : { name: 'home' }
        return current
      })
    },
    [],
  )

  const addToCart = useCallback((productId: string, size: string) => {
    setCart((current) => {
      const index = current.findIndex((l) => l.productId === productId && l.size === size)
      if (index >= 0) {
        const next = current.slice()
        next[index] = { ...next[index], qty: next[index].qty + 1 }
        return next
      }
      return [...current, { productId, size, qty: 1 }]
    })
  }, [])

  const setQty = useCallback((index: number, qty: number) => {
    setCart((current) => {
      if (qty < 1) return current.filter((_, i) => i !== index)
      return current.map((line, i) => (i === index ? { ...line, qty: Math.min(qty, 20) } : line))
    })
  }, [])

  const removeLine = useCallback((index: number) => {
    setCart((current) => current.filter((_, i) => i !== index))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const totals = useMemo<Totals>(() => {
    const entries: CartEntry[] = []
    for (const line of cart) {
      const product = productById.get(line.productId)
      if (product) entries.push({ ...line, product })
    }
    const subtotalCents = entries.reduce((sum, e) => sum + e.product.priceCents * e.qty, 0)
    const ship = shippingCents(subtotalCents, country)
    return {
      entries,
      subtotalCents,
      shippingCents: ship,
      totalCents: subtotalCents + ship,
      count: cart.reduce((sum, l) => sum + l.qty, 0),
    }
  }, [cart, productById, country])

  const value: ShopValue = {
    catalog,
    error,
    products,
    productById,
    reloadCatalog: () => setReloadToken((n) => n + 1),
    view,
    navigate,
    query,
    setQuery,
    cart,
    addToCart,
    setQty,
    removeLine,
    clearCart,
    totals,
    country,
    setCountry: setCountryState,
    chfRate: catalog?.chfRate ?? 0.94,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopValue {
  const value = useContext(ShopContext)
  if (!value) throw new Error('useShop must be used inside a ShopProvider')
  return value
}
