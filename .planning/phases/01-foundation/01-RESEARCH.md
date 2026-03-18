# Phase 1: Foundation - Research

**Researched:** 2026-03-18
**Domain:** Turborepo monorepo scaffolding, Supabase + Drizzle ORM, Expo SDK 55 + Nativewind, Next.js + OpenNext/Cloudflare, i18n, EAS Build + CI/CD
**Confidence:** MEDIUM-HIGH (core stack verified; Nativewind v4/SDK 55 compatibility is the main risk area)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **스키마 범위**: MVP 테이블만 생성: profiles, communities, community_members, artist_members, posts, comments, likes, notices, notifications, notification_preferences, reports, user_sanctions, post_translations, community_follows. v1.1 테이블(wallets, jelly_transactions, dm_subscriptions, dm_messages, memberships, media_contents)은 해당 phase에서 추가. posts/comments 테이블에 content_rating 컬럼 미리 포함 (AUTH-09 대비). `posts_with_nickname` 뷰 포함 (ARCHITECTURE.md §4.3).
- **Supabase 환경**: 로컬(Docker) + 클라우드 프로젝트 둘 다 셋업. `supabase init`으로 로컬 개발 환경 구성 + Supabase Cloud 프로젝트 연결. 마이그레이션을 로컬에서 테스트 후 클라우드에 적용.
- **RLS 정책**: ARCHITECTURE.md §6.3에 정의된 모든 RLS 정책 구현. `(select auth.uid())` 래퍼 패턴 전체 적용 (STATE.md 결정사항). anon 차단, 멤버 검증, 크리에이터 역할 검증, 팔로잉 커뮤니티 제한 등 전체 구현.
- **Admin 앱 초기화**: Next.js 초기화 + @opennextjs/cloudflare 설정 + Cloudflare Pages 실제 배포 테스트. "Hello World" 수준이지만 배포 파이프라인 검증 완료 상태. UI 프레임워크: shadcn/ui (Tailwind 기반, 모바일 앱의 Nativewind와 디자인 언어 통일).
- **CI/CD 파이프라인**: GitHub Actions: Lint + TypeCheck, Build 검증, Supabase 마이그레이션 테스트 (Docker), EAS Build 트리거. EAS Build: release 태그(v*.*.*) push 시에만 트리거 (빌드 비용 절약). Cloudflare Pages: GitHub 연동으로 main push 시 자동 배포, PR은 Preview 배포.
- **i18n 구조**: 네임스페이스 분리: common.json, auth.json 등 기능별 파일 분리. Phase 1에서는 common + auth 네임스페이스 스켈레톤만 생성 (5개 언어). 실제 번역 키는 해당 Phase에서 추가.

