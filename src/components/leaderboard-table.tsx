import Link from "next/link";

import { ordinal } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({
  rows,
  compact = false,
}: {
  rows: LeaderboardRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
          No marks yet
        </div>
        <p className="mt-3 max-w-xs text-sm leading-6 text-bone-dim">
          The board is waiting for its first name. One mark is all it takes to appear.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3.5 font-mono text-[9px] font-normal tracking-[0.16em] text-muted uppercase">
                Rank
              </th>
              <th className="px-3 py-3.5 font-mono text-[9px] font-normal tracking-[0.16em] text-muted uppercase">
                Handle
              </th>
              <th className="px-3 py-3.5 text-right font-mono text-[9px] font-normal tracking-[0.16em] text-muted uppercase">
                Best
              </th>
              <th className="hidden px-3 py-3.5 text-right font-mono text-[9px] font-normal tracking-[0.16em] text-muted uppercase sm:table-cell">
                Current
              </th>
              <th className="hidden px-5 py-3.5 text-right font-mono text-[9px] font-normal tracking-[0.16em] text-muted uppercase sm:table-cell">
                Marked
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const podium = row.rank <= 3;
              return (
                <tr
                  key={row.handle}
                  className="group border-b border-line/70 transition-colors last:border-0 hover:bg-bone/[0.035]"
                >
                  <td className="px-5 py-4">
                    <span
                      className={`font-mono text-[11px] ${
                        podium ? "text-ember" : "text-muted"
                      }`}
                    >
                      {String(row.rank).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/share/${row.handle}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-bone transition-colors group-hover:text-ember-soft"
                    >
                      <span className="text-muted">@</span>
                      {row.handle}
                    </Link>
                    {podium && !compact ? (
                      <span className="ml-2 hidden font-mono text-[9px] tracking-[0.1em] text-muted uppercase md:inline">
                        {ordinal(row.rank)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <span className="display text-2xl text-bone">{row.best_streak}</span>
                  </td>
                  <td className="hidden px-3 py-4 text-right sm:table-cell">
                    <span className="font-mono text-[12px] text-bone-dim">{row.current_streak}</span>
                  </td>
                  <td className="hidden px-5 py-4 text-right sm:table-cell">
                    <span className="font-mono text-[12px] text-bone-dim">{row.days_marked}</span>
                    <span className="text-muted"> / 30</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
