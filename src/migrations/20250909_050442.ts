import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "address_line1" varchar;
  ALTER TABLE "users" ADD COLUMN "address_line2" varchar;
  ALTER TABLE "users" ADD COLUMN "address_city" varchar;
  ALTER TABLE "users" ADD COLUMN "address_state" varchar;
  ALTER TABLE "users" ADD COLUMN "address_postal_code" varchar;
  ALTER TABLE "users" ADD COLUMN "address_country" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_line1" varchar NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_line2" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_city" varchar NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_state" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_postal_code" varchar NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "shipping_address_country" varchar NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "address_line1";
  ALTER TABLE "users" DROP COLUMN "address_line2";
  ALTER TABLE "users" DROP COLUMN "address_city";
  ALTER TABLE "users" DROP COLUMN "address_state";
  ALTER TABLE "users" DROP COLUMN "address_postal_code";
  ALTER TABLE "users" DROP COLUMN "address_country";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_line1";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_line2";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_city";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_state";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_postal_code";
  ALTER TABLE "orders" DROP COLUMN "shipping_address_country";`)
}
