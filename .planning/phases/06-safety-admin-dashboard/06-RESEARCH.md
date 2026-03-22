# Phase 6: Safety & Admin Dashboard - Research

**Researched:** 2026-03-22
**Domain:** Content moderation (mobile reporting + auto-moderation) + Admin dashboard (Next.js management UI)
**Confidence:** HIGH

## Summary

Phase 6 covers two distinct domains: (1) mobile-side content reporting and automated moderation, and (2) a full admin dashboard in the existing Next.js admin app. The mobile side adds a report bottom sheet to posts/comments, integrates a `moderate` Edge Function (banned word filter + OpenAI Moderation API), and enforces spam rate limiting. The admin side builds 8 pages behind a sidebar layout: Dashboard, Communities, Creators, Members, Moderation, Notices (migrate existing), Banners, and Analytics.

The existing codebase provides strong foundations. The `reports` and `user_sanctions` tables with full RLS policies already exist in `packages/db/src/schema/moderation.ts`. The admin app has shadcn/ui components (Table, Badge, Button, AlertDialog, Input, Textarea, Select, Switch), a `supabaseAdmin` service-role client, and an established CRUD pattern from the notices pages. Edge Functions follow a consistent `Deno.serve()` pattern across 5 existing functions.

**Primary recommendation:** Use the imperative Alert-based bottom sheet pattern (consistent with existing DeleteConfirmDialog) for the report flow rather than adding `@gorhom/bottom-sheet` as a new dependency. For the admin dashboard, use recharts 3.8 for analytics charts and the existing shadcn/ui + Tailwind dark-theme stack. The `moderate` Edge Function should follow the same Deno.serve() + supabase service-role pattern as the existing `notify` and `translate` functions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Report entry point: post/comment `...` (more) menu with "Report" option -- same menu as delete button
- **D-02:** Report UI: bottom sheet 1-step -- 5 reason list (hate/spam/violence/copyright/other) tap -> submit immediately
- **D-03:** "Other" reason requires text input -- cannot submit without description
- **D-04:** Report completion feedback: toast message ("Report has been submitted")
- **D-05:** Own content hides report option (only shows delete)
- **D-06:** Duplicate report shows toast error ("Already reported") -- UNIQUE constraint
- **D-07:** Left sidebar fixed -- icon + text menu (Weverse/Vercel style)
- **D-08:** Sidebar 8 flat menus: Dashboard / Communities / Creators / Members / Moderation / Notices / Banners / Analytics
- **D-09:** Admin auth: separate login page -- Supabase Auth login then role=admin check, block if not admin
- **D-10:** Migrate existing notices page into new sidebar layout
- **D-11:** Report queue: table row click -> side panel (drawer) with original content + report reasons + reporter count
- **D-12:** Sanction application: from report detail side panel -> "Take Action" -> dropdown (warning/7d/30d/permanent) + reason input -> confirm
- **D-13:** Appeals: MVP minimal -- sanction history shows "appeal email" guidance text only (no in-app appeal)
- **D-14:** Content deletion: admin can directly delete content from report queue (soft delete)
- **D-15:** Key metrics: DAU/WAU/MAU, daily new signups, posts/comments/reports per community trend, top 10 popular communities, active user ratio
- **D-16:** Charts: line charts (time-axis trends -- DAU/signups/reports etc.)
- **D-17:** Date range: preset buttons -- 7d / 30d / 90d
- **D-18:** Data source: direct Supabase queries -- SQL views/functions for aggregation (real-time)
- **D-19:** `moderate` Edge Function: async call on post/comment creation -- does not block post creation
- **D-20:** Banned word filter: PostgreSQL matching -> immediate block (cannot publish + warning)
- **D-21:** OpenAI Moderation API: hate/violence/sexual detection -> auto-create report (add to admin queue)
- **D-22:** Spam prevention: 5 posts/min exceeded -> 1-hour temp block

