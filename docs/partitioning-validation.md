# Partitioning and Hotspots — issue #12

Validated locally on 2026-10-26 with macOS arm64, Node 24.19.0, npm 11.6.2, existing lockfile dependencies and `ASTRO_TELEMETRY_DISABLED=1`. No dependencies changed. GitHub Actions was not awaited.

## Local gates

- Astro check: zero errors, warnings or hints across 21 files. ESLint passes.
- Production build passes and generates home, both replication lessons and `/partitioning/hotspots`.
- Vitest: 19 tests pass, including six partitioning cases. They verify 4/4/4 even arrivals; 10/1/1 hot arrivals; overload growth and drain conservation; hotspot ownership for all twelve keys including cyclic background keys; configuration reset semantics and invalid-key rejection; deterministic replay and preservation of earlier nested state; and conservation/local capacity across 200 traffic steps.
- Playwright: 20 desktop/mobile cases pass against the real production Astro preview with one loopback host and managed Chromium 156 revision 1248. Six new cases cover exact table/SVG results, queue growth and draining, hot-key changes/reset, home/breadcrumb navigation, keyboard interaction, responsive overflow, no-JavaScript prose and axe WCAG A/AA checks of the hot state (zero detected violations). All fourteen existing replication cases pass.
- Full-page desktop/mobile screenshots inspected; the fixed-scale SVG has a semantic table with exact request counts and key ownership as its text equivalent.

## Source and contract review

Primary-agent review checked service ordering and arithmetic against ADR 0005 and the worked scenario. A batch first routes twelve requests, then each owner completes at most four; unused capacity is not pooled. Hot-key demand and total demand are distinct: nine requests hit the chosen key, while ten hit its owner. Changing choices starts a fresh run and is explicitly not migration. No significant findings remain. No separate independent reviewer approval is claimed.

AWS partition-key guidance was checked before writing the lesson; the citation is limited to the product's recommendation to consider access patterns and spread activity. The simulation's modulo rule, counters and capacity are teaching assumptions. It models no real storage, individual response latency, rejection/backpressure, migration, auto-scaling or vendor-specific behavior. Production deployment and verification remain #13, Actions restoration #16. No full assistive-technology or Safari/Firefox coverage is claimed.
