export function Stat({
  label,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`display text-4xl sm:text-5xl ${accent ? "text-ember" : "text-bone"}`}
        >
          {value}
        </span>
        {suffix ? (
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
