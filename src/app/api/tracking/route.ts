import { NextRequest, NextResponse } from 'next/server'

interface TrackingEvent {
  name: string
  params?: Record<string, unknown>
  clientId?: string
}

async function sendToGTM(event: TrackingEvent) {
  const measurementId = process.env.GTM_MEASUREMENT_ID
  const apiSecret = process.env.GTM_API_SECRET
  if (!measurementId || !apiSecret) return

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`
  const body = {
    client_id: event.clientId || 'anonymous',
    events: [
      {
        name: event.name,
        params: event.params || {},
      },
    ],
  }

  await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { events } = (await req.json()) as { events?: TrackingEvent[] }
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    await Promise.all(
      events.map(async (event) => {
        await Promise.all([
          sendToGTM(event),
          // Add other platform forwarders here
        ])
      }),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking route error:', error)
    return NextResponse.json({ error: 'Failed to process events' }, { status: 500 })
  }
}
