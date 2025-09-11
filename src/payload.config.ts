// storage adapters
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { s3Storage } from '@payloadcms/storage-s3'
import nodemailer from 'nodemailer'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Items } from './collections/Items'
import { Categories } from './collections/Categories'
import { Orders } from './collections/Orders'
import { Reviews } from './collections/Reviews'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const getServerSideURL = () => {
  // Prefer explicitly provided public URL
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL

  // In Vercel, VERCEL_URL is set per-deployment (includes preview domains)
  const vercelURL = process.env.VERCEL_URL
  const vercelProdURL = process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (explicit) return explicit
  if (vercelURL) return `https://${vercelURL}`
  if (vercelProdURL) return `https://${vercelProdURL}`

  return undefined as unknown as string
}

const storagePlugins = [] as any[]

// Prefer Vercel Blob if configured; otherwise fall back to S3 if configured
if (process.env.BLOB_READ_WRITE_TOKEN) {
  storagePlugins.push(
    vercelBlobStorage({
      enabled: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Apply to the Payload 'media' collection
      collections: {
        media: {
          // optional: keep uploads under a folder-like prefix
          prefix: 'uploads',
        },
      },
      // optional flags
      // addRandomSuffix: true,
      // clientUploads: false, // enable if you need >4.5MB files on Vercel
    }),
  )
} else if (
  process.env.S3_BUCKET &&
  process.env.S3_REGION &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY
) {
  storagePlugins.push(
    s3Storage({
      bucket: process.env.S3_BUCKET as string,
      collections: {
        media: {
          prefix: 'uploads',
        },
      },
      config: {
        region: process.env.S3_REGION as string,
        ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
        },
      },
    }),
  )
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: getServerSideURL(),
  // Allow current deployment URL and localhost for dev
  cors: [getServerSideURL(), 'http://localhost:3000'].filter(Boolean) as string[],
  plugins: storagePlugins,
  collections: [Users, Media, Items, Categories, Orders, Reviews],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      // Prefer POSTGRES_URL, fallback to DATABASE_URL for hosts that provide that
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
    },
    // When set to undefined or true, Payload will automatically push DB
    // changes in dev environment.
    push: process.env.DYAD_DISABLE_DB_PUSH === 'true' ? false : undefined,
  }),
  sharp,
  email: nodemailerAdapter({
    defaultFromAddress: process.env.GMAIL_USER || '',
    defaultFromName: process.env.EMAIL_DEFAULT_FROM_NAME || 'Online Bazar',
    transport: await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    }),
  }),
})
