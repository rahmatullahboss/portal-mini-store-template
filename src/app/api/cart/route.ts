import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import {
  findActiveCartForUser,
  findCartBySession,
  createNewCart,
  extractCartQuantities,
  resolveCartPayload,
  getSessionIdFromDoc,
  generateSessionId,
} from './cart-helpers'
import config from '@/payload.config'

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

    const userId = user?.id
    const sessionCandidate = request.cookies.get('dyad_cart_sid')?.value

    let cartDoc: Record<string, unknown> | null = null

    if (userId) {
      cartDoc = await findActiveCartForUser(payload, userId)
    }

    if (!cartDoc && sessionCandidate) {
      cartDoc = await findCartBySession(payload, sessionCandidate)
    }

    const quantityMap = extractCartQuantities(cartDoc)
    const {
      serialized,
      total: computedTotal,
      snapshot,
    } = await resolveCartPayload(payload, quantityMap)

    const totalRaw = typeof cartDoc?.['cartTotal'] === 'number' ? cartDoc['cartTotal'] : undefined
    const total = typeof totalRaw === 'number' ? totalRaw : computedTotal

    const resolvedSessionId =
      getSessionIdFromDoc(cartDoc) ??
      sessionCandidate ??
      (serialized.length > 0 ? generateSessionId() : null)

    const response = NextResponse.json({
      items: serialized,
      total,
      sourceUpdatedAt: typeof cartDoc?.['updatedAt'] === 'string' ? cartDoc['updatedAt'] : null,
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

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: req.headers })
    const body = await req.json()
    const cartSessionId = req.cookies.get('dyad_cart_sid')?.value

    let cart

    if (user) {
      cart = await findActiveCartForUser(payload, user.id)
      if (cart && cartSessionId && cartSessionId !== getSessionIdFromDoc(cart)) {
        // a logged-in user should only have one active cart
        // if for some reason we have a mismatch between the session cart and the user's active cart,
        // we should probably merge them
      }
    } else if (cartSessionId) {
      cart = await findCartBySession(payload, cartSessionId)
    }

    if (!cart) {
      cart = await createNewCart(payload, user?.id)
    }

    const { items: cartItems, customerName, customerEmail, customerNumber } = body

    // update the cart with the new data from the client
    const updatedCart = await payload.update({
      collection: 'abandoned-carts',
      id: (cart as any).id,
      data: {
        items: cartItems,
        customerName,
        customerEmail,
        customerNumber,
        user: user?.id ? (user.id as any) : null,
      },
    })

    // Set the cart session ID cookie
    const response = NextResponse.json(updatedCart)
    if (!cartSessionId || cartSessionId !== (updatedCart as any).id) {
      response.cookies.set('dyad_cart_sid', (updatedCart as any).id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Failed to persist cart:', error)
    return NextResponse.json({ error: 'Failed to persist cart' }, { status: 500 })
  }
}
