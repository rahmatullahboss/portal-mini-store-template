import React from 'react'
import type { Metadata } from 'next'

import { CartProvider } from '@/lib/cart-context'
import { SiteFooter } from '@/components/site-footer'
import '../globals.css'
import {
  CartSidebar,
  Analytics,
  SpeedInsights,
  Toaster,
} from '@/components/lazy-client-components'

export const metadata: Metadata = {
  description: 'Online Bazar — a mini store template powered by Payload.',
  title: 'Online Bazar',
  openGraph: {
    title: 'Online Bazar',
    description: 'Online Bazar — a mini store template powered by Payload.',
    url: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
    siteName: 'Online Bazar',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Online Bazar preview',
      },
    ],
    type: 'website',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q3LY08VXYN"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-Q3LY08VXYN');
            `,
          }}
        />
      </head>
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
