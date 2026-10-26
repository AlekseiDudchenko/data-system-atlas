# Independent bootstrap review

An independent agent reviewed the model, UI, tests, original lesson and architecture on 2026-10-26. It independently ran all seven Vitest tests and Astro check successfully.

## Findings and resolutions

| Finding                                                   | Resolution                                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| MDX layout frontmatter was not used for document metadata | Layout handles explicit Astro props and MDX frontmatter; production E2E asserts lesson title                   |
| Heading could join words across a line break              | Explicit whitespace added                                                                                      |
| Generated invariant scenario never blocked replication    | Event sequence now includes both blocked and restored states                                                   |
| Scrollable lists needed portable keyboard access          | Queue and event log are focusable and named; lint exception is limited to these list tags in the lab component |

Follow-up review also verified that extracting the static hero into `LessonHero.astro` removes invalid nested paragraphs produced by MDX, and that opt-in browser/server environment overrides leave the normal setup portable. The JavaScript-disabled test uses a direct `noscript` locator because Playwright text locators exclude that element.

The reviewer confirmed no remaining significant source findings: deterministic transitions are independent of React and clocks; FIFO, queue retention, restore-on-next-step and historical reads match the prose. Educational boundaries distinguish acknowledgment from durability and selective link failure from node outage. Original text and SVG have appropriate source attribution, and the architecture remains small.

Review approval was conditional on the primary agent's final build, browser, axe and visual checks. Their results are recorded in [validation](validation.md). This is a code/content review, not full assistive-technology certification or a formal copyright opinion.

## Final launch configuration verification — issue #15

The only executable change after the independently reviewed implementation was removal of embedded `--host 0.0.0.0` options from the npm dev/preview scripts. The existing Playwright command now expands to `astro preview --host 127.0.0.1 --ignore-lock`, with one explicit loopback host. This configuration was inspected and exercised directly, then used by all eight passing production-build browser tests with managed Chromium. Typecheck, lint, seven unit tests and build also passed. No further source fixes were required; this follow-up is primary-agent verification, not a new independent review. Earlier independent findings remain resolved.
