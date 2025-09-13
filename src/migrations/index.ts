import * as migration_20250908_055127 from './20250908_055127';
import * as migration_20250909_050442 from './20250909_050442';
import * as migration_20250909_120000_add_customer_number_to_orders from './20250909_120000_add_customer_number_to_orders';
import * as migration_20250909_123000_guest_checkout_orders_fields from './20250909_123000_guest_checkout_orders_fields';
import * as migration_20250909_130000_add_customer_number_to_users from './20250909_130000_add_customer_number_to_users';
import * as migration_20250910_000001_make_media_alt_nullable from './20250910_000001_make_media_alt_nullable';
import * as migration_20250911_063423 from './20250911_063423';
import * as migration_20250911_add_reviews_table from './20250911_add_reviews_table';
import * as migration_20250911_add_categories_lock_rel from './20250911_add_categories_lock_rel';
import * as migration_20250912_add_reviews_lock_rel from './20250912_add_reviews_lock_rel';
import * as migration_20250912_add_reviewer_name_to_reviews from './20250912_add_reviewer_name_to_reviews';
import * as migration_20250912_make_orders_items_item_nullable from './20250912_make_orders_items_item_nullable';
import * as migration_20250912_add_device_fields_to_orders from './20250912_add_device_fields_to_orders';

export const migrations = [
  {
    up: migration_20250908_055127.up,
    down: migration_20250908_055127.down,
    name: '20250908_055127',
  },
  {
    up: migration_20250909_050442.up,
    down: migration_20250909_050442.down,
    name: '20250909_050442',
  },
  {
    up: migration_20250909_120000_add_customer_number_to_orders.up,
    down: migration_20250909_120000_add_customer_number_to_orders.down,
    name: '20250909_120000_add_customer_number_to_orders',
  },
  {
    up: migration_20250909_123000_guest_checkout_orders_fields.up,
    down: migration_20250909_123000_guest_checkout_orders_fields.down,
    name: '20250909_123000_guest_checkout_orders_fields',
  },
  {
    up: migration_20250909_130000_add_customer_number_to_users.up,
    down: migration_20250909_130000_add_customer_number_to_users.down,
    name: '20250909_130000_add_customer_number_to_users',
  },
  {
    up: migration_20250910_000001_make_media_alt_nullable.up,
    down: migration_20250910_000001_make_media_alt_nullable.down,
    name: '20250910_000001_make_media_alt_nullable',
  },
  {
    up: migration_20250911_063423.up,
    down: migration_20250911_063423.down,
    name: '20250911_063423'
  },
  {
    up: migration_20250911_add_reviews_table.up,
    down: migration_20250911_add_reviews_table.down,
    name: '20250911_add_reviews_table',
  },
  {
    up: migration_20250911_add_categories_lock_rel.up,
    down: migration_20250911_add_categories_lock_rel.down,
    name: '20250911_add_categories_lock_rel',
  },
  {
    up: migration_20250912_add_reviews_lock_rel.up,
    down: migration_20250912_add_reviews_lock_rel.down,
    name: '20250912_add_reviews_lock_rel',
  },
  {
    up: migration_20250912_add_reviewer_name_to_reviews.up,
    down: migration_20250912_add_reviewer_name_to_reviews.down,
    name: '20250912_add_reviewer_name_to_reviews',
  },
  {
    up: migration_20250912_make_orders_items_item_nullable.up,
    down: migration_20250912_make_orders_items_item_nullable.down,
    name: '20250912_make_orders_items_item_nullable',
  },
  {
    up: migration_20250912_add_device_fields_to_orders.up,
    down: migration_20250912_add_device_fields_to_orders.down,
    name: '20250912_add_device_fields_to_orders',
  },
];
