import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'

const s3OrBlobHostEnv =
  process.env.NEXT_PUBLIC_IMAGE_HOSTNAME ||
  process.env.S3_PUBLIC_DOMAIN ||
  process.env.BLOB_PUBLIC_HOST ||
  process.env.BLOB_PUBLIC_DOMAIN

// Derive Blob hostname from token if provided
const blobHostFromToken = (() => {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const match = token?.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)
  const id = match?.[1]?.toLowerCase()
  return id ? `${id}.public.blob.vercel-storage.com` : undefined
})()

const dynamicRemotePatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'images.unsplash.com' },
]

for (const host of [s3OrBlobHostEnv, blobHostFromToken]) {
  if (host) {
    dynamicRemotePatterns.push({
      protocol: 'https',
      hostname: String(host).replace(/^https?:\/\//, ''),
    })
  }
}

// Also allow this app's own deployment host so absolute URLs like
// https://<app-domain>/api/media/file/<filename> can be optimized by Next/Image.
const vercelHosts = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
for (const host of vercelHosts) {
  if (host) {
    dynamicRemotePatterns.push({
      protocol: 'https',
      hostname: String(host).replace(/^https?:\/\//, ''),
    })
  }
}

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: '@dyad-sh/nextjs-webpack-component-tagger',
      })
    }
    return config
  },
  images: {
    remotePatterns: dynamicRemotePatterns,
    formats: ['image/avif', 'image/webp'],
    // Favor smaller device sizes for mobile-first loading
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
  },
  // Your Next.js config here
  experimental: {
    // Reduce JS by optimizing common lib imports
    optimizePackageImports: [
      'date-fns',
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'embla-carousel-react',
      'recharts',
      'react-day-picker',
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
