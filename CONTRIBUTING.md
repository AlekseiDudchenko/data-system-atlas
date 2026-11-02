# Contributing

Start with an issue describing the reader's problem and the observable outcome. Keep each change to one complete, runnable step of an exploration. Follow the setup and gates in README; use the committed lockfile and a feature branch based on current main.

For model changes, state invariants and add tests that would fail if a guarantee were broken. Keep simulation logic free of UI, clocks, randomness, and I/O. Avoid a shared framework until repeated requirements justify it. Add an ADR for a consequential change in boundaries or guarantees.

For explorations, follow [content guidelines](docs/content-guidelines.md). Write original prose in English and Russian, cite primary sources, and explicitly explain model limitations. Do not reproduce published figures, exercises, or chapter structure. Contributions are under the project's MIT license; ensure you may license submitted material.

Run type checking, linting, model tests, production build, and browser tests before requesting review. Check mobile layout, keyboard flow, screen-reader names, text equivalents, color-independent feedback, and JavaScript-disabled prose. Browser automation is a baseline, not full assistive-technology certification.

PRs should explain the reader-visible outcome, model assumptions, tests, screenshots where useful, and remaining limitations. Ask an independent reviewer to check correctness, accessibility, sources, and architectural simplicity. Resolve significant findings before merge. Document unavailable CI honestly and attach equivalent local evidence. Do not merge known failing code.
