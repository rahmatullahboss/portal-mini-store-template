'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  price: number
  name?: string
  image?: {
    url: string
    alt?: string
  }
  imageUrl?: string
}

type OrderNowButtonProps = {
  item: Item
  className?: string
  wrapperClassName?: string
  isLoggedIn?: boolean
  deliveryZone?: 'inside_dhaka' | 'outside_dhaka'
}

export function OrderNowButton({
  item,
  className = '',
  wrapperClassName = '',
  isLoggedIn,
  deliveryZone = 'inside_dhaka',
}: OrderNowButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isLoggedIn) {
        router.push(`/order/${item.id}`)
        return
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ item: item.id, quantity: 1 }],
          deliveryZone,
        }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => null)
        const orderDoc = (data as any)?.doc || {}
        const oid = orderDoc?.id
        const subtotal = Number(orderDoc?.subtotal ?? item.price)
        const shipping = Number(orderDoc?.shippingCharge ?? 0)
        const total = Number(orderDoc?.totalAmount ?? subtotal + shipping)

        if (item?.name) {
          try {
            sessionStorage.setItem(
              'last-order-preview',
              JSON.stringify({
                orderId: oid,
                items: [
                  {
                    name: item.name,
                    image: item.image || (item.imageUrl ? { url: item.imageUrl } : undefined),
                  },
                ],
                subtotal,
                shippingCharge: shipping,
                totalAmount: total,
                deliveryZone: (orderDoc as any)?.deliveryZone || deliveryZone,
                freeDeliveryApplied:
                  typeof (orderDoc as any)?.freeDeliveryApplied === 'boolean'
                    ? Boolean((orderDoc as any)?.freeDeliveryApplied)
                    : shipping === 0,
              }),
            )
          } catch {}
        }

        router.push(oid ? `/my-orders?success=true&orderId=${oid}` : '/my-orders?success=true')
        return
      }

      const data = await res.json().catch(() => ({}))
      const message = (data as any)?.error || (data as any)?.message || 'Additional details required'
      setError(message)
      router.push(`/order/${item.id}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to place order')
      router.push(`/order/${item.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', wrapperClassName)}>
      <Button
        type="button"
        onClick={handleOrder}
        disabled={loading}
        size="sm"
        className={cn(
          'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 border-0 text-white rounded-full shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm md:h-11 md:px-5 md:text-sm',
          className,
        )}
      >
        {loading ? 'Ordering.' : 'Order Now'}
      </Button>
      {error ? (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
