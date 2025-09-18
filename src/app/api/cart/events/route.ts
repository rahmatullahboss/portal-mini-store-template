import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { buildCartChannels, registerCartSubscriber } from '@/lib/cart-realtime'
import { resolveSessionIdFromRequest, resolveUserId } from '../cart-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const encoder = new TextEncoder()

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    let userId: string | number | null = null

    try {
      const { user } = await payload.auth({ headers: request.headers })
      userId = resolveUserId(user)
    } catch {
      userId = null
    }

    const sessionId = resolveSessionIdFromRequest(request)
    const channelKeys = buildCartChannels({ userId, sessionId })

    if (channelKeys.length === 0) {
      return NextResponse.json({ error: 'Missing cart channel identifier' }, { status: 400 })
    }

    let dispose: (() => void) | null = null

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        dispose = registerCartSubscriber(channelKeys, controller, { signal: request.signal })
        controller.enqueue(encoder.encode('event: cart_ready\ndata: {}\n\n'))
      },
      cancel() {
        dispose?.()
      },
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Failed to open cart events stream:', error)
    return NextResponse.json({ error: 'Failed to open cart events' }, { status: 500 })
  }
}
