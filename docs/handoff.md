# Project handoff — 2026-10-27

## Current state

Three lessons are implemented and merged into `main`:

- [x] Platform, content contract, deterministic replication model and stale-read lesson (#6–#10), plus bootstrap verification (#15): PR #14, merge `0803d87519aebc88e19303da1412db98d9cdca22`.
- [x] Read-your-writes (#11): PR #17, merge `6b0de07ee30b5b185860fb9fdf79c4b6e56019ee`. See [validation](read-your-writes-validation.md).
- [x] Partitioning and hotspots (#12): PR #18, merge `d51070eca78439c31a851f163bfd95cc8d6ba494`. See [validation](partitioning-validation.md).

Latest local verification on 2026-10-27 passed typecheck (zero errors, warnings or hints), lint, all 19 unit tests, production build (four routes) and all 20 desktop/mobile Playwright cases. This run used installed Google Chrome because managed Chromium was absent, and a temporary configuration on port 14321 because the default port 4321 was occupied. The existing listener was left running and no committed test configuration was changed. This run did not repeat a clean dependency installation or independent review.

## Remaining work

- [ ] Cloudflare Pages deployment and production verification (#13): record actual HTTPS URL and deployed SHA, verify all routes and lesson interactions, security headers and rollback. No verified public deployment is recorded.
- [ ] Gather qualitative learner feedback on the three lessons, then define the next bounded experiment. Later topics in the [roadmap](roadmap.md) are discovery areas, not scheduled implementation tickets.
- [ ] Restore GitHub Actions when account availability is resolved (#16). This is non-blocking; local validation remains the development and merge route.

## Historical bootstrap verification — issue #15

Work resumed on 2026-10-26 with the user's explicit authorization to merge PR #14 after successful local checks, without waiting for GitHub Actions.

The application at `1a8f8c3d01c85e8ea51c161f1fbd2d390720d95f`, including the final preview-script checkpoint, passed clean installation, typecheck, lint, seven unit tests, production build, and eight desktop/mobile Playwright tests. The exact Astro preview command uses one explicit loopback host. Managed Chromium was installed successfully; no Python server or custom browser executable was needed. See [validation](validation.md) and [review](review.md) for evidence and limitations.

No additional application changes were needed. PR #14 delivers the platform, content contract, deterministic model and first stale-read lesson (#6–#10). The previous independent source review remains applicable.

At that bootstrap checkpoint, #11 and #12 were still future work; both have since shipped as recorded above. Deployment (#13) and non-blocking Actions restoration (#16) remain open.
