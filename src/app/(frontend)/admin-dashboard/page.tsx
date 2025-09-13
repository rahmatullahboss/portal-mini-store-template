import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import OrderStatusUpdate from './order-status-update'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'

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

  // Get order statistics
  const pendingOrders = orders.docs.filter((order: any) => order.status === 'pending')
  const completedOrders = orders.docs.filter((order: any) => order.status === 'completed')
  const cancelledOrders = orders.docs.filter((order: any) => order.status === 'cancelled')
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

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Cancelled Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{orders.docs.length}</div>
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
                          <p className="text-sm text-gray-600 mt-1">Customer number: {order.customerNumber}</p>
                        ) : null}
                        <p className="text-sm text-gray-500 mt-1">
                          Ordered:{' '}
                          {new Date(order.orderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge
                          variant={
                            order.status === 'pending'
                              ? 'secondary'
                              : order.status === 'completed'
                                ? 'default'
                                : 'destructive'
                          }
                        >
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

        {/* Abandoned Carts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Abandoned Carts</h2>
            <div className="flex gap-3">
              <Badge variant="secondary">Active: {activeCarts.length}</Badge>
              <Badge variant="destructive">Abandoned: {abandonedCarts.length}</Badge>
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
                <Card key={cart.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {cart.customerName || cart.customerEmail || (cart.user ? `${cart.user?.firstName || ''} ${cart.user?.lastName || ''}`.trim() : null) || `Session ${String(cart.sessionId).slice(0, 8)}…`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Last activity: {new Date(cart.lastActivityAt).toLocaleString()}
                        </CardDescription>
                        {cart.customerEmail ? (
                          <p className="text-sm text-gray-600 mt-1">Email: {cart.customerEmail}</p>
                        ) : null}
                        {cart.customerNumber ? (
                          <p className="text-sm text-gray-600">Number: {cart.customerNumber}</p>
                        ) : null}
                        {cart.user ? (
                          <p className="text-sm text-gray-600">User: {cart.user?.email}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <Badge
                          variant={cart.status === 'active' ? 'secondary' : cart.status === 'abandoned' ? 'destructive' : 'default'}
                        >
                          {cart.status.charAt(0).toUpperCase() + cart.status.slice(1)}
                        </Badge>
                        {cart.recoveredOrder ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/collections/orders/${cart.recoveredOrder?.id || cart.recoveredOrder}`}>
                              View Order
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(cart.items || []).map((line: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            {line.item && typeof line.item === 'object' && line.item?.image?.url ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden">
                                <Image src={line.item.image.url} alt={line.item.image.alt || line.item.name} fill className="object-cover" />
                              </div>
                            ) : null}
                            <div>
                              <div className="text-sm font-medium">{line.item?.name || 'Item'}</div>
                              <div className="text-xs text-gray-600">Qty: {line.quantity}</div>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {typeof line?.item?.price === 'number' ? `৳${(line.item.price * (line.quantity || 1)).toFixed(2)}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Session: {String(cart.sessionId).slice(0, 16)}</div>
                      <div className="text-right font-semibold">Total: ৳{Number(cart.cartTotal || 0).toFixed(2)}</div>
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
