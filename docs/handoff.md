# Project handoff — 2026-10-28

## Where things stand

- Direction changed: [VISION.md](../VISION.md). The atlas is a collection of interactive architecture explorations; the first and only one planned is Scaling Large Data Transfers.
- `main` at `d560b54` holds the editorial redesign (keep it), the dark theme, three earlier lessons and a data-migration prototype (both to be retired in #20).
- Local checks on `d560b54`: typecheck 0 errors, lint clean, 26 unit tests, build of 15 pages. Browser tests not re-run.

## Next

Follow the [roadmap](roadmap.md): #20 and #21 first, then #22, #23, #24. Work on a branch and merge through a PR; do not push to `main` directly — it deploys to production.

## Notes

- Astro needs Node ≥ 22.23 (Node 24 pinned in `.node-version`).
- GitHub Actions are unavailable (#16); record the local checks in each PR.
