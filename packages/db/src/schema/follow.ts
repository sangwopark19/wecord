import {
  pgTable,
  uuid,
  timestamp,
  unique,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';
import { communityMembers } from './community';

export const communityFollows = pgTable(
  'community_follows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    followerCmId: uuid('follower_cm_id')
      .notNull()
      .references(() => communityMembers.id),
    followingCmId: uuid('following_cm_id')
      .notNull()
      .references(() => communityMembers.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // UNIQUE: one follow per pair
    unique('follows_unique').on(table.followerCmId, table.followingCmId),
    // SELECT: same community members can see follows
    pgPolicy('community_follows_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.id = ${table.followerCmId}
          AND cm2.user_id = (select auth.uid())
      )`,
    }),
    // INSERT: own follower, same community enforcement
    pgPolicy('community_follows_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.id = ${table.followerCmId}
          AND cm2.id = ${table.followingCmId}
          AND cm1.user_id = (select auth.uid())
      )`,
    }),
    // DELETE: can delete own follows
    pgPolicy('community_follows_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.id = ${table.followerCmId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // anon blocked
    pgPolicy('community_follows_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
