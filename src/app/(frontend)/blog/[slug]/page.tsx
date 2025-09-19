import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Post, Media, User } from '@/payload-types'
import RichText from '@/components/RichText'

interface BlogPostProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const payload = await getPayload({ config })

  const post = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: params.slug,
      },
      status: {
        equals: 'published',
      },
    },
  })

  if (!post.docs.length) {
    return {
      title: 'Post Not Found',
    }
  }

  const postData = post.docs[0] as Post

  return {
    title: `${postData.title} | Blog | Online Bazar`,
    description: postData.excerpt || 'Read this blog post on Online Bazar',
  }
}

export default async function BlogPost({ params }: BlogPostProps) {
  const payload = await getPayload({ config })

  const post = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: params.slug,
      },
      status: {
        equals: 'published',
      },
    },
  })

  if (!post.docs.length) {
    notFound()
  }

  const postData = post.docs[0] as Post

  // Get author name
  let authorName = ''
  if (postData.author) {
    if (typeof postData.author === 'number') {
      const author = await payload.findByID({
        collection: 'users',
        id: postData.author,
      })
      authorName = `${author.firstName} ${author.lastName}`
    } else {
      const author = postData.author as User
      authorName = `${author.firstName} ${author.lastName}`
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>

        <div className="flex items-center text-gray-600 mb-6">
          {authorName && <span className="mr-4">By {authorName}</span>}
          <time dateTime={postData.publishedDate}>
            {format(new Date(postData.publishedDate), 'MMMM d, yyyy')}
          </time>
        </div>

        {postData.featuredImage &&
          typeof postData.featuredImage !== 'number' &&
          'url' in postData.featuredImage && (
            <div className="mb-8">
              <img
                src={postData.featuredImage.url || ''}
                alt={postData.featuredImage.alt || postData.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

        <div className="prose max-w-none">
          {postData.content && <RichText content={postData.content} />}
        </div>
      </article>
    </div>
  )
}
