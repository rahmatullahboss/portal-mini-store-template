import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
// guest checkout enabled; no redirect import

import config from '@/payload.config'
import { SiteHeader } from '@/components/site-header'
import OrderForm from './order-form'
import { normalizeDeliverySettings, DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const fullUser = user
    ? await payload.findByID({ collection: 'users', id: (user as any).id }).catch(() => null)
    : null

  // Guest checkout allowed; no redirect

  // Fetch the specific item
  const item = await payload.findByID({
    collection: 'items',
    id,
    depth: 2,
  })

  const deliverySettingsResult = await payload
    .find({ collection: 'delivery-settings', limit: 1 })
    .catch(() => null)
  const deliverySettings = normalizeDeliverySettings((deliverySettingsResult as any)?.docs?.[0] || DEFAULT_DELIVERY_SETTINGS)

  if (!item || !item.available) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Item Not Available</CardTitle>
              <CardDescription>Sorry, this item is not available for ordering.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const categoryLabel =
    typeof (item as any).category === 'object' ? ((item as any).category as any)?.name : (item as any).category
  const imageSrc =
    item.image && typeof item.image === 'object'
      ? item.image.url
      : (item as any)?.imageUrl
  const imageAlt =
    (item.image && typeof item.image === 'object' && item.image.alt) || item.name || 'Selected item'

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={(fullUser as any) || (user as any)} />
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Items</Link>
        </Button>

        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Card className="overflow-hidden">
            {imageSrc ? (
              <div className="relative aspect-[4/3]">
                <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
              </div>
            ) : null}
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl text-gray-900">{item.name}</CardTitle>
                  <CardDescription className="whitespace-pre-line text-base text-gray-600">
                    {item.shortDescription ?? item.description ?? 'Review the item details before placing your order.'}
                  </CardDescription>
                </div>
                {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-semibold text-gray-900">৳{item.price.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-base font-medium text-green-700">Available for order</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>Provide your contact and delivery details to place the order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-medium">Guest checkout</p>
                  <p className="mt-1">
                    You can order this item without an account. We’ll ask for your contact and shipping details. Want to save
                    your details for next time?{' '}
                    <Link className="font-medium underline" href="/register">
                      Create an account
                    </Link>{' '}
                    or{' '}
                    <Link className="font-medium underline" href="/login">
                      sign in
                    </Link>
                    .
                  </p>
                </div>
              ) : null}
              <OrderForm item={item} user={(fullUser as any) || (user as any)} deliverySettings={deliverySettings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


