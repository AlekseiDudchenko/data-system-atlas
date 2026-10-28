import { useId } from "react";
import { migrationCopy } from "../content/migration";
import type { Locale } from "../i18n";
import type { MigrationState } from "../simulation/migration";

export default function MigrationDiagram({
  state,
  locale,
  preview = false,
}: {
  state: MigrationState;
  locale: Locale;
  preview?: boolean;
}) {
  const c = migrationCopy[locale];
  const marker = `migration-${useId().replaceAll(":", "")}`;
  return (
    <svg
      className="migration-diagram"
      viewBox="0 0 720 365"
      role="img"
      aria-label={`${c.source}: ${state.source.map((v) => `v${v}`).join(", ")}. ${c.target}: ${state.target.map((v) => (v === null ? c.empty : `v${v}`)).join(", ")}. ${c.copied}: ${state.copied}/6. ${c.pending}: ${state.changes.length - state.applied}.`}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--story-accent)" />
        </marker>
      </defs>
      <rect
        x="278"
        y="8"
        width="164"
        height="44"
        rx="6"
        className="migration-app"
      />
      <text x="360" y="35" textAnchor="middle" className="migration-label">
        {c.app}
      </text>
      <path
        d={state.switched ? "M360 52 V70 H560 V99" : "M360 52 V70 H160 V99"}
        fill="none"
        stroke="var(--story-accent)"
        strokeWidth="1.5"
        markerEnd={`url(#${marker})`}
      />
      <text x="160" y="125" textAnchor="middle" className="migration-label">
        {c.source}
      </text>
      <text x="560" y="125" textAnchor="middle" className="migration-label">
        {c.target}
      </text>
      <rect
        x="55"
        y="143"
        width="210"
        height="200"
        rx="8"
        className="migration-db"
      />
      <rect
        x="455"
        y="143"
        width="210"
        height="200"
        rx="8"
        className="migration-db"
      />
      {state.source.map((version, i) => (
        <g key={i}>
          <text x="75" y={171 + i * 30} className="migration-id">
            {String(i + 1).padStart(2, "0")}
          </text>
          <rect
            x="114"
            y={155 + i * 30}
            width="105"
            height="22"
            rx="3"
            className={
              i === 0 && version > 1 ? "migration-row changed" : "migration-row"
            }
          />
          <text
            x="231"
            y={171 + i * 30}
            textAnchor="end"
            className="migration-version"
          >
            v{version}
          </text>
          <text x="475" y={171 + i * 30} className="migration-id">
            {String(i + 1).padStart(2, "0")}
          </text>
          <rect
            x="514"
            y={155 + i * 30}
            width="105"
            height="22"
            rx="3"
            className={`migration-row ${state.target[i] === null ? "empty" : state.target[i] !== version ? "outdated" : ""}`}
          />
          <text
            x="631"
            y={171 + i * 30}
            textAnchor="end"
            className="migration-version"
          >
            {state.target[i] === null ? "—" : `v${state.target[i]}`}
          </text>
        </g>
      ))}
      <path
        d="M278 216 H442"
        fill="none"
        stroke="var(--story-accent)"
        strokeWidth="1.5"
        strokeDasharray={state.copied === 6 ? "3 5" : undefined}
        markerEnd={`url(#${marker})`}
      />
      <text
        x="360"
        y="198"
        textAnchor="middle"
        className="migration-link-label"
      >
        {c.snapshot}
      </text>
      <text x="360" y="239" textAnchor="middle" className="migration-counter">
        {state.copied} / 6
      </text>
      {state.stage >= 2 && (
        <g>
          <path
            d="M278 295 H442"
            fill="none"
            stroke="var(--story-accent)"
            strokeWidth="1.5"
            markerEnd={`url(#${marker})`}
          />
          <text
            x="360"
            y="277"
            textAnchor="middle"
            className="migration-link-label"
          >
            {c.stream}
          </text>
          {state.changes
            .slice(state.applied, state.applied + 5)
            .map((change, i) => (
              <g key={state.applied + i}>
                <rect
                  x={291 + i * 26}
                  y="287"
                  width="20"
                  height="16"
                  rx="3"
                  fill="var(--story-accent)"
                />
                <text
                  x={301 + i * 26}
                  y="299"
                  textAnchor="middle"
                  className="migration-packet-label"
                >
                  {change.version}
                </text>
              </g>
            ))}
        </g>
      )}
      {!preview && state.copied > 0 && state.copied < 6 && (
        <circle
          key={state.copied}
          r="4"
          fill="var(--story-accent)"
          className="migration-moving-dot"
        >
          <animateMotion dur="0.6s" path="M278 216 H442" fill="freeze" />
        </circle>
      )}
    </svg>
  );
}
