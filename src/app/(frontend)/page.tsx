import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CartButton } from '@/components/cart-button'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { OrderNowButton } from '@/components/order-now-button'
import { LogoutButton } from '@/components/logout-button'
import { SiteHeader } from '@/components/site-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const revalidate = 3600

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  // Fetch auth status and available items in parallel to reduce latency
  const [{ user }, items] = await Promise.all([
    payload.auth({ headers }),
    payload.find({
      collection: 'items',
      where: {
        available: {
          equals: true,
        },
      },
      // Limit depth and number of returned documents to speed up the query
      depth: 1,
      limit: 12,
    }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-stone-100 text-gray-800">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <SiteHeader variant="full" user={user} />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-4 h-4 bg-amber-300 rounded-full opacity-60 animate-bounce animation-delay-1000"></div>
            <div className="absolute top-40 right-20 w-6 h-6 bg-rose-300 rounded-full opacity-50 animate-bounce animation-delay-2000"></div>
            <div className="absolute bottom-40 left-20 w-3 h-3 bg-blue-300 rounded-full opacity-60 animate-bounce animation-delay-3000"></div>
            <div className="absolute bottom-20 right-10 w-5 h-5 bg-amber-200 rounded-full opacity-40 animate-bounce animation-delay-4000"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h2 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter">
                  <span className="brand-text animate-gradient-x">Online Bazar</span>
                  <br />
                  <span className="text-gray-800">Reimagined</span>
                </h2>
                <div className="h-1 w-32 bg-gradient-to-r from-amber-400 to-rose-400 mx-auto rounded-full"></div>
              </div>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Experience the future of shopping with our curated collection of premium items,
                delivered with precision and passion.
              </p>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-500 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Online Bazar Grid */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-5xl font-bold brand-text">Our Collection</h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Handcrafted experiences, delivered to perfection
              </p>
            </div>

            {items.docs.length === 0 ? (
              <div className="text-center py-20">
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <p className="text-gray-600 text-xl">New experiences loading...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {items.docs.map((item: any, index: number) => (
                  <Card
                    key={item.id}
                    className="group relative overflow-hidden rounded-3xl border-2 border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-xl transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 hover:border-amber-300/60 transform-gpu p-0"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Enhanced Card Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-rose-100/20 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>

                    <div className="relative z-10 h-full flex flex-col">
                      <Link href={`/item/${item.id}`} className="block">
                        {((item.image && typeof item.image === 'object') || item.imageUrl) && (
                          <div className="relative aspect-[5/4] overflow-hidden rounded-t-3xl">
                            <Image
                              src={
                                item.image && typeof item.image === 'object'
                                  ? item.image.url
                                  : item.imageUrl
                              }
                              alt={
                                (item.image && typeof item.image === 'object'
                                  ? item.image.alt
                                  : undefined) || item.name
                              }
                              fill
                              className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:saturate-110"
                            />
                            {/* Image Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Floating Badge */}
                            <div className="absolute top-4 right-4 transform group-hover:scale-110 transition-transform duration-300">
                              <Badge
                                variant="secondary"
                                className="bg-white/90 text-gray-700 border border-gray-200/60 backdrop-blur-sm shadow-lg font-medium px-3 py-1"
                              >
                                {typeof item.category === 'object'
                                  ? (item.category as any)?.name
                                  : item.category}
                              </Badge>
                            </div>
                          </div>
                        )}

                        <CardHeader className="space-y-3 p-4">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-300 leading-tight">
                              {item.name}
                            </CardTitle>
                            <div className="h-0.5 w-12 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                          <CardDescription className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                      </Link>

                      <CardFooter className="flex items-center justify-between border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm p-4 rounded-b-3xl">
                        <div className="space-y-1">
                          <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ৳{item.price.toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500 font-medium">Premium Quality</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 md:flex-col md:items-stretch md:gap-2 lg:flex-row lg:flex-wrap lg:items-center">
                          <AddToCartButton item={item} className="flex-shrink-0 md:w-full lg:w-auto" />
                          <OrderNowButton
                            item={item}
                            isLoggedIn={!!user}
                            className="flex-shrink-0 px-2 sm:px-4 py-2 text-xs sm:text-sm md:w-full lg:w-auto"
                            wrapperClassName="flex-shrink-0 md:w-full lg:w-auto"
                          />
                        </div>
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Global footer is rendered via layout */}
    </div>
  )
}
