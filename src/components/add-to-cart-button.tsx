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
      className={isAdded ? 'bg-green-600 hover:bg-green-600' : ''}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added!
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
