const CART_REGISTRY_SYMBOL = Symbol.for('portal.cart.realtime.registry')

interface CartSubscriber {
  id: string
  controller: ReadableStreamDefaultController<Uint8Array>
  channels: Set<string>
  heartbeat?: NodeJS.Timeout
  cleanup?: () => void
}

interface CartRealtimeRegistry {
  channels: Map<string, Set<CartSubscriber>>
}

export type CartRealtimeEventType = 'cart_updated'

export interface CartRealtimePayload {
  type: CartRealtimeEventType
  sessionId: string | null
  originSessionId: string | null
  userId: string | null
  updatedAt: string
}

const encoder = new TextEncoder()

const getRegistry = (): CartRealtimeRegistry => {
  const globalTarget = globalThis as unknown as Record<PropertyKey, unknown>
  const existing = globalTarget[CART_REGISTRY_SYMBOL] as CartRealtimeRegistry | undefined
  if (existing) {
    return existing
  }
  const next: CartRealtimeRegistry = {
    channels: new Map(),
  }
  globalTarget[CART_REGISTRY_SYMBOL] = next
  return next
}

const createSubscriberId = (): string => 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)

const normalizeKey = (key: string | null | undefined): string | null => {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const buildCartChannels = (identifiers: {
  userId?: string | number | null
  sessionId?: string | null
}): string[] => {
  const keys = new Set<string>()

  if (typeof identifiers.userId === 'number' || typeof identifiers.userId === 'string') {
    const normalizedUser = normalizeKey(String(identifiers.userId))
    if (normalizedUser) {
      keys.add('user:' + normalizedUser)
    }
  }

  const normalizedSession = normalizeKey(identifiers.sessionId ?? null)
  if (normalizedSession) {
    keys.add('session:' + normalizedSession)
  }

  return Array.from(keys)
}

const removeSubscriber = (subscriber: CartSubscriber) => {
  const registry = getRegistry()
  for (const channel of subscriber.channels) {
    const subscribers = registry.channels.get(channel)
    if (!subscribers) continue
    subscribers.delete(subscriber)
    if (subscribers.size === 0) {
      registry.channels.delete(channel)
    }
  }
  if (subscriber.heartbeat) {
    clearInterval(subscriber.heartbeat)
  }
  subscriber.cleanup = undefined
}

export const registerCartSubscriber = (
  channelKeys: string[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  options?: { signal?: AbortSignal },
): (() => void) => {
  const normalizedKeys = Array.from(
    new Set(
      channelKeys
        .map((raw) => normalizeKey(raw))
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  if (normalizedKeys.length === 0) {
    return () => {}
  }

  const registry = getRegistry()

  const subscriber: CartSubscriber = {
    id: createSubscriberId(),
    controller,
    channels: new Set(normalizedKeys),
  }

  let closed = false

  const cleanup = () => {
    if (closed) return
    closed = true
    removeSubscriber(subscriber)
  }

  subscriber.cleanup = cleanup

  for (const key of normalizedKeys) {
    const subscribers = registry.channels.get(key)
    if (subscribers) {
      subscribers.add(subscriber)
    } else {
      registry.channels.set(key, new Set([subscriber]))
    }
  }

  const heartbeat = setInterval(() => {
    try {
      controller.enqueue(encoder.encode('event: ping\ndata: ' + Date.now() + '\n\n'))
    } catch {
      cleanup()
    }
  }, 30000)

  subscriber.heartbeat = heartbeat

  if (options?.signal) {
    if (options.signal.aborted) {
      cleanup()
    } else {
      options.signal.addEventListener('abort', cleanup, { once: true })
    }
  }

  return cleanup
}

export const broadcastCartUpdate = (channelKeys: string[], payload: CartRealtimePayload) => {
  const normalizedKeys = Array.from(
    new Set(
      channelKeys
        .map((raw) => normalizeKey(raw))
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  )

  if (normalizedKeys.length === 0) {
    return
  }

  const registry = getRegistry()
  const dataString = JSON.stringify(payload)
  const message = encoder.encode('event: ' + payload.type + '\ndata: ' + dataString + '\n\n')

  for (const key of normalizedKeys) {
    const subscribers = registry.channels.get(key)
    if (!subscribers || subscribers.size === 0) continue

    for (const subscriber of Array.from(subscribers)) {
      try {
        subscriber.controller.enqueue(message)
      } catch {
        subscriber.cleanup?.()
      }
    }
  }
}