### Claude's Discretion
- Bottom sheet report UI exact height/spacing
- Sidebar icon choices (Lucide icons)
- Side panel (drawer) width/animation
- Chart library choice (recharts etc.)
- moderate Edge Function banned word list structure
- Spam rate limit implementation (DB trigger vs Edge Function)
- Soft delete implementation (is_deleted column vs deleted_at timestamp)
- Analytics SQL view/function optimization

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-01 | User can report posts/comments (reason: hate/spam/violence/copyright/other) | Reports table with 5 reasons exists in schema. Bottom sheet UI pattern + supabase insert |
| SAFE-02 | Duplicate report prevention (UNIQUE constraint) | `reports_unique` constraint on (reporter_id, target_type, target_id) already in schema |
| SAFE-03 | Report confirmation feedback to user | Toast pattern (Alert on native, window.confirm on web) established in project |
| SAFE-04 | Content auto-moderation via OpenAI Moderation API | `moderate` Edge Function + `omni-moderation-latest` model (free, multilingual) |
| SAFE-05 | Banned word filter (PostgreSQL matching) | banned_words table + SQL function for pre-insert check |
| SAFE-06 | Spam prevention (5 posts/min rate limit -> 1hr temp block) | Rate limit check in Edge Function or DB function before insert |
| ADMN-01 | Admin can create/edit/delete communities | supabaseAdmin CRUD on communities table, following notices page pattern |
| ADMN-02 | Admin can create/manage creator accounts | supabaseAdmin operations on profiles + community_members (role='creator') |
| ADMN-03 | Admin can register/manage artist members per community | supabaseAdmin CRUD on artist_members table |
| ADMN-04 | Admin can view community member list and statistics | supabaseAdmin query community_members + aggregate counts |
| ADMN-05 | Admin can view report queue (sorted by count) | SQL view aggregating reports by target with count, admin RLS already exists |
| ADMN-06 | Admin can preview reported content and take action | Side panel UI with content fetch + action buttons |
| ADMN-07 | Admin can apply graduated sanctions | user_sanctions table insert (warning/7day_ban/30day_ban/permanent_ban) |
| ADMN-08 | Admin can view sanction history and handle appeals | user_sanctions query by user + appeal email text |
| ADMN-09 | Admin analytics dashboard (DAU/WAU/MAU, posts/comments per community, new signups) | SQL views/functions + recharts line charts |
| ADMN-10 | Admin can create/edit/delete promotion banners | supabaseAdmin CRUD on promotion_banners, following notices pattern |
| ADMN-11 | Admin can create/manage notices per community | Existing notices pages migrate into sidebar layout |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.x (already 16.1.7) | Admin dashboard framework | Already in project |
| @supabase/supabase-js | ^2.99.2 | Database client (service_role for admin) | Already in project |
| shadcn/ui (base-nova style) | latest | UI components (Table, Badge, Button, etc.) | Already in project, 8 components installed |
| lucide-react | ^0.577.0 | Sidebar and page icons | Already in project |
| recharts | 3.8.0 | Analytics charts (line charts) | Most popular React charting library, composable API, dark theme support |
| Tailwind CSS v4 | ^4 | Styling (dark theme) | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-reanimated | ~4.2.2 | Bottom sheet animation (mobile) | Already in mobile project |
| @tanstack/react-query | ^5.90.21 | Data fetching / cache (mobile report hooks) | Already in mobile project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | @tremor/react | Tremor has nice dashboards but adds heavy dependency; recharts is lighter and more flexible |
| recharts | Chart.js/react-chartjs-2 | Chart.js requires canvas; recharts is SVG-based and more React-idiomatic |
| @gorhom/bottom-sheet (mobile report) | React Native Modal + custom view | Avoid adding a new dependency; use existing imperative Alert pattern or simple Modal |

**Installation (admin only):**
```bash
cd apps/admin && npm install recharts
```

**No new mobile dependencies needed.** The report bottom sheet can be implemented using React Native's built-in `Modal` component or the existing imperative `Alert.alert` + ActionSheet pattern, consistent with `DeleteConfirmDialog`.

## Architecture Patterns

