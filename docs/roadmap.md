# Roadmap and backlog

Direction: [VISION.md](../VISION.md), agreed 2026-10-28. Active work lives in GitHub Issues; this file keeps the order and the decisions behind it. Build one strong exploration before extracting shared abstractions.

## Status — 2026-10-29

- Shipped and verified in production ([record](production-validation.md)): P0 in PR #27 (scenes 1–4 and the home page), P1 in PR #28 (scenes 5–8: failures, retries, idempotency, checkpoints, parallel pull), P2 in PR #29 (the push page). Issues #20–#26 are closed.
- Decisions: keep the headline "How data systems work"; Scaling Large Data Transfers is the first and only exploration; the earlier lessons and the migration prototype are retired; no "How it works" block and no About page; the site is Russian only for now (`/`, `/de/` redirect to `/ru/`).
- GitHub Actions are unavailable (#16). Validate locally and record which checks ran.

## P0 — first exploration

| Order | Issue                                                                  | Scope                                                                 | Depends on |
| ----- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- |
| 1     | [#20](https://github.com/AlekseiDudchenko/data-system-atlas/issues/20) | Retire old lessons and migration prototype; redirects                 | —          |
| 2     | [#21](https://github.com/AlekseiDudchenko/data-system-atlas/issues/21) | Pull-transfer model: sequential, lazy reading, batch writes; ADR 0006 | —          |
| 3     | [#22](https://github.com/AlekseiDudchenko/data-system-atlas/issues/22) | Exploration page: scenes, diagram, metrics, assumptions               | #21        |
| 4     | [#23](https://github.com/AlekseiDudchenko/data-system-atlas/issues/23) | Home with one featured exploration; new footer                        | #20, #22   |
| 5     | [#24](https://github.com/AlekseiDudchenko/data-system-atlas/issues/24) | Validation and release                                                | #20–#23    |

#20 and #21 can run in parallel. Ship #20 together with #22/#23 so the public home never shows an empty atlas.

## P1 — failures and scale

[#25](https://github.com/AlekseiDudchenko/data-system-atlas/issues/25): retry and lost acknowledgements, idempotency, checkpoint/resume, then parallel pull and contention. Split into issues after P0.

## P2 — push-based path

[#26](https://github.com/AlekseiDudchenko/data-system-atlas/issues/26): queue/stream, consumers, lag, dead-letter, redelivery, consumer groups.

## Next, not scheduled

- English and German translations of both pages, then the language switcher returns.
- Live migration with CDC (snapshot + change stream + cutover; the retired prototype in `d560b54` is a starting point), multiple sources, mapping, validation and reconciliation.
- Replay and schema evolution on the push page; transaction boundaries and partial batch failures on the pull page.
- Learner feedback on the exploration before adding a second one.

## Infrastructure

- [#16](https://github.com/AlekseiDudchenko/data-system-atlas/issues/16) Restore GitHub Actions — non-blocking.
- Cloudflare Pages deploys `main` automatically: [deployment](deployment.md), [production verification](production-validation.md).

## History

Before 2026-10-28 the atlas was a set of lessons (stale reads #9, read-your-writes #11, partitioning #12) built in M0–M2 and published with #13. That direction is superseded; the code remains in git history and ADRs 0003–0005 describe those models.
