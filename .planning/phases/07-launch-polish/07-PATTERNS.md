# Phase 7: Launch Polish — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 40 (신규 생성 + 수정 파일 총합)
**Analogs found:** 36 / 40 (4개는 완전 신규 — delete-user Edge Function 구조만 기존 function에서 차용, 실제 orchestration은 신규 패턴)

---

## File Classification

### Mobile screens / routes (14)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `apps/mobile/app/(tabs)/_layout.tsx` | config/layout | request-response (navigation) | self (modify) | exact |
| `apps/mobile/app/(tabs)/more.tsx` | screen | request-response | `apps/mobile/app/(tabs)/notifications.tsx` (SafeAreaView + ScrollView 패턴), `apps/mobile/app/(community)/search.tsx` | role-match |
| `apps/mobile/app/(tabs)/shop.tsx` | screen | streaming (WebView) | 없음 (신규) — `apps/mobile/app/(community)/[id]/notification-preferences.tsx` 헤더 패턴만 재사용 | partial |
| `apps/mobile/app/(tabs)/dm.tsx` | screen | CRUD (boolean update) | `apps/mobile/app/(onboarding)/complete.tsx` (centered empty-state pattern) | role-match |
| `apps/mobile/app/(more)/_layout.tsx` | layout | — | `apps/mobile/app/(community)/_layout.tsx`, `apps/mobile/app/(community)/[id]/_layout.tsx` | exact |
| `apps/mobile/app/(more)/profile-edit.tsx` | screen | CRUD | `apps/mobile/app/(onboarding)/language.tsx` (form + 저장 flow), `apps/mobile/components/community/CommunityNicknameInput.tsx` | role-match |
| `apps/mobile/app/(more)/settings.tsx` | screen | CRUD | `apps/mobile/app/(community)/[id]/notification-preferences.tsx` (grouped list + Switch) | exact |
| `apps/mobile/app/(more)/joined-communities.tsx` | screen | request-response (list) | `apps/mobile/app/(community)/search.tsx` (FlatList + query hook) | role-match |
| `apps/mobile/app/(more)/language.tsx` (settings 진입) | screen | CRUD | `apps/mobile/app/(onboarding)/language.tsx` (추출 대상) | exact |
| `apps/mobile/app/(more)/delete-account/_layout.tsx` | layout | — | `apps/mobile/app/(community)/[id]/_layout.tsx` | exact |
| `apps/mobile/app/(more)/delete-account/warning.tsx` | screen | request-response | `apps/mobile/app/(onboarding)/tos.tsx` (scroll + 동의 CTA) | role-match |
| `apps/mobile/app/(more)/delete-account/confirm.tsx` | screen | request-response | `apps/mobile/components/community/CommunityNicknameInput.tsx` (TextInput + validation) | partial |
| `apps/mobile/app/(more)/delete-account/processing.tsx` | screen | event-driven | `apps/mobile/app/(onboarding)/complete.tsx` (centered loader) | partial |

### Mobile hooks (7)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `apps/mobile/hooks/profile/useUpdateProfile.ts` | hook | CRUD | `apps/mobile/hooks/notification/useNotificationPreferences.ts` (optimistic mutation pattern) | exact |
| `apps/mobile/hooks/profile/useUploadAvatar.ts` | hook | file-I/O | `apps/mobile/hooks/post/useCreatePost.ts` (`compressAndUploadImage`) | exact |
| `apps/mobile/hooks/profile/useDirtyState.ts` | hook/utility | transform | (신규 utility — RESEARCH Pattern 5 참조) | no-analog |
| `apps/mobile/hooks/community/useMyCommunities.ts` | hook | request-response | `apps/mobile/hooks/community/useCommunitySearch.ts` (useQuery + 매핑) | exact |
| `apps/mobile/hooks/dm/useDmLaunchNotify.ts` | hook | CRUD | `apps/mobile/hooks/community/useJoinCommunity.ts` (useMutation + invalidate) | role-match |
| `apps/mobile/hooks/account/useDeleteAccount.ts` | hook | event-driven | `apps/mobile/hooks/post/useCreatePost.ts` (functions.invoke) + `authStore.signOut()` | role-match |
| (hook) authStore 로그아웃 cache clear 확장 | hook | event-driven | `apps/mobile/stores/authStore.ts` (modify signOut to call queryClient.clear) | exact |

### Mobile components (7)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `apps/mobile/components/settings/LanguagePicker.tsx` | component | CRUD (controlled + onChange) | `apps/mobile/app/(onboarding)/language.tsx` (추출) | exact |
| `apps/mobile/components/settings/SettingsRow.tsx` | component | request-response | `apps/mobile/app/(community)/[id]/notification-preferences.tsx` `PreferenceRow` | exact |
| `apps/mobile/components/more/ProfileCard.tsx` | component | request-response | `apps/mobile/components/community/CommunityCard.tsx` (rounded card + image + text 조합) | role-match |
| `apps/mobile/components/more/JoinedCommunityRow.tsx` | component | request-response | `apps/mobile/components/notification/NotificationRow.tsx` (row w/ icon + text + chevron) | role-match |
| `apps/mobile/components/more/AvatarActionSheet.tsx` | component (wrapper) | event-driven | 없음 — `@expo/react-native-action-sheet` 공식 문서 패턴 | no-analog |
| `apps/mobile/components/shop/ShopWebView.tsx` + `ShopHeader.tsx` + `ShopErrorFallback.tsx` | component | streaming | 없음 — react-native-webview 공식 패턴 + `apps/mobile/app/(community)/[id]/notification-preferences.tsx` 헤더 | partial |
| `apps/mobile/components/dm/DmPlaceholder.tsx` | component | CRUD | `apps/mobile/app/(tabs)/notifications.tsx` empty-state block (lines 219-228) | role-match |

### Supabase schema + functions (5)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `packages/supabase/migrations/<ts>_phase7_dm_launch_notify.sql` | migration | schema | `packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql` (ALTER + policy) | exact |
| `packages/supabase/migrations/<ts>_phase7_avatars_bucket.sql` | migration | schema+storage | `packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql` (lines 76-92) | exact |
| `packages/supabase/migrations/<ts>_phase7_delete_user_function.sql` | migration | pg function | `packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql` (plpgsql SECURITY DEFINER) | role-match |
| `packages/supabase/functions/delete-user/index.ts` | edge-function | event-driven | `packages/supabase/functions/generate-nickname/index.ts` (Deno.serve + CORS + service_role client) + RESEARCH Pattern 3 | exact |
| `packages/db/src/schema/auth.ts` | schema | — | self (modify — add `dm_launch_notify` + `bio` 이미 존재 확인) | exact |

### i18n (5 namespaces × 2 languages = 10)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `packages/shared/src/i18n/locales/{ko,en}/more.json` | config/i18n | — | `packages/shared/src/i18n/locales/{ko,en}/common.json` (flat key structure) | exact |
| `packages/shared/src/i18n/locales/{ko,en}/settings.json` | config/i18n | — | 위 동일 | exact |
| `packages/shared/src/i18n/locales/{ko,en}/shop.json` | config/i18n | — | 위 동일 | exact |
| `packages/shared/src/i18n/locales/{ko,en}/dm.json` | config/i18n | — | 위 동일 | exact |
| `packages/shared/src/i18n/locales/{ko,en}/legal.json` | config/i18n | — | 위 동일 | exact |

