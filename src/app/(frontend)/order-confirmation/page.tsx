import React, { Suspense } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { ConfirmationClient } from './ConfirmationClient'

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams?.orderId

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader variant="full" user={undefined as any} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/">← Back to Home</Link>
        </Button>

        <Suspense fallback={<div className="text-sm text-gray-600">Loading confirmation…</div>}>
          <ConfirmationClient orderId={orderId} />
        </Suspense>
      </div>
    </div>
  )
}
