# Stack Research

**Domain:** Fan community platform (Weverse-like) — BL/GL creator + fan social app
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH (core stack verified; one key library version gap flagged)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo SDK | **55** | Universal app runtime (iOS/Android/Web) | RN 0.83 + React 19.2; New Architecture only (legacy dropped); Hermes v1 opt-in; 75% smaller OTA updates via bytecode diffing. Only viable path for solo dev targeting three platforms from one codebase. |
| React Native | **0.83** (via Expo 55) | Native UI rendering | Bundled with SDK 55. New Architecture required, no opt-out. |
| React | **19.2** (via Expo 55) | UI component model | Bundled with SDK 55. Concurrent features now standard. |
| Expo Router | **v7** (bundled with SDK 55) | File-based routing for iOS/Android/Web | Built on React Navigation; URL-first routing enables deep links, web SEO, shared code across platforms. v7 ships with SDK 55 and includes new Colors API, Apple Zoom transitions, Stack.Toolbar. |
| Supabase | **latest JS client ^2** | Auth + PostgREST API + Realtime + Storage + Edge Functions | Single platform replacing Auth0 + custom API + WebSocket server + S3 + Lambda. Critical for solo dev. Fully managed, generous free tier, RLS enforces security at DB layer. |
| PostgreSQL | **17** (via Supabase) | Primary datastore — "Just Use Postgres" | pg_textsearch for full-text search, pgmq for async jobs, pg_cron for scheduled tasks, JSONB for flexible metadata. Eliminates Redis, Elasticsearch, and message queue services. |
| Drizzle ORM | **^0.45** (drizzle-kit ^0.31) | Type-safe PostgreSQL client + migrations | TypeScript-native, SQL-close API, zero dependencies (~7.4kb). Supabase officially documents Drizzle as first-class ORM. Works in Edge Functions via postgres.js driver. |
| Next.js | **15** | Admin dashboard web app | App Router, server components, TypeScript first. Deployed to Cloudflare Workers via OpenNext adapter. |
| Nativewind | **v4** (^4.x) | Tailwind CSS styling for React Native | **v4 for production.** v5 (Tailwind CSS v4) is pre-release and not production-ready as of March 2026. v4 is widely used in production, stable with SDK 55, and supports the dark-only theme with Teal accent. |
| TanStack Query | **v5** (^5.x) | Server state management + caching | Industry standard for server state in React. Handles pagination, background refetch, optimistic updates. Official React Native support with focus/reconnect hooks. Dev tools plugin available for Expo. |
| Zustand | **v5** (^5.0.11) | Client state management | Minimal API, no boilerplate, React 18+ native. v5 stable as of late 2024, latest patch v5.0.11. Handles UI state: drawer open, selected tab, locale preference. |
| Turborepo | **latest** | Monorepo build orchestration | Remote caching, parallel task execution, auto-detects Expo monorepo setup (SDK 52+). Pairs with pnpm workspaces. |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-notifications | SDK 55 bundled | Push notifications (FCM + APNs) | All notification features: new posts, comments, community alerts. Requires EAS project ID; does NOT work in Expo Go on Android (use dev build). |
| expo-image | SDK 55 bundled | Performant image rendering with caching | All image display in feeds, avatars, banners. Faster than React Native Image; supports blurhash placeholder. |
| @shopify/flash-list | **^1.7** | Virtualized list for feeds | Replace every FlatList in feed screens. 5–10x FPS improvement on low-end Android. Critical for posts/comments feed. Do NOT use `key` props inside item components — breaks recycling. |
| expo-localization | SDK 55 bundled | Device locale detection | Auto-detect user's system language on first launch for i18n default. |
| i18next + react-i18next | **^23** | i18n (KO/EN/TH/ZH-CN/JA) | Full i18n framework with pluralization, namespaces, TypeScript key types. Combine with expo-localization for device language detection. The de facto standard for React Native i18n. |
| expo-av / expo-video | SDK 55 bundled | Video playback | Note: expo-av removed from Expo Go in SDK 55 — use expo-video. Relevant for future VOD (v1.1). |
| expo-image-picker | SDK 55 bundled | Photo/video upload from camera roll | Post creation: image/video attachment. |
| expo-web-browser | SDK 55 bundled | In-app WebView (Shop tab) | Open x-square.kr shop URL within app. |
| react-native-reanimated | **v4** (via SDK 55) | Animations | Gesture-based transitions, skeleton loaders. Nativewind v5 requires Reanimated v4 — another reason to stay on NW v4 for now to avoid version conflicts. |
| react-native-gesture-handler | SDK 55 bundled | Native gesture recognition | Pull-to-refresh, swipe actions, tab bar gestures. |
| @supabase/supabase-js | **^2** | Supabase client | Auth, PostgREST queries, Realtime subscriptions, Storage uploads. Use single instance across app. |
| shadcn/ui | **latest (Tailwind v4 variant)** | Admin dashboard component library | Next.js admin panel only. Built on Radix UI primitives, accessible, unstyled base. Most admin dashboard starters use shadcn/ui + Next.js in 2025/2026. |
| Sentry | **expo-sentry** | Error monitoring + crash reporting | Production error tracking. Add after MVP launch or as part of Phase 1 infra. |

