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
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeItemId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const normalizeCartItem = (value: unknown): CartItem | null => {
  if (!isRecord(value)) return null

  const normalizedId = normalizeItemId(value.id)
  if (!normalizedId || !isNonEmptyString(value.name)) {
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
    id: normalizedId,
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

type CartItemInput = Omit<CartItem, 'quantity'> & { id: string | number }

interface CartContextType {
  state: CartState
  addItem: (item: CartItemInput) => void
  removeItem: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
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
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const hasSyncedServerCartRef = useRef(false)
  const serverSnapshotRef = useRef<Map<string, number>>(new Map())
  const skipNextPersistRef = useRef(false)
  const isAuthenticatedRef = useRef(true)
  const sessionIdRef = useRef<string | null>(null)
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const clientIdRef = useRef<string | null>(null)
  const updateSessionId = useCallback((value: string | null) => {
    sessionIdRef.current = value
    setSessionToken(value)
  }, [])

  const updateAuthState = useCallback((value: boolean) => {
    isAuthenticatedRef.current = value
    setIsAuthenticated(value)
  }, [])

  const ensureClientId = useCallback(() => {
    if (clientIdRef.current) return clientIdRef.current
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dyad-cart-client-id')
        if (stored && stored.trim().length > 0) {
          clientIdRef.current = stored.trim()
          return clientIdRef.current
        }
        const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
        clientIdRef.current = generated
        localStorage.setItem('dyad-cart-client-id', generated)
        return generated
      } catch {
        const fallback = Math.random().toString(36).slice(2)
        clientIdRef.current = fallback
        return fallback
      }
    }
    const fallback = Math.random().toString(36).slice(2)
    clientIdRef.current = fallback
    return fallback
  }, [])

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (typeof window !== 'undefined' && reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    ensureClientId()
    try {
      const savedCart = localStorage.getItem('dyad-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as unknown
        if (isRecord(parsed) && Array.isArray(parsed.items)) {
          const sanitizedItems = parsed.items
            .map((item) => normalizeCartItem(item))
            .filter((item): item is CartItem => item !== null)
          dispatch({ type: 'SET_ITEMS', payload: sanitizedItems })
          const snapshotCandidate = (parsed as Record<string, unknown>)['serverSnapshot']
          const snapshotRaw = isRecord(snapshotCandidate) ? snapshotCandidate : null
          if (snapshotRaw) {
            const entries: [string, number][] = []
            for (const [id, value] of Object.entries(snapshotRaw)) {
              if (!isNonEmptyString(id)) continue
              const quantity = Number(value)
              if (Number.isFinite(quantity) && quantity >= 0) {
                entries.push([id, quantity])
              }
            }
            serverSnapshotRef.current = new Map(entries)
          } else {
            serverSnapshotRef.current = new Map()
          }
          const savedSessionId = (parsed as Record<string, unknown>)['sessionId']
          updateSessionId(isNonEmptyString(savedSessionId) ? savedSessionId : null)
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    } finally {
      setHasLoadedLocalCart(true)
    }
  }, [updateSessionId, ensureClientId])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedLocalCart || typeof window === 'undefined') return
    try {
      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false
        return
      }
      const serverSnapshot = Object.fromEntries(serverSnapshotRef.current.entries())
      const payload = {
        items: state.items,
        serverSnapshot,
        sessionId: sessionIdRef.current,
      }
      localStorage.setItem('dyad-cart', JSON.stringify(payload))
    } catch (error) {
      console.error('Failed to persist cart to localStorage:', error)
    }
  }, [state.items, hasLoadedLocalCart])

  const syncCartFromServer = useCallback(async () => {
    if (!hasLoadedLocalCart || typeof window === 'undefined') return
    if (hasSyncedServerCartRef.current) return
    hasSyncedServerCartRef.current = true
    try {
      const sessionQuery = sessionIdRef.current ? `?sessionId=${encodeURIComponent(sessionIdRef.current)}` : ''
      const response = await fetch(`/api/cart${sessionQuery}`, { credentials: 'include' })
      if (response.status === 401) {
        updateAuthState(false)
        hasSyncedServerCartRef.current = false
        updateSessionId(null)
        return
      }
      if (!response.ok) {
        // Allow retry on future attempts
        hasSyncedServerCartRef.current = false
        return
      }
      updateAuthState(true)
      const data = (await response.json().catch(() => null)) as unknown
      if (!isRecord(data)) {
        updateSessionId(null)
        serverSnapshotRef.current = new Map()
        return
      }
      const dataRecord = data as Record<string, unknown>
      const sessionIdValue = isNonEmptyString(dataRecord.sessionId) ? dataRecord.sessionId : null
      updateSessionId(sessionIdValue)
      const snapshotCandidate = dataRecord['snapshot']
      const snapshotRaw = isRecord(snapshotCandidate) ? snapshotCandidate : null
      const snapshotEntries: [string, number][] = []
      if (snapshotRaw) {
        for (const [id, value] of Object.entries(snapshotRaw)) {
          if (!isNonEmptyString(id)) continue
          const quantity = Number(value)
          if (Number.isFinite(quantity) && quantity >= 0) {
            snapshotEntries.push([id, Math.floor(quantity)])
          }
        }
      }
      const itemsCandidate = dataRecord['items']
      if (!Array.isArray(itemsCandidate)) {
        serverSnapshotRef.current = new Map(snapshotEntries)
        return
      }
      const incomingItems: CartItem[] = itemsCandidate
        .map((item) => normalizeCartItem(item))
        .filter((item): item is CartItem => item !== null)
      if (incomingItems.length === 0) {
        serverSnapshotRef.current = new Map(snapshotEntries)
        return
      }

      const existingMap = new Map(state.items.map((item) => [item.id, item] as const))
      const mergedMap = new Map(existingMap)
      const previousSnapshot = new Map(serverSnapshotRef.current)
      const nextSnapshotEntries: [string, number][] = []

      for (const incoming of incomingItems) {
        if (!incoming?.id) continue
        const existing = existingMap.get(incoming.id)
        const previousServerQuantity = previousSnapshot.get(incoming.id) ?? 0
        const existingQuantity = existing?.quantity ?? 0
        const referenceQuantity = Math.max(previousServerQuantity, incoming.quantity)
        const guestContribution = existingQuantity - referenceQuantity
        const mergedQuantity = Math.max(incoming.quantity + guestContribution, 0)
        if (mergedQuantity > 0) {
          mergedMap.set(incoming.id, {
            ...(existing ?? incoming),
            ...incoming,
            quantity: mergedQuantity,
          })
        } else {
          mergedMap.delete(incoming.id)
        }
        nextSnapshotEntries.push([incoming.id, incoming.quantity])
      }

      const effectiveSnapshotEntries = snapshotEntries.length > 0 ? snapshotEntries : nextSnapshotEntries
      serverSnapshotRef.current = new Map(effectiveSnapshotEntries)
      dispatch({ type: 'SET_ITEMS', payload: Array.from(mergedMap.values()) })
    } catch (error) {
      console.error('Failed to sync cart from server:', error)
      hasSyncedServerCartRef.current = false
    }
  }, [hasLoadedLocalCart, state.items, updateSessionId, updateAuthState])

  useEffect(() => {
    if (!hasLoadedLocalCart) return
    syncCartFromServer()
  }, [hasLoadedLocalCart, syncCartFromServer])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!isAuthenticated && !sessionToken) {
      closeEventSource()
      return
    }

    let cancelled = false

    const connect = () => {
      if (cancelled) return
      closeEventSource()

      const params = new URLSearchParams()
      if (sessionToken) {
        params.set('sessionId', sessionToken)
      }
      const query = params.toString()
      const baseUrl = '/api/cart/events'
      const url = query.length > 0 ? `${baseUrl}?${query}` : baseUrl
      const source = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = source

      source.addEventListener('cart_updated', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data ?? '{}') as {
            sessionId?: string | null
            originSessionId?: string | null
            originClientId?: string | null
          }
          const originSession = typeof parsed.originSessionId === 'string' && parsed.originSessionId.trim().length > 0 ? parsed.originSessionId.trim() : null
          const originClient = typeof parsed.originClientId === 'string' && parsed.originClientId.trim().length > 0 ? parsed.originClientId.trim() : null
          const localClient = clientIdRef.current ?? ensureClientId()
          if (originClient && localClient && originClient === localClient) {
            return
          }
          if (originSession && sessionIdRef.current && originSession === sessionIdRef.current) {
            return
          }
        } catch {
          // Ignore malformed payloads
        }
        hasSyncedServerCartRef.current = false
        void syncCartFromServer()
      })

      source.addEventListener('error', () => {
        source.close()
        if (cancelled) return
        eventSourceRef.current = null
        if (typeof window !== 'undefined' && reconnectTimerRef.current === null) {
          reconnectTimerRef.current = window.setTimeout(() => {
            reconnectTimerRef.current = null
            connect()
          }, 2000)
        }
      })
    }

    connect()

    return () => {
      cancelled = true
      closeEventSource()
    }
  }, [sessionToken, isAuthenticated, syncCartFromServer, closeEventSource, ensureClientId])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleAuthChange = () => {
      hasSyncedServerCartRef.current = false
      updateAuthState(false)
      updateSessionId(null)
      closeEventSource()
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current)
        persistTimeoutRef.current = null
      }
      syncCartFromServer()
    }
    window.addEventListener('dyad-auth-changed', handleAuthChange)
    return () => window.removeEventListener('dyad-auth-changed', handleAuthChange)
  }, [syncCartFromServer, updateAuthState, updateSessionId, closeEventSource])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleMergeSuccess = () => {
      skipNextPersistRef.current = true
      serverSnapshotRef.current = new Map()
      updateSessionId(null)
      closeEventSource()
      try {
        localStorage.removeItem('dyad-cart')
      } catch {}
      hasSyncedServerCartRef.current = false
    }
    window.addEventListener('dyad-cart-merge-success', handleMergeSuccess)
    return () => window.removeEventListener('dyad-cart-merge-success', handleMergeSuccess)
  }, [updateSessionId, closeEventSource])

  const persistCartToServer = useCallback(
    async (items: CartItem[]) => {
      if (!hasLoadedLocalCart || typeof window === 'undefined') return

      const currentSnapshot = new Map<string, number>()
      for (const item of items) {
        if (!item?.id) continue
        const quantity = Math.max(0, Math.floor(item.quantity))
        if (quantity <= 0) continue
        currentSnapshot.set(item.id, quantity)
      }

      const previousSnapshot = serverSnapshotRef.current
      let isDifferent = currentSnapshot.size !== previousSnapshot.size
      if (!isDifferent) {
        for (const [id, quantity] of currentSnapshot.entries()) {
          if ((previousSnapshot.get(id) ?? 0) !== quantity) {
            isDifferent = true
            break
          }
        }
      }

      if (!isDifferent) {
        return
      }

      try {
        const clientId = ensureClientId()
        const response = await fetch('/api/cart', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: Array.from(currentSnapshot.entries()).map(([id, quantity]) => ({
              id,
              quantity,
            })),
            sessionId: sessionIdRef.current ?? undefined,
            clientId,
          }),
        })

        if (response.status === 401) {
          updateAuthState(false)
          updateSessionId(null)
          return
        }

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`)
        }

        updateAuthState(true)

        const data = (await response.json().catch(() => null)) as unknown
        const snapshotRaw = isRecord(data) ? (data as Record<string, unknown>).snapshot : null
        if (isRecord(snapshotRaw)) {
          const nextEntries: [string, number][] = []
          for (const [id, value] of Object.entries(snapshotRaw)) {
            if (typeof id !== 'string') continue
            const quantity = Number(value)
            if (Number.isFinite(quantity) && quantity >= 0) {
              nextEntries.push([id, Math.floor(quantity)])
            }
          }
          serverSnapshotRef.current = new Map(nextEntries)
        } else {
          serverSnapshotRef.current = new Map(currentSnapshot)
        }
        const nextSessionId = isRecord(data) && isNonEmptyString(data.sessionId) ? data.sessionId : null
        updateSessionId(nextSessionId)
      } catch (error) {
        console.error('Failed to persist cart to server:', error)
      }
    },
    [hasLoadedLocalCart, updateSessionId, updateAuthState, ensureClientId],
  )

  useEffect(() => {
    if (!hasLoadedLocalCart) return
    if (!isAuthenticated) return
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current)
    }
    const itemsSnapshot = state.items
    persistTimeoutRef.current = setTimeout(() => {
      persistTimeoutRef.current = null
      void persistCartToServer(itemsSnapshot)
    }, 400)
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current)
        persistTimeoutRef.current = null
      }
    }
  }, [state.items, hasLoadedLocalCart, persistCartToServer, isAuthenticated])

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

  const addItem = (item: CartItemInput) => {
    const normalizedId = normalizeItemId(item.id)
    if (!normalizedId) return

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        id: normalizedId,
      },
    })
  }

  const removeItem = (id: string | number) => {
    const normalizedId = normalizeItemId(id)
    if (!normalizedId) return
    dispatch({ type: 'REMOVE_ITEM', payload: normalizedId })
  }

  const updateQuantity = (id: string | number, quantity: number) => {
    const normalizedId = normalizeItemId(id)
    if (!normalizedId) return
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: normalizedId, quantity } })
  }

  const clearCart = () => {
    serverSnapshotRef.current = new Map()
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
