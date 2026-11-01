import Link from "next/link";

const CELLS = [1, 1, 0, 0, 1, 1, 1, 0, 1];

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3" aria-label="NNN home">
      <span className="grid h-7 w-7 grid-cols-3 gap-[2px]" aria-hidden="true">
        {CELLS.map((filled, index) => (
          <span
            key={index}
            className={`rounded-[1px] transition-colors ${
              filled ? "bg-ember group-hover:bg-ember-soft" : "bg-bone/15"
            }`}
          />
        ))}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-[15px] font-medium tracking-[0.24em] text-bone">NNN</span>
        <span className="hidden font-mono text-[9px] tracking-[0.2em] text-muted sm:inline">
          NOV 26
        </span>
      </span>
    </Link>
  );
}
