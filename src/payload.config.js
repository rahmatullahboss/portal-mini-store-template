"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerSideURL = void 0;
// storage adapters
const storage_vercel_blob_1 = require("@payloadcms/storage-vercel-blob");
const storage_s3_1 = require("@payloadcms/storage-s3");
const nodemailer_1 = require("nodemailer");
const db_vercel_postgres_1 = require("@payloadcms/db-vercel-postgres");
const email_nodemailer_1 = require("@payloadcms/email-nodemailer");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const path_1 = require("path");
const payload_1 = require("payload");
const url_1 = require("url");
const sharp_1 = require("sharp");
const Users_1 = require("./collections/Users");
const Media_1 = require("./collections/Media");
const Items_1 = require("./collections/Items");
const Categories_1 = require("./collections/Categories");
const Orders_1 = require("./collections/Orders");
const AbandonedCarts_1 = require("./collections/AbandonedCarts");
const Reviews_1 = require("./collections/Reviews");
const filename = (0, url_1.fileURLToPath)(import.meta.url);
const dirname = path_1.default.dirname(filename);
const getServerSideURL = () => {
    // Prefer explicitly provided public URL
    const explicit = process.env.NEXT_PUBLIC_SERVER_URL;
    // In Vercel, VERCEL_URL is set per-deployment (includes preview domains)
    const vercelURL = process.env.VERCEL_URL;
    const vercelProdURL = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (explicit)
        return explicit;
    if (vercelURL)
        return `https://${vercelURL}`;
    if (vercelProdURL)
        return `https://${vercelProdURL}`;
    return undefined;
};
exports.getServerSideURL = getServerSideURL;
const storagePlugins = [];
// Prefer Vercel Blob if configured; otherwise fall back to S3 if configured
if (process.env.BLOB_READ_WRITE_TOKEN) {
    storagePlugins.push((0, storage_vercel_blob_1.vercelBlobStorage)({
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
    }));
}
else if (process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY) {
    storagePlugins.push((0, storage_s3_1.s3Storage)({
        bucket: process.env.S3_BUCKET,
        collections: {
            media: {
                prefix: 'uploads',
            },
        },
        config: {
            region: process.env.S3_REGION,
            ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
        },
    }));
}
exports.default = (0, payload_1.buildConfig)({
    admin: {
        user: Users_1.Users.slug,
        importMap: {
            baseDir: path_1.default.resolve(dirname),
        },
        components: {
            beforeDashboard: ['@/components/before-dashboard'],
        },
    },
    serverURL: (0, exports.getServerSideURL)(),
    // Allow current deployment URL and localhost for dev
    cors: [(0, exports.getServerSideURL)(), 'http://localhost:3000'].filter(Boolean),
    plugins: storagePlugins,
    collections: [Users_1.Users, Media_1.Media, Items_1.Items, Categories_1.Categories, Orders_1.Orders, Reviews_1.Reviews, AbandonedCarts_1.AbandonedCarts],
    editor: (0, richtext_lexical_1.lexicalEditor)(),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path_1.default.resolve(dirname, 'payload-types.ts'),
    },
    db: (0, db_vercel_postgres_1.vercelPostgresAdapter)({
        pool: {
            // Prefer POSTGRES_URL, fallback to DATABASE_URL for hosts that provide that
            connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
        },
        // When set to undefined or true, Payload will automatically push DB
        // changes in dev environment.
        push: process.env.NODE_ENV === 'production' ? false : (process.env.DYAD_DISABLE_DB_PUSH === 'true' ? false : undefined),
    }),
    sharp: sharp_1.default,
    email: (0, email_nodemailer_1.nodemailerAdapter)({
        defaultFromAddress: process.env.GMAIL_USER || '',
        defaultFromName: process.env.EMAIL_DEFAULT_FROM_NAME || 'Online Bazar',
        transport: await nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        }),
    }),
});
