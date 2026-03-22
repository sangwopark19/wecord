import { pgTable, uuid, text, integer, boolean, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';

export const promotionBanners = pgTable(
  'promotion_banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    imageUrl: text('image_url').notNull(),
    linkUrl: text('link_url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy('banners_select_authenticated', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.isActive} = true`,
    }),
    pgPolicy('banners_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