---

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager for monorepo | Workspaces required for Turborepo. Use `node-linker=hoisted` in `.npmrc` if Metro has module resolution issues. |
| EAS Build | Cloud CI/CD for Expo | Required for push notifications (credentials), production builds, OTA updates. EAS internally expects pnpm; ensure `eas.json` specifies `"cli": { "appVersionSource": "remote" }`. |
| EAS Update | OTA JavaScript bundle updates | Bytecode diffing in SDK 55 reduces update payload ~75%. Use `--environment` flag (required in SDK 55). |
| Drizzle Kit | **^0.31** | DB schema migrations | `drizzle-kit generate` → `drizzle-kit migrate`. Keep schema in `packages/db/src/schema/`. |
| Supabase CLI | **latest** | Edge Function deploy, local dev, DB migrations | `supabase functions deploy`, `supabase db push`. Use alongside Drizzle for schema management. |
| OpenNext (Cloudflare adapter) | **latest** | Deploy Next.js 15 admin to Cloudflare Workers | `@opennextjs/cloudflare`. The `@cloudflare/next-on-pages` (Cloudflare Pages) is **deprecated** as of December 2025. Switch to Workers + OpenNext for full Next.js feature support including server components and ISR. |
| TypeScript | **^5.x** | Type safety across all packages | Strict mode in all packages. Turborepo's `packages/shared` exports shared types used by both mobile and admin. |

---

## Installation

