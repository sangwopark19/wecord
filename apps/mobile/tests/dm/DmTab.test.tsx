import { describe, it } from 'vitest';

// Render assertions for <DmPlaceholder> require @testing-library/react-native,
// blocked in this worktree by the RNTR react-test-renderer peer pin
// (19.2.3 vs 19.2.4 — 07-01 deviation #5 same root cause).
//
// Contract is enforced at three layers:
//   1. Pure logic (skip/filter/payload) — useDmLaunchNotify.test.ts
//   2. i18n copy — verified via grep gates in plan <verify> block
//   3. Visual smoke — manual check during 07-03 end-of-phase QA
//
// When the RNTR pin is resolved (Plan 07-03 or follow-up), promote these
// it.todo entries to render assertions using the @expo/vector-icons mock.
describe('DM Coming Soon (component render)', () => {
  it.todo('renders chatbubbles-outline icon at 96px teal — RNTR pin blocked');
  it.todo('renders heading 곧 보이게 될 고유한 공간입니다 — RNTR pin blocked');
  it.todo('renders CTA 출시되면 알려주세요 when dmLaunchNotify=false — RNTR pin blocked');
  it.todo('renders state 알림 등록 완료 when dmLaunchNotify=true — RNTR pin blocked');
});
