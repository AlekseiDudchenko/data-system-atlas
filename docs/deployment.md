# Cloudflare Pages deployment

## Live project — 2026-10-27

Project `data-systems-atlas` is connected to the existing GitHub repository and deploys `main` automatically. Primary URL: https://data-systems-atlas.dudchenko.org/. Assigned Pages URL: https://data-systems-atlas-4c2.pages.dev/. The custom domain is Active with SSL enabled. Node 24 is pinned in `.node-version`. See [production release verification](production-validation.md) for the deployed application SHA, deployment ID, checks and rollback limits.

## Settings

Connect the existing `AlekseiDudchenko/data-system-atlas` repository to Cloudflare Pages. Product/project name: `data-systems-atlas` if available. Production branch: `main`. Root directory: repository root. Framework preset: Astro. Build command: `npm ci && npm run build`. Build output directory: `dist`. Set `NODE_VERSION=24`. No runtime adapter, database, environment secrets, or Cloudflare Functions are required. `wrangler.jsonc` describes the static output for optional CLI deployment.

Before deploying, run all README gates locally. GitHub Actions availability is independent of Cloudflare's Git-based build. Do not publish a failing build.

## Alternatives and verification

For an authorized CLI session, run `npx wrangler pages deploy dist --project-name data-systems-atlas` after the production build, using a project that belongs to the correct account. Do not commit tokens. Record the actual returned URL; do not assume a project name implies an active deployment.

Verify the returned URL serves `/`, `/replication/stale-reads`, and `/favicon.svg`, including a direct lesson navigation and hard refresh. In a browser, reproduce write → stale read → two steps → current read. Check a blocked follower catches up only after restore and another step. Confirm mobile reflow, HTTPS, and expected security headers. Save the deployed commit and URL in the release record.

Also verify `/replication/read-your-writes` by direct navigation and hard refresh. Block B, write, compare immediate and session reads, advance twice, confirm the session read remains waiting, then restore and step to complete it. Verify canceling a waiting read retains the session minimum before retrying on A.

Verify `/partitioning/hotspots` directly and after hard refresh. An even batch completes all twelve requests; a fresh hot-key batch produces 10/1/1 arrivals and six queued requests on one owner. Drain twice to empty that queue. Change hot key to move the busiest owner and verify changing choices resets counters.

Rollback using Cloudflare Pages' prior production deployment promotion, or revert the source commit through a reviewed PR and rebuild. Test the same smoke scenario after rollback.

## Historical bootstrap deployment status

The bootstrap session did not deploy the site because account access was unavailable. This is superseded by the live project and production verification above.

References: [Cloudflare build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [Astro deployment](https://docs.astro.build/en/guides/deploy/).
