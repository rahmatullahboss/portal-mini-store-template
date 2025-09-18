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
import { Check } from 'lucide-react'

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

  const steps = [
    { label: 'Product', status: 'done' as const },
    { label: 'Checkout', status: 'current' as const },
  ]

  if (!item || !item.available) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_0%,rgba(59,130,246,0.08),transparent)]" />
        <SiteHeader variant="full" user={(fullUser as any) || (user as any)} />
        <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-20 sm:pt-24">
          <Card className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-semibold text-slate-900">Item not available</CardTitle>
              <CardDescription className="text-base text-slate-500">
                Sorry, this item is not available for ordering right now. Please explore other products.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button asChild className="rounded-full px-6">
                <Link href="/">Back to shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_0%,rgba(59,130,246,0.08),transparent)]" />
      <SiteHeader variant="full" user={(fullUser as any) || (user as any)} />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 lg:px-8 lg:pt-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-full border border-transparent bg-white/70 px-4 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:border-blue-100 hover:bg-white/90 hover:text-blue-600"
          >
            <Link href="/">← Back to shopping</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <span
                  className={
                    step.status === 'current'
                      ? 'flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-blue-600'
                      : 'flex items-center gap-2 text-slate-500'
                  }
                >
                  <span
                    className={
                      step.status === 'done'
                        ? 'flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow'
                        : 'flex size-6 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-semibold text-blue-600 shadow-sm'
                    }
                    aria-hidden
                  >
                    {step.status === 'done' ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {step.label}
                </span>
                {index < steps.length - 1 ? <span className="hidden h-px w-8 bg-slate-300 sm:block" aria-hidden /> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <OrderForm
            item={item}
            user={(fullUser as any) || (user as any)}
            deliverySettings={deliverySettings}
          />

          <div className="space-y-6">
            <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur-sm lg:sticky lg:top-32">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">Product overview</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>
                  <p className="text-sm text-slate-500">Review the product details before confirming your order.</p>
                </div>
                {typeof (item as any).category === 'object' || (item as any).category ? (
                  <Badge className="ml-auto h-7 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600">
                    {typeof (item as any).category === 'object'
                      ? ((item as any).category as any)?.name
                      : (item as any).category}
                  </Badge>
                ) : null}
              </div>
              {item.image && typeof item.image === 'object' && item.image.url ? (
                <div className="relative mt-6 h-56 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <Image
                    src={item.image.url}
                    alt={item.image.alt || item.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 384px, 100vw"
                  />
                </div>
              ) : null}
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                {item.shortDescription || item.description ? (
                  <p className="text-base text-slate-600">
                    {(item.shortDescription as string) || (item.description as string)}
                  </p>
                ) : null}
                <div className="flex items-center justify-between rounded-2xl bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
                  <span className="font-medium">Unit price</span>
                  <span className="text-base font-semibold text-blue-600">৳{Number(item.price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200/60 bg-blue-50/80 p-6 text-sm text-blue-800 shadow-lg shadow-blue-200/60">
              <h3 className="text-base font-semibold">Need help?</h3>
              <p className="mt-2 leading-relaxed">
                Our support team is ready to assist if you have questions about this product or the checkout process. Reach out via
                live chat or email and we’ll be happy to help.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


