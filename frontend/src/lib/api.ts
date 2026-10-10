export type ApiOrderItem = {
  name: string
  qty: number
  price: number
  prep_minutes: number
}

export type ApiOrder = {
  id: number
  source: string
  external_id: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  items: { name: string; qty: number; price: number; prep_minutes?: number }[]
  total: number
  placed_at: string
  promised_by: string
}

export type SyncOrderResponse = {
  created: boolean
  order: ApiOrder
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError('Could not connect to BR CAFÉ ordering. Check your connection and try again.')
  }

  if (!response.ok) {
    let detail = `Ordering request failed (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // Keep the HTTP status message if the server response is not JSON.
    }
    throw new ApiError(detail, response.status)
  }

  return (await response.json()) as T
}

export async function submitCustomerOrder(input: {
  externalId: string
  items: ApiOrderItem[]
}) {
  return request<SyncOrderResponse>('/orders/sync', {
    method: 'POST',
    body: JSON.stringify({
      source: 'website',
      external_id: input.externalId,
      items: input.items,
    }),
  })
}

export async function getManagerOrders() {
  return request<ApiOrder[]>('/orders?limit=100')
}

export const backendIntegration = {
  baseUrl: API_BASE_URL,
  available: ['POST /orders/sync', 'GET /orders', 'GET /orders/{id}', 'PATCH /orders/{id}/status'],
  pending: [
    'GET /menu',
    'GET /inventory',
    'POST /inventory/restock-requests',
    'POST /inventory/adjustments',
    'GET /orders/{id}/customer-tracking (authorized)',
    'WebSocket or polling event stream',
  ],
} as const
