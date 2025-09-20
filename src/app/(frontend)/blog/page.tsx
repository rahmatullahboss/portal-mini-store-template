import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'
import { SiteHeader } from '@/components/site-header'

export const metadata: Metadata = {
  title: 'Blog | Online Bazar',
  description: 'Latest news and updates from Online Bazar',
}

export default async function BlogPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  // Get user for header
  const authResult = await payload.auth({ headers })
  const user = authResult?.user ?? null

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedDate',
  })

  // Function to render rich text content as plain text for excerpt
  const renderPlainText = (content: any): string => {
    if (!content) return ''

    if (Array.isArray(content)) {
      return content
        .map((node) => {
          if (typeof node === 'string') {
            return node
          }
          if (typeof node === 'object' && node !== null) {
            if (node.text) {
              return node.text
            }
            if (node.children) {
              return renderPlainText(node.children)
            }
          }
          return ''
        })
        .join(' ')
    }

    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-stone-100">
      <SiteHeader variant="full" user={user} />
      <div className="container mx-auto px-4 py-8 pt-32">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.docs.map((post: Post) => (
            <div
              key={post.id}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white"
            >
              {post.featuredImage &&
                typeof post.featuredImage !== 'number' &&
                post.featuredImage.url && (
                  <img
                    src={
                      payload.config.serverURL
                        ? `${payload.config.serverURL}${post.featuredImage.url}`
                        : post.featuredImage.url
                    }
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.svg' // Fallback image
                    }}
                  />
                )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  {post.publishedDate && new Date(post.publishedDate).toLocaleDateString()}
                </p>
                {post.excerpt ? (
                  <p className="text-gray-700">{post.excerpt}</p>
                ) : post.content ? (
                  <p className="text-gray-700">
                    {renderPlainText(post.content).substring(0, 150)}...
                  </p>
                ) : null}
                <div className="mt-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