### Claude's Discretion
- Turborepo 캐시 전략 및 turbo.json 파이프라인 구성
- ESLint/Prettier/TypeScript 공유 설정 상세
- Drizzle 마이그레이션 파일 구조
- Nativewind v4 호환성 검증 방법 (STATE.md 경고 대응)
- Supabase Edge Function 프로젝트 구조
- 테스트 프레임워크 선택 (Vitest 등)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-01 | Turborepo 모노레포 구조 셋업 (apps/mobile, apps/admin, packages/db, packages/supabase, packages/shared) | Turborepo 2.8.17 + pnpm workspace 패턴; turbo.json pipeline 구성 |
| FOUN-02 | Supabase 프로젝트 초기화 (Auth, Storage, Realtime, Edge Functions) | Supabase CLI 2.81.2; `supabase init` + local Docker + cloud link 패턴 |
| FOUN-03 | Drizzle ORM 스키마 정의 및 초기 마이그레이션 (핵심 테이블 전체) | Drizzle ORM 0.45.1 + drizzle-kit 0.31.10; ARCHITECTURE.md §4.1 ERD 완전 반영 |
| FOUN-04 | RLS 정책 기본 구조 설정 (`(select auth.uid())` 패턴 적용) | Drizzle RLS API (`authUid`, `pgPolicy`); `(select auth.uid())` 래퍼가 row-level 평가 방지하여 성능 개선 |
| FOUN-05 | Expo SDK 55 프로젝트 초기화 (New Architecture, expo-router v4+) | Expo SDK 55.0.7 (RN 0.83, React 19.2, New Architecture only); expo-router SDK 55 버전 |
| FOUN-06 | Nativewind v4 + 다크 테마 디자인 시스템 설정 | Nativewind 4.2.3 — SDK 55 호환성 미확인; v5 마이그레이션 고려 필요 |
| FOUN-07 | Next.js 관리자 앱 초기화 (@opennextjs/cloudflare 배포 설정) | Next.js 16.1.7 + @opennextjs/cloudflare 1.17.1 + wrangler 4.75.0 |
| FOUN-08 | i18n 인프라 설정 (expo-localization + i18next, 5개 언어 KO/EN/TH/ZH-CN/JA) | expo-localization 55.0.9, i18next 25.8.18, react-i18next 16.5.8; 네임스페이스 분리 패턴 |
| FOUN-09 | EAS Build/Update 프로젝트 등록 및 CI/CD 기본 설정 | expo/expo-github-action@v8; eas-cli 18.4.0; release 태그 트리거 패턴 |
</phase_requirements>

---

## Summary

Phase 1은 Wecord 프로젝트의 모든 인프라를 처음부터 구축한다. 핵심 도전은 세 가지다: (1) Nativewind v4와 Expo SDK 55의 호환성이 공식적으로 확인되지 않았으며 v5로의 전환을 고려해야 할 수 있다. (2) RLS 정책에서 `(select auth.uid())` 래퍼 패턴을 일관되게 적용하는 것은 성능상 중요하며, Drizzle의 `authUid` helper를 사용하면 이를 타입 안전하게 처리할 수 있다. (3) @opennextjs/cloudflare는 deprecated된 `next-on-pages`를 대체하는 현재 표준이며 STATE.md에서 Phase 1에 반드시 검증하도록 명시되어 있다.

스택은 명확하게 결정되어 있다: Turborepo 2.x + pnpm workspace, Supabase CLI + Drizzle ORM 0.45.1, Expo SDK 55 (RN 0.83 / New Architecture only), Next.js + @opennextjs/cloudflare 1.17.1. 모든 패키지 버전은 npm registry에서 2026-03-18 기준으로 확인되었다.

**Primary recommendation:** Nativewind 설치 전 `npx expo export --platform ios` 테스트를 먼저 실행하여 SDK 55 호환성을 확인한다. 문제 발생 시 즉시 v5로 전환한다. 나머지 스택은 안정적이다.

---

## Standard Stack

