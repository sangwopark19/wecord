import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';

export const profiles = pgTable(
  'profiles',
  {
    userId: uuid('user_id').primaryKey(),
    globalNickname: text('global_nickname').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    language: text('language')
      .$type<'ko' | 'en' | 'th' | 'zh' | 'ja'>()
      .notNull()
      .default('en'),
    dateOfBirth: text('date_of_birth'),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    settings: jsonb('settings'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // SELECT: authenticated users can read profiles
    pgPolicy('profiles_select_authenticated', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    // UPDATE: users can only update their own profile
    pgPolicy('profiles_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid())`,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),
    // INSERT: users can only insert their own profile
    pgPolicy('profiles_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid())`,
    }),
    // anon blocked on all operations
    pgPolicy('profiles_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
