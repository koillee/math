# iPad performance and standalone web app QA

Date: 2026-08-25

## Changes checked
- Global progress bar appears on same-origin navigation clicks.
- App Router loading boundary renders a branded skeleton while a route is pending.
- `/manifest.webmanifest` returns `200` with `display: "standalone"`, start URL `/`, theme/background colors, and icons.
- Root metadata includes the manifest link and Apple web-app capable/status-bar metadata.
- Database reads in `getMvpState` now run concurrently rather than as a sequential transaction.
- The diagnostic page no longer loads the full dashboard state before reading diagnostic items.
- Seed verification uses a fast readiness check before replaying the full seed on a fresh serverless worker.

## Automated validation
- `bun run lint` passed.
- `bun run test:mvp -- https://3000-iqazqti4ealbh12nkupx5.e2b.app` passed.
- Manifest response verified with `200` and `content-type: application/manifest+json`.

## Browser QA
- Dashboard opened and screenshot captured: `qa-screenshots/ipad-pwa-dashboard.png`.
- Today route opened and screenshot captured: `qa-screenshots/ipad-pwa-today.png`.
- Diagnostic route opened and screenshot captured: `qa-screenshots/ipad-pwa-diagnostic.png`.
- Navigation and existing routes remained available through the browser snapshot.
- No application console errors were observed. The prior Next.js `themeColor` warning was fixed by moving it to the typed viewport export.

## iPad verification note
The managed browser can verify metadata and route behavior but cannot reproduce an iPad Home Screen installation. After deploying, remove the old shortcut and re-add the site from Safari using **Share → Add to Home Screen**. Launch the new icon from the Home Screen; opening the URL in a Safari tab will not be standalone.