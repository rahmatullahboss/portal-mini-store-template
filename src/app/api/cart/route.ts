import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import {
  buildQuantityMapFromIncoming,
  extractCartQuantities,
  findActiveCartForUser,
  generateSessionId,
  getDocId,
  getSessionIdFromDoc,
  isRecord,
  normalizeIncomingItems,
  resolveCartPayload,
  resolveUserId,
} from './cart-helpers'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = resolveUserId(user)
    if (typeof userId !== 'number') {
      return NextResponse.json({ items: [], total: 0 })
    }

    const cartDoc = await findActiveCartForUser(payload, userId)

    if (!cartDoc) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const quantityMap = extractCartQuantities(cartDoc)
    const { serialized, total: computedTotal } = await resolveCartPayload(payload, quantityMap)

    const totalRaw = isRecord(cartDoc) && typeof cartDoc.cartTotal === 'number' ? cartDoc.cartTotal : undefined
    const total = typeof totalRaw === 'number' ? totalRaw : computedTotal

    return NextResponse.json({
      items: serialized,
      total,
      sourceUpdatedAt: isRecord(cartDoc) && typeof cartDoc.updatedAt === 'string' ? cartDoc.updatedAt : null,
      sessionId: getSessionIdFromDoc(cartDoc),
    })
  } catch (error) {
    console.error('Failed to load persisted cart:', error)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = resolveUserId(user)
    if (typeof userId !== 'number') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const itemsInput = isRecord(body) ? body.items : null
    const incomingItems = normalizeIncomingItems(itemsInput)
    const quantityMap = buildQuantityMapFromIncoming(incomingItems)

    const cartDoc = await findActiveCartForUser(payload, userId)
    const resolved = await resolveCartPayload(payload, quantityMap)

    const existingSession = getSessionIdFromDoc(cartDoc)
    const cookieSession = request.cookies.get('dyad_cart_sid')?.value
    const sessionId = existingSession ?? cookieSession ?? generateSessionId()

    const data: Record<string, unknown> = {
      sessionId,
      user: userId,
      items: resolved.lines,
      cartTotal: resolved.total,
      status: 'active',
      lastActivityAt: new Date().toISOString(),
    }

    const cartId = getDocId(cartDoc)

    if (cartId !== null) {
      await payload.update({
        collection: 'abandoned-carts',
        id: cartId as any,
        data,
      })
    } else {
      await payload.create({ collection: 'abandoned-carts', data })
    }

    const response = NextResponse.json({
      success: true,
      items: resolved.serialized,
      total: resolved.total,
      snapshot: resolved.snapshot,
    })

    if (sessionId) {
      response.cookies.set('dyad_cart_sid', String(sessionId), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    console.error('Failed to persist cart:', error)
    return NextResponse.json({ error: 'Failed to persist cart' }, { status: 500 })
  }
}
