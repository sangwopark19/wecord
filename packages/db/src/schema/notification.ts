import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';
import { communities } from './community';

export const notices = pgTable(
  'notices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id),
    authorId: uuid('author_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    mediaUrls: text('media_urls').array(),
    isPinned: boolean('is_pinned').notNull().default(false),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: community members only
    pgPolicy('notices_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // INSERT/UPDATE/DELETE: admin only
    pgPolicy('notices_insert_admin', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    pgPolicy('notices_update_admin', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    pgPolicy('notices_delete_admin', {
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
    pgPolicy('notices_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    communityId: uuid('community_id').references(() => communities.id),
    type: text('type')
      .$type<'creator_post' | 'comment' | 'like' | 'notice' | 'member_post' | 'system'>()
      .notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: own notifications only
    pgPolicy('notifications_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // UPDATE: own notifications only (mark read)
    pgPolicy('notifications_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // INSERT: service role only (edge functions insert notifications)
    pgPolicy('notifications_insert_service', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`false`,
    }),
    // anon blocked
    pgPolicy('notifications_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    userId: uuid('user_id').notNull(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id),
    creatorPosts: boolean('creator_posts').notNull().default(true),
    comments: boolean('comments').notNull().default(true),
    likes: boolean('likes').notNull().default(true),
    notices: boolean('notices').notNull().default(true),
  },
  (table) => [
    // Composite primary key
    primaryKey({ columns: [table.userId, table.communityId] }),
    // SELECT: own preferences
    pgPolicy('notification_preferences_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // INSERT: own preferences
    pgPolicy('notification_preferences_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),
    // UPDATE: own preferences
    pgPolicy('notification_preferences_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // anon blocked
    pgPolicy('notification_preferences_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
