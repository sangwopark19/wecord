---
status: resolved
trigger: "온보딩 Dot Indicator가 표시되지 않음 (Test 11)"
created: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:00:00Z
---

## Current Focus

hypothesis: Animated.View does not support NativeWind className prop, so dots render with zero visual size (no background color applied)
test: Check NativeWind docs for Animated.View className support
expecting: Animated.View from react-native is NOT interoperable with NativeWind className without explicit cssInterop registration
next_action: Report root cause

## Symptoms

expected: 4-dot indicator visible at top of each onboarding screen (tos, dob, language, curate)
actual: Dots not visible at all
errors: None reported (silent rendering failure)
reproduction: Navigate to any onboarding screen, observe top area
started: Since implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-19
  checked: OnboardingDotIndicator.tsx line 21-24
  found: Animated.View uses className prop for styling (bg-teal / bg-input, w-2, h-2, rounded-full)
  implication: NativeWind v4 requires explicit cssInterop() registration for non-standard RN components. Animated.View is NOT pre-registered.

- timestamp: 2026-03-19
  checked: Codebase-wide search for cssInterop or remapProps
  found: No cssInterop or remapProps calls exist anywhere in the codebase
  implication: Animated.View ignores className entirely - styles are never applied. Dots render as 0x0 invisible elements.

- timestamp: 2026-03-19
  checked: NativeWind version and react-native-css-interop version
  found: nativewind ^4.1.23, react-native-css-interop ^0.2.3
  implication: NativeWind v4 uses react-native-css-interop under the hood. className works on View/Text/etc automatically but NOT on Animated.View without registration.

- timestamp: 2026-03-19
  checked: _layout.tsx structure
  found: SafeAreaView wraps only the DotIndicator with edges=['top']. Stack is a sibling. Layout structure is correct.
  implication: Layout is fine; the issue is purely that className on Animated.View is ignored.

## Resolution

root_cause: |
  NativeWind v4 does NOT support `className` on `Animated.View` out of the box.
  In OnboardingDotIndicator.tsx (line 21-24), `Animated.View` is given className
  for sizing (w-2 h-2) and color (bg-teal / bg-input), but these styles are
  silently ignored because Animated.View has no cssInterop registration.
  The dots render as 0x0 elements with no background color -- completely invisible.

fix: |
  Two options:

  Option A (Recommended - simplest): Replace Animated.View with a regular View
  for the dot styling, and wrap/nest the Animated.View only for the scale transform.
  e.g., Use a View with className for w-2 h-2 rounded-full bg-teal/bg-input,
  and apply the Animated scale transform via inline style on an outer Animated.View.

  Option B: Register Animated.View with cssInterop so className works:
    import { cssInterop } from 'react-native-css-interop';
    import { Animated } from 'react-native';
    cssInterop(Animated.View, { className: 'style' });

  Option C: Drop the scale animation entirely and use a plain View with className.
  The 1.0 -> 1.25 scale difference is subtle and possibly not worth the complexity.

verification: UAT 통과 (commit a1aa0df)
files_changed:
  - apps/mobile/components/OnboardingDotIndicator.tsx
resolved: 2026-03-19
