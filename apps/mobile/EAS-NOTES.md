# EAS Configuration Notes

This file preserves context that previously lived as `_comment` fields inside `eas.json`.
The EAS schema does not permit arbitrary extra properties, so comments are kept here.

## build.production

- `autoIncrement: true` — bumps iOS `buildNumber` and Android `versionCode` automatically.
- `environment: "production"` — binds EAS env vars created via
  `eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL ...`
  (see `07-03-MANUAL-FOLLOWUP.md`).
- `channel: "production"` — matches the `expo-updates` channel for OTA delivery.

## submit.production

- `ios.ascAppId` — the numeric App Store Connect app ID. Apple generates this
  on first creation of the app record; the placeholder
  `TBD_REPLACE_AFTER_APP_STORE_CONNECT_RECORD_CREATION` must be updated before
  running `eas submit --platform ios --profile production`.
- `android.serviceAccountKeyPath` — path to a JSON service-account key
  downloaded from Google Cloud Console with Play Console API access.
  **Never commit the JSON itself** (it's in `.gitignore`).
- `android.track: "internal"` — uploads to the internal testing track first;
  promote to production track manually in Play Console.

## build.development (internal distribution)

Used for ad-hoc developer / stakeholder demo builds. Requires the target
device's UDID to be registered via `eas device:create` before building, or the
install will fail the provisioning-profile check.
