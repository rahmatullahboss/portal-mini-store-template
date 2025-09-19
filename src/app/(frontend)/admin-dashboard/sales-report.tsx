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

  // Format BDT currency
  const formatBDT = (n: number) =>
    `à§³${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
        const response = await fetch(`/api/admin/sales-report?days=${days}`)
        const data = await response.json()

        if (response.ok) {
          // Reverse the data to show latest day first
          setSalesData(data.reverse())
        } else {
          throw new Error(data.error || 'Failed to fetch sales data')
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error)
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

  // Calculate totals for summary
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0)
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0)
  const avgDailySales = totalSales / salesData.length || 0

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

      {/* Graph Visualization */}
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
            {salesData.map((data, index) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
