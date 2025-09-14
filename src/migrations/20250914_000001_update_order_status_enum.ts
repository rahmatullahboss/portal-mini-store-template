import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add new values to enum_orders_status enum type
    ALTER TYPE "public"."enum_orders_status" ADD VALUE 'processing' BEFORE 'completed';
    ALTER TYPE "public"."enum_orders_status" ADD VALUE 'shipped' BEFORE 'completed';
    ALTER TYPE "public"."enum_orders_status" ADD VALUE 'refunded' AFTER 'cancelled';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Note: In PostgreSQL, you cannot directly remove values from an enum type.
  // To fully rollback this migration, you would need to:
  // 1. Create a new enum type with the original values
  // 2. Update all columns using the enum to use the new type
  // 3. Drop the old enum type
  // 4. Rename the new enum type to the original name
  //
  // This is a complex operation that can be risky in production,
  // so we'll leave the enum values in place for safety.
  console.log('Rollback: Keeping enum values in place for safety')
}
