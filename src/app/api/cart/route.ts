import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import {
  findActiveCartForUser,
  findCartBySession,
  createNewCart,
} from './cart-helpers'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const payload = await getPayload()
  const { user } = await payload.auth({ req })
  const body = await req.json()
  const cookieStore = cookies()
  const cartSessionId = cookieStore.get('cart_session_id')?.value

  let cart

  if (user) {
    cart = await findActiveCartForUser(user.id, payload)
    if (cart && cart.id !== cartSessionId) {
      // a logged-in user should only have one active cart
      // if for some reason we have a mismatch between the session cart and the user's active cart,
      // we should probably merge them
    }
  } else if (cartSessionId) {
    cart = await findCartBySession(cartSessionId, payload)
  }

  if (!cart) {
    cart = await createNewCart(payload, user?.id)
  }

  const {
    items: cartItems,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
  } = body

  // update the cart with the new data from the client
  cart = await payload.update({
    collection: 'carts',
    id: cart.id,
    data: {
      items: cartItems,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      user: user?.id,
    },
  })

  // Set the cart session ID cookie
  if (!cartSessionId || cartSessionId !== cart.id) {
    cookieStore.set('cart_session_id', cart.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }

  return NextResponse.json(cart)
}