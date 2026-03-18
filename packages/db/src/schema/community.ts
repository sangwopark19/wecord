import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';

export const communities = pgTable(
  'communities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    coverImageUrl: text('cover_image_url'),
    type: text('type').$type<'solo' | 'group'>().notNull(),
    category: text('category').$type<'bl' | 'gl' | 'voice_drama' | 'novel' | 'etc'>(),
    memberCount: integer('member_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  () => [
    // SELECT: all authenticated users can see communities (community search is public for logged-in users)
    pgPolicy('communities_select_authenticated', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    // INSERT/UPDATE/DELETE: admin only (checked via role in auth.users metadata)
    pgPolicy('communities_insert_admin', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    pgPolicy('communities_update_admin', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    pgPolicy('communities_delete_admin', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    // anon blocked
    pgPolicy('communities_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const communityMembers = pgTable(
  'community_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id),
    communityNickname: text('community_nickname').notNull(),
    role: text('role')
      .$type<'member' | 'creator' | 'admin'>()
      .notNull()
      .default('member'),
    followerCount: integer('follower_count').notNull().default(0),
    followingCount: integer('following_count').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // UNIQUE: nickname per community
    unique('cm_community_nickname_unique').on(table.communityId, table.communityNickname),
    // UNIQUE: one membership per user per community
    unique('cm_user_community_unique').on(table.userId, table.communityId),
    // SELECT: members of the same community can see each other
    pgPolicy('community_members_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // INSERT: can insert own membership
    pgPolicy('community_members_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),
    // UPDATE: can update own membership
    pgPolicy('community_members_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // DELETE: can delete own membership
    pgPolicy('community_members_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // anon blocked
    pgPolicy('community_members_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
