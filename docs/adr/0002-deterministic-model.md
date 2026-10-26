# ADR 0002: Pure transitions with explicit logical steps

Status: Accepted · 2026-10-26

Context: Readers need repeatable failure experiments, and tests need to assert intermediate states without flaky delays.

Decision: Represent state as readonly data. Apply discriminated events through a pure `transition` function. Only a step event advances logical time; writes, reads and link toggles do not. Reset returns fresh state. Keep the engine independent of React, browser APIs, I/O, random numbers and clocks.

Consequences: Exact scenarios replay in unit tests. State can be inspected independently of rendering. Logical steps are not latency measurements. Explicit stepping prioritizes causality over animation. The UI holds input selection separately from simulated system state.

Alternatives: Timers obscure sequencing and make tests timing-dependent. A generic discrete-event framework is deferred until a second lesson requires shared scheduling machinery.
