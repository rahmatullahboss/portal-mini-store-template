import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Online Bazar',
  description: 'Latest news and updates from Online Bazar',
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  // This is a placeholder page that will be populated dynamically
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <p>Loading blog posts...</p>
    </div>
  )
}
