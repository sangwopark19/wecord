import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';
import { communities } from './community';

export const artistMembers = pgTable(
  'artist_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id),
    userId: uuid('user_id'),
    displayName: text('display_name').notNull(),
    profileImageUrl: text('profile_image_url'),
    position: text('position'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: community members can see artist members
    pgPolicy('artist_members_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // INSERT/UPDATE/DELETE: admin only
    pgPolicy('artist_members_insert_admin', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    pgPolicy('artist_members_update_admin', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    pgPolicy('artist_members_delete_admin', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    // anon blocked
    pgPolicy('artist_members_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
