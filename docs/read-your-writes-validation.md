# Read Your Writes — issue #11

Validated locally on 2026-10-26 using macOS arm64, Node 24.19.0, npm 11.6.2 and the existing lockfile installation. No dependency changes. `ASTRO_TELEMETRY_DISABLED=1` was set. GitHub Actions was not awaited, as requested for this project.

## Gates

- Astro check: zero errors, warnings or hints across 17 files.
- ESLint and production build: pass; home and both lesson routes generated.
- Vitest: 13 tests pass, including six new session tests covering immediate versus gated reads, indefinite blocked waiting, restore-without-delivery, automatic completion, sequential operations, cancellation/rerouting, minimum tracking, historical results, deterministic replay, immutability/reset and the returned-version invariant across failure/recovery sequences.
- Playwright: 14 desktop/mobile tests pass against the production build with a fresh Astro preview, one explicit loopback host, and managed Chromium 156 revision 1248. The six new browser cases include both read policies, wait/recover, keyboard cancellation and rerouting, 80-character values, mobile reflow, lesson navigation, JavaScript-disabled prose, and axe WCAG A/AA checks of the waiting state (zero detected violations).
- Desktop/mobile lesson screenshots inspected. The existing stale-read lesson's eight browser cases also pass after extracting its shared topology.

## Review and limits

Primary-agent review checked reducer ordering against the worked scenarios and ADR 0004: a waiting read never returns an old value, restore alone cannot finish it, cancellation retains the minimum, pending client operations are rejected, and completed results stay historical. There is no new independent reviewer approval for this feature; the bootstrap review does not cover this change.

The source reference was checked against MongoDB's official consistency documentation. Product conditions are explicit in the lesson; this simulation makes no general database guarantee. The minimum-version gate models one sequential client and a single key, with no persistence, deadline, automatic routing, failover, concurrent clients, or full causal protocol. No public deployment or Safari/Firefox/full assistive-technology certification is claimed. Deployment and Actions follow-ups remain #13 and #16.
