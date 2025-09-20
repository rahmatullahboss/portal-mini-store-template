import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'
import { SiteHeader } from '@/components/site-header'
import { BlogImage } from '@/components/blog-image'

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
    depth: 1, // Fetch related data like featuredImage
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

  // Function to get image URL
  const getImageUrl = (image: any): string => {
    if (!image) return '/placeholder-image.svg'

    // If it's already a string URL
    if (typeof image === 'string') {
      return image.startsWith('http') ? image : `${payload.config.serverURL || ''}${image}`
    }

    // If it's an object with a URL property
    if (typeof image === 'object' && image.url) {
      return image.url.startsWith('http')
        ? image.url
        : `${payload.config.serverURL || ''}${image.url}`
    }

    return '/placeholder-image.svg'
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-stone-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.35),_transparent_65%)] motion-reduce:opacity-25"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.3),_transparent_60%)] motion-reduce:opacity-25 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(147,197,253,0.25),_transparent_60%)] motion-reduce:opacity-20 animation-delay-4000"></div>
      </div>

      <div className="relative z-20">
        <SiteHeader variant="full" user={user} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pt-12 pb-32">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl font-bold brand-text">Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Latest news and updates from Online Bazar
          </p>
        </div>

        {posts.docs.length === 0 ? (
          <div className="text-center py-20">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mx-auto flex items-center justify-center">
                <span className="text-3xl">📰</span>
              </div>
              <p className="text-gray-600 text-xl">No blog posts available yet</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {posts.docs.map((post: Post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group relative overflow-hidden rounded-3xl border-2 border-gray-200/60 bg-white shadow-xl transition-all duration-700 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 hover:border-amber-300/60 transform-group-0 md:bg-white/95 md:backdrop-blur-xl gap-0 p-0 block"
              >
                {/* Enhanced Card Glow Effect */}
                <div className="absolute inset-0 hidden md:block md:bg-gradient-to-br md:from-amber-100/30 md:via-rose-100/20 md:to-blue-100/30 md:opacity-0 md:group-hover:opacity-100 md:transition-all md:duration-700"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 hidden motion-safe:md:block motion-safe:md:-translate-x-full motion-safe:md:group-hover:translate-x-full motion-safe:md:transition-transform motion-safe:md:duration-1000 md:bg-gradient-to-r md:from-transparent md:via-white/20 md:to-transparent md:skew-x-12"></div>

                <div className="relative z-10 h-full flex flex-col">
                  {post.featuredImage && (
                    <div className="relative aspect-[5/4] overflow-hidden rounded-t-3xl">
                      <BlogImage
                        src={getImageUrl(post.featuredImage)}
                        alt={post.title || 'Blog post image'}
                        className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:saturate-110"
                      />
                      {/* Image Overlay */}
                      <div className="absolute inset-0 hidden md:block md:bg-gradient-to-t md:from-gray-900/30 md:via-transparent md:to-transparent md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-500"></div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-300 leading-tight mb-2">
                      {post.title}
                    </h2>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <span>
                        {post.publishedDate && new Date(post.publishedDate).toLocaleDateString()}
                      </span>
                    </div>

                    {post.excerpt ? (
                      <p className="text-gray-700 mb-4 flex-grow">{post.excerpt}</p>
                    ) : post.content ? (
                      <p className="text-gray-700 mb-4 flex-grow">
                        {renderPlainText(post.content).substring(0, 150)}...
                      </p>
                    ) : null}

                    <div className="mt-auto">
                      <span className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium">
                        Read more →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
