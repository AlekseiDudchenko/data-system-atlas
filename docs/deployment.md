# Cloudflare Pages deployment

## Live project — 2026-10-27

Project `data-systems-atlas` is connected to the existing GitHub repository and deploys `main` automatically. Primary URL: https://data-systems-atlas.dudchenko.org/. Assigned Pages URL: https://data-systems-atlas-4c2.pages.dev/. The custom domain is Active with SSL enabled. Node 24 is pinned in `.node-version`. See [production release verification](production-validation.md) for the deployed application SHA, deployment ID, checks and rollback limits.

## Settings

Connect the existing `AlekseiDudchenko/data-system-atlas` repository to Cloudflare Pages. Product/project name: `data-systems-atlas` if available. Production branch: `main`. Root directory: repository root. Framework preset: Astro. Build command: `npm ci && npm run build`. Build output directory: `dist`. Set `NODE_VERSION=24`. No runtime adapter, database, environment secrets, or Cloudflare Functions are required. `wrangler.jsonc` describes the static output for optional CLI deployment.

Before deploying, run all README gates locally. GitHub Actions availability is independent of Cloudflare's Git-based build. Do not publish a failing build.

## Alternatives and verification

For an authorized CLI session, run `npx wrangler pages deploy dist --project-name data-systems-atlas` after the production build, using a project that belongs to the correct account. Do not commit tokens. Record the actual returned URL; do not assume a project name implies an active deployment.

Verify the returned URL serves `/ru/`, `/ru/data-transfers/` and `/favicon.svg`, including direct navigation and hard refresh. English is served at `/`, `/data-transfers/` and `/data-transfers/push/`. German routes redirect to their Russian counterparts (302 until translated); retired lesson and migration URLs redirect to `/ru/` (301, `public/_redirects`). On the exploration, run scene 1 (done in about 2 s), scene 2 with a million records (out of memory, nothing written) scene 4 (a million records in about a minute with batches of 1,000), scene 7 with the checkpoint saved before the write (1,000 records missing) and scene 8 with eight readers (speedup ×4.3). On `/ru/data-transfers/push/`: scene 1 loses 14,000 events, scene 2 recovers 29.7 s after the outage, scene 4 reports 1,700 duplicates. Confirm mobile reflow, HTTPS and the security headers. Save the deployed commit and URL in the release record.

Rollback using Cloudflare Pages' prior production deployment promotion, or revert the source commit through a reviewed PR and rebuild. Test the same smoke scenario after rollback.

## Historical bootstrap deployment status

The bootstrap session did not deploy the site because account access was unavailable. This is superseded by the live project and production verification above.

References: [Cloudflare build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [Astro deployment](https://docs.astro.build/en/guides/deploy/).
