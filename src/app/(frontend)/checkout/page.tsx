import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import { CheckoutForm } from './checkout-form'
import { normalizeDeliverySettings, DEFAULT_DELIVERY_SETTINGS } from '@/lib/delivery-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })
  const fullUser = user
  const deliverySettingsResult = await payload
    .find({ collection: 'delivery-settings', limit: 1 })
    .catch(() => null)
  const deliverySettings = normalizeDeliverySettings((deliverySettingsResult as any)?.docs?.[0] || DEFAULT_DELIVERY_SETTINGS)

    ? await payload.findByID({ collection: 'users', id: (user as any).id }).catch(() => null)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={(fullUser as any) || (user as any)} />
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Shopping</Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          {!user ? (
            <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-medium">Guest checkout</p>
              <p className="mt-1">
                You can place an order without an account. We’ll just need your contact and shipping details.
                Want faster checkout next time?{' '}
                <Link className="underline font-medium" href="/register">Create an account</Link>{' '}
                or <Link className="underline font-medium" href="/login">sign in</Link>.
              </p>
            </div>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckoutForm user={(fullUser as any) || (user as any)} deliverySettings={deliverySettings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

