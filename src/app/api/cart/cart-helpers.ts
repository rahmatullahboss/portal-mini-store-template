import type { Payload } from 'payload'
import type { Cart, AbandonedCart } from '@/payload-types'

export async function findActiveCartForUser(userId: string, payload: Payload) {
  const carts = await payload.find({
    collection: 'abandoned-carts',
    where: {
      'user.id': {
        equals: userId,
      },
      status: {
        equals: 'active',
      },
    },
  })

  return carts.docs[0] as AbandonedCart | undefined
}

export async function findCartBySession(sessionId: string, payload: Payload) {
  const cart = await payload.findByID({
    collection: 'abandoned-carts',
    id: sessionId,
  })

  return cart as AbandonedCart
}

export async function createNewCart(payload: Payload, userId?: string) {
  const cart = await payload.create({
    collection: 'abandoned-carts',
    data: {
      items: [],
      status: 'active',
      user: userId,
    },
  })

  return cart as AbandonedCart
}