```bash
# Mobile app (apps/mobile)
npx expo install expo-notifications expo-image expo-localization expo-image-picker expo-web-browser

# Core state + data
pnpm add @tanstack/react-query zustand @supabase/supabase-js

# i18n
pnpm add i18next react-i18next

# Feed performance
pnpm add @shopify/flash-list

# Styling (NW v4)
pnpm add nativewind
pnpm add -D tailwindcss

# packages/db
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit

# apps/admin (Next.js)
pnpm add next react react-dom
pnpm add -D @opennextjs/cloudflare wrangler
# Shadcn/ui: use CLI → npx shadcn@latest init
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Nativewind v4 | Nativewind v5 | When v5 reaches stable (monitor nativewind/nativewind releases). v5 offers Tailwind CSS v4 CSS variables and P3 colors — valuable for per-community theming in v1.1+. |
| Expo Router v7 | React Navigation standalone | If you need custom navigation patterns not expressible in file-based routing. Not recommended — Expo Router v7 covers all required patterns. |
| FlashList | FlatList | Never for feed screens. FlatList is acceptable only for short static lists (<20 items). |
| i18next + react-i18next | expo-localization + i18n-js | i18n-js for very simple 1-2 language apps with no pluralization needs. Not appropriate here (5 languages, complex grammar rules). |
| Supabase Edge Functions (Deno) | Separate Node.js API server | If you need heavy server-side computation, long-running jobs, or npm packages not available in Deno. For MVP: Edge Functions cover translation, push triggers, moderation webhooks. |
| OpenNext + Cloudflare Workers | Vercel | If budget is not a concern and preview deployments are important. Vercel has better DX for Next.js but adds cost at scale. |
| Drizzle ORM | Prisma | Prisma has better codegen documentation but heavier bundle, slower cold starts in Edge Functions, and less direct SQL control. Drizzle wins for Supabase Edge Function context. |
| TanStack Query v5 | SWR | TanStack Query has richer features: infinite queries, mutations with optimistic updates, background sync. SWR is simpler but too limited for a social feed with complex cache invalidation. |
| Zustand v5 | Jotai / Valtio | Both are fine for small client state. Zustand chosen for team familiarity and proven React Native compatibility. |
| Google Translate API | DeepL API | DeepL produces higher quality translations, especially for Asian languages (KO/JA/ZH). Consider DeepL for v1.0 translation quality — same Edge Function integration cost. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@cloudflare/next-on-pages` (Cloudflare Pages) | Deprecated December 2025. Only supports Edge runtime, missing server components, ISR, image optimization. | `@opennextjs/cloudflare` with Cloudflare Workers |
| Nativewind v5 in production | Pre-release as of March 2026. API still evolving; PostCSS/Metro tooling unstable. Reanimated v4 dependency can conflict. | Nativewind v4 (stable, production-proven) |
| FlatList for feed screens | 5–10x worse performance than FlashList on Android. Critical failure mode for a social feed app at scale. | @shopify/flash-list |
| expo-av for new video code | Removed from Expo Go in SDK 55. Will be deprecated. | expo-video |
| Legacy Architecture in SDK 55 | Dropped entirely. No opt-out exists. New Architecture is the only option. | Just use New Architecture (already the default) |
| Redux / Redux Toolkit | Extreme boilerplate for solo dev. Server state belongs in TanStack Query; client state in Zustand. Redux adds no value here. | TanStack Query (server) + Zustand (client) |
| Prisma in Edge Functions | Prisma's query engine is a separate binary that cannot run in Deno/Edge environments. Causes cold start and deployment issues. | Drizzle ORM (pure JS/TS, works anywhere) |
| react-native-async-storage for auth tokens | Supabase Auth handles token storage internally via its own secure storage adapter. Overriding it causes refresh token bugs. | Let `@supabase/supabase-js` manage its own storage |
| Multiple Supabase client instances | Creates multiple WebSocket connections, causes duplicate Realtime events, wastes connection slots. | Single Supabase client singleton across entire app |

---

## Stack Patterns by Variant

**For the mobile app (apps/mobile) feed screens:**
- Use FlashList + TanStack Query `useInfiniteQuery` for paginated feeds
- Implement `useFocusEffect` + `queryClient.invalidateQueries` for screen-focus refetch
- Set `staleTime: 1000 * 60` (1 min), `gcTime: 1000 * 60 * 30` (30 min) for feed queries
- Disable `refetchOnWindowFocus` (meaningless on mobile)

**For Supabase Realtime (notifications, live feed updates):**
- Subscribe to `postgres_changes` for new posts/comments/notifications
- Always load initial data via PostgREST first, then subscribe — prevents gaps between load and subscription
- Unsubscribe on component unmount; use single channel per screen to avoid connection bloat
- Channel topic pattern: `community:{id}:posts`, `user:{id}:notifications`

**For translation (Edge Function):**
- Call Google Translate API or DeepL from a Supabase Edge Function triggered by client button press
- Cache translated text in a `post_translations` table (post_id, language, translated_body)
- Do NOT re-translate on every request — check cache first
- Edge Function runs Deno 2.x (all regions confirmed on Deno 2.1+ as of 2025)

**For the admin dashboard (apps/admin):**
- Use Next.js 15 App Router with server components for data tables (no client-side loading state needed)
- Deploy via `@opennextjs/cloudflare` to Cloudflare Workers (NOT Cloudflare Pages)
- Use `shadcn/ui` + Tailwind CSS for components — most comprehensive admin UI ecosystem in 2025

