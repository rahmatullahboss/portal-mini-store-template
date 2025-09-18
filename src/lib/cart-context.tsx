'use client'

import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image?: {
    url: string
    alt?: string
  }
  quantity: number
  category: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'MERGE_ITEMS'; payload: CartItem[] }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const normalizeCartItem = (value: unknown): CartItem | null => {
  if (!isRecord(value)) return null

  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) {
    return null
  }

  const quantityRaw = Number(value.quantity)
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1

  const priceRaw = Number(value.price)
  const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0

  const categoryValue = value.category
  const category = isNonEmptyString(categoryValue)
    ? categoryValue
    : isRecord(categoryValue) && isNonEmptyString(categoryValue.name)
      ? categoryValue.name
      : ''

  const imageValue = value.image
  const image =
    isRecord(imageValue) && typeof imageValue.url === 'string'
      ? {
          url: imageValue.url,
          alt: isNonEmptyString(imageValue.alt) ? imageValue.alt : undefined,
        }
      : undefined

  return {
    id: value.id,
    name: value.name,
    price,
    quantity,
    category,
    ...(image ? { image } : {}),
  }
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find((item) => item.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      }
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== action.payload.id),
        }
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
        ),
      }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      }
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
      }
    case 'MERGE_ITEMS': {
      const mergedMap = new Map<string, CartItem>()
      for (const item of state.items) {
        mergedMap.set(item.id, item)
      }
      for (const incoming of action.payload) {
        if (!incoming || !incoming.id) continue
        const existing = mergedMap.get(incoming.id)
        if (existing) {
          mergedMap.set(incoming.id, {
            ...existing,
            ...incoming,
            quantity: Math.max(existing.quantity, incoming.quantity),
          })
        } else {
          mergedMap.set(incoming.id, incoming)
        }
      }
      return {
        ...state,
        items: Array.from(mergedMap.values()),
      }
    }
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      }
    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      }
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      }
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  })
  const [hasLoadedLocalCart, setHasLoadedLocalCart] = useState(false)
  const hasSyncedServerCartRef = useRef(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedCart = localStorage.getItem('dyad-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as unknown
        if (isRecord(parsed) && Array.isArray(parsed.items)) {
          const sanitizedItems = parsed.items
            .map((item) => normalizeCartItem(item))
            .filter((item): item is CartItem => item !== null)
          dispatch({ type: 'SET_ITEMS', payload: sanitizedItems })
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    } finally {
      setHasLoadedLocalCart(true)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedLocalCart || typeof window === 'undefined') return
    try {
      localStorage.setItem('dyad-cart', JSON.stringify({ items: state.items }))
    } catch (error) {
      console.error('Failed to persist cart to localStorage:', error)
    }
  }, [state.items, hasLoadedLocalCart])

  const syncCartFromServer = useCallback(async () => {
    if (!hasLoadedLocalCart || typeof window === 'undefined') return
    if (hasSyncedServerCartRef.current) return
    hasSyncedServerCartRef.current = true
    try {
      const response = await fetch('/api/cart', { credentials: 'include' })
      if (!response.ok) {
        // Allow retry on future attempts
        hasSyncedServerCartRef.current = false
        return
      }
      const data = (await response.json().catch(() => null)) as unknown
      if (!isRecord(data) || !Array.isArray(data.items) || data.items.length === 0) {
        return
      }
      const incomingItems: CartItem[] = data.items
        .map((item) => normalizeCartItem(item))
        .filter((item): item is CartItem => item !== null)
      if (incomingItems.length > 0) {
        dispatch({ type: 'MERGE_ITEMS', payload: incomingItems })
      }
    } catch (error) {
      console.error('Failed to sync cart from server:', error)
      hasSyncedServerCartRef.current = false
    }
  }, [hasLoadedLocalCart])

  useEffect(() => {
    if (!hasLoadedLocalCart) return
    syncCartFromServer()
  }, [hasLoadedLocalCart, syncCartFromServer])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleAuthChange = () => {
      hasSyncedServerCartRef.current = false
      syncCartFromServer()
    }
    window.addEventListener('dyad-auth-changed', handleAuthChange)
    return () => window.removeEventListener('dyad-auth-changed', handleAuthChange)
  }, [syncCartFromServer])

  // Send lightweight cart activity to server (for abandoned cart tracking)
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Debounce to avoid spamming on rapid changes
    const handle = setTimeout(() => {
      try {
        const total = state.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
        // Try to include any known guest details
        let customerEmail: string | undefined
        let customerNumber: string | undefined
        let customerName: string | undefined
        try {
          customerEmail = localStorage.getItem('dyad-guest-email') || undefined
          customerNumber = localStorage.getItem('dyad-guest-number') || undefined
          const n = localStorage.getItem('dyad-guest-name') || undefined
          customerName = n && n.trim().length > 0 ? n : undefined
        } catch {}

        fetch('/api/cart-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: state.items.map((i) => ({ id: i.id, quantity: i.quantity })),
            total,
            customerEmail,
            customerNumber,
            customerName,
          }),
          keepalive: true,
        }).catch(() => {})
      } catch {}
    }, 800)
    return () => clearTimeout(handle)
  }, [state.items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' })
  }

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' })
  }

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' })
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
