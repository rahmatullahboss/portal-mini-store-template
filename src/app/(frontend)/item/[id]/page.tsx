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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ShieldCheck, ShoppingCart, Truck } from 'lucide-react'
import ReviewSection from './ReviewSection'
import { ReviewStars } from '@/components/review-stars'

export const revalidate = 3600

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
  const deliveryZone = (user as any)?.deliveryZone === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka'

  const item = await getItem(id, payload)

  if (!item) {
    return notFound()
  }

  const shortDescription = (item as any).shortDescription || item.description

  const categoryLabel =
    typeof (item as any).category === 'object'
      ? ((item as any).category as any)?.name
      : (item as any).category

  // Approved reviews for this product
  const reviewsRes = await payload.find({
    collection: 'reviews',
    where: {
      and: [
        { item: { equals: id } },
        { approved: { equals: true } },
      ],
    },
    depth: 2,
    limit: 50,
    sort: '-createdAt',
  })
  const reviews = reviewsRes?.docs || []
  const ratingAvg = reviews.length
    ? Math.round((reviews.reduce((a: number, r: any) => a + Number(r.rating || 0), 0) / reviews.length) * 10) / 10
    : 0

  // Check if current user can review (completed order contains this item)
  let canReview = false
  if (user) {
    try {
      const orders = await payload.find({
        collection: 'orders',
        where: {
          and: [
            { user: { equals: (user as any).id } },
            { status: { equals: 'completed' } },
            { 'items.item': { equals: id } },
          ],
        },
        limit: 1,
      })
      canReview = (orders?.docs?.length || 0) > 0
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={user} />
      <div className="container mx-auto px-4 py-8">
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
            <div className="flex items-center gap-3 mt-2">
              {categoryLabel ? <Badge variant="secondary">{categoryLabel}</Badge> : null}
              <div className="flex items-center gap-2">
                <ReviewStars value={ratingAvg} />
                <span className="text-sm text-gray-600">{reviews.length} Reviews</span>
              </div>
            </div>
            <p className="text-lg text-gray-700 mt-4 whitespace-pre-line">
              {shortDescription}
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-green-600">৳{item.price.toFixed(2)}</span>
              <span className="text-4xl font-bold text-green-600">Tk {item.price.toFixed(2)}</span>
            <div className="mt-8 flex gap-3">
              <>
                <AddToCartButton item={item as any} />
                <OrderNowButton item={item as any} isLoggedIn={!!user} deliveryZone={deliveryZone} />
              </>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                <Truck className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Free shipping worldwide</p>
                  <p className="text-xs text-gray-500">On all orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                <ShieldCheck className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">100% Secured Payment</p>
                  <p className="text-xs text-gray-500">Trusted checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                <ShoppingCart className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Top brand products</p>
                  <p className="text-xs text-gray-500">Quality assured</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="link">
                <Link href="/"> &larr; Back to all items</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description">
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {item.description}
              </div>
            </TabsContent>
            <TabsContent value="reviews">
              <ReviewSection
                itemId={id}
                canReview={!!canReview}
                userId={(user as any)?.id || null}
                initialReviews={reviews as any}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
