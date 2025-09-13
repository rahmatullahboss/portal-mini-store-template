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
    avgOrderValue?: number
    conversionRate?: number
  }
  salesSeries: { month: string; value: number }[]
  breakdown: { grossSales: number; discounts: number; returns: number; deliveryCharge: number }
  users?: { newUsers: number }
  devices?: { mobile: number; desktop: number; tablet: number; other: number }
  carts?: { abandoned: number }
}

const formatBDT = (n: number) => `৳${n.toFixed(2)}`

const Card = ({ title, value, trend, accent }: { title: string; value: string; trend?: string; accent?: 'blue'|'green'|'red'|'amber'|'violet' }) => {
  const acc = accent === 'blue' ? 'text-blue-600' : accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-600' : accent === 'amber' ? 'text-amber-600' : accent === 'violet' ? 'text-violet-600' : ''
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="text-xs text-gray-500">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${acc}`}>{value}</div>
      {trend ? <div className="text-xs text-emerald-600 mt-1">{trend}</div> : null}
    </div>
  )
}

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    <div className="space-y-6" suppressHydrationWarning>
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

      {!mounted || loading ? (
        <div className="text-sm text-gray-500">Loading metrics…</div>
      ) : err ? (
        <div className="text-sm text-red-600">{err}</div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card title="Gross Sales" value={formatBDT(metrics.totals.grossSales)} trend={'+ vs last month'} accent="blue" />
            <Card title="Avg Order Value" value={formatBDT(metrics.totals.avgOrderValue || 0)} accent="violet" />
            <Card title="Conversion Rate" value={`${(metrics.totals.conversionRate || 0).toFixed(1)}%`} accent="green" />
            <Card title="New Users" value={String(metrics.users?.newUsers ?? 0)} accent="amber" />
            <Card title="Active Orders" value={String(metrics.totals.activeOrders)} accent="blue" />
            <Card title="Abandoned Carts" value={String(metrics.carts?.abandoned ?? 0)} accent="red" />
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
              <div className="text-sm text-gray-600 mb-2">Device sessions</div>
              <DeviceDonut devices={metrics.devices || { mobile: 0, desktop: 0, tablet: 0, other: 0 }} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function DeviceDonut({ devices }: { devices: { mobile: number; desktop: number; tablet: number; other: number } }) {
  const total = Object.values(devices).reduce((a, b) => a + b, 0) || 1
  const pct = (n: number) => Math.round((n / total) * 100)
  const slices = [
    { key: 'Mobile', value: devices.mobile, color: '#10b981' },
    { key: 'Desktop', value: devices.desktop, color: '#3b82f6' },
    { key: 'Tablet', value: devices.tablet, color: '#f59e0b' },
    { key: 'Other', value: devices.other, color: '#6b7280' },
  ]
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
        {(() => {
          let acc = 0
          return slices.map((s, i) => {
            const p = (s.value / total) * 100
            const dash = `${p} ${100 - p}`
            const el = (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="16"
                fill="transparent"
                stroke={s.color}
                strokeWidth="4"
                strokeDasharray={dash}
                strokeDashoffset={acc}
              />
            )
            acc -= p
            return el
          })
        })()}
        <circle cx="18" cy="18" r="12" fill="white" />
      </svg>
      <div className="text-sm space-y-1">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600 w-16">{s.key}</span>
            <span className="font-medium">{pct(s.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
