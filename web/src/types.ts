export interface SubCategory {
  id: string
  label: string
}

export interface Category {
  id: string
  code: string
  label: string
  subs: SubCategory[]
}

export interface Product {
  id: string
  ref: string
  name: string
  catId: string
  catLabel: string
  subId: string
  subLabel: string
  priceCents: number
  sizes: string[]
  badge: string | null
  description: string
  image: string
  pool: string[]
  source: 'seed' | 'admin'
}

export interface Country {
  code: string
  label: string
}

export interface DeliveryStage {
  id: string
  title: string
  desc: string
}

export interface Catalog {
  categories: Category[]
  products: Product[]
  countries: Country[]
  stages: DeliveryStage[]
  chfRate: number
}

export interface BankInfo {
  holder: string
  iban: string
  bic: string
  bankName: string
}

export interface CartLine {
  productId: string
  size: string
  qty: number
}

export interface CheckoutDraft {
  orderId: string
  ref: string
  bank: BankInfo
  subtotalCents: number
  shippingCents: number
  totalCents: number
  countryLabel: string
}

export type OrderStatus = 'pending' | 'valid' | 'rejected'

export interface TrackedOrder {
  ref: string
  status: OrderStatus
  stage: number
  reason: string
  itemCount: number
  totalCents: number
  createdAt: string
}

export interface OrderItem {
  productId: string
  ref: string
  name: string
  size: string
  qty: number
  priceCents: number
  image: string
}

export interface AdminOrder {
  id: string
  ref: string
  status: OrderStatus
  stage: number
  reason: string
  customer: {
    name: string
    email: string
    phone: string
    city: string
    addr: string
    country: string
  }
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  hasProof: boolean
  proofMime: string | null
  proofName: string | null
  proofUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminOrdersResponse {
  orders: AdminOrder[]
  stats: { pending: number; valid: number; rejected: number; revenueCents: number }
  reasons: string[]
}

export interface AdminProductsResponse {
  products: Product[]
  matchCount: number
  totalCount: number
  removedCount: number
}
