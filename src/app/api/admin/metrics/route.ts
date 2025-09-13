import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(d: Date, months: number) {
  const nd = new Date(d)
  nd.setMonth(nd.getMonth() + months)
  return nd
}

export async function GET(req: NextRequest) {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Require admin
    const { user } = await payload.auth({ headers: req.headers })
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const range = url.searchParams.get('range') || 'this-month'

    const now = new Date()
    const from = range === 'all-time' ? new Date(2000, 0, 1) : startOfMonth(now)
    const to = now

    // Helper to fetch orders by where clause
    const findOrders = async (where: any, limit = 5000) => {
      const res = await payload.find({ collection: 'orders', where, depth: 0, limit })
      return res.docs as any[]
    }

    const dateFilter = {
      and: [
        { orderDate: { greater_than_equal: from.toISOString() } },
        { orderDate: { less_than_equal: to.toISOString() } },
      ],
    }

    const completed = await findOrders({ and: [{ status: { equals: 'completed' } }, dateFilter] })
    const pending = await findOrders({ and: [{ status: { equals: 'pending' } }, dateFilter] })
    const cancelled = await findOrders({ and: [{ status: { equals: 'cancelled' } }, dateFilter] })

    const sum = (rows: any[]) => rows.reduce((a, r) => a + Number(r.totalAmount || 0), 0)

    const totals = {
      grossSales: sum(completed),
      totalOrders: completed.length + pending.length + cancelled.length,
      activeOrders: pending.length,
      fulfilledOrders: completed.length,
      cancelledOrders: cancelled.length,
    }

    // Build last 12 months series for completed orders
    const start12 = startOfMonth(addMonths(now, -11))
    const last12 = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { status: { equals: 'completed' } },
          { orderDate: { greater_than_equal: start12.toISOString() } },
          { orderDate: { less_than_equal: to.toISOString() } },
        ],
      },
      depth: 0,
      limit: 10000,
      sort: 'orderDate',
    })

    const seriesMap = new Map<string, number>()
    for (let i = 0; i < 12; i++) {
      const d = addMonths(start12, i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      seriesMap.set(key, 0)
    }
    for (const o of last12.docs as any[]) {
      const d = new Date(o.orderDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      seriesMap.set(key, (seriesMap.get(key) || 0) + Number(o.totalAmount || 0))
    }
    const salesSeries = Array.from(seriesMap.entries()).map(([key, value]) => ({
      month: key,
      value,
    }))

    return NextResponse.json({
      range,
      from: from.toISOString(),
      to: to.toISOString(),
      totals,
      salesSeries,
      breakdown: {
        grossSales: totals.grossSales,
        discounts: 0,
        returns: 0,
        deliveryCharge: 0,
      },
    })
  } catch (e) {
    console.error('metrics error', e)
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}

