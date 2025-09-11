import React from 'react'
import { CartProvider } from '@/lib/cart-context'
import { CartSidebar } from '@/components/cart-sidebar'
import { SiteFooter } from '@/components/site-footer'
import '../globals.css'
import { Toaster } from '@/components/ui/sonner'

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
        </CartProvider>
      </body>
    </html>
  )
}
