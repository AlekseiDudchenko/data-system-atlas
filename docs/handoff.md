# Project handoff — 2026-10-28

## Where things stand

- Direction: [VISION.md](../VISION.md). One exploration, Scaling Large Data Transfers, in Russian only: the pull page `/ru/data-transfers/` (eight scenes: volume, failures, parallel readers) and the push page `/ru/data-transfers/push/` (five scenes and a pull-or-push table).
- Shipped: P0 in PR #27, P1 in PR #28, P2 in the PR closing #26. Each release is checked in production ([record](production-validation.md)).
- Models and their assumptions: ADRs 0006–0008.

## Next

See "Next, not scheduled" in the [roadmap](roadmap.md). Work on a branch and merge through a PR; `main` deploys to production.

## Notes

- Astro needs Node ≥ 22.23 (Node 24 pinned in `.node-version`).
- GitHub Actions are unavailable (#16); record the local checks in each PR.
- Cloudflare Pages has no branch previews; share a preview as a built page if needed.
