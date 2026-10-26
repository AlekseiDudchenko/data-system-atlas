# Cloudflare Pages deployment

## Settings

Connect the existing `AlekseiDudchenko/data-system-atlas` repository to Cloudflare Pages. Product/project name: `data-systems-atlas` if available. Production branch: `main`. Root directory: repository root. Framework preset: Astro. Build command: `npm ci && npm run build`. Build output directory: `dist`. Set `NODE_VERSION=24`. No runtime adapter, database, environment secrets, or Cloudflare Functions are required. `wrangler.jsonc` describes the static output for optional CLI deployment.

Before deploying, run all README gates locally. GitHub Actions availability is independent of Cloudflare's Git-based build. Do not publish a failing build.

## Alternatives and verification

For an authorized CLI session, run `npx wrangler pages deploy dist --project-name data-systems-atlas` after the production build, using a project that belongs to the correct account. Do not commit tokens. Record the actual returned URL; do not assume a project name implies an active deployment.

Verify the returned URL serves `/`, `/replication/stale-reads`, and `/favicon.svg`, including a direct lesson navigation and hard refresh. In a browser, reproduce write → stale read → two steps → current read. Check a blocked follower catches up only after restore and another step. Confirm mobile reflow, HTTPS, and expected security headers. Save the deployed commit and URL in the release record.

Rollback using Cloudflare Pages' prior production deployment promotion, or revert the source commit through a reviewed PR and rebuild. Test the same smoke scenario after rollback.

## Bootstrap deployment status

Not deployed by the bootstrap session unless an actual verified URL is recorded in `docs/validation.md`. No Cloudflare account connection or deployment credentials were supplied. The application is ready for static Pages hosting; account authorization and repository connection remain required.

References: [Cloudflare build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [Astro deployment](https://docs.astro.build/en/guides/deploy/).
