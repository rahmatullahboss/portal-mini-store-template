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
  const router = useRouter()

  const handleOrder = async () => {
    setLoading(true)
    try {
      // Navigate to the single-item order page to confirm details (guest or user)
      router.push(`/order/${snack.id}`)
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
      {/* Errors are handled on the order page; no local error display */}
    </div>
  )
}
