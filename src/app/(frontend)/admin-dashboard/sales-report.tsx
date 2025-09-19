'use client'
import React, { useEffect, useState } from 'react'

type SalesData = {
  date: string
  orders: number
  sales: number
  avgOrderValue: number
}

export default function SalesReport() {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d') // Changed default to 7d
  const [error, setError] = useState<string | null>(null)

  // Format BDT currency
  const formatBDT = (n: number) =>
    `৳${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Format date as "MMM DD" (e.g., "Sep 15")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get day of week
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true)
      setError(null)
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
        const response = await fetch(`/api/admin/sales-report?days=${days}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch sales data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          // Reverse the data to show latest day first
          setSalesData(data.reverse())
        } else {
          throw new Error('Invalid data format received')
        }
      } catch (error: any) {
        console.error('Failed to fetch sales data:', error)
        setError(error.message || 'Failed to load sales report')
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading sales report...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading sales report</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  // Calculate totals for summary
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0)
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0)
  const avgDailySales = totalSales / (salesData.length || 1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Total Orders</div>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Total Sales</div>
          <div className="text-2xl font-bold">{formatBDT(totalSales)}</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Avg Daily Sales</div>
          <div className="text-2xl font-bold">{formatBDT(avgDailySales)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Daily Sales Trend</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Graph Visualization - Only show if we have data */}
      {salesData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-end justify-between h-48 gap-2">
            {salesData.map((data, index) => {
              // Calculate bar height as percentage of max sales
              const maxSales = Math.max(...salesData.map((d) => d.sales))
              const barHeight = maxSales > 0 ? (data.sales / maxSales) * 100 : 0

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-gray-500 mb-1">{getDayOfWeek(data.date)}</div>
                  <div className="text-xs text-gray-500 mb-1">{formatDate(data.date)}</div>
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all hover:opacity-75"
                    style={{ height: `${barHeight}%` }}
                  ></div>
                  <div className="text-xs font-medium text-gray-700 mt-1">
                    {formatBDT(data.sales)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Order
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salesData.length > 0 ? (
              salesData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(data.date)} ({getDayOfWeek(data.date)})
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {data.orders}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatBDT(data.sales)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatBDT(data.avgOrderValue)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No sales data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