### Admin Dashboard Structure
```
apps/admin/app/
├── layout.tsx               # Root layout (dark theme, add sidebar)
├── login/
│   └── page.tsx             # Admin login page
├── (dashboard)/
│   ├── layout.tsx           # Sidebar layout wrapper
│   ├── page.tsx             # Dashboard home (overview stats)
│   ├── communities/
│   │   ├── page.tsx         # Community list + CRUD
│   │   └── [id]/page.tsx    # Community edit
│   ├── creators/
│   │   ├── page.tsx         # Creator list + management
│   │   └── [id]/page.tsx    # Creator edit
│   ├── members/
│   │   └── page.tsx         # Member list + search
│   ├── moderation/
│   │   └── page.tsx         # Report queue + side panel
│   ├── notices/
│   │   ├── page.tsx         # Migrated from existing /notices
│   │   ├── new/page.tsx     # Migrated
│   │   └── [id]/page.tsx    # Migrated
│   ├── banners/
│   │   └── page.tsx         # Banner CRUD
│   └── analytics/
│       └── page.tsx         # Analytics dashboard
├── components/
│   ├── Sidebar.tsx          # Fixed sidebar navigation
│   ├── SidePanel.tsx        # Slide-out drawer for report details
│   └── ui/                  # Existing shadcn components
```

### Mobile Report Flow Structure
```
apps/mobile/
├── components/
│   ├── report/
│   │   ├── ReportBottomSheet.tsx    # Modal with 5 reason options
│   │   └── useReport.ts            # Report mutation hook
│   ├── post/
│   │   └── PostCard.tsx             # Add report option to more menu
│   └── comment/
│       └── CommentRow.tsx           # Add report option to more menu
├── hooks/
│   └── report/
│       └── useReport.ts            # Supabase insert + error handling
```

### Edge Function Structure
```
packages/supabase/functions/
└── moderate/
    └── index.ts    # Deno.serve() - banned words + OpenAI Moderation
```

### Pattern 1: Admin Sidebar Layout
**What:** Fixed left sidebar with icon + text navigation, wraps all dashboard pages
**When to use:** All admin pages except login
**Example:**
```typescript
// apps/admin/app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check admin role on mount
    async function checkAuth() {
      const { data: { user } } = await supabaseAdmin.auth.getUser();
      if (!user || user.user_metadata?.role !== 'admin') {
        router.replace('/login');
        return;
      }
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">{children}</main>
    </div>
  );
}
```

### Pattern 2: Report Bottom Sheet (Mobile)
**What:** Modal-based report flow with 5 reasons, consistent with existing imperative dialog pattern
**When to use:** When user taps "Report" from post/comment more menu
**Example:**
```typescript
// Simple Modal approach - no new dependencies
import { Modal, View, Text, Pressable } from 'react-native';

const REPORT_REASONS = [
  { key: 'hate', label: '혐오 표현' },
  { key: 'spam', label: '스팸' },
  { key: 'violence', label: '폭력' },
  { key: 'copyright', label: '저작권 침해' },
  { key: 'other', label: '기타' },
] as const;

// Or use ActionSheet pattern (Alert.alert with buttons) for maximum simplicity
```

### Pattern 3: Moderate Edge Function (Async)
**What:** Edge Function called after post/comment creation for content screening
**When to use:** Triggered from mobile app after successful post/comment insert
**Example:**
```typescript
// packages/supabase/functions/moderate/index.ts
Deno.serve(async (req: Request) => {
  const { target_id, target_type, content } = await req.json();

  // 1. Banned word check (query banned_words table)
  const { data: bannedWords } = await supabase
    .from('banned_words')
    .select('word');

  const hasBannedWord = bannedWords?.some(bw =>
    content.toLowerCase().includes(bw.word.toLowerCase())
  );

  if (hasBannedWord) {
    // Soft-delete the content + create auto-report
    await supabase.from(target_type === 'post' ? 'posts' : 'comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', target_id);
    return Response.json({ action: 'blocked', reason: 'banned_word' });
  }

  // 2. OpenAI Moderation API check
  const modResult = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: content }),
  });

  const { results } = await modResult.json();
  if (results[0].flagged) {
    // Auto-create report for admin review
    await supabase.from('reports').insert({
      reporter_id: '00000000-0000-0000-0000-000000000000', // system user
      target_type, target_id,
      reason: mapCategoryToReason(results[0].categories),
      status: 'pending',
    });
  }

  return Response.json({ action: 'allowed' });
});
```

