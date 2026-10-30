import type { transferJava } from "../content/transferJava";

export default function JavaExample({ example }: {
  example: (typeof transferJava)[number];
}) {
  return (
    <details className="java-example">
      <summary>Java / JDBC — {example.title}</summary>
      <p>{example.note}</p>
      {/* Keyboard focus lets readers scroll long code lines. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre tabIndex={0} aria-label={`Java: ${example.title}`}>
        <code>{example.code}</code>
      </pre>
    </details>
  );
}
