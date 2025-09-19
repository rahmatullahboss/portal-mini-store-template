import type { NextRequest } from 'next/server'
import type { Payload } from 'payload'

export const resolveSessionIdFromRequest = (request: NextRequest): string | null => {
  const urlSession = request.nextUrl.searchParams.get('sessionId')
  if (typeof urlSession === 'string' && urlSession.trim().length > 0) {
    return urlSession.trim()
  }

  const headerSession = request.headers.get('x-dyad-cart-session')
  if (typeof headerSession === 'string' && headerSession.trim().length > 0) {
    return headerSession.trim()
  }

  const cookieSession = request.cookies.get('dyad_cart_sid')?.value
  if (typeof cookieSession === 'string' && cookieSession.trim().length > 0) {
    return cookieSession.trim()
  }

  return null
}

export type CartLine = { item: number; quantity: number }
export type IncomingCartItem = { id: string | number; quantity: number }
export type SerializedCartItem = {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  image?: {
    url: string
    alt?: string
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const coerceNumericId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed)
    }
  }
  return null
}

export const toItemId = (value: unknown): number | null => {
  const direct = coerceNumericId(value)
  if (direct !== null) return direct

  if (isRecord(value)) {
    const candidateKeys = ['id', 'value', '_id'] as const
    for (const key of candidateKeys) {
      if (!(key in value)) continue
      const candidate = (value as Record<string, unknown>)[key]
      const numeric = coerceNumericId(candidate)
      if (numeric !== null) {
        return numeric
      }
      if (isRecord(candidate)) {
        const nested = toItemId(candidate)
        if (nested !== null) {
          return nested
        }
      }
    }
  }

  return null
}

export const resolveUserId = (user: unknown): number | string | null => {
  if (!isRecord(user)) return null
  const idRaw = user.id
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) return idRaw
  if (typeof idRaw === 'string') {
    const trimmed = idRaw.trim()
    if (trimmed.length === 0) return null
    const numeric = toItemId(trimmed)
    return numeric ?? trimmed
  }
  const numeric = toItemId(idRaw)
  return numeric
}

export const findActiveCartForUser = async (
  payload: Payload,
  userId: number | string,
): Promise<Record<string, unknown> | null> => {
  const query = await payload.find({
    collection: 'abandoned-carts',
    overrideAccess: true,
    limit: 1,
    depth: 0,
    sort: '-updatedAt',
    where: {
      and: [{ user: { equals: userId } }, { status: { not_equals: 'recovered' } }],
    },
  })

  const doc = query?.docs?.[0]
  return isRecord(doc) ? doc : null
}

export const findCartBySession = async (
  payload: Payload,
  sessionId: string,
): Promise<Record<string, unknown> | null> => {
  const query = await payload.find({
    collection: 'abandoned-carts',
    overrideAccess: true,
    limit: 1,
    depth: 0,
    sort: '-updatedAt',
    where: {
      and: [{ sessionId: { equals: sessionId } }, { status: { not_equals: 'recovered' } }],
    },
  })

  const doc = query?.docs?.[0]
  return isRecord(doc) ? doc : null
}

export async function createNewCart(payload: Payload, userId?: number | string) {
  const cart = await payload.create({
    collection: 'abandoned-carts',
    data: {
      items: [],
      status: 'active',
      sessionId: Math.random().toString(36).slice(2), // Generate a simple session ID
      lastActivityAt: new Date().toISOString(),
      user: userId ? (userId as any) : null,
    },
  })

  return cart
}