### Admin app public routes (4)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `apps/admin/app/(public)/layout.tsx` | layout | — | `apps/admin/app/(dashboard)/layout.tsx` (reverse — auth 제거) + `apps/admin/app/layout.tsx` | role-match |
| `apps/admin/app/(public)/privacy/page.tsx` | screen | static render | RESEARCH Example 3 + `apps/admin/app/(dashboard)/notices/page.tsx` (Next.js 'use client' 패턴) | partial |
| `apps/admin/app/(public)/terms/page.tsx` | screen | static render | 위 동일 | partial |
| (option) `apps/admin/app/(public)/account-delete-request/page.tsx` | screen | static render | 위 동일 | partial |

### Config (3)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `apps/mobile/app.json` | config | — | self (modify plugins) | exact |
| `apps/mobile/eas.json` | config | — | self (modify production profile) | exact |
| `apps/mobile/package.json` | config | — | self (modify deps) | exact |

---

## Pattern Assignments

### 1. `apps/mobile/app/(tabs)/_layout.tsx` (5-tab expansion)

**Analog:** `apps/mobile/app/(tabs)/_layout.tsx` (self — modify)

**Base pattern to preserve** (lines 5-16):
```tsx
<Tabs
  screenOptions={{
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#000000',
      borderTopColor: '#2A2A2A',
      height: 56,
    },
    tabBarActiveTintColor: '#00E5C3',
    tabBarInactiveTintColor: '#999999',
  }}
>
```

**Existing Tabs.Screen pattern to copy** (lines 18-35):
```tsx
<Tabs.Screen
  name="index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home-outline" size={size} color={color} />
    ),
  }}
/>
```

**Hidden tab pattern** (lines 36-41):
```tsx
<Tabs.Screen
  name="notifications"
  options={{ href: null }}
/>
```

**What to copy:** screenOptions block intact, Tabs.Screen 구조, notifications href:null 유지.

**What to change for Phase 7:**
- 3개 Tabs.Screen 추가 (`shop`, `dm`, `more`) — CONTEXT D-01 기준 Home → Community → Shop → DM → More 순서.
- `tabBarIcon` callback 시그너처를 `({ color, size, focused })`로 확장해 outline/filled 토글 (UI-SPEC 5-tab section).
- `title` i18n화: `t('tabs.home')` 등 — 신규 `common.json` 키 추가 또는 기존 `auth.json` 패턴 참조.

**Data flow:** 클라이언트 네비게이션만; 서버 호출 없음.

---

### 2. `apps/mobile/app/(tabs)/more.tsx` (Account hub)

**Analog:** `apps/mobile/app/(tabs)/notifications.tsx` (SafeAreaView + header + content 패턴)

**Imports pattern to copy** (notifications.tsx lines 1-7):
```tsx
import { View, Text, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
```

**SafeAreaView + header pattern** (notifications.tsx lines 170-206):
```tsx
<SafeAreaView className="flex-1 bg-background">
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    }}
    className="border-border"
  >
    ...
  </View>
  <ScrollView> ... </ScrollView>
</SafeAreaView>
```

**What to copy:** SafeAreaView 래핑, 헤더 border-bottom 구조, `useTranslation` + `useAuthStore` 패턴, `router.push` deep-link 처리.

**What to change for Phase 7:**
- 헤더 title을 '더보기'로 변경 (UI-SPEC Tab label 섹션).
- ScrollView 내용: `<ProfileCard />` → `<JoinedCommunitiesSection />` → `<SettingsSection />` → `<AppInfoSection />` → `<LogOutSection />` (CONTEXT D-06 순서).
- Pull-to-refresh는 제외 (profile/community list는 TanStack Query가 자동 refetch).

**Data flow:** `useAuth()` + `useMyCommunities()` 구독 → UI 렌더 → 섹션별 router.push.

---

### 3. `apps/mobile/app/(tabs)/shop.tsx` + components/shop/*

**Analog:** RESEARCH Pattern 2 (react-native-webview 공식) + `apps/mobile/app/(community)/[id]/notification-preferences.tsx` (헤더 구조 lines 58-79)

**Header pattern to mirror** (notification-preferences.tsx lines 58-79):
```tsx
<View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  }}
  className="border-border"
>
  <Pressable
    onPress={() => router.back()}
    accessibilityRole="button"
    accessibilityLabel="뒤로가기"
    style={{ minHeight: 44, justifyContent: 'center', marginRight: 12 }}
  >
    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
  </Pressable>
  <Text className="text-display font-semibold text-foreground">...</Text>
</View>
```

**WebView core pattern** (RESEARCH Pattern 2, excerpt):
```tsx
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

const ALLOWED_HOST = 'x-square.kr';

const handleShouldStart = (req: any) => {
  try {
    const url = new URL(req.url);
    if (!url.hostname.endsWith(ALLOWED_HOST)) {
      WebBrowser.openBrowserAsync(req.url);
      return false;
    }
  } catch { return false; }
  return true;
};

<WebView
  ref={ref}
  source={{ uri: 'https://x-square.kr' }}
  onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
  onShouldStartLoadWithRequest={handleShouldStart}
  onError={() => setError(true)}
  onHttpError={({ nativeEvent }) => {
    if (nativeEvent.statusCode >= 500) setError(true);
  }}
  allowsBackForwardNavigationGestures
  startInLoadingState
/>
```

**What to copy:** hostname 필터 로직 (URL 파싱 실패 시 false), `onNavigationStateChange` → `canGoBack` state 동기화, error state 기반 Fallback 전환.

**What to change for Phase 7:**
- `ShopHeader` 컴포넌트 신설: 좌측 back (canGoBack 기반 disabled), 중앙 'Shop', 우측 refresh (`ref.current?.reload()`) — UI-SPEC D-23 참조.
- `ShopErrorFallback`은 centered layout + `PrimaryCTAButton` 재사용 (UI-SPEC Shop error fallback 섹션).
- `sharedCookiesEnabled={false}` 명시 (D-24 무명 방문).

**Data flow:** WebView → 외부 CDN (x-square.kr), 앱 내 저장 없음. error state만 로컬.

---

### 4. `apps/mobile/app/(tabs)/dm.tsx` + components/dm/DmPlaceholder.tsx

**Analog:** `apps/mobile/app/(tabs)/notifications.tsx` empty-state block (lines 219-228) + `apps/mobile/components/PrimaryCTAButton.tsx`

**Empty-state pattern to copy** (notifications.tsx lines 219-228):
```tsx
<View className="flex-1 items-center justify-center px-8" style={{ paddingTop: 64 }}>
  <Ionicons name="notifications-outline" size={48} color="#666666" />
  <Text className="text-heading font-semibold text-foreground mt-4 text-center">
    {t('empty.heading')}
  </Text>
  <Text className="text-body text-muted-foreground mt-2 text-center">
    {t('empty.body')}
  </Text>
</View>
```

**PrimaryCTAButton pattern** (PrimaryCTAButton.tsx lines 11-48) — reuse verbatim.

**What to copy:** 중앙 정렬 empty-state (Ionicons + Heading + Body), PrimaryCTAButton 통째 재사용.

