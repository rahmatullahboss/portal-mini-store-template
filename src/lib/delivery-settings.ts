export type DeliverySettings = {
  insideDhakaCharge: number
  outsideDhakaCharge: number
  freeDeliveryThreshold: number
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  freeDeliveryThreshold: 2000,
}

const toPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

export const normalizeDeliverySettings = (raw: any): DeliverySettings => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_DELIVERY_SETTINGS }
  }

  return {
    insideDhakaCharge: toPositiveNumber((raw as any).insideDhakaCharge, DEFAULT_DELIVERY_SETTINGS.insideDhakaCharge),
    outsideDhakaCharge: toPositiveNumber((raw as any).outsideDhakaCharge, DEFAULT_DELIVERY_SETTINGS.outsideDhakaCharge),
    freeDeliveryThreshold: toPositiveNumber((raw as any).freeDeliveryThreshold, DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold),
  }
}
