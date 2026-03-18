-- Initial Schema Migration
-- Generated from Drizzle ORM schema + ARCHITECTURE.md section 4.3 (view) + section 4.4 (indexes)
-- All RLS policies use (select auth.uid()) wrapper for performance optimization

CREATE TABLE "artist_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"profile_image_url" text,
	"position" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "artist_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"global_nickname" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"language" text DEFAULT 'en' NOT NULL,
	"date_of_birth" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"settings" jsonb,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"type" text NOT NULL,
	"category" text,
	"member_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "communities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"community_nickname" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cm_community_nickname_unique" UNIQUE("community_id","community_nickname"),
	CONSTRAINT "cm_user_community_unique" UNIQUE("user_id","community_id")
);
--> statement-breakpoint
ALTER TABLE "community_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"artist_member_id" uuid,
	"parent_comment_id" uuid,
	"content" text NOT NULL,
	"content_rating" text DEFAULT 'general',
	"author_role" text DEFAULT 'fan' NOT NULL,
	"is_creator_reply" boolean DEFAULT false NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "likes" (
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "likes_user_id_target_type_target_id_pk" PRIMARY KEY("user_id","target_type","target_id")
);
--> statement-breakpoint
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"artist_member_id" uuid,
	"author_role" text DEFAULT 'fan' NOT NULL,
	"content" text NOT NULL,
	"content_rating" text DEFAULT 'general',
	"media_urls" text[],
	"post_type" text DEFAULT 'text' NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "community_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_cm_id" uuid NOT NULL,
	"following_cm_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "follows_unique" UNIQUE("follower_cm_id","following_cm_id")
);
--> statement-breakpoint
ALTER TABLE "community_follows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"media_urls" text[],
	"is_pinned" boolean DEFAULT false NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"creator_posts" boolean DEFAULT true NOT NULL,
	"comments" boolean DEFAULT true NOT NULL,
	"likes" boolean DEFAULT true NOT NULL,
	"notices" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notification_preferences_user_id_community_id_pk" PRIMARY KEY("user_id","community_id")
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"action_taken" text,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "reports_unique" UNIQUE("reporter_id","target_type","target_id")
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_sanctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"reason" text NOT NULL,
	"issued_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_sanctions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "post_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"source_lang" text NOT NULL,
	"target_lang" text NOT NULL,
	"translated_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "translations_lookup_unique" UNIQUE("target_id","target_type","target_lang")
);
--> statement-breakpoint
ALTER TABLE "post_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Foreign Keys
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_artist_member_id_artist_members_id_fk" FOREIGN KEY ("artist_member_id") REFERENCES "public"."artist_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_artist_member_id_artist_members_id_fk" FOREIGN KEY ("artist_member_id") REFERENCES "public"."artist_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_follower_cm_id_community_members_id_fk" FOREIGN KEY ("follower_cm_id") REFERENCES "public"."community_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_following_cm_id_community_members_id_fk" FOREIGN KEY ("following_cm_id") REFERENCES "public"."community_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- RLS Policies
CREATE POLICY "artist_members_select" ON "artist_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "artist_members"."community_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "artist_members_insert_admin" ON "artist_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "artist_members"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "artist_members_update_admin" ON "artist_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "artist_members"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "artist_members_delete_admin" ON "artist_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "artist_members"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "artist_members_anon_block" ON "artist_members" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "profiles_select_authenticated" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."user_id" = (select auth.uid())) WITH CHECK ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_insert_own" ON "profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("profiles"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_anon_block" ON "profiles" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "communities_select_authenticated" ON "communities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "communities_insert_admin" ON "communities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "communities_update_admin" ON "communities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "communities_delete_admin" ON "communities" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "communities_anon_block" ON "communities" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "community_members_select" ON "community_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "community_members"."community_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "community_members_insert_own" ON "community_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("community_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "community_members_update_own" ON "community_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("community_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "community_members_delete_own" ON "community_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("community_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "community_members_anon_block" ON "community_members" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "comments_select_member" ON "comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM posts p
        JOIN community_members cm ON cm.community_id = p.community_id
        WHERE p.id = "comments"."post_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "comments_insert_member" ON "comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        "comments"."author_id" = (select auth.uid())
        AND EXISTS (
          SELECT 1 FROM posts p
          JOIN community_members cm ON cm.community_id = p.community_id
          WHERE p.id = "comments"."post_id"
            AND cm.user_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "comments_delete_own" ON "comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("comments"."author_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "comments_anon_block" ON "comments" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "likes_select_member" ON "likes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "likes_insert_own" ON "likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "likes_delete_own" ON "likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("likes"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "likes_anon_block" ON "likes" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "posts_select_member" ON "posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "posts"."community_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "posts_insert_member" ON "posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
        "posts"."author_id" = (select auth.uid())
        AND EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = "posts"."community_id"
            AND cm.user_id = (select auth.uid())
            AND cm.community_nickname IS NOT NULL
        )
        AND (
          "posts"."author_role" = 'fan'
          OR ("posts"."author_role" = 'creator' AND EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = "posts"."community_id"
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
      );--> statement-breakpoint
CREATE POLICY "posts_delete_own" ON "posts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("posts"."author_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "posts_update_admin" ON "posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "posts"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "posts_anon_block" ON "posts" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "community_follows_select" ON "community_follows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.id = "community_follows"."follower_cm_id"
          AND cm2.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "community_follows_insert_own" ON "community_follows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM community_members cm1
        JOIN community_members cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.id = "community_follows"."follower_cm_id"
          AND cm2.id = "community_follows"."following_cm_id"
          AND cm1.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "community_follows_delete_own" ON "community_follows" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.id = "community_follows"."follower_cm_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "community_follows_anon_block" ON "community_follows" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "notices_select_member" ON "notices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "notices"."community_id"
          AND cm.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "notices_insert_admin" ON "notices" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "notices"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "notices_update_admin" ON "notices" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "notices"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "notices_delete_admin" ON "notices" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = "notices"."community_id"
          AND cm.user_id = (select auth.uid())
          AND cm.role = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "notices_anon_block" ON "notices" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "notification_preferences_select_own" ON "notification_preferences" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notification_preferences"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notification_preferences_insert_own" ON "notification_preferences" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("notification_preferences"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notification_preferences_update_own" ON "notification_preferences" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notification_preferences"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notification_preferences_anon_block" ON "notification_preferences" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_update_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_insert_service" ON "notifications" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "notifications_anon_block" ON "notifications" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "reports_insert_authenticated" ON "reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("reports"."reporter_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reports_select_admin" ON "reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "reports_update_admin" ON "reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "reports_anon_block" ON "reports" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "user_sanctions_select" ON "user_sanctions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        "user_sanctions"."user_id" = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = (select auth.uid())
            AND raw_user_meta_data->>'role' = 'admin'
        )
      );--> statement-breakpoint
CREATE POLICY "user_sanctions_insert_admin" ON "user_sanctions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
          AND raw_user_meta_data->>'role' = 'admin'
      ));--> statement-breakpoint
CREATE POLICY "user_sanctions_anon_block" ON "user_sanctions" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint
CREATE POLICY "post_translations_select_authenticated" ON "post_translations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "post_translations_insert_service" ON "post_translations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "post_translations_anon_block" ON "post_translations" AS PERMISSIVE FOR ALL TO "anon" USING (false);--> statement-breakpoint

-- posts_with_nickname view — ARCHITECTURE.md section 4.3
CREATE VIEW posts_with_nickname AS
SELECT p.*, cm.community_nickname AS author_nickname, cm.id AS author_cm_id,
       am.display_name AS artist_member_name, c.name AS community_name, c.slug AS community_slug
FROM posts p
JOIN community_members cm ON cm.user_id = p.author_id AND cm.community_id = p.community_id
LEFT JOIN artist_members am ON am.id = p.artist_member_id
JOIN communities c ON c.id = p.community_id;
--> statement-breakpoint

-- Indexes — ARCHITECTURE.md section 4.4

-- Feed pagination (cursor-based)
CREATE INDEX idx_posts_feed ON posts(community_id, created_at DESC, id DESC);
CREATE INDEX idx_posts_creator ON posts(community_id, author_role, created_at DESC) WHERE author_role = 'creator';

-- Comments
CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Translation cache lookup (also covered by UNIQUE constraint)
CREATE UNIQUE INDEX idx_translations_lookup ON post_translations(target_id, target_type, target_lang);

-- Notifications (unread fast lookup)
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- Reports (pending fast lookup)
CREATE INDEX idx_reports_pending ON reports(created_at ASC) WHERE status = 'pending';

-- Community members (also covered by UNIQUE constraints)
CREATE UNIQUE INDEX idx_cm_nickname ON community_members(community_id, community_nickname);
CREATE UNIQUE INDEX idx_cm_user_community ON community_members(user_id, community_id);

-- Posts by member
CREATE INDEX idx_posts_member ON posts(artist_member_id, created_at DESC) WHERE artist_member_id IS NOT NULL;
CREATE INDEX idx_posts_home_feed ON posts(created_at DESC, id DESC);

-- Follows (also covered by UNIQUE constraint)
CREATE UNIQUE INDEX idx_follows_unique ON community_follows(follower_cm_id, following_cm_id);
CREATE INDEX idx_follows_follower ON community_follows(follower_cm_id);
CREATE INDEX idx_follows_following ON community_follows(following_cm_id);

-- Artist members
CREATE INDEX idx_artist_members_community ON artist_members(community_id, sort_order);
