export const track = (event: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push({ event, ...(data || {}) })
  }
}
