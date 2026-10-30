import { getTransferCopy } from "../content/localized";
import { useLocale } from "../i18n/react";

export type Column = { title: string; subtitle: string };
export type Row = { label: string; values: readonly string[] };

/** Estimates for the previous decision next to the current one. */
export default function CompareTable({
  columns,
  rows,
}: {
  columns: readonly Column[];
  rows: readonly Row[];
}) {
  const c = getTransferCopy(useLocale());
  return (
    <div className="story-compare">
      <table>
        <caption>{c.compare}</caption>
        <thead>
          <tr>
            <th scope="col">{c.metric}</th>
            {columns.map((column) => (
              <th scope="col" key={column.title}>
                {column.title}
                <span>{column.subtitle}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
