# Bootstrap validation

**Final verification:** On 2026-10-26, issue #15 revalidated application head `1a8f8c3d01c85e8ea51c161f1fbd2d390720d95f`, including the preview-script checkpoint. All local gates passed. GitHub Actions was not awaited, as authorized by the user; its restoration remains #16.

Validated 2026-10-26 against the final implementation. Existing repository inspected: `AlekseiDudchenko/data-system-atlas` (singular). It was empty: no commits, files, prior documentation, or issues. A minimal initialization commit established main; implementation uses `feat/atlas-foundation-stale-reads`. No second repository was created.

| Gate                                               | Result                                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Clean lockfile install (`npm ci`)                  | Pass; 511 packages installed, zero reported vulnerabilities                          |
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

Final run: macOS arm64, Node 24.19.0, temporary npm 11.6.2 outside the repository; app dependencies pinned in package-lock.json. ESLint 9 is used for JSX accessibility plugin compatibility. Playwright 1.64.1 downloaded its matching Chrome for Testing / headless shell 156.0.8078.4 (revision 1248) successfully into a temporary workspace browser directory. No custom browser executable was used.

The exact default preview command was started separately and returned the lesson route successfully:

```sh
ASTRO_TELEMETRY_DISABLED=1 npm run preview -- --host 127.0.0.1 --ignore-lock
```

It expands to `astro preview --host 127.0.0.1 --ignore-lock`: exactly one explicit loopback host. After stopping that manual server, `ASTRO_TELEMETRY_DISABLED=1 PLAYWRIGHT_BROWSERS_PATH=../playwright-browsers CI=1 npm run test:e2e` started a fresh Astro preview through the committed Playwright configuration; all 8 tests passed in 8.6 seconds. Neither the Python static-server override nor a custom browser executable override was set. Desktop/mobile screenshots from this run were visually inspected.

The sandbox initially denied opening the loopback port (`listen EPERM`); the same command succeeded with local process/network permission. An initial browser run found the matching browser absent; installing the managed browser resolved it. These were environment setup failures, not source failures. Earlier-session Node 24.22.1 / Chromium 153 / Python-server results are superseded by this final native-preview run.

Cloudflare security headers are configured in `public/_headers`; production header verification remains a deployment step. No claims of full screen-reader certification, Safari/Firefox testing, performance benchmarking, or production database emulation are made.

GitHub Actions availability is reported on the PR separately; local validation does not depend on billed Actions minutes.

## Screenshots

[Desktop lesson](screenshots/lesson-desktop.jpg) · [Mobile lesson](screenshots/lesson-mobile.jpg). Captured from the built application in a reproducible stale-read state; JPEG copies reduce repository size.

## Deployment

No Cloudflare deployment credentials or account connection were available. No deployment was attempted or claimed. [Deployment settings and smoke procedure](deployment.md) are ready; [issue #13](https://github.com/AlekseiDudchenko/data-system-atlas/issues/13) tracks the remaining launch work.
