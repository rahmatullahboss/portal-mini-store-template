import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'
import RichText from '@/components/RichText'
import { SiteHeader } from '@/components/site-header'
import { ImageWithFallback } from '@/components/image-with-fallback'

export const dynamic = 'force-dynamic'

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  // Get user for header
  const authResult = await payload.auth({ headers })
  const user = authResult?.user ?? null

  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: 'published',
      },
    },
    limit: 1,
    depth: 2, // Fetch related data like author and featuredImage
  })

  if (!posts.docs.length) {
    notFound()
  }

  const post: Post = posts.docs[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-stone-100">
      <SiteHeader variant="full" user={user} />
      <div className="container mx-auto px-4 py-8 pt-32">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            ← Back to Blog
          </Link>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center text-gray-600 mb-6 gap-4">
            <span>{post.publishedDate && new Date(post.publishedDate).toLocaleDateString()}</span>
            {post.author && typeof post.author !== 'number' && (
              <span>
                By {post.author.firstName} {post.author.lastName}
              </span>
            )}
            {post.category && typeof post.category !== 'number' && (
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">{post.category.name}</span>
            )}
          </div>

          {post.featuredImage &&
            typeof post.featuredImage !== 'number' &&
            post.featuredImage.url && (
              <ImageWithFallback
                src={
                  payload.config.serverURL
                    ? `${payload.config.serverURL}${post.featuredImage.url}`
                    : post.featuredImage.url
                }
                alt={post.title}
                className="w-full h-auto rounded-lg mb-6"
              />
            )}

          {post.content && (
            <div className="prose max-w-none">
              <RichText content={post.content} />
            </div>
          )}

          {post.excerpt && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p>{post.excerpt}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              ← Back to Blog
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
