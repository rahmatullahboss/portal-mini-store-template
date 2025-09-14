'use client'

import dynamic from 'next/dynamic'

export const CartSidebar = dynamic(
  () => import('@/components/cart-sidebar').then((mod) => mod.CartSidebar),
  { ssr: false },
)
export const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false },
)
export const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false },
)