**What to change for Phase 7:**
- Icon: `chatbubbles-outline`, size 96, color teal `#00E5C3` (UI-SPEC DM Coming Soon).
- Heading: Display 20px (`text-display font-semibold`), Body는 max-width ~280px.
- CTA: "출시되면 알려주세요" → tap 후 "알림 등록 완료" outline variant로 상태 전환.
- `useDmLaunchNotify()` 훅 연동: profile.dm_launch_notify 이미 true이면 'Notified' 초기 상태 + 재탭 시 Alert/toast "이미 알림이 등록되어 있어요" (Pitfall 10 방지).

**Data flow:** profile 상태 → UI → `supabase.from('profiles').update({ dm_launch_notify: true })` → optimistic invalidate.

---

### 5. `apps/mobile/app/(more)/_layout.tsx`

**Analog:** `apps/mobile/app/(community)/[id]/_layout.tsx` (정확히 동일)

**Full pattern to copy** (`[id]/_layout.tsx` lines 1-13):
```tsx
import { Stack } from 'expo-router';

export default function CommunityIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    />
  );
}
```

**What to copy:** 구조 전체. 이름만 `MoreGroupLayout`으로 변경.

**What to change:** animation 추가 고려 (`animation: 'slide_from_right'`는 `(community)/_layout.tsx`에 이미 있음 — delete-account 서브 플로우에는 `animation: 'default'` 권장).

---

### 6. `apps/mobile/app/(more)/profile-edit.tsx`

**Analog:** `apps/mobile/app/(onboarding)/language.tsx` (form + state + supabase update 패턴)

**State + update pattern to copy** (language.tsx lines 21-49):
```tsx
const { user, profile, setProfile } = useAuthStore();
const [loading, setLoading] = useState(false);

const handleContinue = async () => {
  if (!user || !profile) return;
  setLoading(true);
  try {
    await i18n.changeLanguage(selectedLanguage);
    await supabase
      .from('profiles')
      .update({ language: selectedLanguage })
      .eq('user_id', user.id);
    setProfile({ ...profile, language: selectedLanguage });
    router.push('/(onboarding)/curate' as never);
  } finally {
    setLoading(false);
  }
};
```

**What to copy:** `useAuthStore` destructure 패턴, `try/finally` loading 관리, `supabase.from('profiles').update().eq('user_id', user.id)` 시그너처, `setProfile` optimistic local sync.

**What to change for Phase 7:**
- 필드 3개 동시 편집: nickname / avatar / bio (CONTEXT D-10) — `useState` snapshot + dirty 비교 (RESEARCH Pattern 5).
- Header: 좌측 back, 중앙 '프로필 편집', 우측 '저장' (`disabled={!isDirty || loading}`) — UI-SPEC Profile edit section.
- Avatar tap → `@expo/react-native-action-sheet` `showActionSheetWithOptions({ options: [...], destructiveButtonIndex, cancelButtonIndex })` (D-11, 4 옵션).
- Bio: `TextInput multiline maxLength={150}` + `{current.bio.length}/150` helper.
- Save flow: (1) avatar 로컬 URI → `useUploadAvatar()` → public URL, (2) profile update(nickname, bio, avatar_url), (3) setProfile + `queryClient.invalidateQueries({ queryKey: ['profile'] })`, (4) back.

**Data flow:** local state → avatars 버킷 업로드 → profiles row update → authStore setProfile + TanStack invalidate.

---

### 7. `apps/mobile/app/(more)/settings.tsx`

**Analog:** `apps/mobile/app/(community)/[id]/notification-preferences.tsx` (exact — grouped list + Switch)

**PreferenceRow pattern to copy** (notification-preferences.tsx lines 9-41):
```tsx
interface PreferenceRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function PreferenceRow({ label, description, value, onChange }: PreferenceRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
      }}
      className="border-border"
    >
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text className="text-heading font-semibold text-foreground">{label}</Text>
        <Text className="text-label text-muted-foreground mt-1">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#3A3A3A', true: '#00E5C3' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
```

**What to copy:** Switch `trackColor` + `thumbColor` (teal 색상 토큰 고정), row layout (`justifyContent: 'space-between'` + `borderBottomWidth: 1` + `border-border`), label/description 계층.

**What to change for Phase 7:**
- `SettingsRow` 일반화: `right?: 'switch' | 'chevron' | 'value'` prop으로 3가지 variation 수용. switch (푸시 알림), value+chevron (언어 현재값), chevron (커뮤니티별 설정 / 약관 / 개인정보 / 버전 readonly).
- OS permission reconcile: `useFocusEffect(() => { Notifications.getPermissionsAsync().then(...) })` (RESEARCH Pattern 7).
- 섹션 그룹화: 첫 행 top-rounded, 마지막 행 bottom-rounded, 섹션 간 32px gap (UI-SPEC grouped list).
- 행 탭 동작:
  - 언어 → `router.push('/(more)/language')`
  - 푸시 알림 → `togglePush(desired)` (Pattern 7)
  - 커뮤니티별 설정 → `router.push('/(more)/joined-communities')` (재사용; 선택 시 기존 `(community)/[id]/notification-preferences`)
  - 약관/개인정보 → `Linking.openURL('https://<cf-pages>.pages.dev/terms')`
  - 로그아웃 → `Alert.alert` (LeaveConfirmDialog 패턴)
  - 계정 삭제 → `router.push('/(more)/delete-account/warning')`

**Data flow:** profile + OS permission → UI → 개별 action (routing / OS call / supabase update).

---

### 8. `apps/mobile/app/(more)/joined-communities.tsx`

**Analog:** `apps/mobile/app/(community)/search.tsx` (FlatList + query hook)

**List pattern to copy** (search.tsx lines 30-50):
```tsx
const renderItem = ({ item }: { item: CommunitySearchResult }) => (
  <View style={{ width: '50%' }}>
    <CommunityCard community={item} />
  </View>
);

const renderEmpty = () => {
  if (isLoading) return null;
  if (!debouncedQuery.trim()) return null;
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Ionicons name="search-outline" size={48} color="#666666" />
      <Text className="text-heading font-semibold text-foreground mt-4">
        {t('search.empty.heading')}
      </Text>
      <Text className="text-body text-muted-foreground mt-2">{t('search.empty.body')}</Text>
    </View>
  );
};
```

**Hook pattern reference:** `useCommunitySearch` (useQuery + mapping) — `useMyCommunities` 신규 훅은 RESEARCH Example 1 참조.

**What to copy:** FlatList + isLoading + empty state 3단 분기, `t('...')` 빈 상태 copy.

**What to change for Phase 7:**
- 2-column grid → 1-column list (UI-SPEC Joined-communities list, 56px row + 40dp avatar).
- `JoinedCommunityRow` 컴포넌트: Ionicons 대신 `expo-image`로 community cover, 우측 chevron-forward (`muted-foreground`).
- 탭 시 `router.push(\`/(community)/\${id}\`)` (D-07).
- Query key: `['myCommunities', userId]` (RESEARCH Example 1).

**Data flow:** `useMyCommunities()` → community_members 조인 쿼리 → 리스트 렌더.

---

### 9. `apps/mobile/app/(more)/delete-account/{warning,confirm,processing}.tsx`

