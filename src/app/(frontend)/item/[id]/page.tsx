import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import config from '@/payload.config'
import { SiteHeader } from '@/components/site-header'
import { notFound } from 'next/navigation'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { OrderNowButton } from '@/components/order-now-button'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

async function getItem(id: string, payload: any) {
  const item = await payload.findByID({
    collection: 'items',
    id,
    depth: 2,
  })
  return item
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const item = await getItem(id, payload)

  if (!item) {
    return notFound()
  }

  const categoryLabel =
    typeof (item as any).category === 'object'
      ? ((item as any).category as any)?.name
      : (item as any).category

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            {((item.image && typeof item.image === 'object') || item.imageUrl) && (
              <div className="aspect-square relative rounded-lg overflow-hidden border">
                <Image
                  src={
                    item.image && typeof item.image === 'object' ? item.image.url : item.imageUrl
                  }
                  alt={
                    (item.image && typeof item.image === 'object' ? item.image.alt : undefined) ||
                    item.name
                  }
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-gray-900">{item.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : null}
            </div>
            <p className="text-lg text-gray-700 mt-4">{item.description}</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-green-600">৳{item.price.toFixed(2)}</span>
            </div>
            <div className="mt-8 flex gap-3">
              <>
                <AddToCartButton item={item as any} />
                <OrderNowButton item={item as any} isLoggedIn={!!user} />
              </>
            </div>
            <div className="mt-4">
              <Button asChild variant="link">
                <Link href="/"> &larr; Back to all items</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

