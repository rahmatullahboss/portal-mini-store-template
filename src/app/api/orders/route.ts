import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get user from the request (optional for guest checkout)
    const { user } = await payload.auth({ headers: request.headers })

    // Parse body defensively to avoid crashing on non-JSON payloads
    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    let body: any = {}
    try {
      if (contentType.includes('application/json')) {
        body = await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const fd = await request.formData()
        body = Object.fromEntries(Array.from(fd.entries()))
      } else if (contentType.includes('multipart/form-data')) {
        const fd = await request.formData()
        body = Object.fromEntries(Array.from(fd.entries()))
      } else {
        // Try to parse as JSON text, otherwise fallback to empty
        const txt = await request.text()
        try {
          body = JSON.parse(txt)
        } catch {
          // If looks like query string (e.g., depth=0&draft=false), ignore gracefully
          body = {}
        }
      }
    } catch {
      body = {}
    }

    const { items, totalAmount, customerNumber, customerName, customerEmail } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    const totalNum = typeof totalAmount === 'string' ? Number(totalAmount) : Number(totalAmount || 0)
    if (!totalNum || totalNum <= 0) {
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

    // Normalize item IDs to numeric (Payload default id type)
    const normalizedItems = (items as any[])
      .map((line) => {
        let idNum: number | undefined
        const raw = (line as any)?.item
        if (typeof raw === 'number' && Number.isFinite(raw)) idNum = raw
        else {
          const s = String(raw)
          if (/^\d+$/.test(s)) idNum = Number(s)
        }
        const qty = Number((line as any)?.quantity ?? 1)
        return idNum ? { item: idNum, quantity: qty > 0 ? qty : 1 } : null
      })
      .filter((r): r is { item: number; quantity: number } => !!r)

    if (!normalizedItems.length) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
    }

    // Validate items exist and are available
    for (const line of normalizedItems) {
      const itemDoc = await payload.findByID({
        collection: 'items',
        id: (line as any).item,
      })

      if (!itemDoc || !itemDoc.available) {
        return NextResponse.json({ error: `Item ${line.item} is not available` }, { status: 400 })
      }
    }

    // Detect device
    const ua = request.headers.get('user-agent') || ''
    const uaLower = ua.toLowerCase()
    const deviceType = uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')
      ? 'mobile'
      : uaLower.includes('ipad') || uaLower.includes('tablet')
        ? 'tablet'
        : uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('linux')
          ? 'desktop'
          : 'other'

    // Create the order
    const order = await payload.create({
      collection: 'orders',
      data: {
        ...(user ? { user: user.id } : {}),
        customerName: computedCustomerName,
        customerEmail: String(computedCustomerEmail).trim(),
        customerNumber: String(computedCustomerNumber).trim(),
        items: normalizedItems,
        totalAmount: totalNum,
        status: 'pending',
        orderDate: new Date().toISOString(),
        userAgent: ua || undefined,
        deviceType,
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

    // Mark any associated abandoned cart as recovered, then delete it
    try {
      const sid = request.cookies.get('dyad_cart_sid')?.value
      if (sid) {
        const carts = await payload.find({
          collection: 'abandoned-carts',
          limit: 1,
          where: {
            and: [
              { sessionId: { equals: String(sid) } },
              { status: { not_equals: 'recovered' } },
            ],
          },
        })
        if (carts?.docs?.[0]) {
          const cartId = (carts.docs[0] as any).id
          await payload.update({
            collection: 'abandoned-carts',
            id: cartId,
            data: {
              status: 'recovered',
              recoveredOrder: (order as any).id,
            } as any,
          })
          // After marking recovered, remove the record to keep abandoned list clean
          try {
            await payload.delete({ collection: 'abandoned-carts', id: cartId, overrideAccess: true } as any)
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Failed to mark cart as recovered:', e)
    }

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