**Analogs mixed:**
- warning → `apps/mobile/app/(onboarding)/tos.tsx` (ScrollView + CTA)
- confirm → `apps/mobile/components/community/CommunityNicknameInput.tsx` (TextInput + validation)
- processing → `apps/mobile/app/(onboarding)/complete.tsx` (centered ActivityIndicator)

**TextInput validation pattern to reference:** warning/confirm 페이지는 아래 패턴으로 dirty 체크:
```tsx
const [typed, setTyped] = useState('');
const canProceed = typed === 'DELETE';
// <PrimaryCTAButton disabled={!canProceed} ... />
```

**Processing pattern** (RESEARCH Pattern 3 — Edge Function call + signOut 순서, Pitfall 5):
```tsx
useEffect(() => {
  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { /* already signed out */ return; }
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await useAuthStore.getState().signOut(); // local clear — session already invalid server-side
      queryClient.clear();
      router.replace('/(auth)/login');
    } catch (err) {
      // toast + back to warning
      Alert.alert(t('delete.error'));
      router.back();
    }
  })();
}, []);
```

**What to copy from analogs:** ScrollView wrapper from `tos.tsx`, TextInput pattern from CommunityNicknameInput, ActivityIndicator centered from complete.tsx.

**What to change:** 3단계 독립 라우트 유지 (D-37), destructive 톤 (`bg-destructive` CTA), 삭제 순서 strict (Edge Function 완료 후에만 로컬 signOut).

**Data flow:** Edge Function POST (JWT) → service_role orchestrated delete → 200 → client signOut + queryClient.clear + router.replace.

---

### 10. `apps/mobile/hooks/profile/useUpdateProfile.ts`

**Analog:** `apps/mobile/hooks/notification/useNotificationPreferences.ts` (optimistic mutation)

**Mutation skeleton to copy** (useNotificationPreferences.ts lines 43-90):
```tsx
const mutation = useMutation({
  mutationFn: async ({ column, value }: { column: ...; value: boolean }) => {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user!.id, ..., [column]: value }, { onConflict: 'user_id,community_id' });
    if (error) throw error;
  },
  onMutate: async ({ column, value }) => {
    const queryKey = ['notification_preferences', user?.id, communityId];
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData<...>(queryKey);
    queryClient.setQueryData<...>(queryKey, (old) => ({ ...old, [column]: value }));
    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

**What to copy:** `onMutate` / `onError` / `onSettled` 전체 optimistic rollback 구조.

**What to change:**
- Table: `profiles`, keyed on `user_id`.
- Mutation input: `{ globalNickname?, bio?, avatarUrl?, dmLaunchNotify? }` partial update.
- Query key: `['profile', userId]`.
- Post-mutation: `useAuthStore.setProfile(mergedProfile)` local sync (이미 `authStore`가 `setProfile` 노출 중).

**Data flow:** partial profile patch → supabase update → authStore setProfile + TanStack invalidate.

---

### 11. `apps/mobile/hooks/profile/useUploadAvatar.ts`

**Analog:** `apps/mobile/hooks/post/useCreatePost.ts` `compressAndUploadImage` (exact)

**Full pattern to copy** (useCreatePost.ts lines 17-48):
```tsx
async function compressAndUploadImage(uri: string, path: string): Promise<string> {
  const compressed = await manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  let uploadData: ArrayBuffer | Blob;
  if (Platform.OS === 'web') {
    const response = await fetch(compressed.uri);
    uploadData = await response.blob();
  } else {
    const base64 = await readAsStringAsync(compressed.uri, { encoding: 'base64' });
    uploadData = decode(base64);
  }
  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, uploadData, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data: publicData } = supabase.storage.from('post-media').getPublicUrl(path);
  return publicData.publicUrl;
}
```

**What to copy:** `manipulateAsync` + web/native 분기, `readAsStringAsync` + `decode` base64 → ArrayBuffer, `supabase.storage.upload` + `getPublicUrl` 두 단계.

**What to change for Phase 7:**
- Bucket: `avatars` (신규) — RESEARCH Pattern 6 마이그레이션으로 생성.
- Resize: `width: 512, height: 512` (square crop 권장).
- `upsert: true` (유저당 avatar 경로 단일 — `{userId}/avatar-{timestamp}.jpg`).
- Path: `${userId}/avatar-${Date.now()}.jpg` (CDN cache bust).

**Data flow:** local URI → 리사이즈 → base64 → ArrayBuffer → Storage 업로드 → public URL 반환.

---

### 12. `apps/mobile/hooks/community/useMyCommunities.ts`

**Analog:** `apps/mobile/hooks/community/useCommunitySearch.ts` (useQuery + mapping)

**Query structure** (useCommunitySearch.ts lines 15-34):
```tsx
export function useCommunitySearch(query: string) {
  return useQuery({
    queryKey: ['communitySearch', query],
    queryFn: async (): Promise<CommunitySearchResult[]> => {
      if (!query.trim()) return [];
      const { data, error } = await supabase
        .from('communities')
        .select('id, slug, name, description, cover_image_url, type, category, member_count')
        .textSearch('name', query, { type: 'websearch', config: 'simple' })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as CommunitySearchResult[];
    },
    enabled: query.trim().length > 0,
  });
}
```

**What to copy:** query key array + `enabled` gate + typed return + `(data ?? []) as T[]` 캐스팅.

**What to change for Phase 7 (RESEARCH Example 1):**
- Table: `community_members` with `!inner` join to `communities`.
- Filter: `.eq('user_id', userId!)`.
- Select: `community_nickname, joined_at, communities!inner(id, name, slug, cover_image_url)`.
- Order: `joined_at desc`.
- Map result: `{ communityId, communityName, coverImageUrl, myCommunityNickname, joinedAt }`.

**Data flow:** authStore.user.id → TanStack Query → supabase select → 매핑 → UI.

---

### 13. `apps/mobile/hooks/dm/useDmLaunchNotify.ts`

**Analog:** `apps/mobile/hooks/community/useJoinCommunity.ts` (useMutation + authStore.user + invalidate)

**Mutation skeleton** (useJoinCommunity.ts lines 26-45):
```tsx
export function useJoinCommunity() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async ({ ... }) => {
      if (!user) throw new Error('Not authenticated');
      const { error: insertError } = await supabase
        .from('community_members')
        .insert({ ... });
      if (insertError) { ... }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['communityMember', variables.communityId] });
    },
  });
}
```

**What to copy:** user guard, `useAuthStore` destructure, mutation + invalidate 패턴.

**What to change for Phase 7 (RESEARCH Example 2):**
- Single-field update: `.update({ dm_launch_notify: true }).eq('user_id', user.id)`.
- 재탭 처리: mutationFn 진입 전에 `profile.dm_launch_notify === true`이면 toast '이미 등록되어 있어요' 보여주고 mutate 생략 (Pitfall 10).
- `onSuccess`: authStore.setProfile merge + `queryClient.invalidateQueries({ queryKey: ['profile', userId] })`.
- Profile 타입 확장 필요: `authStore.ts` Profile 인터페이스에 `dmLaunchNotify: boolean` 추가 + `fetchOrCreateProfile` select에 포함.

**Data flow:** profile check → (skip or update) → authStore setProfile + invalidate.

---

### 14. `apps/mobile/hooks/account/useDeleteAccount.ts`

**Analog:** RESEARCH Pattern 3 + `apps/mobile/stores/authStore.ts` `signOut()` + `useCreatePost.ts` `supabase.functions.invoke` 패턴

**functions.invoke reference** (useCreatePost.ts lines 130-138):
```tsx
supabase.functions.invoke('moderate', {
  body: { target_id: data.id, target_type: 'post', content: ..., author_id: user?.id },
}).catch(() => {});
```

**signOut reference** (authStore.ts lines 158-161):
```tsx
signOut: async () => {
  await supabase.auth.signOut();
  set({ session: null, user: null, profile: null, onboardingData: null });
},
```

**What to copy:** `supabase.functions.invoke` 대신 `fetch` + Authorization header (Edge Function이 JWT 필요), signOut 내부 state clear 패턴.

**What to change:**
- Strict 순서: Edge Function 200 → `authStore.signOut()` → `queryClient.clear()` → `router.replace('/(auth)/login')` (Pitfall 5).
- Loading state는 screen-level (`processing.tsx`)이 관리 — 훅은 pure async 함수 반환.
- Error handling: catch 시 toast + back 플로우는 호출처가 관리.

**Data flow:** session JWT → Edge Function POST → (orchestrated delete) → signOut → cache clear → replace.

---

### 15. `apps/mobile/components/settings/LanguagePicker.tsx`

**Analog:** `apps/mobile/app/(onboarding)/language.tsx` (extract — exact copy of render)

**Pattern to extract** (language.tsx lines 13-88):
```tsx
const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

