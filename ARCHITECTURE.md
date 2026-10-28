# Architecture

## Static pages, local experiments

Astro renders the home page and the exploration at build time. The exploration hydrates one React island (`TransferExplorer`) with `client:load`; the home page renders the same diagram statically as a preview. No server adapter, API, database, authentication, or persistent storage is introduced, apart from the optional theme preference in `localStorage`.

## Boundaries

| Location                              | Responsibility                                           |
| ------------------------------------- | -------------------------------------------------------- |
| `src/pages/ru`                        | Public routes (Russian only for now)                     |
| `src/layouts/Layout.astro`            | Document, metadata, navigation, theme toggle, footer     |
| `src/components/Home.astro`           | Home page with the featured exploration                  |
| `src/components/TransferStory.astro`  | Exploration page: heading, island, model limits, sources |
| `src/components/TransferExplorer.tsx` | Scenes, controls, run animation, before/after table      |
| `src/components/TransferDiagram.tsx`  | SVG diagram, wide and tall variants, text equivalent     |
| `src/simulation/transfer.ts`          | Pure cost model and progress at a point in modelled time |
| `src/simulation/*.test.ts`            | Model invariants                                         |
| `src/content`                         | Page copy                                                |
| `src/i18n`                            | Locales, layout strings, number/duration/size formatting |
| `tests`                               | Production-build browser scenarios                       |
| `public`                              | Static assets, Cloudflare headers and redirects          |

## Model contract

`estimateTransfer(plan)` returns a complete estimate for a plan of records, eager or lazy reading and batch size: outcome, duration, round trips, records read and written, memory needed, how long the source cursor stays open and throughput. `progressAt(estimate, t)` returns the visible state at modelled time `t`. The UI animates by sampling `progressAt` over a fixed 2.6 s, or jumps to the end when reduced motion is preferred. The model imports nothing from React, the DOM, timers or randomness. Constants and their consequences are in [ADR 0006](docs/adr/0006-transfer-cost-model.md).

## Content and extension

Each scene fixes the strategy (eager/lazy, per-record/batched) and its default controls; changing a control or scene resets the run. A scene compares its estimate with the previous decision at the same record count. New scenes extend `plans()` in the explorer and the model only when they need a new mechanism; no generic simulation engine exists until a second exploration needs one.

## Quality and operations

Strict TypeScript plus Astro check covers TS, TSX and Astro files. ESLint covers JS/TS/TSX with JSX accessibility rules. Vitest checks model invariants; Playwright runs desktop and mobile scenarios against the built site, including redirects, keyboard, reduced motion, no-JavaScript reading and axe checks in both themes. Production is static Cloudflare Pages output in `dist/`.

See [ADRs](docs/adr/README.md) for trade-offs and [deployment](docs/deployment.md) for setup, smoke checks and rollback.
