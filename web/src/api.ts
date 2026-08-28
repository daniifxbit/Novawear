import type {
  AdminOrder,
  AdminOrdersResponse,
  AdminProductsResponse,
  BankInfo,
  Catalog,
  CartLine,
  CheckoutDraft,
  TrackedOrder,
} from './types'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: 'same-origin', ...init })

  if (!res.ok) {
    let message = 'Une erreur est survenue'
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status)
  }

  return (await res.json()) as T
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  catalog: () => request<Catalog>('/catalog'),

  checkout: (payload: {
    customer: { name: string; email: string; phone: string; city: string; addr: string }
    country: string
    items: CartLine[]
  }) => request<CheckoutDraft>('/checkout', json(payload)),

  confirmPayment: (orderId: string, proof: File) => {
    const form = new FormData()
    form.append('proof', proof)
    return request<{ ref: string }>(`/checkout/${orderId}/confirm`, { method: 'POST', body: form })
  },

  track: (ref: string) => request<TrackedOrder>(`/track?ref=${encodeURIComponent(ref)}`),

  admin: {
    session: () => request<{ authenticated: boolean; demoCode: boolean }>('/admin/session'),
    login: (code: string) => request<{ authenticated: boolean; demoCode: boolean }>('/admin/login', json({ code })),
    logout: () => request<{ authenticated: boolean }>('/admin/logout', { method: 'POST' }),

    orders: () => request<AdminOrdersResponse>('/admin/orders'),
    validate: (id: string) => request<AdminOrder>(`/admin/orders/${id}/validate`, { method: 'POST' }),
    reject: (id: string, reason: string) => request<AdminOrder>(`/admin/orders/${id}/reject`, json({ reason })),
    reopen: (id: string) => request<AdminOrder>(`/admin/orders/${id}/reopen`, { method: 'POST' }),
    setStage: (id: string, stage: number) => request<AdminOrder>(`/admin/orders/${id}/stage`, json({ stage })),

    bank: () => request<{ bank: BankInfo; defaults: BankInfo }>('/admin/bank'),
    saveBank: (bank: BankInfo) =>
      request<{ bank: BankInfo }>('/admin/bank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bank),
      }),

    products: (q: string) => request<AdminProductsResponse>(`/admin/products?q=${encodeURIComponent(q)}`),
    addProduct: (fields: Record<string, string>, photo: File | null) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(fields)) form.append(key, value)
      if (photo) form.append('photo', photo)
      return request<{ product: unknown }>('/admin/products', { method: 'POST', body: form })
    },
    deleteProduct: (id: string) => request<{ ok: true }>(`/admin/products/${id}`, { method: 'DELETE' }),
    restoreProducts: () => request<{ restored: number }>('/admin/products/restore', { method: 'POST' }),
  },
}
