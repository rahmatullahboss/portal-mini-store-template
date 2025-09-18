import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import type { AbandonedCart } from '@/payload-types'

import config from '@/payload.config'
import {
  buildQuantityMapFromIncoming,
  extractCartQuantities,
  findActiveCartForUser,
  findCartBySession,
  generateSessionId,
  getDocId,
  getSessionIdFromDoc,
  isRecord,
  normalizeIncomingItems,
  resolveCartPayload,
  resolveUserId,
} from './cart-helpers'

const resolveSessionIdFromRequest = (request: NextRequest): string | null => {
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

const applySessionCookie = (response: NextResponse, sessionId: string | null) => {
  if (!sessionId) return

  response.cookies.set('dyad_cart_sid', String(sessionId), {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    const userId = resolveUserId(user)
    const sessionCandidate = resolveSessionIdFromRequest(request)

    let cartDoc: Record<string, unknown> | null = null

    if (typeof userId === 'number') {
      cartDoc = await findActiveCartForUser(payload, userId)
    }

    if (!cartDoc && sessionCandidate) {
      cartDoc = await findCartBySession(payload, sessionCandidate)
    }

    const quantityMap = extractCartQuantities(cartDoc)
    const { serialized, total: computedTotal, snapshot } = await resolveCartPayload(payload, quantityMap)

    const totalRaw = isRecord(cartDoc) && typeof cartDoc?.cartTotal === 'number' ? cartDoc.cartTotal : undefined
    const total = typeof totalRaw === 'number' ? totalRaw : computedTotal

    const resolvedSessionId =
      getSessionIdFromDoc(cartDoc) ?? sessionCandidate ?? (serialized.length > 0 ? generateSessionId() : null)

    const response = NextResponse.json({
      items: serialized,
      total,
      sourceUpdatedAt: isRecord(cartDoc) && typeof cartDoc?.updatedAt === 'string' ? cartDoc.updatedAt : null,
      sessionId: resolvedSessionId,
      snapshot,
    })

    applySessionCookie(response, resolvedSessionId)

    return response
  } catch (error) {
    console.error('Failed to load persisted cart:', error)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    const userId = resolveUserId(user)
    const body = await request.json().catch(() => null)
    const itemsInput = isRecord(body) ? body.items : null
    const payloadSessionId =
      isRecord(body) && typeof body.sessionId === 'string' && body.sessionId.trim().length > 0
        ? body.sessionId.trim()
        : undefined
    const requestSessionId = resolveSessionIdFromRequest(request)
    const incomingItems = normalizeIncomingItems(itemsInput)
    const quantityMap = buildQuantityMapFromIncoming(incomingItems)

    let cartDoc: Record<string, unknown> | null = null
    if (typeof userId === 'number') {
      cartDoc = await findActiveCartForUser(payload, userId)
    }

    const sessionCandidate = payloadSessionId ?? requestSessionId ?? null

    if (!cartDoc && sessionCandidate) {
      cartDoc = await findCartBySession(payload, sessionCandidate)
    }

    const resolved = await resolveCartPayload(payload, quantityMap)

    const existingSession = getSessionIdFromDoc(cartDoc)
    const sessionId = existingSession ?? sessionCandidate ?? generateSessionId()

    const nowIso = new Date().toISOString()

    const data: Omit<AbandonedCart, 'id' | 'createdAt' | 'updatedAt'> = {
      sessionId,
      user: typeof userId === 'number' ? userId : null,
      items: resolved.lines,
      cartTotal: resolved.total,
      status: 'active',
      lastActivityAt: nowIso,
      customerName: null,
      customerEmail: null,
      customerNumber: null,
      recoveredOrder: null,
      recoveryEmailSentAt: null,
      notes: null,
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
      sessionId,
    })

    applySessionCookie(response, sessionId)

    return response
  } catch (error) {
    console.error('Failed to persist cart:', error)
    return NextResponse.json({ error: 'Failed to persist cart' }, { status: 500 })
  }
}
