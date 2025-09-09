import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get user from the request
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, totalAmount } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 })
    }

    // Determine shipping address: prefer explicit shippingAddress from body, otherwise use user's saved address
    let shippingAddress = (body as any).shippingAddress
    if (!shippingAddress) {
      const fullUser = await payload.findByID({ collection: 'users', id: (user as any).id })
      shippingAddress = (fullUser as any)?.address
    }

    const requiredAddressFields = ['line1', 'city', 'postalCode', 'country']
    const hasAddress =
      shippingAddress &&
      requiredAddressFields.every((f) => typeof shippingAddress[f] === 'string' && shippingAddress[f].trim().length > 0)

    if (!hasAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required. Please add your address to your profile or include shippingAddress.' },
        { status: 400 },
      )
    }

    // Validate items exist and are available
    for (const item of items) {
      const snack = await payload.findByID({
        collection: 'snacks',
        id: item.snack,
      })

      if (!snack || !snack.available) {
        return NextResponse.json({ error: `Snack ${item.snack} is not available` }, { status: 400 })
      }
    }

    // Create the order
    const order = await payload.create({
      collection: 'orders',
      data: {
        user: user.id,
        items,
        totalAmount,
        status: 'pending',
        orderDate: new Date().toISOString(),
        shippingAddress: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state || undefined,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      },
    })

    return NextResponse.json({ success: true, doc: order })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get user from the request
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's orders
    const orders = await payload.find({
      collection: 'orders',
      where: {
        user: {
          equals: user.id,
        },
      },
      depth: 2,
      sort: '-orderDate',
    })

    return NextResponse.json({ orders: orders.docs })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