### Pattern 4: Analytics SQL View
**What:** PostgreSQL function for aggregated metrics (DAU/WAU/MAU)
**When to use:** Analytics dashboard data source
**Example:**
```sql
-- Daily active users for date range
CREATE OR REPLACE FUNCTION get_daily_active_users(
  start_date DATE, end_date DATE
) RETURNS TABLE(day DATE, count BIGINT) AS $$
  SELECT date_trunc('day', created_at)::date AS day,
         COUNT(DISTINCT author_id) AS count
  FROM posts
  WHERE created_at >= start_date AND created_at < end_date + 1
  GROUP BY day ORDER BY day;
$$ LANGUAGE sql STABLE;
```

### Anti-Patterns to Avoid
- **Blocking moderation:** Never block post creation on OpenAI API call -- always async (D-19)
- **Hard delete:** Never hard-delete content from report queue -- use soft delete with `deleted_at` timestamp
- **Client-side rate limiting:** Never rely on client-side rate limiting for spam -- enforce in DB/Edge Function
- **Inline admin auth check:** Never check admin role in every page component -- use layout-level auth guard
- **Real-time analytics:** Do not use Supabase Realtime for analytics -- use direct SQL queries with date range

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG charts | recharts | Complex axis/tooltip/responsive behavior |
| Content moderation AI | Custom ML model | OpenAI Moderation API (free, omni-moderation-latest) | 42% better on multilingual vs previous, zero cost |
| UI components | Custom admin form components | shadcn/ui (already installed) | Table, Badge, Button, Select, Switch all available |
| Rate limiting counter | Custom in-memory counter | PostgreSQL window function on posts table | Distributed correctness across multiple function instances |
| Date range picker | Custom calendar widget | Preset buttons (7d/30d/90d) per D-17 | MVP simplicity |

**Key insight:** The admin app already has the full shadcn/ui component set and supabaseAdmin service-role client established. Every new admin page is a variation of the notices CRUD pattern (fetch -> Table -> AlertDialog for delete). Do not create new patterns when existing ones work.

## Common Pitfalls

### Pitfall 1: Admin Auth - supabaseAdmin vs User Auth
**What goes wrong:** Using `supabaseAdmin` (service_role) for auth checks -- it bypasses RLS entirely
**Why it happens:** The admin app uses service_role key for data operations, but auth session checking needs a user-scoped client
**How to avoid:** Create a separate browser-side supabase client (anon key) for auth.getUser() / auth.signIn(). Use supabaseAdmin only for data operations after auth is confirmed.
**Warning signs:** `supabaseAdmin.auth.getUser()` returns null or the service role user, not the logged-in admin

### Pitfall 2: Duplicate Report UNIQUE Constraint Error Handling
**What goes wrong:** Supabase returns error code `23505` (unique_violation) but developer doesn't catch it specifically
**Why it happens:** Generic error handling shows "Something went wrong" instead of "Already reported"
**How to avoid:** Check `error.code === '23505'` specifically and show the duplicate report toast
**Warning signs:** Users see generic errors when reporting same content twice

### Pitfall 3: Soft Delete Breaking Existing Queries
**What goes wrong:** Adding `deleted_at` column to posts/comments but existing views/queries don't filter by it
**Why it happens:** `posts_with_nickname` view and all feed queries need `WHERE deleted_at IS NULL`
**How to avoid:** Update the view definition and add `deleted_at` filter to ALL existing queries/views. Create a migration that updates `posts_with_nickname` view.
**Warning signs:** Deleted posts still appearing in feeds

### Pitfall 4: OpenAI Moderation API - System Reporter UUID
**What goes wrong:** auto-reports from moderation need a `reporter_id` but the UNIQUE constraint prevents duplicate system reports
**Why it happens:** The reports table requires a valid UUID for reporter_id, and the system user isn't a real auth user
**How to avoid:** Create a fixed system user UUID (e.g., `00000000-0000-0000-0000-000000000000`) and document it. Or use a dedicated `is_automated` boolean column to distinguish system reports.
**Warning signs:** UNIQUE constraint violations when the same content gets flagged multiple times by the system

### Pitfall 5: Rate Limit Race Condition
**What goes wrong:** Multiple concurrent requests bypass the 5 posts/min check
**Why it happens:** Checking count and inserting are separate transactions
**How to avoid:** Use a single SQL function with `SELECT FOR UPDATE` or use `pg_advisory_lock` for atomicity. Alternatively, count recent posts in the INSERT RLS policy itself.
**Warning signs:** Users can post 6+ times per minute if they submit rapidly

