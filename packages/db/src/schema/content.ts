import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  primaryKey,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';
import { communities, communityMembers } from './community';
import { artistMembers } from './artist-member';

// Raw SQL view definition — Drizzle generates the CREATE VIEW statement from this
// ARCHITECTURE.md section 4.3 exact match
export const postsWithNicknameViewSql = sql`
  CREATE OR REPLACE VIEW posts_with_nickname AS
  SELECT p.*, cm.community_nickname AS author_nickname, cm.id AS author_cm_id,
         am.display_name AS artist_member_name, c.name AS community_name, c.slug AS community_slug
  FROM posts p
  JOIN community_members cm ON cm.user_id = p.author_id AND cm.community_id = p.community_id
  LEFT JOIN artist_members am ON am.id = p.artist_member_id
  JOIN communities c ON c.id = p.community_id
`;

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id),
    authorId: uuid('author_id').notNull(),
    artistMemberId: uuid('artist_member_id').references(() => artistMembers.id),
    authorRole: text('author_role')
      .$type<'fan' | 'creator'>()
      .notNull()
      .default('fan'),
    content: text('content').notNull(),
    contentRating: text('content_rating').default('general'),
    mediaUrls: text('media_urls').array(),
    postType: text('post_type')
      .$type<'text' | 'image' | 'video'>()
      .notNull()
      .default('text'),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: community members only
    pgPolicy('posts_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // INSERT: community members, author_id must match, verify role for creator posts, block sanctioned users
    pgPolicy('posts_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`
        ${table.authorId} = (select auth.uid())
        AND EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = ${table.communityId}
            AND cm.user_id = (select auth.uid())
            AND cm.community_nickname IS NOT NULL
        )
        AND (
          ${table.authorRole} = 'fan'
          OR (${table.authorRole} = 'creator' AND EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = ${table.communityId}
              AND cm.user_id = (select auth.uid())
              AND cm.role = 'creator'
          ))
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_sanctions us
          WHERE us.user_id = (select auth.uid())
            AND us.type != 'warning'
            AND (us.expires_at IS NULL OR us.expires_at > now())
        )
      `,
    }),
    // DELETE: own posts
    pgPolicy('posts_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.authorId} = (select auth.uid())`,
    }),
    // UPDATE: admin only
    pgPolicy('posts_update_admin', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = ${table.communityId}
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      )`,
    }),
    // anon blocked
    pgPolicy('posts_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id),
    authorId: uuid('author_id').notNull(),
    artistMemberId: uuid('artist_member_id').references(() => artistMembers.id),
    parentCommentId: uuid('parent_comment_id'),
    content: text('content').notNull(),
    contentRating: text('content_rating').default('general'),
    authorRole: text('author_role')
      .$type<'fan' | 'creator'>()
      .notNull()
      .default('fan'),
    isCreatorReply: boolean('is_creator_reply').notNull().default(false),
    likeCount: integer('like_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: community members (join through post -> community)
    pgPolicy('comments_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM posts p
        JOIN community_members cm ON cm.community_id = p.community_id
        WHERE p.id = ${table.postId}
          AND cm.user_id = (select auth.uid())
      )`,
    }),
    // INSERT: community members
    pgPolicy('comments_insert_member', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`
        ${table.authorId} = (select auth.uid())
        AND EXISTS (
          SELECT 1 FROM posts p
          JOIN community_members cm ON cm.community_id = p.community_id
          WHERE p.id = ${table.postId}
            AND cm.user_id = (select auth.uid())
        )
      `,
    }),
    // DELETE: own comments
    pgPolicy('comments_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.authorId} = (select auth.uid())`,
    }),
    // anon blocked
    pgPolicy('comments_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const likes = pgTable(
  'likes',
  {
    userId: uuid('user_id').notNull(),
    targetType: text('target_type').$type<'post' | 'comment'>().notNull(),
    targetId: uuid('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Composite primary key
    primaryKey({ columns: [table.userId, table.targetType, table.targetId] }),
    // SELECT: community members (join through target)
    pgPolicy('likes_select_member', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // INSERT: own likes, must be community member
    pgPolicy('likes_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),
    // DELETE: own likes
    pgPolicy('likes_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
    }),
    // anon blocked
    pgPolicy('likes_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

