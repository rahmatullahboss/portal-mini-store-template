"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'

type PreviewItem = {
  name?: string
  image?: { url: string; alt?: string }
}

export default function OrderConfirmationPage() {
  const sp = useSearchParams()
  const orderId = sp.get('orderId') || undefined
  const [items, setItems] = useState<PreviewItem[] | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('last-order-preview')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.items)) {
          setItems(parsed.items)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={undefined as any} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Home</Link>
        </Button>

        <Alert className="mb-6">
          <AlertDescription>
            <div className="space-y-2">
              <div className="text-lg font-semibold">Order placed successfully! 🎉</div>
              {orderId ? (
                <div className="text-sm text-gray-600">Reference: #{String(orderId).slice(-8)}</div>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {items && items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    {item.image?.url ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden border">
                        <Image
                          src={item.image.url}
                          alt={item.image.alt || item.name || 'Ordered item'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <div className="font-medium">{item.name || 'Item'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                Your order has been placed. You will receive a confirmation email shortly.
              </div>
            )}
            <Separator className="my-4" />
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/my-orders">View My Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

