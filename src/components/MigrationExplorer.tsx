import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n";
import { migrationCopy } from "../content/migration";
import {
  canSwitchMigration,
  initialMigration,
  migrationMatches,
  migrationTransition,
  type MigrationEvent,
  type MigrationStage,
} from "../simulation/migration";
import { useHydrated } from "./useHydrated";
import MigrationDiagram from "./MigrationDiagram";

export default function MigrationExplorer({ locale }: { locale: Locale }) {
  const c = migrationCopy[locale];
  const [state, setState] = useState(() => initialMigration(0));
  const active = useRef<MigrationStage>(0);
  const hydrated = useHydrated();
  const switchScene = (stage: MigrationStage) => {
    if (active.current === stage) return;
    active.current = stage;
    setState(initialMigration(stage));
  };
  useEffect(() => {
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene]"),
    );
    const observer = new IntersectionObserver(
      () => {
        // Read current positions, since queued intersection entries can precede a manual jump.
        const anchor = window.innerHeight * 0.3;
        const visible = scenes.find((scene) => {
          const bounds = scene.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        if (visible)
          switchScene(Number(visible.dataset.scene) as MigrationStage);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);
  const dispatch = (event: MigrationEvent) =>
    setState((previous) => migrationTransition(previous, event));
  const finished = state.copied === 6;
  return (
    <div className={`migration-explorer ${hydrated ? "is-interactive" : ""}`}>
      <div className="migration-narrative">
        {c.scenes.map((scene, i) => (
          <section
            key={i}
            id={`scene-${i + 1}`}
            data-scene={i}
            className={`migration-scene ${state.stage === i ? "active" : ""}`}
            aria-labelledby={`scene-title-${i}`}
          >
            <span className="story-index">0{i + 1} / 04</span>
            <h2 id={`scene-title-${i}`}>{scene.title}</h2>
            <p>{scene.body}</p>
            <p className="scene-insight">{scene.insight}</p>
            <a
              href="#migration-workspace"
              className="scene-open"
              onClick={(event) => {
                event.preventDefault();
                switchScene(i as MigrationStage);
                document
                  .getElementById("migration-workspace")
                  ?.focus({ preventScroll: true });
              }}
            >
              {c.controls} <span aria-hidden="true">↗</span>
            </a>
          </section>
        ))}
      </div>
      <div
        className="migration-workspace"
        id="migration-workspace"
        tabIndex={-1}
      >
        <nav className="scene-nav" aria-label={c.scenesLabel}>
          {c.scenes.map((scene, i) => (
            <button
              key={i}
              type="button"
              disabled={!hydrated}
              aria-label={scene.title}
              aria-pressed={state.stage === i}
              onClick={() => {
                switchScene(i as MigrationStage);
                if (window.matchMedia("(min-width: 900px)").matches) {
                  document
                    .getElementById(`scene-${i + 1}`)
                    ?.scrollIntoView({ block: "start", behavior: "instant" });
                }
              }}
            >
              0{i + 1}
            </button>
          ))}
          <span className="workspace-mode">
            {state.switched ? c.target : state.paused ? c.paused : c.live}
          </span>
        </nav>
        <MigrationDiagram state={state} locale={locale} />
        <div className="migration-metrics">
          <span>
            {c.copied}
            <strong>
              {state.copied}
              <span> / 6</span>
            </strong>
          </span>
          {state.stage >= 2 && (
            <span>
              {c.pending}
              <strong>{state.changes.length - state.applied}</strong>
            </span>
          )}
        </div>
        <fieldset
          className="migration-controls"
          disabled={!hydrated || state.switched}
          aria-label={c.controls}
        >
          <button
            type="button"
            onClick={() => dispatch({ type: "copy" })}
            disabled={finished}
          >
            {c.copy}
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => dispatch({ type: "write" })}
            disabled={state.paused}
          >
            {c.write}
          </button>
          {state.stage >= 2 && (
            <button
              type="button"
              className="quiet"
              onClick={() => dispatch({ type: "apply" })}
              disabled={!finished || state.applied === state.changes.length}
            >
              {c.apply}
            </button>
          )}
          {state.stage === 3 && (
            <>
              <button
                type="button"
                className="quiet"
                onClick={() => dispatch({ type: "pause" })}
              >
                {state.paused ? c.resume : c.pause}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "switch" })}
                disabled={!canSwitchMigration(state)}
              >
                {c.switch}
              </button>
            </>
          )}
        </fieldset>
        <p className="migration-status" role="status">
          {state.switched
            ? c.complete
            : !finished
              ? c.missing
              : migrationMatches(state)
                ? c.matching
                : c.behind}
          <span>
            {c.sourceVersion}: v{state.source[0]} · {c.targetVersion}:{" "}
            {state.target[0] === null ? "—" : `v${state.target[0]}`}
          </span>
        </p>
        {state.stage === 3 && !state.switched && (
          <p className="workspace-hint">{c.cutoverHint}</p>
        )}
        {state.stage === 2 && !finished && (
          <p className="workspace-hint">{c.snapshotHint}</p>
        )}
        <button
          type="button"
          className="migration-reset"
          disabled={!hydrated}
          onClick={() => setState(initialMigration(state.stage))}
        >
          {c.reset} <span aria-hidden="true">↺</span>
        </button>
      </div>
    </div>
  );
}
