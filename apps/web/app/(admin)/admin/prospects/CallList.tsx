import { EmptyState, cx } from "@/components/glass";
import type { ProspectView } from "@/lib/prospects";
import { linkClass, mobileCard, rowClass, td, th } from "../AdminUi";

// Lista de ligações: prospects sem e-mail (com telefone e sem "do not contact"). Ligação feita
// por uma pessoa, uma a uma: nada de robô nem SMS (TCPA, ver docs/prospecting.md).

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function CallList({ rows }: { rows: ProspectView[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No one to call yet."
        description="Prospects without an email but with a phone number show up here."
      />
    );
  }
  return (
    <>
      <div className="glass hidden overflow-x-auto rounded-2xl md:block">
        <table className="w-full text-left text-[14px] text-(--glass-fg)">
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Phone</th>
              <th className={th}>City</th>
              <th className={th}>Preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={rowClass}>
                <td className={cx(td, "font-semibold")}>{row.name}</td>
                <td className={cx(td, "whitespace-nowrap tabular-nums")}>
                  {row.phone && (
                    <a href={tel(row.phone)} className={linkClass}>
                      {row.phone}
                    </a>
                  )}
                </td>
                <td className={td}>{[row.city, row.state].filter(Boolean).join(", ")}</td>
                <td className={td}>
                  {row.previewPath ? (
                    <a
                      href={row.previewPath}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      Open preview
                    </a>
                  ) : (
                    <span className="text-(--glass-fg-muted)">No preview yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className={mobileCard}>
            <p className="font-semibold text-(--glass-fg)">{row.name}</p>
            <p className="text-[13px] text-(--glass-fg-muted)">
              {[row.city, row.state].filter(Boolean).join(", ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-[15px]">
              {row.phone && (
                <a href={tel(row.phone)} className={linkClass}>
                  {row.phone}
                </a>
              )}
              {row.previewPath && (
                <a href={row.previewPath} target="_blank" rel="noreferrer" className={linkClass}>
                  Open preview
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