### Pitfall 6: Sidebar Layout Migration Breaking Notices Routes
**What goes wrong:** Moving notices into `(dashboard)/notices/` breaks existing hardcoded routes
**Why it happens:** Notices pages currently live at `/notices/` -- moving to `/(dashboard)/notices/` changes the URL
**How to avoid:** Since this is admin-only and no external links point to it, just move the files. But verify all internal `Link` href values are updated.
**Warning signs:** 404 errors on notice pages after layout migration

### Pitfall 7: Admin Client-Side Supabase Auth
**What goes wrong:** Using `supabaseAdmin` (service_role key) exposed in client-side code
**Why it happens:** The admin app uses `supabaseAdmin` for CRUD, but Next.js `'use client'` components expose env vars prefixed with `NEXT_PUBLIC_`
**How to avoid:** The service_role key is accessed via `process.env.SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix) -- this works in SSR/Server Components. For client components, use Server Actions or API Routes to proxy admin operations.
**Warning signs:** Service role key visible in browser dev tools. Current pattern in notices already uses `'use client'` with supabaseAdmin -- this is actually a known pattern in the project (service key from server env, not exposed in client bundle because Next.js excludes non-NEXT_PUBLIC_ vars).

## Code Examples

### Report Hook (Mobile)
```typescript
// apps/mobile/hooks/report/useReport.ts
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

type ReportReason = 'hate' | 'spam' | 'violence' | 'copyright' | 'other';

export function useReport() {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      reason,
    }: {
      targetType: 'post' | 'comment';
      targetId: string;
      reason: ReportReason;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('DUPLICATE_REPORT');
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Toast: "신고가 접수되었습니다"
    },
    onError: (error: Error) => {
      if (error.message === 'DUPLICATE_REPORT') {
        // Toast: "이미 신고한 콘텐츠입니다"
      }
    },
  });
}
```

### Sidebar Component (Admin)
```typescript
// apps/admin/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Mic2, UserCheck,
  Shield, Bell, Image, BarChart3,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Communities', href: '/communities', icon: Users },
  { label: 'Creators', href: '/creators', icon: Mic2 },
  { label: 'Members', href: '/members', icon: UserCheck },
  { label: 'Moderation', href: '/moderation', icon: Shield },
  { label: 'Notices', href: '/notices', icon: Bell },
  { label: 'Banners', href: '/banners', icon: Image },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];
```

### Recharts Line Chart (Analytics)
```typescript
// Source: recharts official docs
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={dauData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
    <XAxis dataKey="day" stroke="#999" />
    <YAxis stroke="#999" />
    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }} />
    <Line type="monotone" dataKey="count" stroke="#00E5C3" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

### Spam Rate Limit SQL Function
```sql
-- Check if user exceeded post rate limit (5 posts/min)
CREATE OR REPLACE FUNCTION check_post_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM posts
  WHERE author_id = p_user_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 5 THEN
    -- Insert 1-hour temp block
    INSERT INTO user_sanctions (user_id, type, reason, issued_by, expires_at)
    VALUES (
      p_user_id, '7day_ban', 'Spam rate limit exceeded',
      '00000000-0000-0000-0000-000000000000',
      now() + interval '1 hour'
    );
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Banned Words Table + Check
```sql
-- New table for banned words
CREATE TABLE banned_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (admin-only management)
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