<FlatList
  data={LANGUAGES}
  keyExtractor={(item) => item.code}
  className="mt-4"
  ItemSeparatorComponent={() => <View className="h-2" />}
  renderItem={({ item }) => {
    const isSelected = item.code === selectedLanguage;
    return (
      <Pressable
        onPress={() => { setSelectedLanguage(item.code); i18n.changeLanguage(item.code); }}
        className={`flex-row items-center justify-between h-[52px] rounded-xl px-4 bg-card ${
          isSelected ? 'border-2 border-teal' : 'border-2 border-transparent'
        }`}
      >
        <Text className="text-body font-regular text-foreground">{item.label}</Text>
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
            isSelected ? 'border-teal' : 'border-subtle'
          }`}
        >
          {isSelected && <View className="w-[10px] h-[10px] rounded-full bg-teal" />}
        </View>
      </Pressable>
    );
  }}
/>
```

**What to copy:** LANGUAGES constant, FlatList + renderItem, radio ring + inner dot (`w-5 h-5` + `w-[10px] h-[10px]`), teal selected state.

**What to change:**
- Props: `{ value, onChange, mode }` 인터페이스 (RESEARCH Pattern 4).
- `mode === 'settings'`: onChange가 즉시 supabase + i18n 커밋. CTA 없음.
- `mode === 'onboarding'`: 현재 `language.tsx`가 이 컴포넌트를 import하고, 자체 `handleContinue`에서 commit.
- `language.tsx` (onboarding) 리팩토링: LANGUAGES + render만 새 컴포넌트에서 import, handleContinue는 그대로 유지.

**Data flow (settings mode):** onChange → i18n.changeLanguage + profile.language update + queryClient.invalidateQueries(['profile']).

---

### 16. `apps/mobile/components/settings/SettingsRow.tsx`

**Analog:** `apps/mobile/app/(community)/[id]/notification-preferences.tsx` `PreferenceRow` (lines 16-41)

이미 Pattern 7 섹션에서 전체 excerpt 인용.

**What to copy:** border-bottom, flex row with label/description 계층, Switch trackColor.

**What to change for Phase 7:**
- `right` prop variant: `switch` | `chevron` | `valueWithChevron` | `none`.
- Destructive variant: `destructive?: boolean` → label text-destructive (로그아웃/계정 삭제 행).
- Icon 왼쪽 옵션: `leftIcon?: React.ComponentProps<typeof Ionicons>['name']` (UI-SPEC settings rows 20px outline icon).

---

### 17. `apps/mobile/components/more/ProfileCard.tsx`

**Analog:** `apps/mobile/components/community/CommunityCard.tsx` (rounded card w/ image + text)

**Quick structural reference** — 개별 Read 생략, 기본 structure:
- `Pressable` or `View` with `bg-card rounded-xl p-4`
- `flex-row` layout
- `expo-image` for avatar
- Right-aligned action text button

**What to change for Phase 7 (UI-SPEC More tab profile card):**
- Height 88px, `bg-card`, rounded-12, mx-4, p-4.
- 56px circular avatar (`expo-image`, fallback initial).
- Middle flex: globalNickname (Heading 16px semibold) + bio preview (Body 14px muted, numberOfLines=1).
- Right: '프로필 편집' text button (teal, Label 12px, NOT icon).
- Tap '프로필 편집' → `router.push('/(more)/profile-edit')`.

---

### 18. `apps/mobile/components/more/JoinedCommunityRow.tsx`

**Analog:** `apps/mobile/components/notification/NotificationRow.tsx` (row with icon + text + chevron)

Quick structural notes (without separate Read — already referenced in notifications.tsx usage):
- `Pressable` row, 56px height, `borderBottomWidth: 1` border-border.
- `flex-row items-center`.
- Left 40dp avatar → middle flex (title/subtitle) → right chevron.

**What to change for Phase 7 (UI-SPEC Joined communities list):**
- 40dp circular `expo-image` for community cover.
- Title: community name (Body 14px semibold).
- Subtitle: `내 닉네임: {myCommunityNickname}` (Label 12px muted).
- Right: `Ionicons chevron-forward 16` muted.
- Tap: `router.push(\`/(community)/\${communityId}\`)`.

---

### 19. `apps/mobile/components/more/AvatarActionSheet.tsx`

**Analog:** 없음 (신규) — `@expo/react-native-action-sheet` 공식 패턴 (RESEARCH Standard Stack + CONTEXT D-11)

**Reference pattern** (canonical):
```tsx
import { useActionSheet } from '@expo/react-native-action-sheet';

const { showActionSheetWithOptions } = useActionSheet();
const hasCustomAvatar = profile.avatarUrl != null;

const options = [
  t('actions.camera'),        // '카메라로 촬영'
  t('actions.library'),       // '앨범에서 선택'
  t('actions.useDefault'),    // '기본 아바타로 변경'
  ...(hasCustomAvatar ? [t('actions.remove')] : []), // '사진 삭제' (conditional)
  t('common:cta.cancel'),     // '취소'
];
const destructiveButtonIndex = hasCustomAvatar ? 3 : undefined;
const cancelButtonIndex = options.length - 1;

showActionSheetWithOptions(
  { options, destructiveButtonIndex, cancelButtonIndex, title: t('actions.title') },
  (selectedIndex) => { /* dispatch by index */ }
);
```

**Setup requirement:** `_layout.tsx`를 `<ActionSheetProvider>`로 wrap (RESEARCH Per-Decision D-11). 현재 `apps/mobile/app/_layout.tsx`에는 없음 — 수정 필요.

**Data flow:** user tap avatar → options 렌더 → selectedIndex dispatch → camera/picker/default/delete action → `useUploadAvatar` or `setCurrent({ avatarUrl: null })`.

---

### 20. `apps/mobile/components/shop/ShopWebView.tsx` / `ShopHeader.tsx` / `ShopErrorFallback.tsx`

Pattern 3에서 이미 상세 excerpt 인용. 요약:

- `ShopHeader.tsx`: header analog는 notification-preferences.tsx header (섹션 3 인용). back disabled 처리는 canGoBack state 기반.
- `ShopWebView.tsx`: RESEARCH Pattern 2 (hostname allowlist + WebBrowser.openBrowserAsync).
- `ShopErrorFallback.tsx`: notifications.tsx empty-state 패턴 + PrimaryCTAButton ('다시 시도').

**Shared rule:** `sharedCookiesEnabled={false}` (D-24).

---

### 21. `packages/supabase/migrations/<ts>_phase7_dm_launch_notify.sql`

**Analog:** `packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql` (ALTER TABLE + INDEX)

**Pattern to copy** (phase4 migration lines 16-19):
```sql
ALTER TABLE notifications ADD COLUMN community_id uuid REFERENCES communities(id);
CREATE INDEX idx_notifications_community ON notifications(user_id, community_id, created_at DESC);
```

**Phase 7 actual migration:**
```sql
ALTER TABLE profiles ADD COLUMN dm_launch_notify boolean NOT NULL DEFAULT false;
-- 인덱스는 불필요 (fan-out 시점에 full-scan 허용, 예상 row ≤ 100k)
```

**What to copy:** `ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT` 형식.

**What to change:** RLS 재설정 불필요 (profiles_update_own 이미 존재, 본인 row만 업데이트 — auth.ts 스키마 lines 36-42).

---

### 22. `packages/supabase/migrations/<ts>_phase7_avatars_bucket.sql`

**Analog:** `packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql` lines 76-92 (exact — storage bucket + 4 policies)

**Pattern to copy** (phase3 migration lines 76-92):
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-media', 'post-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "post_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "post_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'post-media');

CREATE POLICY "post_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (storage.foldername(name))[3] = auth.uid()::text);
```

**What to copy:** `INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING` 형식, `FOR INSERT TO authenticated WITH CHECK (...)` 패턴, `(storage.foldername(name))[N]` path segment 체크.

**What to change for Phase 7 (RESEARCH Pattern 6):**
- id: `avatars`, public: true, size limit: 2097152 (2MB), allowed MIME: `image/jpeg, image/png, image/webp`.
- RLS 정책 4개: insert/update/select/delete (post-media는 insert/select/delete 3개만).
- Foldername index `[1]` (avatars/{userId}/avatar.jpg) — post-media는 `[3]` (communities/{cid}/{uid}/file.jpg).

---

### 23. `packages/supabase/migrations/<ts>_phase7_delete_user_function.sql`

**Analog:** `packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql` (plpgsql SECURITY DEFINER)

**Pattern to copy** (phase3 migration lines 9-18):
```sql
CREATE OR REPLACE FUNCTION update_post_like_count() RETURNS TRIGGER AS $$
BEGIN
  ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What to copy:** `CREATE OR REPLACE FUNCTION ... RETURNS ... AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER;` 보일러.

**What to change for Phase 7 (RESEARCH Pattern 3 lines 401-421):**
- 트리거 함수가 아닌 RPC 함수 (`RETURNS void`, 인자 `p_user_id UUID`).
- 명시적 `REVOKE ALL ... FROM public, anon, authenticated;` + `GRANT EXECUTE ... TO service_role;`.
- 순서화 삭제: posts/comments soft-delete → community_follows → community_members → notification_preferences → likes → reports → profiles.
- A1/A2 assumption 확인 필요 (Plan 단계에서 `reports.reporter_id`, `likes.user_id` 존재 검증).

---

### 24. `packages/supabase/functions/delete-user/index.ts`

**Analog:** `packages/supabase/functions/generate-nickname/index.ts` (exact — Deno.serve + CORS + service_role client)

**Full imports + CORS pattern** (generate-nickname lines 1-11):
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  ...
});
```

**Service role client pattern** (generate-nickname lines 15-25):
```ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
```

**Error response pattern** (generate-nickname lines 78-82):
```ts
return new Response(JSON.stringify({ error: String(error) }), {
  status: 500,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

**What to copy:** imports, CORS headers, Deno.serve entry, service_role client factory, error response shape.

**What to change for Phase 7 (RESEARCH Pattern 3 lines 426-454):**
- JWT 검증: Authorization header 파싱 → `supabaseUserClient.auth.getUser(token)` → null이면 401.
- Service role client로 `admin.rpc('delete_account', { p_user_id: user.id })` 호출.
- `admin.auth.admin.deleteUser(user.id)` 호출 (반드시 RPC 성공 후).
- 200: `{ ok: true }`, 401: `{ error: 'unauthorized' }`, 500: RPC 또는 auth delete 실패.

**Data flow:** JWT → getUser → RPC delete_account → auth.admin.deleteUser → 200.

---

### 25. `packages/db/src/schema/auth.ts`

**Analog:** self (modify)

**Current profiles table** (auth.ts lines 13-28) — 이미 `bio`, `avatarUrl` 존재 확인:
```ts
export const profiles = pgTable(
  'profiles',
  {
    userId: uuid('user_id').primaryKey(),
    globalNickname: text('global_nickname').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    language: text('language').$type<'ko' | 'en' | 'th' | 'zh' | 'ja'>().notNull().default('en'),
    dateOfBirth: text('date_of_birth'),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
    settings: jsonb('settings'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  ...
);
```

**What to change for Phase 7:**
- Column 추가: `dmLaunchNotify: boolean('dm_launch_notify').notNull().default(false)`.
- 기존 RLS 정책(`profiles_update_own`) 그대로 — self-update 허용이 이미 수록.
- **No need** for new policy (자신의 dm_launch_notify 업데이트는 update_own으로 충분).

**Also update mobile Profile type:**
```ts
// apps/mobile/stores/authStore.ts Profile interface
export interface Profile {
  userId: string;
  globalNickname: string;
  avatarUrl: string | null;
  bio: string | null;        // NEW for Phase 7
  language: SupportedLanguage;
  onboardingCompleted: boolean;
  dateOfBirth: string | null;
  dmLaunchNotify: boolean;   // NEW for Phase 7
}
```
그리고 `fetchOrCreateProfile`의 select에 `bio, dm_launch_notify` 추가.

---

### 26. `packages/shared/src/i18n/locales/{ko,en}/{more,settings,shop,dm,legal}.json`

**Analog:** `packages/shared/src/i18n/locales/ko/common.json` (flat key structure)

**Pattern to copy** (common.json):
```json
{
  "appName": "Wecord",
  "loading": "로딩 중...",
  "cta": { "join": "커뮤니티 가입", "confirm": "확인" },
  "empty": { "heading": "...", "body": "..." },
  "error": { "heading": "...", "body": "...", "network": "..." }
}
```

**What to copy:** Namespaced object 패턴 (cta / empty / error groups), flat JSON (deep nesting 2단계까지).

**What to change for Phase 7:**
- 신규 5 namespace × 2 languages = 10 파일.
- UI-SPEC Copywriting Contract의 모든 카피를 namespace별로 분배:
  - `more.json`: tab label, profile card button, section headers, 가입 커뮤니티 empty state, logout/delete row labels, version label.
  - `settings.json`: screen title, language/push/community-specific row labels + helpers, terms/privacy row labels.
  - `shop.json`: tab label, header title, aria labels, error fallback (heading/body/retry), external link toast.
  - `dm.json`: tab label, coming soon heading/body, Notify Me CTA, Notified state, already-notified toast.
  - `legal.json`: privacy/terms page headings, language toggle, last-updated prefix.
- i18n loader 등록 필요: `packages/shared/src/i18n/index.ts`의 resources에 5 namespace 추가 (기존 `common`, `auth`, `community` 등과 동일 구조).

---

### 27. `apps/admin/app/(public)/layout.tsx` + `privacy/page.tsx` + `terms/page.tsx`

**Analog (layout):** `apps/admin/app/layout.tsx` (root, minimal) + `apps/admin/app/(dashboard)/layout.tsx` (reverse — remove auth)

**Root layout pattern** (admin/app/layout.tsx lines 9-21):
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

**What to copy (for `(public)/layout.tsx`):** 인증 wrapping 없이 단순 container.
```tsx
// apps/admin/app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-background text-foreground min-h-screen">
      {children}
    </div>
  );
}
```

**What to change vs (dashboard) layout:**
- `(dashboard)/layout.tsx`는 `'use client'` + `useEffect` auth guard (lines 1-30). `(public)` layout은 guard 완전 제거.
- Route group 분리만으로 auth flow 바이패스 (Next.js 15+ route group 기본 동작).

**Pages pattern (RESEARCH Example 3 lines 996-1024):**
```tsx
// apps/admin/app/(public)/privacy/page.tsx
import { PRIVACY_KO, PRIVACY_EN } from '@/lib/legal-content';
import Link from 'next/link';

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? PRIVACY_EN : PRIVACY_KO;
  return (
    <article>
      <nav className="flex justify-end gap-2 text-sm">
        <Link href="?lang=ko" className={!isEn ? 'font-bold' : ''}>KO</Link>
        <Link href="?lang=en" className={isEn ? 'font-bold' : ''}>EN</Link>
      </nav>
      <h1 className="text-2xl font-semibold mt-4">
        {isEn ? 'Privacy Policy' : '개인정보처리방침'}
      </h1>
      <p className="text-sm text-muted-foreground">
        {isEn ? 'Last updated: ' : '최종 개정일: '}2026-04-22
      </p>
      <div className="prose prose-invert mt-6" dangerouslySetInnerHTML={{ __html: body }} />
    </article>
  );
}
```

**What to copy:** `searchParams: Promise<...>` (Next.js 15 async params), `?lang=ko/en` toggle, `dangerouslySetInnerHTML` for static content.

**What to change:**
- Server component (no `'use client'`) — `searchParams`는 서버에서 resolve.
- Content 소스: `apps/admin/lib/legal-content.ts` (신규 — KO/EN 문자열 export).
- terms/page.tsx는 privacy/page.tsx와 구조 동일, import만 TERMS_KO/TERMS_EN.

---

### 28. `apps/mobile/app.json` (modify)

**Current state** (app.json lines 31-41):
```json
"plugins": [
  "expo-router",
  "expo-secure-store",
  "expo-web-browser",
  "@react-native-community/datetimepicker",
  "expo-apple-authentication",
  ["expo-image-picker", {
    "photosPermission": "...",
    "cameraPermission": "..."
  }]
]
```

**What to change for Phase 7:**
- RESEARCH Open Question #1 결과에 따라 `expo-tracking-transparency` 추가 또는 생략 (Plan 단계 결정).
- `react-native-webview` plugin은 불필요 (native module auto-link).
- `@expo/react-native-action-sheet` 불필요 (JS only).
- D-31 compliance: bundle identifier 유지 `com.wecord.app`, icon / splash 확인.

---

### 29. `apps/mobile/eas.json` (modify)

**Current state** (eas.json 전체 — 18 lines):
```json
{
  "cli": { "version": ">= 18.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  },
  "submit": { "production": {} }
}
```

**What to change for Phase 7:**
- `production` profile: EAS env 연결 (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), `autoIncrement: true` 권장.
- `submit.production`: Apple `ascAppId`, Google `serviceAccountKeyPath` 연결 (제출 자동화).

---

### 30. `apps/mobile/package.json` (modify)

**What to add (via `npx expo install`):**
- `react-native-webview` (~13.16.0)
- `@expo/react-native-action-sheet` (^4.1.1)
- `expo-tracking-transparency` (~55.0.x) — Open Question #1에 따라 보류 가능

**What to check:** `expo-image-manipulator` 이미 설치됨 (RESEARCH Standard Stack 확인).

---

## Shared Patterns

### Pattern A: Authentication / User Context (공통)

**Source:** `apps/mobile/stores/authStore.ts` (lines 100-161) + `apps/mobile/hooks/useAuth.ts`

**Apply to:** 모든 Phase 7 mobile screen / hook.

**Canonical usage:**
```tsx
import { useAuthStore } from '../../stores/authStore';

// In a screen:
const { user, profile, setProfile } = useAuthStore();
if (!user || !profile) return null; // or redirect

// In a hook:
const userId = useAuthStore((s) => s.user?.id);
```

**Key guarantees:**
- `user.id`는 `auth.users.id` = profile FK. Supabase 쿼리에서 `.eq('user_id', user.id)` 패턴.
- `setProfile()`로 optimistic local sync — TanStack invalidate와 병행.
- Profile 인터페이스 확장 시 `fetchOrCreateProfile`의 select에도 컬럼 추가 필요 (Phase 7: `bio`, `dm_launch_notify`).

---

### Pattern B: TanStack Query Key Convention

**Source:** `apps/mobile/hooks/**/*.ts` (scan summary)

| Domain | Key Pattern |
|--------|-------------|
| profile | `['profile', userId]` |
| community membership | `['communityMember', communityId]` |
| community search | `['communitySearch', query]` |
| my communities | `['myCommunities', userId]` (NEW for Phase 7) |
| notifications | `['notifications', userId, scope]` |
| notification_preferences | `['notification_preferences', userId, communityId]` |
| fan/creator feed | `['fanFeed' \| 'creatorFeed', communityId]` |

**Apply to Phase 7:**
- `useMyCommunities` → `['myCommunities', userId]`.
- `useUpdateProfile` → invalidate `['profile', userId]`.
- `useDmLaunchNotify` → invalidate `['profile', userId]` (dm_launch_notify는 profile 일부).
- `useDeleteAccount` → 성공 시 `queryClient.clear()` (모든 캐시 제거, 로그아웃 일관성).

---

### Pattern C: Supabase Client Usage

**Source:** `apps/mobile/lib/supabase.ts` (reference), 모든 hooks

**Canonical pattern:**
```tsx
import { supabase } from '../../lib/supabase';

// Select
const { data, error } = await supabase
  .from('table')
  .select('col1, col2, rel!inner(a, b)')
  .eq('user_id', user.id);

// Update
const { error } = await supabase
  .from('profiles')
  .update({ field: value })
  .eq('user_id', user.id);

// Storage upload
await supabase.storage.from('bucket').upload(path, data, { contentType, upsert });
const { data: pub } = supabase.storage.from('bucket').getPublicUrl(path);

// Edge Function (current codebase pattern)
await supabase.functions.invoke('function-name', { body: {...} });
// OR for functions requiring JWT (delete-user):
fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

**Apply to Phase 7:**
- 프로필 편집: update('profiles')
- DM notify: update('profiles')
- 가입 커뮤니티: select('community_members', inner join)
- 아바타 업로드: storage.upload('avatars')
- 계정 삭제: fetch(Edge Function)

---

### Pattern D: Confirm Dialog (Alert.alert imperative)

**Source:** `apps/mobile/components/post/DeleteConfirmDialog.tsx` + `apps/mobile/components/community/LeaveConfirmDialog.tsx`

**Full pattern** (DeleteConfirmDialog.tsx lines 1-25):
```tsx
import { Alert, Platform } from 'react-native';

export function showDeleteConfirmDialog(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('...');
    if (confirmed) onConfirm();
    return;
  }
  Alert.alert('삭제 확인', '...', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: onConfirm },
  ]);
}
```

**Apply to Phase 7:**
- Log out dialog (D-20): 동일 패턴, title '로그아웃하시겠어요?', body empty, destructive '로그아웃' button.
- 이미 알림 등록됨 toast (D-28): Alert 대신 toast 컴포넌트 or `Alert.alert` minimal ('이미 알림이 등록되어 있어요', [OK]).
- Delete account flow는 **Alert 대신 전용 스크린 3단계** (D-37) — 이 패턴 적용 안 함.

**Anti-pattern alert (from RESEARCH):** 새 dialog 컴포넌트 작성 금지. `useLeaveConfirmDialog()` 훅을 새로 만들기보다, 로그아웃용 `showLogoutConfirmDialog` 유틸 함수 유지.

---

### Pattern E: Screen Layout (SafeAreaView + Header + Content)

**Source:** `apps/mobile/app/(community)/[id]/notification-preferences.tsx` (lines 55-107) + `apps/mobile/app/(tabs)/notifications.tsx` (lines 170-247)

**Canonical skeleton:**
```tsx
<SafeAreaView className="flex-1 bg-background">
  {/* Header */}
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    }}
    className="border-border"
  >
    <Pressable onPress={() => router.back()} ...>
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
    </Pressable>
    <Text className="text-display font-semibold text-foreground">{title}</Text>
  </View>

  {/* Content */}
  <ScrollView className="flex-1"> ... </ScrollView>
