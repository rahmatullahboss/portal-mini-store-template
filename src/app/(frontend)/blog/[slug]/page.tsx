import React from 'react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  // This is a placeholder page that will be populated dynamically
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Loading post...</h1>
        <p>The blog post content will be loaded here.</p>
      </article>
    </div>
  )
}
