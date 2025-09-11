import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get user from the request (optional for guest checkout)
    const { user } = await payload.auth({ headers: request.headers })

    const body = await request.json()
    const { items, totalAmount, customerNumber, customerName, customerEmail } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 })
    }

    // Fetch full user doc if logged in (for fallbacks)
    let fullUser: any = null
    if (user) {
      try {
        fullUser = await payload.findByID({ collection: 'users', id: (user as any).id })
      } catch {}
    }

    // Compute customer number: prefer payload, else user profile
    const computedCustomerNumber =
      typeof customerNumber === 'string' && customerNumber.trim().length > 0
        ? customerNumber.trim()
        : (fullUser as any)?.customerNumber?.trim?.()

    if (!computedCustomerNumber) {
      return NextResponse.json({ error: 'Customer number is required' }, { status: 400 })
    }

    // Determine shipping address
    let shippingAddress = (body as any).shippingAddress
    if (!shippingAddress && fullUser) {
      shippingAddress = (fullUser as any)?.address
    }

    const requiredAddressFields = ['line1', 'city', 'postalCode', 'country']
    const hasAddress =
      shippingAddress &&
      requiredAddressFields.every((f) => typeof shippingAddress[f] === 'string' && shippingAddress[f].trim().length > 0)

    if (!hasAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required. Please provide shippingAddress fields.' },
        { status: 400 },
      )
    }

    // For guest checkout, require name and email
    const computedCustomerName = user
      ? `${(fullUser as any)?.firstName || (user as any).firstName || ''} ${
          (fullUser as any)?.lastName || (user as any).lastName || ''
        }`.trim()
      : customerName
    const computedCustomerEmail = user ? (fullUser as any)?.email || (user as any).email : customerEmail
    if (!computedCustomerName || !computedCustomerEmail) {
      return NextResponse.json({ error: 'Customer name and email are required' }, { status: 400 })
    }

    // Validate items exist and are available
    for (const line of items) {
      const itemDoc = await payload.findByID({
        collection: 'items',
        id: line.item,
      })

      if (!itemDoc || !itemDoc.available) {
        return NextResponse.json({ error: `Item ${line.item} is not available` }, { status: 400 })
      }
    }

    // Create the order
    const order = await payload.create({
      collection: 'orders',
      data: {
        ...(user ? { user: user.id } : {}),
        customerName: computedCustomerName,
        customerEmail: String(computedCustomerEmail).trim(),
        customerNumber: String(computedCustomerNumber).trim(),
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
      } as any,
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