</SafeAreaView>
```

**Apply to:** more.tsx, settings.tsx, profile-edit.tsx, joined-communities.tsx, language.tsx, delete-account/*.tsx.

---

### Pattern F: Dark Theme Tokens (tailwind.config.js)

**Source:** `apps/mobile/tailwind.config.js` (referenced throughout UI-SPEC)

**Key tokens:**
- `bg-background` → `#000000`
- `bg-card` → `#1A1A1A`
- `bg-teal` → `#00E5C3` (active, accent)
- `bg-teal-dark` → `#00B89A` (press)
- `bg-destructive` / `text-destructive` → `#FF4444`
- `text-foreground` → `#FFFFFF`
- `text-muted-foreground` → `#999999`
- `text-subtle` → `#666666`
- `border-border` → `#2A2A2A`
- `text-label` (12px), `text-body` (14px), `text-heading` (16px), `text-display` (20px)
- `font-regular` (400), `font-semibold` (600)

**Apply to:** 모든 Phase 7 UI. 새 hex 금지 (UI-SPEC Registry Safety).

---

## Cross-Cutting Concerns

### Error Handling
- Edge Function: try/catch → `return new Response(JSON.stringify({error:...}), {status:500,...})` — `packages/supabase/functions/generate-nickname/index.ts` lines 78-82 참조.
- Hook: supabase error → throw; mutation onError로 UI 복원; catch에서 `Alert.alert`.
- Screen: empty/loading/error 3분기 패턴 (notifications.tsx lines 209-245 참조).

