# Architecture

## Static pages, local experiments

Astro renders the home page and MDX lesson at build time. One React island hydrates the experiment using `client:load`. SVG presents topology; native HTML controls, node summaries, message lists, and a historical read status provide the usable interface and text equivalents. No server adapter, API, database, authentication, or persistent browser storage is introduced.

## Boundaries

| Location                            | Responsibility                                        |
| ----------------------------------- | ----------------------------------------------------- |
| `src/pages`                         | Public routes and English MDX lesson prose            |
| `src/layouts/Layout.astro`          | Static HTML document, metadata, navigation, skip link |
| `src/components/ReplicationLab.tsx` | UI state, dispatch, SVG and HTML views                |
| `src/simulation/replication.ts`     | Pure model and event transitions                      |
| `src/simulation/*.test.ts`          | Model contracts                                       |
| `tests`                             | Production-build browser scenarios                    |
| `public`                            | Static assets and Cloudflare headers                  |

A UI action dispatches an explicit event. `transition(state, event)` returns the next state. The UI renders that state. The simulation imports nothing from React, SVG, browser APIs, timers, randomness, or networking. Events can be replayed with `events.reduce(transition, initialState())`; no general engine framework is needed yet.

## First model contract

One string key, a permanent leader, two followers. Writes monotonically increase a logical version and queue two snapshots, due at `step + 2`. Write, read, and link events do not move time. A step delivers all due messages on unblocked links in insertion order, preserving write order per follower. A block retains messages and leaves reads available. Restoring alone does not deliver: the next step does. A read captures both the replica version and leader version at read time, so historical results do not change meaning later. Reset constructs a fresh initial state.

All model state is typed readonly; transitions replace changed collections and do not mutate prior state. Values are trimmed and capped at 80 characters. The event log retains 100 entries; pending messages are unbounded in this small manual model. Reload loses all state. No crash durability, elections, retry mechanics, duplicate messages, reordering, cross-key atomicity, or wall-clock latency is modeled. This selective link failure is not a full network partition.

## Content and extension

Use MDX for a lesson with a single island imported explicitly. Content guidelines define a common editorial contract rather than a custom schema or registry. The home page names all eight territories but links only the working lesson. Extract shared simulation infrastructure or a content collection only after a second concrete use case demonstrates a need.

## Quality and operations

Strict TypeScript plus Astro check covers TS, TSX, MDX integration, and Astro files. ESLint covers JS/TS/TSX, with JSX accessibility rules; Astro templates are checked by Astro and inspected in browser tests. Vitest validates deterministic transitions and invariants; Playwright runs desktop/mobile scenarios against the built site, plus keyboard, no-JavaScript and axe checks. Production is static Cloudflare Pages output in `dist/`.

See [ADRs](docs/adr/README.md) for trade-offs and [deployment](docs/deployment.md) for setup, smoke checks, and rollback.
