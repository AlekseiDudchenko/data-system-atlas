# Content guidelines

## A lesson's editorial contract

1. State an engineering question and learning outcome.
2. Ask for a prediction before revealing an observation.
3. Provide a short reproducible sequence of controls and expected results.
4. Explain the mechanism and the architectural trade-off.
5. Offer a failure experiment and a practical design discussion.
6. List model assumptions, omissions, and what the model does not prove.
7. Cite further reading and distinguish general ideas from product-specific guarantees.

## Correctness and attribution

English content must use precise terms: an acknowledgment does not automatically imply replication or crash durability. Name the reference point when calling a read stale. Do not confuse selective replication link blocking with full node failure or whole-system partition. Describe conditional guarantees in the context of implementation and configuration.

Use original scenarios, text, diagrams, and exercises. Do not organize lessons to mirror a copyrighted book or trace figures. Mention conceptual inspiration separately from technical evidence. Link primary implementation documentation for product claims; name book authors and publication details without implying affiliation. Quote only when necessary and narrowly, with attribution. Review sources whenever a lesson's guarantee changes.

## Accessible experiments

Use native labeled buttons, inputs, checkboxes, and selects. Supply textual equivalents for graphical node values and links. Show status in words as well as color. Keep controls reachable with visible focus, support mobile reflow, and respect reduced motion. Important read feedback belongs in a polite live region; do not announce the entire event history on every action. Provide readable explanations and a worked scenario without JavaScript.

## Model limitations

Every lesson names its time model, delivery ordering, failure boundaries, persistence behavior, and omitted mechanisms. Models teach causality, not performance predictions. A simulated behavior is not evidence that a real database provides that behavior. Review a deterministic scenario against both code and prose before publication.
