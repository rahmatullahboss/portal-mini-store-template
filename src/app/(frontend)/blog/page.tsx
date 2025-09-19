import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Post } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Blog | Online Bazar',
  description: 'Latest news and updates from Online Bazar',
}

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise })
  
  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedDate',
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.docs.map((post: Post) => (
          <div key={post.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            {post.featuredImage && typeof post.featuredImage !== 'number' && post.featuredImage.url && (
              <img 
                src={payload.config.serverURL + post.featuredImage.url} 
                alt={post.title} 
                className="w-full h-48 object-cover"
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
              {post.excerpt && (
                <p className="text-gray-700">{post.excerpt}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}