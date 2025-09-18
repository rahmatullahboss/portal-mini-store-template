import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { extractClientIdFromCookieHeader, sendGaEvent } from '@/lib/server/ga'
import { DEFAULT_DELIVERY_SETTINGS, normalizeDeliverySettings } from '@/lib/delivery-settings'
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || process.env.DEFAULT_CURRENCY || 'BDT'
const resolveDeliveryZone = (value?: unknown): 'inside_dhaka' | 'outside_dhaka' | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.toLowerCase().replace(/[\\s-]+/g, '_')
  if (normalized.includes('outside')) return 'outside_dhaka'
  if (normalized.includes('inside')) return 'inside_dhaka'
  if (normalized.includes('dhaka')) return 'inside_dhaka'
  return undefined
}

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

    const {
      items,
      customerNumber,
      customerName,
      customerEmail,
      deliveryZone: deliveryZoneInput,
      paymentMethod: paymentMethodInput,
      paymentSenderNumber: paymentSenderNumberInput,
      paymentTransactionId: paymentTransactionIdInput,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 })
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
    // Validate items exist and collect details for analytics
    const itemDetails: Array<{ id: number; name: string; price: number; quantity: number; category?: string }> = []
    for (const line of normalizedItems) {
      const itemDoc = await payload.findByID({
        collection: 'items',
        id: (line as any).item,
        depth: 1,
      })

      if (!itemDoc || !itemDoc.available) {
        return NextResponse.json({ error: `Item ${line.item} is not available` }, { status: 400 })
      }

      const price = typeof (itemDoc as any)?.price === 'number' ? (itemDoc as any).price : Number((itemDoc as any)?.price || 0)
      const category = (() => {
        const cat = (itemDoc as any)?.category
        if (!cat) return undefined
        if (typeof cat === 'object' && 'name' in cat) {
          return (cat as any).name as string
        }
        return undefined
      })()

      itemDetails.push({
        id: line.item,
        name: (itemDoc as any)?.name || `Item ${line.item}`,
        price: Number.isFinite(price) ? Number(price) : 0,
        quantity: line.quantity,
        category,
      })
    }


    const subtotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ error: 'Invalid subtotal calculated for order' }, { status: 400 })
    }

    const settingsResult = await payload
      .find({ collection: 'delivery-settings', limit: 1 })
      .catch(() => null)
    const deliverySettingsSource = (settingsResult as any)?.docs?.[0] || DEFAULT_DELIVERY_SETTINGS
    const {
      insideDhakaCharge,
      outsideDhakaCharge,
      freeDeliveryThreshold,
      digitalPaymentDeliveryCharge,
    } = normalizeDeliverySettings(deliverySettingsSource)
    const userDeliveryZone = resolveDeliveryZone((fullUser as any)?.deliveryZone)
    const requestDeliveryZone = resolveDeliveryZone(deliveryZoneInput)
    const inferredZoneFromAddress = (() => {
      const city = String((shippingAddress as any)?.city || '').toLowerCase()
      if (city.includes('dhaka')) return 'inside_dhaka' as const
      if (city.length > 0) return 'outside_dhaka' as const
      return undefined
    })()
    const deliveryZone = requestDeliveryZone || userDeliveryZone || inferredZoneFromAddress || 'inside_dhaka'

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
    const parsePaymentMethod = (value: unknown): 'cod' | 'bkash' | 'nagad' | undefined => {
      if (typeof value !== 'string') return undefined
      const normalized = value.toLowerCase().trim()
      if (['cod', 'cash_on_delivery', 'cash'].includes(normalized)) return 'cod'
      if (['bkash', 'b-kash', 'b kash'].includes(normalized)) return 'bkash'
      if (['nagad'].includes(normalized)) return 'nagad'
      return undefined
    }

    const paymentMethod = parsePaymentMethod(paymentMethodInput) || 'cod'
    const paymentSenderNumber = typeof paymentSenderNumberInput === 'string' ? paymentSenderNumberInput.trim() : ''
    const paymentTransactionId =
      typeof paymentTransactionIdInput === 'string' ? paymentTransactionIdInput.trim() : ''

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && (!paymentSenderNumber || !paymentTransactionId)) {
      return NextResponse.json(
        { error: 'Sender number and transaction ID are required for digital wallet payments.' },
        { status: 400 },
      )
    }

    const freeDeliveryApplied = subtotal >= freeDeliveryThreshold
    const isDigitalPayment = paymentMethod === 'bkash' || paymentMethod === 'nagad'
    const appliedShippingCharge = freeDeliveryApplied
      ? 0
      : isDigitalPayment
        ? digitalPaymentDeliveryCharge
        : deliveryZone === 'outside_dhaka'
          ? outsideDhakaCharge
          : insideDhakaCharge
    const shippingBase = Number.isFinite(appliedShippingCharge) ? appliedShippingCharge : 0
    const shippingChargeValue = Number(Math.max(0, shippingBase).toFixed(2))
    const subtotalValue = Number(subtotal.toFixed(2))
    const totalValue = Number((subtotalValue + shippingChargeValue).toFixed(2))

    const order = await payload.create({
      collection: 'orders',
      data: {
        ...(user ? { user: user.id } : {}),
        customerName: computedCustomerName,
        customerEmail: String(computedCustomerEmail).trim(),
        customerNumber: String(computedCustomerNumber).trim(),
        items: normalizedItems,
        subtotal: subtotalValue,
        shippingCharge: shippingChargeValue,
        deliveryZone,
        freeDeliveryApplied,
        totalAmount: totalValue,
        paymentMethod,
        paymentSenderNumber: paymentSenderNumber || undefined,
        paymentTransactionId: paymentTransactionId || undefined,
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

    // Forward purchase event to GA4 (best-effort)
    try {
      const clientId = extractClientIdFromCookieHeader(request.headers.get('cookie'))
      const purchaseValue = totalValue
      const shippingValue = shippingChargeValue
      const itemsForAnalytics = itemDetails.map((detail) => ({
        item_id: String(detail.id),
        item_name: detail.name,
        price: Number(Number(detail.price || 0).toFixed(2)),
        quantity: detail.quantity,
        item_category: detail.category,
      }))
      await sendGaEvent({
        name: 'purchase',
        clientId: clientId || undefined,
        userId: user ? String((user as any).id || (user as any)?.id) : undefined,
        params: {
          transaction_id: String((order as any)?.id || ''),
          currency: DEFAULT_CURRENCY,
          value: purchaseValue,
          shipping: shippingValue,
          free_delivery: freeDeliveryApplied ? 1 : 0,
          payment_method: paymentMethod,
          items: itemsForAnalytics,
        },
        timestampMicros: Date.now() * 1000,
      })
    } catch (analyticsError) {
      console.warn('Failed to send GA purchase event', analyticsError)
    }
    // Mark any associated abandoned cart as recovered
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


