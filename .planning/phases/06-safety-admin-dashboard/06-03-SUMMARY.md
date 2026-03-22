---
phase: 06-safety-admin-dashboard
plan: 03
subsystem: ui
tags: [next.js, supabase-auth, sidebar, admin-dashboard, oauth]

requires:
  - phase: 01-foundation
    provides: "Next.js admin app with shadcn/ui components and supabaseAdmin client"
  - phase: 04-highlights-notices-notifications-translation
    provides: "Existing notices pages (CRUD) to migrate into sidebar layout"
provides:
  - "Browser-side Supabase client (supabaseBrowser) for admin auth"
  - "Admin login page with Google OAuth and role check"
  - "Dashboard layout with auth guard and sidebar"
  - "Sidebar component with 8 menu items and active state"
  - "Dashboard home with DAU/WAU/MAU/Signups stat cards"
  - "Notices migrated into sidebar layout with English labels"
affects: [06-04, 06-05, 06-06, 06-07]

tech-stack:
  added: []
  patterns:
    - "supabaseBrowser (anon key) for auth, supabaseAdmin (service_role) for data"
    - "(dashboard) route group with auth guard layout wrapping all admin pages"
    - "Sidebar active state detection via usePathname with exact match for /"

key-files:
  created:
    - apps/admin/lib/supabase-browser.ts
    - apps/admin/app/login/page.tsx
    - apps/admin/app/(dashboard)/layout.tsx
    - apps/admin/app/(dashboard)/page.tsx
    - apps/admin/app/(dashboard)/notices/page.tsx
    - apps/admin/app/(dashboard)/notices/new/page.tsx
    - apps/admin/app/(dashboard)/notices/[id]/page.tsx
    - apps/admin/components/Sidebar.tsx
  modified:
    - apps/admin/app/page.tsx (deleted - replaced by route group)

key-decisions:
  - "Deleted app/page.tsx to avoid route conflict with (dashboard)/page.tsx route group"
  - "supabaseBrowser uses anon key for auth; supabaseAdmin stays for data queries per Research pitfall 1"
  - "DAU counted via head/count, WAU/MAU via distinct Set on author_id from posts table"

patterns-established:
  - "Admin auth pattern: supabaseBrowser for login/session, layout-level auth guard redirects non-admin to /login"
  - "Sidebar nav: 8 flat menus with Lucide icons, left accent border on active, usePathname matching"

requirements-completed: [ADMN-09, ADMN-11]

duration: 3min
completed: 2026-03-22
---

# Phase 06 Plan 03: Admin Dashboard Foundation Summary

**Admin login with Google OAuth + role guard, 8-menu sidebar layout, dashboard stat cards (DAU/WAU/MAU/Signups), and notices migrated to English sidebar layout**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T07:34:12Z
- **Completed:** 2026-03-22T07:37:33Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Admin login page with Google OAuth and admin role verification (non-admin users see "Access denied" and are signed out)
- Fixed 256px sidebar with 8 menu items (Dashboard, Communities, Creators, Members, Moderation, Notices, Banners, Analytics) with active state highlighting
- Dashboard home page with 4 stat cards: DAU, WAU, MAU, New Signups plus pending reports link
- Existing notices pages migrated into the (dashboard) route group with all Korean labels translated to English

## Task Commits

Each task was committed atomically:

1. **Task 1: Browser Supabase client + Login page + Auth guard layout** - `ca51ca1` (feat)
2. **Task 2: Sidebar component + Dashboard home + Migrate notices** - `9d80f4b` (feat)

## Files Created/Modified
- `apps/admin/lib/supabase-browser.ts` - Browser-side Supabase client with anon key for auth
- `apps/admin/app/login/page.tsx` - Admin login page with Google OAuth and admin role check
- `apps/admin/app/(dashboard)/layout.tsx` - Auth guard layout with sidebar
- `apps/admin/app/(dashboard)/page.tsx` - Dashboard home with stat cards
- `apps/admin/components/Sidebar.tsx` - Fixed left sidebar with 8 menu items
- `apps/admin/app/(dashboard)/notices/page.tsx` - Notices list (migrated, English)
- `apps/admin/app/(dashboard)/notices/new/page.tsx` - Create notice (migrated, English)
- `apps/admin/app/(dashboard)/notices/[id]/page.tsx` - Edit notice (migrated, English)
- `apps/admin/app/page.tsx` - Deleted (replaced by route group)

## Decisions Made
- Deleted `app/page.tsx` to avoid Next.js route conflict with `(dashboard)/page.tsx` -- route groups map to `/` which conflicts with root page.tsx
- Created `supabase-browser.ts` with anon key for auth flow, keeping existing `supabaseAdmin` (service_role) for data operations -- per Research pitfall 1 about separating auth vs data clients
- DAU uses `count/head` (approximate), WAU/MAU use `Set` on distinct `author_id` -- pragmatic for dashboard overview; analytics page (plan 06-07) will use proper SQL aggregation functions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All admin dashboard pages will be wrapped in the sidebar layout automatically via the (dashboard) route group
- Auth guard protects all dashboard pages -- login page is outside the group
- Sidebar navigation links are ready for all 8 sections (Communities, Creators, Members, Moderation, Notices, Banners, Analytics pages to be built in subsequent plans)

---
*Phase: 06-safety-admin-dashboard*
*Completed: 2026-03-22*
