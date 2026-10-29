# Production releases — 2026-10-28: failures and parallel pull (#28), push page (#29)

- #28 (`7715881`): on https://data-systems-atlas.dudchenko.org/ru/data-transfers/ in Chromium at 1280×900 and 390×844 with reduced motion — scene 5 «Перенос прерван на пакете 121 через 8,1 с», scene 7 with the checkpoint before the write «… Пропущено: 1 000.», scene 8 with eight readers «Ускорение ×4,3»; no page errors, no horizontal overflow.
- #29 (`7c20406`): `/ru/data-transfers/push/` returns 200 and `/data-transfers/push/` redirects to it (302). Reached from the pull page's link at both viewports; scenes 1–5 report 14 000 lost, recovery in 29,7 с, a lag that never recovers behind the poison message, 1 700 duplicates and 20 000 lost with four consumers; no page errors, no horizontal overflow.
- Before each merge, locally: typecheck, lint, Prettier, unit tests (28, then 36) and desktop/mobile Playwright (26, then 40) passed.

# Production release — 2026-10-28: first exploration (#27)

- Merged application commit: `ee7e1029130d5a7b9408a25d632810fa421fd578` (squash of PR #27), deployed automatically from `main`.
- HTTPS checks on https://data-systems-atlas.dudchenko.org/: `/ru/` and `/ru/data-transfers/` return 200; `/`, `/de/` and `/data-transfers/` return 302 to the Russian pages; retired lesson and migration URLs (with and without a trailing slash, all locales) return 301 to `/ru/`; `/favicon.svg` returns 200; security headers unchanged.
- Smoke scenario in Chromium against production, desktop (1280×900) and phone (390×844) with reduced motion: scene 1 «Готово: 1 000 записей за 2,1 с.», scene 2 «Нехватка памяти через 2,6 с … Ничего не записано.», scene 4 «Готово: 1 000 000 записей за 59 с.»; no page errors, no horizontal overflow.
- Before merge, locally: typecheck, lint, Prettier, 13 unit tests, build and 20 desktop/mobile Playwright tests passed. Branch preview deployments are not enabled for the Pages project, so the pre-merge preview was shared as a private claude.ai artifact.
- Not exercised: rollback, Safari/Firefox, assistive technology beyond axe.

# Production release — 2026-10-27: initial launch (historical)

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