### Core
| Library | Version (verified 2026-03-18) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| turbo | 2.8.17 | 모노레포 태스크 오케스트레이션, 캐싱 | Vercel 공식 지원; 증분 빌드, 원격 캐시 |
| pnpm | 9.x (workspace) | 패키지 관리, workspace | 디스크 효율, workspace protocol, 빠른 설치 |
| expo | 55.0.7 | iOS/Android/Web 유니버설 앱 | RN 0.83 + React 19.2, New Architecture only (SDK 55+) |
| expo-router | (SDK 55 포함) | 파일 기반 라우팅 | Expo 공식 라우터, 딥링크 자동 처리 |
| nativewind | 4.2.3 | Tailwind CSS 기반 스타일링 | tailwind 철학을 RN에 적용; v4.2.3이 현재 최신 |
| drizzle-orm | 0.45.1 | TypeScript 네이티브 ORM | SQL에 가까운 API, Supabase PostgreSQL 완벽 호환 |
| drizzle-kit | 0.31.10 | 스키마 diff 기반 마이그레이션 | drizzle-orm과 버전 쌍 |
| @supabase/supabase-js | 2.99.2 | Supabase JS Client (PostgREST + Realtime + Storage + Auth) | 공식 Supabase SDK |
| supabase (CLI) | 2.81.2 | 로컬 개발 환경, 마이그레이션 배포 | 공식 Supabase CLI |
| next | 16.1.7 | Admin 앱 React 프레임워크 | App Router, RSC, @opennextjs/cloudflare 지원 |
| @opennextjs/cloudflare | 1.17.1 | Next.js → Cloudflare Workers 어댑터 | deprecated `next-on-pages` 대체; STATE.md 결정사항 |
| wrangler | 4.75.0 | Cloudflare Workers 배포 CLI | @opennextjs/cloudflare 필수 의존성 (3.99.0+) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-localization | 55.0.9 | 디바이스 언어 감지 | i18n 초기화 시 locale 결정 |
| i18next | 25.8.18 | i18n 프레임워크 | 번역 키 관리, 네임스페이스 |
| react-i18next | 16.5.8 | React 바인딩 | `useTranslation` hook |
| @react-native-async-storage/async-storage | - | i18next 언어 설정 영속화 | 앱 재시작 후 언어 유지 |
| tailwindcss | 4.2.1 | CSS 유틸리티 (Admin용) | Next.js admin shadcn/ui 기반 |
| shadcn/ui | 4.0.8 (CLI) | Admin UI 컴포넌트 라이브러리 | Tailwind 기반, Admin 앱에만 사용 |
| vitest | 4.1.0 | 단위 테스트 프레임워크 | packages/db 스키마 검증, 유틸 테스트 |
| eas-cli | 18.4.0 | EAS Build/Update CLI | CI에서 EAS 빌드 트리거 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nativewind v4 | nativewind v5 | v5는 Expo SDK 54 기준 설계; SDK 55 호환성 미확인이지만 v4보다 향후 안정적 가능성 높음 |
| @opennextjs/cloudflare | next-on-pages | next-on-pages는 deprecated — 절대 사용하지 않음 |
| Drizzle ORM | Prisma | Prisma는 무거운 런타임, Edge 환경에서 제약 많음; Drizzle은 경량 SQL에 가까운 API |
| shadcn/ui (Admin) | Radix UI 직접 사용 | shadcn는 Radix 위의 스타일 레이어; 더 빠른 컴포넌트 조립 |

**Installation (monorepo root):**
```bash
# 루트
pnpm add -D turbo -w

# packages/db
pnpm add drizzle-orm postgres -F @wecord/db
pnpm add -D drizzle-kit -F @wecord/db

# packages/supabase (Edge Functions용 — Deno 런타임, npm 설치 불필요)

# packages/shared
pnpm add i18next react-i18next expo-localization @react-native-async-storage/async-storage -F @wecord/shared

# apps/mobile
npx create-expo-app@latest apps/mobile --template blank-typescript
pnpm add nativewind -F mobile
pnpm add -D tailwindcss -F mobile

# apps/admin
npx create-next-app@latest apps/admin --typescript --tailwind --app
pnpm add @opennextjs/cloudflare -F admin
pnpm add -D wrangler -F admin
npx shadcn@latest init  # apps/admin 내에서
```

---

## Architecture Patterns

