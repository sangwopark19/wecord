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

export const postTranslations = pgTable(
  'post_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    targetId: uuid('target_id').notNull(),
    targetType: text('target_type').$type<'post' | 'comment'>().notNull(),
    sourceLang: text('source_lang').notNull(),
    targetLang: text('target_lang').notNull(),
    translatedText: text('translated_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // UNIQUE: one translation per target per language
    unique('translations_lookup_unique').on(table.targetId, table.targetType, table.targetLang),
    // SELECT: all authenticated users (translation cache is public for logged-in users)
    pgPolicy('post_translations_select_authenticated', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    // INSERT: service role only (Edge Functions insert translations)
    // Authenticated users cannot insert directly
    pgPolicy('post_translations_insert_service', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`false`,
    }),
    // anon blocked
    pgPolicy('post_translations_anon_block', {
      for: 'all',
      to: anonRole,
      using: sql`false`,
    }),
  ]
);
