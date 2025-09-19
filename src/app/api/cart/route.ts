import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { findActiveCartForUser, findCartBySession, createNewCart } from './cart-helpers'
import config from '@/payload.config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: req.headers })
    const body = await req.json()
    const cartSessionId = req.cookies.get('dyad_cart_sid')?.value

    let cart

    if (user) {
      cart = await findActiveCartForUser(payload, user.id)
      if (cart && cart.id !== cartSessionId) {
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