### Recommended Project Structure
```
wecord/
├── apps/
│   ├── mobile/                    # Expo SDK 55 Universal
│   │   ├── app/                   # expo-router 파일 기반 라우팅
│   │   │   ├── (auth)/            # 인증 화면 그룹
│   │   │   ├── (tabs)/            # 메인 탭 그룹
│   │   │   └── _layout.tsx        # Root layout (폰트, Provider)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── metro.config.js        # withNativewind 래핑 필수
│   │   ├── global.css             # Nativewind CSS 지시어
│   │   └── package.json
│   │
│   └── admin/                     # Next.js 16 + @opennextjs/cloudflare
│       ├── app/                   # App Router
│       ├── components/
│       ├── wrangler.jsonc         # Cloudflare Workers 설정
│       ├── open-next.config.ts    # OpenNext 어댑터 설정
│       └── package.json
│
├── packages/
│   ├── db/                        # Drizzle ORM 스키마 & 마이그레이션
│   │   ├── schema/                # 도메인별 스키마 파일
│   │   ├── migrations/            # drizzle-kit 생성 마이그레이션
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── supabase/                  # Supabase 설정
│   │   ├── functions/             # Edge Functions (Deno)
│   │   ├── migrations/            # Supabase SQL 마이그레이션
│   │   └── config.toml
│   │
│   ├── shared/                    # 공유 유틸리티
│   │   ├── i18n/                  # 번역 리소스
│   │   │   ├── locales/
│   │   │   │   ├── ko/
│   │   │   │   │   ├── common.json
│   │   │   │   │   └── auth.json
│   │   │   │   ├── en/
│   │   │   │   ├── th/
│   │   │   │   ├── zh/
│   │   │   │   └── ja/
│   │   │   └── index.ts           # i18next 초기화
│   │   ├── types/
│   │   ├── constants/
│   │   └── package.json
│   │
│   └── ui/                        # 선택적 공유 UI 컴포넌트
│
├── tooling/
│   ├── eslint/                    # 공유 ESLint 설정
│   ├── typescript/                # 공유 tsconfig 베이스
│   └── prettier/                  # 공유 Prettier 설정
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Pattern 1: Turborepo pipeline (turbo.json)

**What:** turbo.json이 태스크 의존성과 캐시 전략을 정의한다.
**When to use:** 모노레포의 모든 빌드/린트/테스트 태스크에 적용.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Pattern 2: Drizzle 스키마 + RLS 정책 정의

**What:** Drizzle ORM으로 스키마와 RLS 정책을 함께 정의. `authUid`로 `(select auth.uid())` 패턴 자동 적용.
**When to use:** 모든 core 테이블에 적용.

```typescript
// packages/db/schema/content.ts
import { pgTable, uuid, text, integer, timestamp, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase';

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  communityId: uuid('community_id').notNull().references(() => communities.id),
  authorId: uuid('author_id').notNull(),
  authorRole: text('author_role').$type<'fan' | 'creator'>().notNull().default('fan'),
  content: text('content').notNull(),
  contentRating: text('content_rating').default('general'), // AUTH-09 대비
  likeCount: integer('like_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // RLS: 커뮤니티 멤버만 열람 — (select auth.uid()) 패턴
  pgPolicy('posts_select_member', {
    for: 'select',
    to: authenticatedRole,
    using: sql`EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = ${table.communityId}
        AND community_members.user_id = (select auth.uid())
    )`,
  }),
  // RLS: anon 차단
  pgPolicy('posts_anon_block', {
    for: 'select',
    to: anonRole,
    using: sql`false`,
  }),
]);
```

**drizzle.config.ts:**
```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema/**/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Supabase connection pooling 사용 시 prepare: false
  entities: {
    roles: {
      provider: 'supabase', // Supabase managed roles 제외
    },
  },
});
```

### Pattern 3: @opennextjs/cloudflare Admin 앱 설정

**What:** Next.js Admin 앱을 Cloudflare Workers로 배포하기 위한 필수 설정 파일들.
**When to use:** apps/admin 초기화 시.

```typescript
// apps/admin/open-next.config.ts
import { defineConfig } from '@opennextjs/cloudflare';

