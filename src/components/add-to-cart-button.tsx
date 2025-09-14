'use client'

import React, { useState } from 'react'
import { Plus, Check } from 'lucide-react'

import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/lib/cart-context'

interface AddToCartButtonProps {
  item: {
    id: string
    name: string
    price: number
    category?: any
    image?: {
      url: string
      alt?: string
    }
    imageUrl?: string
  }
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ item }) => {
  const { addItem, openCart } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category:
        typeof (item as any).category === 'object'
          ? ((item as any).category as any)?.name
          : (item as any).category,
      image: item.image || (item.imageUrl ? { url: item.imageUrl } : undefined),
    })

    setIsAdded(true)

    // Show feedback for 1 second
    setTimeout(() => {
      setIsAdded(false)
    }, 1000)

    // Optional: Open cart after adding item
    // openCart()
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdded}
      size="sm"
      className={`px-2 sm:px-4 py-2 text-xs sm:text-sm ${isAdded ? 'bg-green-600 hover:bg-green-600' : ''}`}
    >
      {isAdded ? (
        <>
          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Added!</span>
          <span className="sm:hidden">✓</span>
        </>
      ) : (
        <>
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="sm:hidden">Add</span>
        </>
      )}
    </Button>
  )
}
