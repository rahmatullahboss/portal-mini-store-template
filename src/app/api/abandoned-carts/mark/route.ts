import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const ttlMinutes = Number(url.searchParams.get('ttlMinutes') || 60)
    const cutoff = new Date(Date.now() - Math.max(5, ttlMinutes) * 60 * 1000).toISOString()

    const res = await payload.find({
      collection: 'abandoned-carts',
      limit: 500,
      where: {
        and: [
          { status: { not_equals: 'recovered' } },
          { lastActivityAt: { less_than: cutoff } },
        ],
      },
    })

    let updated = 0
    for (const doc of res.docs || []) {
      try {
        await payload.update({
          collection: 'abandoned-carts',
          id: (doc as any).id,
          data: { status: 'abandoned' },
        })
        updated++
      } catch {}
    }

    return NextResponse.json({ success: true, updated, cutoff })
  } catch (e) {
    console.error('Mark abandoned error:', e)
    return NextResponse.json({ error: 'Failed to mark carts' }, { status: 500 })
  }
}

// GET handler for Vercel Cron or secret-triggered runs
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: await config })

    // Allow if either (a) called by Vercel Cron (x-vercel-cron header) OR (b) secret matches
    const isVercelCron = !!request.headers.get('x-vercel-cron')
    const url = new URL(request.url)
    const providedSecret = url.searchParams.get('secret') || request.headers.get('x-cron-secret')
    const secretOK = !!process.env.CRON_SECRET && providedSecret === process.env.CRON_SECRET
    if (!isVercelCron && !secretOK) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ttlMinutes = Number(url.searchParams.get('ttlMinutes') || 60)
    const cutoff = new Date(Date.now() - Math.max(5, ttlMinutes) * 60 * 1000).toISOString()

    const res = await payload.find({
      collection: 'abandoned-carts',
      limit: 500,
      where: {
        and: [
          { status: { not_equals: 'recovered' } },
          { lastActivityAt: { less_than: cutoff } },
        ],
      },
    })

    let updated = 0
    for (const doc of res.docs || []) {
      try {
        await payload.update({
          collection: 'abandoned-carts',
          id: (doc as any).id,
          data: { status: 'abandoned' },
        })
        updated++
      } catch {}
    }

    return NextResponse.json({ success: true, updated, cutoff, via: isVercelCron ? 'vercel-cron' : 'secret' })
  } catch (e) {
    console.error('Mark abandoned (GET) error:', e)
    return NextResponse.json({ error: 'Failed to mark carts' }, { status: 500 })
  }
}
