# Data Systems Atlas

**Explore. Break. Understand.**

An independent, open-source interactive atlas of data-intensive applications and distributed systems. Built for experienced backend engineers, aspiring architects, and system design interview preparation.

## Try the first experiment

Live site: [Data Systems Atlas](https://data-systems-atlas.dudchenko.org/).

Open `/replication/stale-reads`. Write a value, read a follower before delivery, block a replication link, and advance logical time to watch the system catch up. No sign-in, backend, or database is needed. Explanations are available without JavaScript; experiments require it.

Then open `/replication/read-your-writes`. Compare an immediate follower read with a session read that waits for your last acknowledged write. Block replication to see the availability cost, then restore it or cancel and retry on another follower.

Explore `/partitioning/hotspots` to compare even and hot-key request batches across three fixed owners. See how equal key counts can still produce one growing queue while other owners have unused capacity.

## Development

Use Node.js 24 LTS and npm. The committed lockfile pins the compatible dependency graph.

```sh
npm ci
npm run dev
```

Visit `http://localhost:4321`. Before opening a PR:

```sh
npm run check
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run preview` serves the production build. Playwright tests that build on desktop and mobile Chromium. GitHub Actions runs the same gates; unavailable Actions do not replace local validation.

## Project guide

- [Vision](VISION.md) and [architecture](ARCHITECTURE.md)
- [Roadmap and GitHub backlog](docs/roadmap.md)
- [Content guidelines](docs/content-guidelines.md) and [contributing](CONTRIBUTING.md)
- [Architecture decisions](docs/adr/README.md)
- [Deployment](docs/deployment.md)

Stack: Astro static pages, strict TypeScript, MDX, React islands, SVG, Vitest, Playwright, and Cloudflare Pages. The pure simulation model has no UI dependencies.

## Independence and licensing

Topic inspiration includes Martin Kleppmann's _Designing Data-Intensive Applications_. This is not a book adaptation or a chapter-by-chapter companion and is not affiliated with the author or publisher. Explanations, diagrams, scenarios, and code are original. Product-specific claims link to primary documentation and carry configuration caveats.

Original project code and content are licensed under [MIT](LICENSE). Third-party dependencies retain their own licenses. Referenced books and documentation are not included in this license.

Repository note: the existing GitHub repository is `AlekseiDudchenko/data-system-atlas` (singular); the product name is **Data Systems Atlas**.

## Languages

English uses the existing root URLs; German uses `/de/` and Russian `/ru/`.
The header language switcher opens the same page in the chosen language.

Shared UI strings live in `src/i18n/de.ts` and `src/i18n/ru.ts`; the typed
English source phrases are the translation keys. Use `translator(locale)` for
UI text and `localizedPath(locale, path)` for internal links. Placeholders such
as `{0}` are substituted after translation, so user-entered values are preserved.
Simulation logs store event data and are formatted by `src/i18n/log.ts`.

Lessons are MDX files under `src/pages/`, `src/pages/de/` and `src/pages/ru/`.
When adding or updating a lesson, keep all three versions, their metadata and
links in sync. React labs receive the page locale as a prop; the simulation
models remain shared across languages. The sample values `Hello`, `Goodbye`
and `New name` are intentionally the same in each language.
