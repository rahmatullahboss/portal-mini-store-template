import React from 'react'
import dynamic from 'next/dynamic'

import { CartProvider } from '@/lib/cart-context'
import { SiteFooter } from '@/components/site-footer'
import '../globals.css'
import { Toaster } from '@/components/ui/sonner'

// Lazily load heavier client components to reduce initial bundle size
const CartSidebar = dynamic(() => import('@/components/cart-sidebar'), {
  ssr: false,
})
const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false },
)
const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: false },
)

export const metadata = {
  description: 'Online Bazar — a mini store template powered by Payload.',
  title: 'Online Bazar',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <CartProvider>
          <main>{children}</main>
          <SiteFooter />
          <CartSidebar />
          <Toaster richColors position="top-center" />
          <Analytics />
          <SpeedInsights />
        </CartProvider>
      </body>
    </html>
  )
}