### Optimistic Updates
- authStore.setProfile + queryClient.invalidateQueries 병행 (Pattern A/B 조합).
- Notification preferences 패턴 (useNotificationPreferences.ts onMutate/onError/onSettled) — profile mutations에서 그대로 차용.

### i18n
- 모든 UI 문자열은 `t('namespace:key')` — 하드코드 금지 (RESEARCH Anti-Patterns 1).
- Phase 7 namespaces: `more`, `settings`, `shop`, `dm`, `legal`.
- 언어 변경 시 profile.language 업데이트 + `queryClient.invalidateQueries({ queryKey: ['profile'] })` (Pitfall 6).

### Accessibility
- 모든 `Pressable` → `accessibilityRole="button"` + `accessibilityLabel`.
- Switch → `accessibilityRole="switch"` + value.
- WebView back/refresh → `accessibilityState={{ disabled }}` 기반 동적.

---

## No Analog Found

다음 파일은 codebase에 유사한 패턴이 부재 — RESEARCH.md의 외부 레퍼런스/예제를 planner가 참조해야 함.

| File | Role | Data Flow | Reason | Fallback |
|------|------|-----------|--------|----------|
| `apps/mobile/hooks/profile/useDirtyState.ts` | utility | transform | 이전 Phase에 form 라이브러리 없음, 커스텀 dirty 훅 부재 | RESEARCH Pattern 5 (useState snapshot + shallow compare) |
| `apps/mobile/components/more/AvatarActionSheet.tsx` | component | event-driven | `@expo/react-native-action-sheet`를 사용한 코드 없음 | `@expo/react-native-action-sheet` README `useActionSheet` 예제 + CONTEXT D-11 4 options |
| `apps/mobile/components/shop/ShopWebView.tsx` | component | streaming | `react-native-webview` 미사용 | RESEARCH Pattern 2 (hostname allowlist + WebBrowser.openBrowserAsync) |
| `apps/admin/app/(public)/privacy/page.tsx` (및 terms/account-delete-request) | screen | static | admin에 public route group 전례 없음 (모든 route가 `(dashboard)` 인증 필요) | RESEARCH Example 3 (searchParams + dangerouslySetInnerHTML) |

