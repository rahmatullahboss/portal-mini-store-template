'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Snack = {
  id: string
  price: number
  name?: string
}

export function OrderNowButton({ snack, className = '' }: { snack: Snack; className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              snack: snack.id,
              quantity: 1,
            },
          ],
          totalAmount: Number(snack.price.toFixed(2)),
        }),
      })

      if (res.status === 401) {
        // Not authenticated — send to login
        router.push('/login')
        return
      }

      if (!res.ok) {
        let msg = 'Failed to place order'
        try {
          const data = await res.json()
          msg = data?.error || data?.message || msg
        } catch {}
        throw new Error(msg)
      }

      // Order placed — go to orders page
      router.push('/my-orders?success=true')
    } catch (e: any) {
      setError(e?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={handleOrder}
        disabled={loading}
        className={`bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 border-0 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105 ${className}`}
      >
        {loading ? 'Ordering…' : 'Order Now'}
      </Button>
      {error ? (
        <span className="text-sm text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

