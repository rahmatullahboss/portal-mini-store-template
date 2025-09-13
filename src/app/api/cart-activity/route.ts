import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

type IncomingItem = { id: string | number; quantity: number }

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    const body = await request.json().catch(() => ({}))
    const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : []
    const total = typeof body?.total === 'number' ? Number(body.total) : undefined
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail : undefined
    const customerName = typeof body?.customerName === 'string' ? body.customerName : undefined
    const customerNumber = typeof body?.customerNumber === 'string' ? body.customerNumber : undefined

    // Require at least one meaningful field
    if (!items.length && typeof total !== 'number') {
      return NextResponse.json({ error: 'No cart data' }, { status: 400 })
    }

    // Get or create a lightweight session id cookie
    let sid = request.cookies.get('dyad_cart_sid')?.value
    const isNewSID = !sid
    if (!sid) {
      try {
        sid = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
      } catch {
        sid = Math.random().toString(36).slice(2)
      }
    }

    // Upsert by sessionId (ignore recovered carts)
    const existing = await payload.find({
      collection: 'abandoned-carts',
      limit: 1,
      where: {
        and: [
          { sessionId: { equals: String(sid) } },
          { status: { not_equals: 'recovered' } },
        ],
      },
    })

    const now = new Date().toISOString()
    // Sanitize cart items: ensure numeric relationship IDs for Payload (default ID type: number)
    const sanitizedItems = items
      .filter((it) => (typeof it?.id === 'string' || typeof it?.id === 'number') && Number(it.quantity) > 0)
      .map((it) => {
        let idNum: number | undefined
        if (typeof it.id === 'number' && Number.isFinite(it.id)) {
          idNum = it.id
        } else {
          const s = String(it.id).trim()
          if (/^\d+$/.test(s)) idNum = Number(s)
        }
        return idNum ? { item: idNum, quantity: Number(it.quantity) } : null
      })
      .filter((row): row is { item: number; quantity: number } => !!row)

    const data: any = {
      sessionId: String(sid),
      ...(user ? { user: (user as any).id } : {}),
      ...(typeof customerEmail === 'string' ? { customerEmail } : {}),
      ...(typeof customerName === 'string' ? { customerName } : {}),
      ...(typeof customerNumber === 'string' ? { customerNumber } : {}),
      ...(sanitizedItems.length ? { items: sanitizedItems } : {}),
      ...(typeof total === 'number' ? { cartTotal: total } : {}),
      status: 'active',
      lastActivityAt: now,
    }

    let doc
    if (existing?.docs?.[0]) {
      doc = await payload.update({
        collection: 'abandoned-carts',
        id: (existing.docs[0] as any).id,
        data,
      })
    } else {
      doc = await payload.create({ collection: 'abandoned-carts', data })
    }

    const res = NextResponse.json({ success: true, id: (doc as any)?.id })
    if (isNewSID && sid) {
      res.cookies.set('dyad_cart_sid', String(sid), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }
    return res
  } catch (e) {
    console.error('Cart activity error:', e)
    return NextResponse.json({ error: 'Failed to record cart activity' }, { status: 500 })
  }
}
