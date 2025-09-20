import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers.js'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'
import RichText from '@/components/RichText'
import { SiteHeader } from '@/components/site-header'
import { BlogImage } from '@/components/blog-image'

export const dynamic = 'force-dynamic'

// Function to get image URL
const getImageUrl = (image: any, serverURL: string): string => {
  if (!image) return '/og-image.png'

  // If it's already a string URL
  if (typeof image === 'string') {
    return image.startsWith('http') ? image : `${serverURL || ''}${image}`
  }

  // If it's an object with a URL property
  if (typeof image === 'object' && image.url) {
    return image.url.startsWith('http') ? image.url : `${serverURL || ''}${image.url}`
  }

  return '/og-image.png'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const payload = await getPayload({ config: configPromise })

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
    depth: 1,
  })

  if (!posts.docs.length) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const post: Post = posts.docs[0]
  const serverURL = payload.config.serverURL || 'http://localhost:3000'

  // Get the featured image URL or fallback to og-image.png
  const imageUrl = post.featuredImage ? getImageUrl(post.featuredImage, serverURL) : '/og-image.png'

  return {
    title: post.title,
    description:
      post.excerpt || (post.content ? 'Read more about this topic' : 'Online Bazar blog post'),
    openGraph: {
      title: post.title,
      description:
        post.excerpt || (post.content ? 'Read more about this topic' : 'Online Bazar blog post'),
      url: `${serverURL}/blog/${slug}`,
      siteName: 'Online Bazar',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title || 'Blog post image',
        },
      ],
      type: 'article',
      publishedTime: post.publishedDate,
      authors:
        post.author && typeof post.author !== 'number'
          ? [`${post.author.firstName} ${post.author.lastName}`]
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description:
        post.excerpt || (post.content ? 'Read more about this topic' : 'Online Bazar blog post'),
      images: [imageUrl],
    },
  }
}

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

  // Function to get image URL
  const getImageUrl = (image: any): string => {
    if (!image) return '/og-image.png'

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

    return '/og-image.png'
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

      <div className="relative z-10 container mx-auto px-4 py-8 pt-8 pb-20">
        <article className="max-w-3xl mx-auto">
          {/* Increased padding for the post header by 8px */}
          <div className="py-12 px-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6"
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
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm">
                  {post.category.name}
                </span>
              )}
            </div>
          </div>

          {post.featuredImage && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden mb-8 shadow-lg">
              <BlogImage
                src={getImageUrl(post.featuredImage)}
                alt={post.title || 'Blog post image'}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          {post.content && (
            <div className="prose max-w-none mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <RichText content={post.content} />
            </div>
          )}

          {post.excerpt && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
              <h3 className="font-semibold mb-2 text-amber-800">Summary:</h3>
              <p className="text-gray-700">{post.excerpt}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center text-amber-600 hover:text-amber-700"
            >
              ← Back to Blog
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
