import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

const DEFAULT_TITLE = 'Free shipping on orders over 2000 taka'
const DEFAULT_SUBTITLE = 'Digital wallet payments have a flat Tk 20 delivery charge.'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "delivery_settings"
      ADD COLUMN IF NOT EXISTS "digital_payment_delivery_charge" numeric DEFAULT 20 NOT NULL;
    ALTER TABLE "delivery_settings"
      ADD COLUMN IF NOT EXISTS "shipping_highlight_title" varchar DEFAULT ${DEFAULT_TITLE} NOT NULL;
    ALTER TABLE "delivery_settings"
      ADD COLUMN IF NOT EXISTS "shipping_highlight_subtitle" varchar DEFAULT ${DEFAULT_SUBTITLE} NOT NULL;

    UPDATE "delivery_settings"
    SET
      "digital_payment_delivery_charge" = COALESCE("digital_payment_delivery_charge", 20),
      "shipping_highlight_title" = CASE
        WHEN TRIM(COALESCE("shipping_highlight_title", '')) = '' THEN ${DEFAULT_TITLE}
        ELSE "shipping_highlight_title"
      END,
      "shipping_highlight_subtitle" = CASE
        WHEN TRIM(COALESCE("shipping_highlight_subtitle", '')) = '' THEN ${DEFAULT_SUBTITLE}
        ELSE "shipping_highlight_subtitle"
      END;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "delivery_settings"
      DROP COLUMN IF EXISTS "digital_payment_delivery_charge",
      DROP COLUMN IF EXISTS "shipping_highlight_title",
      DROP COLUMN IF EXISTS "shipping_highlight_subtitle";
  `)
}
