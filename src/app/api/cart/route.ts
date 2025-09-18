import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'

type CartLine = {
  item: number
  quantity: number
}

type ItemRecord = Record<string, unknown>
type SerializedCartItem = {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toCartLine = (value: unknown): CartLine | null => {
  if (!isRecord(value)) return null
  const itemId = value.item
  if (typeof itemId !== 'number') return null
  const quantityRaw = Number(value.quantity)
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1
  return { item: itemId, quantity }
}

const toItemId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim())
  }
  return null
}

const pickCategoryName = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (isRecord(value) && typeof value.name === 'string') return value.name
  return ''
}

const pickImage = (itemDoc: ItemRecord): SerializedCartItem['image'] => {
  const imageValue = itemDoc.image
  if (isRecord(imageValue) && typeof imageValue.url === 'string') {
    return {
      url: imageValue.url,
      alt: typeof imageValue.alt === 'string' ? imageValue.alt : undefined,
    }
  }
  if (typeof itemDoc.imageUrl === 'string') {
    return { url: itemDoc.imageUrl }
  }
  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRecord = user as Record<string, unknown>
    const userIdRaw = userRecord?.id
    const userId = typeof userIdRaw === 'number' ? userIdRaw : toItemId(userIdRaw)
    if (typeof userId !== 'number') {
      return NextResponse.json({ items: [], total: 0 })
    }

    const cartQuery = await payload.find({
      collection: 'abandoned-carts',
      overrideAccess: true,
      limit: 1,
      depth: 0,
      sort: '-updatedAt',
      where: {
        and: [
          { user: { equals: userId } },
          { status: { not_equals: 'recovered' } },
        ],
      },
    })

    const cartDoc = cartQuery?.docs?.[0]

    if (!isRecord(cartDoc)) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const cartRecord = cartDoc as Record<string, unknown>

    const cartUserRaw = cartRecord.user
    const cartUserId = typeof cartUserRaw === 'number' ? cartUserRaw : toItemId(cartUserRaw)
    if (cartUserId !== userId) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const lines: CartLine[] = Array.isArray(cartRecord.items)
      ? cartRecord.items
          .map((line) => toCartLine(line))
          .filter((line): line is CartLine => line !== null)
      : []
    const itemIds = lines.map((line) => line.item)

    const itemsMap = new Map<number, ItemRecord>()
    if (itemIds.length > 0) {
      const uniqueIds = Array.from(new Set(itemIds))
      const itemsResult = await payload.find({
        collection: 'items',
        where: {
          id: { in: uniqueIds },
        },
        depth: 2,
        limit: uniqueIds.length,
      })

      for (const item of itemsResult.docs) {
        if (!isRecord(item)) continue
        const numericId = toItemId(item.id)
        if (numericId !== null) {
          itemsMap.set(numericId, item)
        }
      }
    }

    const merged = new Map<string, SerializedCartItem>()
    for (const line of lines) {
      const itemDoc = itemsMap.get(line.item)
      if (!itemDoc) continue

      const idRaw = itemDoc.id
      const id = typeof idRaw === 'string' ? idRaw : String(idRaw)
      const quantity = line.quantity
      const priceRaw = Number(itemDoc.price)
      const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0

      const category = pickCategoryName(itemDoc.category)
      const image = pickImage(itemDoc)

      const existing = merged.get(id)
      if (existing) {
        merged.set(id, {
          ...existing,
          quantity: existing.quantity + quantity,
        })
      } else {
        merged.set(id, {
          id,
          name: typeof itemDoc.name === 'string' ? itemDoc.name : String(itemDoc.name ?? ''),
          price,
          quantity,
          category,
          image,
        })
      }
    }

    const items = Array.from(merged.values())

    const totalRaw = typeof cartRecord.cartTotal === 'number' ? cartRecord.cartTotal : undefined
    const total =
      typeof totalRaw === 'number'
        ? totalRaw
        : items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return NextResponse.json({
      items,
      total,
      sourceUpdatedAt: typeof cartRecord.updatedAt === 'string' ? cartRecord.updatedAt : null,
      sessionId: typeof cartRecord.sessionId === 'string' ? cartRecord.sessionId : null,
    })
  } catch (error) {
    console.error('Failed to load persisted cart:', error)
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 })
  }
}