-- Check function
CREATE OR REPLACE FUNCTION contains_banned_word(p_content TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM banned_words
    WHERE p_content ILIKE '%' || word || '%'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| text-moderation-latest | omni-moderation-latest | 2024 | 42% better multilingual accuracy, supports images too |
| Custom profanity filters | OpenAI Moderation API (free) | 2023+ | Zero cost, handles hate/violence/sexual across languages |
| recharts 2.x | recharts 3.8.0 | 2025 | Better TypeScript support, smaller bundle |
| Next.js route groups | Next.js 16 route groups | 2025 | Same `(group)` pattern, stable |

**Deprecated/outdated:**
- `text-moderation-latest`: Use `omni-moderation-latest` instead -- better accuracy, same free pricing
- Custom content filtering ML: OpenAI Moderation API is free and better

## Open Questions

1. **Soft delete column naming**
   - What we know: Posts/comments need soft delete for admin content removal
   - Options: `deleted_at TIMESTAMPTZ` (nullable, more info) vs `is_deleted BOOLEAN` (simpler)
   - Recommendation: Use `deleted_at TIMESTAMPTZ` -- provides when-deleted info useful for audit, nullable serves as boolean check (`WHERE deleted_at IS NULL`)

2. **Spam rate limit: DB function vs Edge Function**
   - What we know: D-22 requires 5 posts/min -> 1hr block
   - Options: (a) PostgreSQL function called from RLS/trigger, (b) Check in moderate Edge Function
   - Recommendation: Use a PostgreSQL function called from the `moderate` Edge Function (not RLS, since RLS would block the post creation itself which conflicts with D-19 async pattern). The moderate function checks rate after insert, and if exceeded, creates a sanction + soft-deletes excess posts.

3. **Admin auth client architecture**
   - What we know: Current admin app uses `supabaseAdmin` (service_role) in `'use client'` components
   - What's unclear: Whether to add a second browser supabase client for auth flow
   - Recommendation: Create `lib/supabase-browser.ts` with anon key for login/auth. Keep `supabaseAdmin` for data operations (existing pattern works because Next.js SSR handles env vars correctly).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.1.x |
| Config file | apps/mobile/vitest.config.ts (mobile), none for admin |
| Quick run command | `cd apps/mobile && npm test` |
| Full suite command | `cd apps/mobile && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAFE-01 | Report mutation creates report | unit | `cd apps/mobile && npx vitest run tests/report.test.ts -t "creates report"` | Wave 0 |
| SAFE-02 | Duplicate report returns error | unit | `cd apps/mobile && npx vitest run tests/report.test.ts -t "duplicate"` | Wave 0 |
| SAFE-03 | Report success shows toast | unit | `cd apps/mobile && npx vitest run tests/report.test.ts -t "toast"` | Wave 0 |
| SAFE-04 | Moderate function calls OpenAI | unit | Manual -- Edge Function (Deno runtime) | manual-only |
| SAFE-05 | Banned word blocks content | unit | Manual -- PostgreSQL function | manual-only |
| SAFE-06 | Rate limit triggers sanction | unit | Manual -- PostgreSQL function | manual-only |
| ADMN-01~11 | Admin CRUD operations | e2e | Manual -- admin app requires service_role | manual-only |

### Sampling Rate
- **Per task commit:** `cd apps/mobile && npm test`
- **Per wave merge:** `cd apps/mobile && npm test && cd ../admin && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/mobile/tests/report.test.ts` -- covers SAFE-01, SAFE-02, SAFE-03
- [ ] Admin app has no test infrastructure -- admin tests are manual-only for MVP (acceptable given admin is internal tool)

## Sources

### Primary (HIGH confidence)
- Project codebase: `packages/db/src/schema/moderation.ts` -- reports + user_sanctions table definitions with RLS
- Project codebase: `apps/admin/app/notices/page.tsx` -- established admin CRUD pattern
- Project codebase: `packages/supabase/functions/notify/index.ts` -- Edge Function pattern
- Project codebase: `docs/ARCHITECTURE.md` sections 5.3, 12.2, 12.3 -- moderate function spec, moderation pipeline, rate limiting
- [OpenAI Moderation API docs](https://developers.openai.com/api/docs/guides/moderation) -- free, omni-moderation-latest model
- [OpenAI Pricing](https://platform.openai.com/docs/pricing) -- Moderation endpoint confirmed free

### Secondary (MEDIUM confidence)
- [recharts](https://recharts.org) -- v3.8.0 verified via npm registry
- [@gorhom/bottom-sheet](https://github.com/gorhom/react-native-bottom-sheet) -- v5.2.8, but decided NOT to use (prefer built-in Modal)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project except recharts (verified via npm)
- Architecture: HIGH - follows established patterns from notices pages, Edge Functions
- Pitfalls: HIGH - derived from actual codebase analysis (soft delete, UNIQUE constraint, auth pattern)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no fast-moving dependencies)