**For pnpm monorepo + EAS Build:**
- Add `.npmrc` with `node-linker=hoisted` if Metro cannot resolve shared packages
- EAS Build supports pnpm natively; specify `"cli": { "npmPackageManager": "pnpm" }` in `eas.json`
- Expo SDK 52+ auto-detects monorepo — no additional Metro config needed for package resolution

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Expo SDK 55 | React Native 0.83, React 19.2 | New Architecture only. No Legacy Architecture. |
| Expo SDK 55 | Nativewind v4 (^4.x) | Confirmed stable. NW v5 requires Reanimated v4 — present in SDK 55 but NW v5 itself is pre-release. |
| Expo SDK 55 | expo-router v7 | Bundled together. Do not install expo-router separately; let Expo manage the version. |
| Expo SDK 55 | react-native-reanimated v4 | Bundled. NW v4.2.0+ includes patch for Reanimated v4 compatibility. |
| Drizzle ORM ^0.45 | drizzle-kit ^0.31 | Must keep ORM and kit versions aligned — mismatches cause "install latest version" errors. |
| Supabase JS ^2 | Deno 2.x Edge Functions | Official Deno-compatible export at `@supabase/supabase-js`. Use `import { createClient } from 'npm:@supabase/supabase-js'` in Edge Functions. |
| Next.js 15 | @opennextjs/cloudflare latest | `next-on-pages` is deprecated. OpenNext supports all Next.js 15.x minor/patch versions. |
| TanStack Query v5 | React 18+ | v5 requires React 18+. SDK 55 ships React 19.2 — fully compatible. |
| Zustand v5 | React 18+ | v5 drops React <18. SDK 55 React 19.2 — fully compatible. |

---

## Gaps and Flags

| Gap | Risk | Action |
|-----|------|--------|
| Nativewind v4 on SDK 55 | MEDIUM — SDK 55 dropped Legacy Arch; NW v4 has not been explicitly tested by NW team on SDK 55 (only SDK 54 verified). Community reports in GitHub discussion #1604 show issues with SDK 54 requiring patches. | Pin NW to a specific v4 patch that resolves SDK 54 peer dep issues. Monitor nativewind/nativewind#1604 before locking version. |
| DeepL vs Google Translate | LOW — decision deferred | Evaluate DeepL translation quality for KO/JA pair early. Same Edge Function, different API key. |
| Cloudflare Workers vs Pages for admin | HIGH if wrong choice made | Use Workers + OpenNext (not Pages). `next-on-pages` deprecated Dec 2025. Breaking change if Pages chosen. |
| pgmq / pg_cron availability | LOW — extensions may need manual enable on Supabase | Verify both extensions are enabled in Supabase dashboard before building notification queue logic. |

---

## Sources

- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — RN 0.83, React 19.2, New Architecture only, Expo Router v7, Hermes v1 (HIGH confidence)
- [Nativewind GitHub Discussion #1604](https://github.com/nativewind/nativewind/discussions/1604) — SDK compatibility tracking (MEDIUM confidence)
- [Nativewind v5 Migration Guide](https://www.nativewind.dev/v5/guides/migrate-from-v4) — v5 is pre-release, not production ready (HIGH confidence)
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) — latest version 0.45.1 (HIGH confidence)
- [Drizzle + Supabase official tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — integration pattern (HIGH confidence)
- [Supabase Edge Functions + Deno 2.1 announcement](https://supabase.com/blog/supabase-edge-functions-deploy-dashboard-deno-2-1) — all regions on Deno 2.1+ (HIGH confidence)
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) — replaces deprecated next-on-pages (HIGH confidence)
- [Cloudflare next-on-pages deprecation](https://github.com/cloudflare/next-on-pages) — confirmed deprecated Dec 2025 (HIGH confidence)
- [Zustand v5 release](https://pmnd.rs/blog/announcing-zustand-v5) — stable, latest 5.0.11 (HIGH confidence)
- [TanStack Query React Native docs](https://tanstack.com/query/latest/docs/framework/react/react-native) — official RN integration guide (HIGH confidence)
- [FlashList performance](https://shopify.github.io/flash-list/) — 5-10x FPS improvement (MEDIUM confidence, benchmarks device-dependent)
- [i18next + expo-localization pattern](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455) — February 2026 guide (MEDIUM confidence)
- [Expo push notifications official docs](https://docs.expo.dev/push-notifications/overview/) — EAS project ID requirement (HIGH confidence)
- [Turborepo + Expo monorepo 2025](https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af) — pnpm hoisted workaround (MEDIUM confidence)

---

*Stack research for: Wecord — BL/GL fan community platform (Weverse-like)*
*Researched: 2026-03-18*
