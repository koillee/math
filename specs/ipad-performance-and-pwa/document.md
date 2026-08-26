# iPad performance and standalone web app

## Overview
Improve the deployed MasteryOS Math web app for iPad home use. Navigation should provide immediate feedback while server-rendered pages load, and Safari should have the metadata required to install the site as a standalone Home Screen web app.

## Goals
- Make taps feel responsive even when a server-rendered route or database-backed request is still loading.
- Add a standards-based web app manifest and Apple web-app metadata.
- Preserve the existing Next.js App Router, Prisma persistence, and learning flows.

## Scope / non-goals
In scope: navigation loading feedback, route loading UI, manifest, app icons, theme/status-bar metadata, and deployment documentation.

Out of scope: converting the site into a native App Store application, changing curriculum logic, changing the database provider, or hiding genuine server/database latency.

## User flows / UX / design notes
1. User taps a navigation or call-to-action link.
2. A slim branded progress indicator appears immediately.
3. The destination route shows a calm skeleton/loading state if the server response is not ready.
4. When installed from Safari using Add to Home Screen, the app opens in its own web-app window with the MasteryOS icon and no normal Safari tab bar.

## Functional requirements
- Provide a global navigation progress indicator for same-origin link clicks.
- Provide an App Router loading boundary for route transitions.
- Expose `/manifest.webmanifest` with `display: "standalone"`, app name, start URL, theme/background colors, and icons.
- Include Apple web-app capable metadata and an Apple-compatible icon.
- Keep all existing routes and forms functional.

## Data model / schema
No data model changes.

## API contracts
No API changes.

## Edge cases / failure modes
- A slow or failed server request must not leave the progress indicator permanently visible; it clears on pathname change and after a safety timeout.
- Existing Home Screen shortcuts retain old metadata; users must remove and re-add the shortcut after deployment.
- Standalone mode is supported by Safari when installed from Safari; opening the URL inside an existing Safari tab will still look like Safari.

## Acceptance criteria
- Navigation gives visible feedback immediately.
- A route loading UI is present during slow transitions.
- Manifest returns successfully and declares standalone display mode.
- Metadata includes Apple web-app capable settings and app icons.
- Existing lint, smoke, build, and browser checks pass.

## Test plan / test cases
- Inspect generated metadata and fetch `/manifest.webmanifest`.
- Navigate between Dashboard, Today, Diagnostic, Tutor, and Evidence.
- Verify progress/loading UI and no console errors.
- Verify the Home Screen reinstall instructions are explicit.
- Run `bun run lint`, `bun run test:mvp -- <preview-url>`, and a production build where available.

## Implementation notes
Use Next.js App Router metadata conventions (`app/manifest.ts`, `app/icon.svg`, and `app/apple-icon.svg`). Keep the progress UI client-only and lightweight; do not add a PWA runtime/cache layer because the app reads mutable learning state from PostgreSQL.

## Status / open questions
- Status: implemented; pending deployed-device verification.
- Open question: actual iPad standalone launch must be rechecked by deleting and re-adding the Home Screen shortcut after deployment.