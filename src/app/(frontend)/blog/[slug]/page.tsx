import React from 'react'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'
import RichText from '@/components/RichText'

export const dynamic = 'force-dynamic'

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
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
    depth: 2, // Fetch related data like author and featuredImage
  })

  if (!posts.docs.length) {
    notFound()
  }

  const post: Post = posts.docs[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center text-gray-600 mb-6">
          <span>{post.publishedDate && new Date(post.publishedDate).toLocaleDateString()}</span>
          {post.author && typeof post.author !== 'number' && (
            <span className="ml-4">
              By {post.author.firstName} {post.author.lastName}
            </span>
          )}
        </div>

        {post.featuredImage && typeof post.featuredImage !== 'number' && post.featuredImage.url && (
          <img
            src={payload.config.serverURL + post.featuredImage.url}
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
      </article>
    </div>
  )
}
