# Bootstrap validation

**Checkpoint:** The results below cover the reviewed application before a final npm preview-script change. That small change still needs verification; work is intentionally paused before merge. See [handoff](handoff.md) and issue #15. GitHub Actions is not a prerequisite for resuming or merging after successful local checks.

Validated 2026-10-26 against the final implementation. Existing repository inspected: `AlekseiDudchenko/data-system-atlas` (singular). It was empty: no commits, files, prior documentation, or issues. A minimal initialization commit established main; implementation uses `feat/atlas-foundation-stale-reads`. No second repository was created.

| Gate                                               | Result                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Clean lockfile install (`npm ci --ignore-scripts`) | Pass; no peer conflict                                                               |
| `npm run check`                                    | Pass; 0 errors, warnings, hints                                                      |
| `npm run lint`                                     | Pass                                                                                 |
| `npm test`                                         | Pass; 7 model tests                                                                  |
| `npm run build`                                    | Pass; two static routes                                                              |
| `npm run test:e2e`                                 | Pass; 8 tests across desktop and mobile Chromium                                     |
| axe WCAG A/AA checks                               | Pass; zero detected violations in tested lesson state                                |
| Keyboard                                           | Skip link, input entry, write/read flow, visible focus, named scrollable lists       |
| Responsive                                         | Desktop and Pixel 7 emulation; no horizontal overflow, including 80-character values |
| JavaScript disabled                                | Explanation/model boundaries and fallback notice available                           |
| Visual inspection                                  | Full-page desktop/mobile screenshots inspected after final fixes                     |
| Independent review                                 | Complete; all significant findings resolved; follow-up passed                        |

## Environment and limits

Node 24.22.1; app dependencies pinned in package-lock.json. ESLint 9 is used for JSX accessibility plugin compatibility. The normal Playwright Chromium download returned a truncated archive in this environment. Browser tests instead ran with Chromium 153 from a temporary `@sparticuz/chromium` package, outside the repository. No fallback browser package is added to project dependencies.

The Astro/Vite preview server cannot enumerate network interfaces in this execution environment (`uv_interface_addresses`). Tests served the actual production `dist/` with Python's static HTTP server using the opt-in configuration overrides:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium \
PLAYWRIGHT_WEB_SERVER_COMMAND='python3 -m http.server 4321 --bind 127.0.0.1 --directory dist' \
npm run test:e2e
```

These overrides are optional. Normal development/CI uses Astro preview and Playwright's managed browser. Cloudflare security headers are configured in `public/_headers`; the fallback static server does not apply them, so production header verification remains a deployment step. No claims of full screen-reader certification, Safari/Firefox testing, performance benchmarking, or production database emulation are made.

GitHub Actions availability is reported on the PR separately; local validation does not depend on billed Actions minutes.

## Screenshots

[Desktop lesson](screenshots/lesson-desktop.jpg) · [Mobile lesson](screenshots/lesson-mobile.jpg). Captured from the built application in a reproducible stale-read state; JPEG copies reduce repository size.

## Deployment

No Cloudflare deployment credentials or account connection were available. No deployment was attempted or claimed. [Deployment settings and smoke procedure](deployment.md) are ready; [issue #13](https://github.com/AlekseiDudchenko/data-system-atlas/issues/13) tracks the remaining launch work.
