"use client"
import React, { useEffect, useMemo, useState } from 'react'
import './index.scss'

type Metrics = {
  range: string
  from: string
  to: string
  totals: {
    grossSales: number
    totalOrders: number
    activeOrders: number
    fulfilledOrders: number
    cancelledOrders: number
  }
  salesSeries: { month: string; value: number }[]
  breakdown: { grossSales: number; discounts: number; returns: number; deliveryCharge: number }
}

const formatBDT = (n: number) => `৳${n.toFixed(2)}`

const Card = ({ title, value, trend }: { title: string; value: string; trend?: string }) => (
  <div className="p-4 rounded-lg border bg-white">
    <div className="text-xs text-gray-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
    {trend ? <div className="text-xs text-emerald-600 mt-1">{trend}</div> : null}
  </div>
)

const Spark = ({ data }: { data: number[] }) => {
  const width = 200
  const height = 48
  const max = Math.max(1, ...data)
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (v / max) * height
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} className="text-blue-500">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  )
}

export default function BeforeDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [range, setRange] = useState<'this-month' | 'all-time'>('this-month')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`/api/admin/metrics?range=${range}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!mounted) return
        if (!ok) throw new Error(j?.error || 'Failed to load metrics')
        setMetrics(j as Metrics)
        setErr(null)
      })
      .catch((e) => setErr(e?.message || 'Failed to load metrics'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [range])

  const sparkData = useMemo(() => metrics?.salesSeries?.map((s) => s.value) || [], [metrics])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Store Overview</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          className="text-sm border rounded-md px-2 py-1 bg-white"
        >
          <option value="this-month">This Month</option>
          <option value="all-time">All Time</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading metrics…</div>
      ) : err ? (
        <div className="text-sm text-red-600">{err}</div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Gross sales" value={formatBDT(metrics.totals.grossSales)} trend={'+ compare to prev'} />
            <Card title="Active Orders" value={String(metrics.totals.activeOrders)} />
            <Card title="Fulfilled Orders" value={String(metrics.totals.fulfilledOrders)} />
            <Card title="Cancelled Orders" value={String(metrics.totals.cancelledOrders)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="col-span-2 p-4 rounded-lg border bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total sales</div>
                <div className="text-lg font-semibold">{formatBDT(metrics.totals.grossSales)}</div>
              </div>
              <Spark data={sparkData.length ? sparkData : [0]} />
              <div className="text-xs text-gray-400 mt-2">Last 12 months</div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-sm text-gray-600 mb-2">Sales breakdown</div>
              <ul className="text-sm space-y-1">
                <li className="flex justify-between"><span>Gross sales</span><span>{formatBDT(metrics.breakdown.grossSales)}</span></li>
                <li className="flex justify-between"><span>Discounts</span><span>{formatBDT(metrics.breakdown.discounts)}</span></li>
                <li className="flex justify-between"><span>Returns</span><span>{formatBDT(metrics.breakdown.returns)}</span></li>
                <li className="flex justify-between"><span>Delivery charge</span><span>{formatBDT(metrics.breakdown.deliveryCharge)}</span></li>
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
