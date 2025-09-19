import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Add the missing column for posts relationship in payload_locked_documents_rels table
  await payload.db.drizzle.execute(`
    ALTER TABLE payload_locked_documents_rels 
    ADD COLUMN IF NOT EXISTS posts_id INTEGER REFERENCES posts(id) ON DELETE CASCADE;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Remove the column if needed
  await payload.db.drizzle.execute(`
    ALTER TABLE payload_locked_documents_rels 
    DROP COLUMN IF EXISTS posts_id;
  `)
}
