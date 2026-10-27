# Data Systems Atlas: vision

**Explore. Break. Understand.**

Turn architectural vocabulary into observable behavior. A reader should be able to predict an outcome, change a system, observe a counterexample, and explain the trade-off in their own words.

## Audience and experience

Experienced backend engineers, aspiring software architects, and engineers preparing for system design interviews need intuition as well as definitions. The atlas is a connected map of concepts, not a linear textbook. Each small lesson combines an original explanation, a manipulable model, a concrete engineering scenario, and explicit boundaries.

The learning loop is: question → prediction → experiment → observation → explanation → design discussion. Mobile and keyboard users must be able to complete the same loop. English is the initial content language.

## Knowledge territories

1. Foundations — latency, throughput, failure, reliability, and data models.
2. Storage Engines — indexes, write paths, B-trees, LSM trees, and compaction.
3. Replication — lag, read routing, session guarantees, and failover.
4. Partitioning — placement, skew, rebalancing, and hotspots.
5. Transactions & Consistency — isolation anomalies and observable guarantees.
6. Distributed Coordination — ordering, consensus, leases, and fencing.
7. Event-Driven Systems — delivery, replay, ordering, and stream state.
8. Architecture Patterns — trade-offs across complete system boundaries.

These are a long-term map. Three lessons are available: Replication and Stale Reads, Read Your Writes, and Partitioning and Hotspots. The map must never imply an unfinished lesson works.

## Principles

- Technical correctness: state the guarantee, assumptions, and failure model. Validate behavior with executable scenarios and independent review.
- Originality and attribution: author independent explanations and illustrations; link primary references; distinguish inspiration from evidence. No copied book structure, prose, figures, or exercises.
- Accessibility: semantic controls, keyboard operation, textual state equivalents, readable contrast, responsive layout, and no reliance on color or animation alone.
- Honest simulations: bounded explanatory models, explicit logical time, visible messages, reproducible events. No benchmark claims or blanket database guarantees.
- Small complete experiences: one useful experiment outweighs a generic framework with no finished lessons.
- Static and private by default: no accounts, analytics, persistence, or services in the MVP.

## Success and scope

Initial success means a reader can reproduce a stale read, explain why it happened, restore a blocked replica, and identify at least two assumptions the model omits. Maintainability means the same scenario can run without a browser.

Later releases can connect experiments with prerequisites and reflection questions. Progress sync, courses, AI tutoring, production emulation, database integrations, and a CMS are outside the MVP. Any expansion needs evidence from learner feedback.
