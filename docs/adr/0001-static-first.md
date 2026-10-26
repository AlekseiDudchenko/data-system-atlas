# ADR 0001: Static Astro with React islands and MDX

Status: Accepted · 2026-10-26

Context: Most of the product is explanatory text. One experiment needs local state. Hosting should be simple and the reading experience should survive disabled JavaScript.

Decision: Generate static Astro pages. Author lessons in MDX and hydrate only experiment components as React islands. Use SVG plus equivalent semantic HTML. Deploy `dist/` to Cloudflare Pages without an adapter. Use strict TypeScript and a committed npm lockfile; use ESLint 9 because the current JSX accessibility plugin's peer range does not support ESLint 10.

Consequences: No runtime service or secrets; prose remains available without JavaScript. Interactive controls need JavaScript. React is downloaded on lesson routes, not the home page. Content updates require a rebuild. No progress synchronization.

Alternatives: A full SPA adds unnecessary client routing and prose rendering. SSR introduces infrastructure without an MVP requirement. Canvas would require more work for text accessibility and inspection.
