import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'
import { OrderStatusUpdate } from '@/components/lazy-client-components'

export default async function AdminDashboardPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated or not admin
  if (!user || (user as any).role !== 'admin') {
    redirect('/')
  }

  // Fetch all orders
  const orders = await payload.find({
    collection: 'orders',
    depth: 3,
    sort: '-orderDate',
    limit: 50,
  })

  // Fetch recent abandoned carts (active + abandoned)
  const carts = await payload.find({
    collection: 'abandoned-carts',
    depth: 2,
    sort: '-lastActivityAt',
    limit: 50,
    where: {
      status: { not_equals: 'recovered' },
    },
  })

  // Get order statistics for all 6 statuses
  const pendingOrders = orders.docs.filter((order: any) => order.status === 'pending')
  const processingOrders = orders.docs.filter((order: any) => order.status === 'processing')
  const shippedOrders = orders.docs.filter((order: any) => order.status === 'shipped')
  const completedOrders = orders.docs.filter((order: any) => order.status === 'completed')
  const cancelledOrders = orders.docs.filter((order: any) => order.status === 'cancelled')
  const refundedOrders = orders.docs.filter((order: any) => order.status === 'refunded')
  const activeCarts = (carts.docs as any[]).filter((c: any) => c.status === 'active')
  const abandonedCarts = (carts.docs as any[]).filter((c: any) => c.status === 'abandoned')

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">← Back to Home</Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Enhanced Statistics Grid with Charts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">⏳</span>
                </div>
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
              <div className="text-xs text-yellow-600 mt-1">
                {((pendingOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🔄</span>
                </div>
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{processingOrders.length}</div>
              <div className="text-xs text-blue-600 mt-1">
                {((processingOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📦</span>
                </div>
                Shipped
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{shippedOrders.length}</div>
              <div className="text-xs text-purple-600 mt-1">
                {((shippedOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✅</span>
                </div>
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
              <div className="text-xs text-green-600 mt-1">
                {((completedOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">❌</span>
                </div>
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledOrders.length}</div>
              <div className="text-xs text-red-600 mt-1">
                {((cancelledOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                Refunded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{refundedOrders.length}</div>
              <div className="text-xs text-gray-600 mt-1">
                {((refundedOrders.length / orders.docs.length) * 100 || 0).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Summary Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📈</span>
                </div>
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{orders.docs.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {pendingOrders.length + processingOrders.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Active Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {completedOrders.length + shippedOrders.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Fulfilled</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {cancelledOrders.length + refundedOrders.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Issues</div>
                </div>
              </div>

              {/* Order Status Progress Bar */}
              <div className="mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Order Status Distribution
                </div>
                <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                  {orders.docs.length > 0 && (
                    <>
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${(pendingOrders.length / orders.docs.length) * 100}%` }}
                        title={`Pending: ${pendingOrders.length}`}
                      />
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${(processingOrders.length / orders.docs.length) * 100}%`,
                        }}
                        title={`Processing: ${processingOrders.length}`}
                      />
                      <div
                        className="bg-purple-500"
                        style={{ width: `${(shippedOrders.length / orders.docs.length) * 100}%` }}
                        title={`Shipped: ${shippedOrders.length}`}
                      />
                      <div
                        className="bg-green-500"
                        style={{ width: `${(completedOrders.length / orders.docs.length) * 100}%` }}
                        title={`Completed: ${completedOrders.length}`}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${(cancelledOrders.length / orders.docs.length) * 100}%` }}
                        title={`Cancelled: ${cancelledOrders.length}`}
                      />
                      <div
                        className="bg-gray-500"
                        style={{ width: `${(refundedOrders.length / orders.docs.length) * 100}%` }}
                        title={`Refunded: ${refundedOrders.length}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Analytics */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🛒</span>
                </div>
                Cart Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{carts.docs.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Carts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{activeCarts.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Active Carts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{abandonedCarts.length}</div>
                  <div className="text-sm text-gray-600 font-medium">Abandoned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {abandonedCarts.length > 0
                      ? (
                          (abandonedCarts.length / (activeCarts.length + abandonedCarts.length)) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Abandon Rate</div>
                </div>
              </div>

              {/* Cart Recovery Potential */}
              <div className="mt-6">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Cart Status Distribution
                </div>
                <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                  {carts.docs.length > 0 && (
                    <>
                      <div
                        className="bg-green-500"
                        style={{ width: `${(activeCarts.length / carts.docs.length) * 100}%` }}
                        title={`Active: ${activeCarts.length}`}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${(abandonedCarts.length / carts.docs.length) * 100}%` }}
                        title={`Abandoned: ${abandonedCarts.length}`}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Recovery Recommendations */}
              {abandonedCarts.length > 0 && (
                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <div className="text-sm font-medium text-amber-800">💡 Recovery Opportunity</div>
                  <div className="text-xs text-amber-700 mt-1">
                    {abandonedCarts.length} abandoned carts worth potential recovery
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Orders Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Orders</h2>

          {orders.docs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No orders found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.docs.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{String(order.id).slice(-8)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Customer:{' '}
                          {order.user ? (
                            <>
                              {order.user?.firstName} {order.user?.lastName} ({order.user?.email})
                            </>
                          ) : (
                            <>
                              {order.customerName} ({order.customerEmail})
                            </>
                          )}
                        </CardDescription>
                        {order.customerNumber ? (
                          <p className="text-sm text-gray-600 mt-1">
                            Customer number: {order.customerNumber}
                          </p>
                        ) : null}
                        <p className="text-sm text-gray-500 mt-1">
                          Ordered:{' '}
                          {new Date(order.orderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge
                          variant={
                            order.status === 'pending'
                              ? 'secondary'
                              : order.status === 'processing'
                                ? 'default'
                                : order.status === 'shipped'
                                  ? 'outline'
                                  : order.status === 'completed'
                                    ? 'default'
                                    : order.status === 'cancelled' || order.status === 'refunded'
                                      ? 'destructive'
                                      : 'secondary'
                          }
                          className={
                            order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'shipped'
                                  ? 'bg-purple-100 text-purple-800'
                                  : order.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : order.status === 'refunded'
                                        ? 'bg-gray-100 text-gray-800'
                                        : ''
                          }
                        >
                          {order.status === 'pending' && '⏳ '}
                          {order.status === 'processing' && '🔄 '}
                          {order.status === 'shipped' && '📦 '}
                          {order.status === 'completed' && '✅ '}
                          {order.status === 'cancelled' && '❌ '}
                          {order.status === 'refunded' && '💰 '}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <OrderStatusUpdate orderId={order.id} currentStatus={order.status} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {item.item &&
                            typeof item.item === 'object' &&
                            item.item.image &&
                            typeof item.item.image === 'object' &&
                            item.item.image.url && (
                              <div className="relative w-12 h-12 rounded overflow-hidden">
                                <Image
                                  src={item.item.image.url}
                                  alt={item.item.image.alt || item.item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.item?.name || 'Unknown Item'}</h4>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ৳{item.item?.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right font-medium">
                            ৳{((item.item?.price || 0) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Shipping Address */}
                    {order.shippingAddress ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">Shipping Address</h4>
                          <p className="text-sm text-gray-700">
                            {order.shippingAddress.line1}
                            {order.shippingAddress.line2 ? (
                              <>
                                <br />
                                {order.shippingAddress.line2}
                              </>
                            ) : null}
                            <br />
                            {order.shippingAddress.city}
                            {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                            <br />
                            {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <Separator className="my-4" />

                    <div className="text-right">
                      <span className="text-lg font-bold">
                        Total: ৳{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Enhanced Abandoned Carts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🛒</span>
              </div>
              Abandoned Carts
            </h2>
            <div className="flex gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                🟢 Active: {activeCarts.length}
              </Badge>
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                🔴 Abandoned: {abandonedCarts.length}
              </Badge>
              {abandonedCarts.length > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  💰 Recovery Value: ৳
                  {abandonedCarts
                    .reduce((sum: number, cart: any) => sum + (cart.cartTotal || 0), 0)
                    .toFixed(2)}
                </Badge>
              )}
            </div>
          </div>

          {carts.docs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No active or abandoned carts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {carts.docs.map((cart: any) => (
                <Card
                  key={cart.id}
                  className={`overflow-hidden border-l-4 ${
                    cart.status === 'active'
                      ? 'border-l-green-500 bg-green-50/30'
                      : cart.status === 'abandoned'
                        ? 'border-l-red-500 bg-red-50/30'
                        : 'border-l-gray-500'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              cart.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {cart.customerName ||
                            cart.customerEmail ||
                            (cart.user
                              ? `${cart.user?.firstName || ''} ${cart.user?.lastName || ''}`.trim()
                              : null) ||
                            `Session ${String(cart.sessionId).slice(0, 8)}…`}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            🕰️ Last activity: {new Date(cart.lastActivityAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                          </span>
                          {cart.status === 'abandoned' && (
                            <span className="text-red-600 font-medium">⚠️ Needs Recovery</span>
                          )}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <p className="flex items-center gap-1">
                            📧 {cart.customerEmail || cart.user?.email || '—'}
                          </p>
                          <p className="flex items-center gap-1">
                            📱 {cart.customerNumber || cart.user?.customerNumber || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge
                          variant={
                            cart.status === 'active'
                              ? 'secondary'
                              : cart.status === 'abandoned'
                                ? 'destructive'
                                : 'default'
                          }
                          className={
                            cart.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : cart.status === 'abandoned'
                                ? 'bg-red-100 text-red-800'
                                : ''
                          }
                        >
                          {cart.status === 'active' && '🟢 '}
                          {cart.status === 'abandoned' && '🔴 '}
                          {cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}
                        </Badge>
                        {cart.recoveredOrder ? (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={`/admin/collections/orders/${cart.recoveredOrder?.id || cart.recoveredOrder}`}
                            >
                              📝 View Order
                            </Link>
                          </Button>
                        ) : cart.status === 'abandoned' && cart.cartTotal > 0 ? (
                          <div className="text-right">
                            <div className="text-sm font-medium text-amber-600">
                              💰 Recovery Value
                            </div>
                            <div className="text-lg font-bold text-gray-800">
                              ৳{Number(cart.cartTotal || 0).toFixed(2)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(cart.items || []).length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          🛒 Cart Items ({(cart.items || []).length})
                        </div>
                        {(cart.items || []).map((line: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              {line.item &&
                              typeof line.item === 'object' &&
                              line.item?.image?.url ? (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                  <Image
                                    src={line.item.image.url}
                                    alt={line.item.image.alt || line.item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-400 text-xl">📦</span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {line.item?.name || 'Item'}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>📝 Qty: {line.quantity}</span>
                                  {typeof line?.item?.price === 'number' && (
                                    <span>• ৳{line.item.price.toFixed(2)} each</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-800">
                              {typeof line?.item?.price === 'number'
                                ? `৳${(line.item.price * (line.quantity || 1)).toFixed(2)}`
                                : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <span className="text-2xl">🙅</span>
                        <p className="text-sm mt-1">No items in cart</p>
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        🏷️ Session: {String(cart.sessionId).slice(0, 16)}…
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">
                          Total: ৳{Number(cart.cartTotal || 0).toFixed(2)}
                        </div>
                        {cart.status === 'abandoned' && cart.cartTotal > 0 && (
                          <div className="text-xs text-red-600 mt-1">⚠️ Revenue at risk</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