export default defineConfig({});
```

```jsonc
// apps/admin/wrangler.jsonc
{
  "name": "wecord-admin",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

```typescript
// apps/admin/next.config.ts
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const nextConfig = {};
export default nextConfig;
```

### Pattern 4: Nativewind v4 + dark theme 설정

**What:** Expo SDK 55에서 Nativewind v4를 설정하는 방법. SDK 55 호환성 주의 필요.
**When to use:** apps/mobile Nativewind 초기화.

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, { input: './global.css' });
```

```css
/* apps/mobile/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```javascript
// apps/mobile/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 다크 테마: 배경 #000000, 카드 #1A1A1A, 액센트 Teal #00E5C3
        background: '#000000',
        card: '#1A1A1A',
        teal: '#00E5C3',
        'teal-dark': '#00B89A',
      },
    },
  },
  plugins: [],
};
```

```typescript
// apps/mobile/app/_layout.tsx
import '../global.css';
// ... Provider 설정
```

### Pattern 5: i18next 네임스페이스 초기화

**What:** packages/shared에 i18next를 네임스페이스 분리로 초기화.
**When to use:** 앱 시작 시 1회 초기화.

```typescript
// packages/shared/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 번역 리소스 import
import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
// ... 다른 언어들

const resources = {
  ko: { common: koCommon, auth: koAuth },
  en: { common: enCommon, auth: enAuth },
  th: { common: thCommon, auth: thAuth },
  zh: { common: zhCommon, auth: zhAuth },
  ja: { common: jaCommon, auth: jaAuth },
};

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'th', 'zh', 'ja'] as const;

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.getLocales()[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### Anti-Patterns to Avoid

- **`next-on-pages` 사용**: deprecated — 반드시 `@opennextjs/cloudflare`를 사용한다.
- **RLS 정책에 bare `auth.uid()` 사용**: `(select auth.uid())` 래퍼 없이 사용하면 row-level 평가로 성능 저하. 항상 래퍼 사용.
- **Nativewind v4 설치 후 검증 생략**: SDK 55에서 `npx expo export --platform ios`로 반드시 검증.
- **Drizzle `prepare: true`로 connection pooling**: Supabase Transaction pool mode에서는 prepared statements 미지원. `prepare: false` 설정 필수.
- **RLS 없이 테이블 생성**: 모든 MVP 테이블에 RLS 활성화 + anon 차단 정책 필수.
- **turbo.json `dev` 태스크에 cache: true**: dev는 persistent 프로세스이므로 항상 `cache: false`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB 마이그레이션 추적 | 수동 SQL 파일 관리 | drizzle-kit generate/migrate | diff 기반 안전한 마이그레이션 생성 |
| RLS authUid 패턴 | 직접 sql`` 작성 | `authUid` from `drizzle-orm/supabase` | 타입 안전, `(select auth.uid())` 래퍼 자동 적용 |
| Cloudflare 배포 | 직접 Workers 번들링 | @opennextjs/cloudflare | Next.js → Workers 어댑터 복잡도 처리 |
| i18n 언어 영속화 | 직접 AsyncStorage 로직 | i18next + async-storage 플러그인 | 캐싱, 폴백, 네임스페이스 관리 포함 |
| 모노레포 빌드 순서 | 수동 의존성 스크립트 | Turborepo `dependsOn: ["^build"]` | 위상 정렬, 병렬 실행, 캐싱 |
| Supabase 로컬 환경 | 직접 PostgreSQL Docker 설정 | supabase CLI (`supabase start`) | Auth, Storage, Realtime 포함 전체 스택 |

**Key insight:** Phase 1은 인프라 단계이므로 각 도구의 공식 scaffolding 도구(create-expo-app, create-next-app, supabase init, drizzle-kit)를 최대한 활용한다. 직접 설정 파일을 작성하면 버전 불일치와 누락 설정으로 이어진다.

---

## Common Pitfalls

### Pitfall 1: Nativewind v4 + Expo SDK 55 호환성 실패
**What goes wrong:** SDK 55는 New Architecture only (RN 0.83). Nativewind v4가 Reanimated 의존성 문제로 스타일이 전혀 적용되지 않거나 빌드 에러 발생.
**Why it happens:** Nativewind v4의 공식 지원은 Expo SDK 54까지. SDK 55(RN 0.83)에서의 v4 동작은 공식 확인되지 않음.
**How to avoid:** 설치 직후 `npx expo export --platform ios`로 검증. 실패하면 즉시 nativewind v5 + `nativewind@preview` 패키지로 전환.
**Warning signs:** Metro bundler 에러, 스타일 클래스 미적용, `Cannot find module 'nativewind/metro'` 에러.

### Pitfall 2: bare `auth.uid()` in RLS (성능 저하)
**What goes wrong:** `auth.uid() = user_id` 형태의 RLS 정책이 각 row마다 함수를 재호출하여 테이블 크기에 비례한 성능 저하.
**Why it happens:** PostgreSQL optimizer가 `auth.uid()` 함수를 행마다 실행하는 volatile function으로 취급.
**How to avoid:** 항상 `(select auth.uid()) = user_id` 형태로 작성. Drizzle에서는 `authUid` from `drizzle-orm/supabase` 사용. 실제 벤치마크에서 61% 쿼리 성능 개선 확인됨.
**Warning signs:** 테이블 행 수가 늘어날수록 API 응답이 선형적으로 느려짐.

### Pitfall 3: @opennextjs/cloudflare 없이 `export const runtime = "edge"` 사용
**What goes wrong:** `@cloudflare/next-on-pages`의 edge runtime 선언이 @opennextjs/cloudflare에서 에러 발생.
**Why it happens:** `next-on-pages`와 `@opennextjs/cloudflare`는 다른 어댑터. 혼용 불가.
**How to avoid:** @opennextjs/cloudflare 마이그레이션 가이드에 따라 `export const runtime = "edge"` 제거. `initOpenNextCloudflareForDev()`를 next.config.ts에 추가.
**Warning signs:** Cloudflare Pages 빌드 실패, `edge` runtime 관련 에러.

### Pitfall 4: pnpm workspace에서 내부 패키지 참조 오류
**What goes wrong:** `apps/mobile`에서 `@wecord/shared`를 import할 때 모듈을 찾지 못함.
**Why it happens:** pnpm-workspace.yaml 설정 오류 또는 package.json의 `exports` 필드 누락.
**How to avoid:** `pnpm-workspace.yaml`에 `packages: ['apps/*', 'packages/*']` 정확히 설정. 내부 패키지에 `main`/`exports` 필드 정의. Turborepo에서 `"@wecord/shared": "workspace:*"` 의존성 선언.
**Warning signs:** `Cannot resolve module '@wecord/shared'`, Metro/Next.js 빌드 에러.

### Pitfall 5: Drizzle connection pooling prepare 설정 누락
**What goes wrong:** Supabase Transaction mode connection pooler 사용 시 prepared statements 에러.
**Why it happens:** Transaction pool mode는 prepared statements를 지원하지 않음.
**How to avoid:** `drizzle.config.ts`와 `postgres()` 클라이언트 초기화 시 `prepare: false` 설정.
**Warning signs:** `prepared statement "s1" already exists` 또는 `ERROR: prepared statements are not supported in transaction pool mode`.

### Pitfall 6: Expo SDK 55에서 expo-router의 탭 구조
**What goes wrong:** SDK 55에서 Native Tabs API가 새로 도입되어 기존 `<Tabs>` 컴포넌트 패턴이 변경됨.
**Why it happens:** SDK 55는 플랫폼 네이티브 탭 경험을 위한 새 API를 도입.
**How to avoid:** Expo SDK 55 changelog를 확인하고 Native Tabs API 문서를 참고하여 탭 레이아웃 구성. `app/(tabs)/_layout.tsx` 구조는 동일하나 내부 구현 확인 필요.
**Warning signs:** 탭 아이콘/레이아웃이 이전 SDK 패턴과 다르게 동작.

---

## Code Examples

### Supabase 로컬 환경 초기화
```bash
# packages/supabase 디렉토리에서
npx supabase init
npx supabase start  # Docker 기반 로컬 환경 시작
npx supabase link --project-ref <PROJECT_REF>  # 클라우드 프로젝트 연결
```

### Drizzle 마이그레이션 생성 및 적용
```bash
# packages/db 에서
npx drizzle-kit generate  # 스키마 diff 기반 마이그레이션 생성
npx drizzle-kit migrate   # 마이그레이션 적용 (로컬 DB)
npx supabase db push      # Supabase 클라우드에 마이그레이션 적용
```

### RLS 정책 — community_members 멤버 확인 서브쿼리
```typescript
// packages/db/schema/community.ts
// 올바른 패턴: (select auth.uid()) 래퍼 사용
pgPolicy('community_members_select', {
  for: 'select',
  to: authenticatedRole,
  using: sql`user_id = (select auth.uid())`,
}),
```

### GitHub Actions CI 파이프라인 기본 구조
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck

  migration-test:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15
    steps:
      - uses: actions/checkout@v4
      - run: npx supabase db push --local

# EAS Build는 release 태그 push 시에만
  eas-build:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-on-pages` | `@opennextjs/cloudflare` | 2024 | next-on-pages deprecated; OpenNext가 공식 Cloudflare 솔루션 |
| bare `auth.uid()` in RLS | `(select auth.uid())` 래퍼 | Supabase 공식 권고 | 61% 쿼리 성능 향상 |
| Prisma ORM | Drizzle ORM (for Edge/RN) | 2023-2024 | Edge/경량 환경에서 Drizzle이 더 적합 |
| Nativewind v3 | Nativewind v4 / v5 | v4: 2023, v5: 2025 | v4는 Tailwind v3 기반; v5는 Tailwind v4 기반 |
| expo-router `app/` 직접 | `src/app/` (SDK 55+) | SDK 55 (2026-02) | 설정 파일과 앱 코드 분리 권장 |

**Deprecated/outdated:**
- `@cloudflare/next-on-pages`: deprecated, 사용 금지
- Nativewind v2/v3: v4로 완전 대체됨
- Expo SDK 54 이하: SDK 55에서 New Architecture가 기본값이자 유일 옵션

---

## Open Questions

1. **Nativewind v4 vs v5 on Expo SDK 55**
   - What we know: v4(4.2.3)는 SDK 54 기준 공식 지원. SDK 55(RN 0.83)는 New Architecture only. v5는 SDK 54 기준 설계. 아무 버전도 SDK 55 공식 지원을 선언하지 않음.
   - What's unclear: SDK 55 + RN 0.83에서 v4, v5 중 어느 버전이 실제로 동작하는지.
   - Recommendation: Plan 01-03에서 가장 먼저 Nativewind 설치 후 `npx expo export --platform ios` 검증 태스크를 두고, 실패 시 즉시 v5로 전환하는 분기를 계획에 명시한다.

2. **Supabase 마이그레이션 전략: drizzle-kit vs supabase CLI**
   - What we know: `drizzle-kit generate`는 TypeScript 스키마에서 SQL을 생성. `supabase db push`는 Supabase 마이그레이션 추적 시스템을 사용. 두 가지 방식이 충돌할 수 있음.
   - What's unclear: packages/db와 packages/supabase/migrations를 어떻게 동기화할지.
   - Recommendation: `drizzle-kit generate`로 SQL 생성 후 `packages/supabase/migrations/`에 복사하여 Supabase CLI로 적용하는 단방향 워크플로우를 채택한다. drizzle-kit migrate는 로컬 검증용으로만 사용.

3. **Next.js 버전: 15 vs 16**
   - What we know: `npm view next version`에서 16.1.7이 latest로 확인됨. @opennextjs/cloudflare docs는 Next.js 15와 16 모두 지원한다고 명시.
   - What's unclear: Next.js 16의 breaking changes와 App Router 안정성.
   - Recommendation: `create-next-app@latest`로 생성하면 16.1.7이 설치됨. 문제 발생 시 15.x로 pin.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `packages/db/vitest.config.ts` (Wave 0에서 생성) |
| Quick run command | `pnpm --filter @wecord/db test --run` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUN-01 | Turborepo 빌드 파이프라인 작동 | smoke | `pnpm turbo build --dry` | ❌ Wave 0 |
| FOUN-02 | Supabase 로컬 환경 기동 | manual | `supabase status` (Docker 필요) | ❌ Wave 0 |
| FOUN-03 | Drizzle 스키마 → 마이그레이션 생성 | unit | `pnpm --filter @wecord/db test --run` | ❌ Wave 0 |
| FOUN-04 | RLS 정책 (select auth.uid()) 패턴 포함 | unit | `pnpm --filter @wecord/db test --run` | ❌ Wave 0 |
| FOUN-05 | Expo 앱 export 성공 | smoke | `npx expo export --platform ios --non-interactive` | ❌ Wave 0 |
| FOUN-06 | Nativewind 스타일 적용 확인 | manual | `npx expo start` 후 시각적 확인 | ❌ Wave 0 |
| FOUN-07 | Admin 앱 Cloudflare preview 빌드 성공 | smoke | `pnpm --filter admin run preview` | ❌ Wave 0 |
| FOUN-08 | i18n 5개 언어 키 로드 | unit | `pnpm --filter @wecord/shared test --run` | ❌ Wave 0 |
| FOUN-09 | EAS project 등록 확인 | manual | `eas project:info` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm turbo lint typecheck`
- **Per wave merge:** `pnpm turbo build test`
- **Phase gate:** Full suite green + manual smoke tests (FOUN-02, 06, 09) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/db/vitest.config.ts` — Vitest 설정, FOUN-03/04
- [ ] `packages/db/__tests__/schema.test.ts` — 스키마 구조 및 RLS 정책 검증
- [ ] `packages/shared/vitest.config.ts` — 공유 패키지 테스트 설정
- [ ] `packages/shared/__tests__/i18n.test.ts` — i18n 초기화 및 5개 언어 키 존재 확인
- [ ] Framework install: `pnpm add -D vitest -F @wecord/db -F @wecord/shared`

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`) — 2026-03-18 기준 모든 패키지 버전 직접 확인
- [Drizzle ORM RLS Docs](https://orm.drizzle.team/docs/rls) — `pgPolicy`, `authUid`, Supabase integration
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — RN 0.83, React 19.2, New Architecture only, expo-router
- [@opennextjs/cloudflare Get Started](https://opennext.js.org/cloudflare/get-started) — wrangler.jsonc, open-next.config.ts, 배포 명령어
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — `(select auth.uid())` 패턴 공식 권고

### Secondary (MEDIUM confidence)
- [GitHub Discussion #1604 — Nativewind/Expo versions](https://github.com/nativewind/nativewind/discussions/1604) — SDK 55 비공식 호환성 정보
- [Nativewind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) — v5 설치 과정 (SDK 54 기준)
- [Expo GitHub Action docs](https://docs.expo.dev/build/building-on-ci/) — CI EAS 빌드 설정
- [Drizzle with Supabase Tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — drizzle.config.ts + connection pooling

### Tertiary (LOW confidence)
- Various WebSearch results on Turborepo + pnpm monorepo patterns — 커뮤니티 문서이나 공식 패턴과 일치

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — npm registry에서 모든 버전 직접 확인 (2026-03-18)
- Architecture: HIGH — ARCHITECTURE.md §3, §4, §6 기반 + 공식 문서 확인
- Pitfalls (Nativewind): LOW-MEDIUM — SDK 55 공식 호환성 미확인; 커뮤니티 보고 기반
- Pitfalls (RLS, OpenNext): HIGH — 공식 문서에서 확인
- i18n patterns: MEDIUM — 공식 문서 + 커뮤니티 패턴 일치

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30일 — Nativewind v4/v5 SDK 55 공식 지원 발표 시 즉시 갱신 필요)