**Note:** delete-user Edge Function은 `generate-nickname` 구조를 재사용하되 "orchestrated delete" 책임은 신규 — RESEARCH Pattern 3의 plpgsql `delete_account` RPC + `auth.admin.deleteUser` 조합을 Plan에 충실히 반영.

---

## Metadata

**Analog search scope:**
- `apps/mobile/app/(tabs)/`, `apps/mobile/app/(community)/`, `apps/mobile/app/(onboarding)/`, `apps/mobile/app/(auth)/`
- `apps/mobile/hooks/{post,community,notification,home}/`
- `apps/mobile/components/{post,community,notification,home}/`
- `apps/mobile/stores/`, `apps/mobile/lib/`
- `packages/supabase/functions/{generate-nickname,notify,moderate}/`
- `packages/supabase/migrations/` (phase1~phase6)
- `packages/db/src/schema/{auth,community,notification}.ts`
- `apps/admin/app/{layout,login,(dashboard)/layout,(dashboard)/notices}/`

**Files scanned (Read tool):** 23 (CONTEXT.md, RESEARCH.md 대부분, UI-SPEC.md 전체, analog 파일 20+).

**Pattern extraction date:** 2026-04-22.

**Downstream usage:** `gsd-planner`가 본 문서의 Pattern Assignments 섹션을 Plan 07-01 / 07-02의 각 action 블록에 그대로 인용. excerpt와 line numbers를 PLAN.md actions에 복사해 구현자가 추가 탐색 없이 작업하게 함.
