# Data Systems Atlas

**How data systems work.** An open collection of interactive explorations into how software architectures evolve when workloads grow and simple solutions reach their limits. No perfect architectures — only decisions, constraints and consequences.

Live site: [Data Systems Atlas](https://data-systems-atlas.dudchenko.org/).

## The exploration

`/ru/data-transfers/` — **Scaling large data transfers.** Copy a table from one database to another: a sequential script that loads everything and inserts one row at a time, then a million records that run it out of memory, lazy reading with a cursor, and batched inserts; then dropped connections and retries, a lost acknowledgement that duplicates a batch, UPSERT, checkpoints saved after or before the write, and several readers over key ranges. Run each step, change its decisions, and compare duration, round trips, memory, duplicates, lost records and speedup. All numbers come from explicit models ([ADR 0006](docs/adr/0006-transfer-cost-model.md), [ADR 0007](docs/adr/0007-failure-and-parallel-models.md)); they are estimates, not benchmarks.

Each pull-transfer scene includes an expandable Java 17 / PostgreSQL JDBC fragment. The examples evolve alongside the narrative and are server-rendered for reading without JavaScript. They are teaching fragments, not a complete migration application: checkpoint storage, keyset page reads and range workers have explicit contracts rather than full implementations. JDBC batches do not inherit the simulator’s fixed round-trip count; retry and idempotency assumptions are described beside the code.

`/ru/data-transfers/push/` — **the push model.** When the source sends events itself: a direct push that loses events during a target outage, a queue that buffers them and the lag it builds, a poison message and a dead-letter queue, redelivery after a consumer crash and idempotent writes, and consumer groups that cannot keep up with a hot partition. A pull-or-push table closes the page; push is a different operating model, not the next step of pull ([ADR 0008](docs/adr/0008-push-model.md)).

The site is Russian only for now. `/`, `/de/`, `/data-transfers/` and `/data-transfers/push/` redirect to the Russian pages; English and German return after translation.

## Development

Use Node.js 24 LTS and npm. The committed lockfile pins the compatible dependency graph.

```sh
npm ci
npm run dev
```

Visit `http://localhost:4321/ru/`. Before opening a PR:

```sh
npm run check
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run preview` serves the production build. Playwright tests run on desktop and mobile Chromium. GitHub Actions are unavailable (#16); record the local checks in each PR.

## Project guide

- [Vision](VISION.md) and [architecture](ARCHITECTURE.md)
- [Roadmap](docs/roadmap.md) and GitHub Issues
- [Content guidelines](docs/content-guidelines.md) and [contributing](CONTRIBUTING.md)
- [Architecture decisions](docs/adr/README.md)
- [Deployment](docs/deployment.md)

Stack: Astro static pages, strict TypeScript, React islands, SVG, Vitest, Playwright, and Cloudflare Pages. The cost model has no UI dependencies.

## Languages

Russian copy lives in `src/content/` (exploration and home) and `src/i18n/ru.ts` (layout strings). `publishedLocales` in `src/i18n/index.ts` lists the languages with built pages; the language switcher appears again when it has more than one entry. Numbers, durations and sizes are formatted by `src/i18n/format.ts`, including Russian plural forms.

## Independence and licensing

Explanations, diagrams, scenarios, and code are original. Product-specific claims link to primary documentation.

Original project code and content are licensed under [MIT](LICENSE). Third-party dependencies retain their own licenses.

Repository note: the GitHub repository is `AlekseiDudchenko/data-system-atlas` (singular); the product name is **Data Systems Atlas**.
