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

export function OrderNowButton({
  item,
  className = '',
  wrapperClassName = '',
  isLoggedIn,
}: {
  item: Item
  className?: string
  wrapperClassName?: string
  isLoggedIn?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      // If not logged in, go collect info first
      if (!isLoggedIn) {
        router.push(`/order/${item.id}`)
        return
      }

      // Logged in: place order immediately using profile info (API falls back to profile)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ item: item.id, quantity: 1 }],
          totalAmount: Number(item.price.toFixed(2)),
        }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => null)
        const oid = (data as any)?.doc?.id
        // Save a lightweight preview for confirmation pages
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
              }),
            )
          } catch {}
        }
        router.push(oid ? `/my-orders?success=true&orderId=${oid}` : '/my-orders?success=true')
        return
      }

      // If profile missing number/address, fall back to info page
      const data = await res.json().catch(() => ({}))
      const message = data?.error || data?.message || 'Additional details required'
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
          'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 border-0 text-white rounded-full shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 h-10 px-3 text-xs sm:h-8 sm:px-4 sm:text-sm md:h-9 md:px-5 md:text-sm',
          className,
        )}
      >
        {loading ? 'Ordering…' : 'Order Now'}
      </Button>
      {error ? (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}