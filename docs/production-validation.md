# Production release — 2026-10-27

Cloudflare Pages project: `data-systems-atlas`, connected to `AlekseiDudchenko/data-system-atlas`, production branch `main`. Automatic deployments are enabled through the existing GitHub integration.

- Primary URL: https://data-systems-atlas.dudchenko.org/
- Pages URL: https://data-systems-atlas-4c2.pages.dev/
- Verified application commit: `b120f7721653e2928e50f4f5dfdd9872e15a45b6`.
- Verified deployment: `8ef06b5d-d5a9-41d2-b144-a438efbf3546`, https://8ef06b5d.data-systems-atlas-4c2.pages.dev/.
- Build command: `npm ci && npm run build`; output: `dist`; root: repository root.
- Node.js 24 is pinned by `.node-version`; deployment logs confirm Node 24.22.1.
- Custom domain status: **Active**, **SSL enabled**. Cloudflare added CNAME `data-systems-atlas` in `dudchenko.org` pointing to `data-systems-atlas-4c2.pages.dev`.

## Verification

The first deployment exposed a loading race: server-rendered controls accepted input before React hydration. A submit could reload the page and early clicks could be lost. All three experiments now render their controls inside a disabled fieldset until hydration completes. Six desktop/mobile regression cases delay JavaScript delivery and verify that controls remain disabled, then work after loading. Keyboard tests explicitly wait for controls before focusing them.

The fixed application passed local typecheck (zero errors, warnings or hints), lint, all 19 unit tests, a four-page production build, and all 26 desktop/mobile browser tests. The same 26 tests passed against the primary HTTPS production URL in 8.6 seconds using installed Google Chrome. Coverage includes replication failure/recovery, session waiting/cancellation, hot-key queues, direct lesson navigation, mobile overflow, keyboard, JavaScript-disabled prose, axe checks and delayed JavaScript delivery.

HTTPS checks confirmed home, all three lesson routes and favicon on both production hostnames, including Pages' redirects to trailing-slash lesson URLs. Responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin`. The primary URL was opened in the user's browser, and local desktop rendering was visually inspected after the control change.

## Operations and limits

Future pushes to `main` publish automatically. See [deployment](deployment.md) for smoke checks and rollback procedure. A live rollback was not exercised during this initial launch; the initial deployment has the loading race, so use the verified fixed application as the recovery baseline. GitHub Actions restoration remains #16 and was not required for this deployment. No independent review, Safari/Firefox coverage or full assistive-technology certification is claimed for the loading fix.
