import { withPayload } from '@payloadcms/next/withPayload'
import { NextConfig } from 'next'
import type { RemotePattern } from 'next/dist/shared/lib/image-config'

const s3HostEnv = process.env.NEXT_PUBLIC_IMAGE_HOSTNAME || process.env.S3_PUBLIC_DOMAIN
const dynamicRemotePatterns: RemotePattern[] = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
]
if (s3HostEnv) {
  dynamicRemotePatterns.push({
    protocol: 'https',
    hostname: String(s3HostEnv).replace(/^https?:\/\//, ''),
  })
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
  },
  // Your Next.js config here
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
