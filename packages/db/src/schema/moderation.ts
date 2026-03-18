import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id').notNull(),
    targetType: text('target_type').$type<'post' | 'comment'>().notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason')
      .$type<'hate' | 'spam' | 'violence' | 'copyright' | 'other'>()
      .notNull(),
    status: text('status')
      .$type<'pending' | 'reviewed' | 'actioned'>()
      .notNull()
      .default('pending'),
    actionTaken: text('action_taken'),
    reviewedBy: uuid('reviewed_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    // UNIQUE: duplicate prevention
    unique('reports_unique').on(table.reporterId, table.targetType, table.targetId),
    // INSERT: authenticated users (reporter must be the user)
    pgPolicy('reports_insert_authenticated', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.reporterId} = (select auth.uid())`,
    }),
    // SELECT: admin only
    pgPolicy('reports_select_admin', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    // UPDATE: admin only
    pgPolicy('reports_update_admin', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    // anon blocked
    pgPolicy('reports_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);

export const userSanctions = pgTable(
  'user_sanctions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    type: text('type')
      .$type<'warning' | '7day_ban' | '30day_ban' | 'permanent_ban'>()
      .notNull(),
    reason: text('reason').notNull(),
    issuedBy: uuid('issued_by').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: own + admin
    pgPolicy('user_sanctions_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`
        ${table.userId} = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = (select auth.uid())
            AND raw_user_meta_data->>'role' = 'admin'
        )
      `,
    }),
    // INSERT: admin only
    pgPolicy('user_sanctions_insert_admin', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      )`,
    }),
    // anon blocked
    pgPolicy('user_sanctions_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
