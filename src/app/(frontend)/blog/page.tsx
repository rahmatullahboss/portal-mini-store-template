import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Post, Media } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Blog | Online Bazar',
  description: 'Latest news and updates from Online Bazar',
}

async function getPublishedPosts() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedDate',
  })

  return posts
}

export default async function BlogPage() {
  const { docs: posts } = await getPublishedPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p>No blog posts published yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {post.featuredImage &&
                typeof post.featuredImage !== 'number' &&
                'url' in post.featuredImage && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featuredImage.url || ''}
                      alt={post.featuredImage.alt || post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {format(new Date(post.publishedDate), 'MMMM d, yyyy')}
                </p>
                {post.excerpt && <p className="text-gray-700 mb-4">{post.excerpt}</p>}
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read more
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
