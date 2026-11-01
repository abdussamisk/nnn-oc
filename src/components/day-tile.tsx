import type { DayState } from "@/lib/types";

const STATE_STYLES: Record<DayState, string> = {
  marked: "border-ember bg-ember text-[#1a0803]",
  today: "border-ember/70 bg-ember/[0.08] text-bone",
  missed: "border-line bg-ink-3/45 text-muted",
  future: "border-line/70 bg-transparent text-muted/60",
  excused: "border-dashed border-line/60 bg-transparent text-muted/45",
};

const STATE_LABEL: Record<DayState, string> = {
  marked: "marked",
  today: "today",
  missed: "missed",
  future: "upcoming",
  excused: "excused — before you joined",
};

export function DayTile({
  day,
  state,
  onClick,
  size = "default",
}: {
  day: number;
  state: DayState;
  onClick?: () => void;
  size?: "default" | "small";
}) {
  const isButton = Boolean(onClick);
  const className = [
    "relative flex aspect-square flex-col items-center justify-center rounded-lg border transition-all duration-150",
    size === "small" ? "text-[10px]" : "text-[11px]",
    STATE_STYLES[state],
    state === "today" ? "animate-[ember-pulse_2.4s_ease-in-out_infinite]" : "",
    isButton ? "cursor-pointer hover:-translate-y-0.5 hover:border-bone/60" : "",
  ].join(" ");

  const content = (
    <>
      <span className="font-mono leading-none font-medium">{String(day).padStart(2, "0")}</span>
      {state === "marked" ? (
        <span className="mt-1 h-1 w-1 rounded-full bg-[#1a0803]/70" aria-hidden="true" />
      ) : null}
      {state === "today" ? (
        <span className="mt-1 font-mono text-[7px] tracking-[0.12em] uppercase">today</span>
      ) : null}
      {state === "missed" ? (
        <span className="absolute top-1 right-1.5 font-mono text-[8px] text-muted/70" aria-hidden="true">
          ×
        </span>
      ) : null}
      {state === "excused" ? (
        <span className="mt-0.5 font-mono text-[7px] tracking-[0.08em] uppercase" aria-hidden="true">
          —
        </span>
      ) : null}
    </>
  );

  if (isButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label={`Day ${day}, ${STATE_LABEL[state]}. View clip.`}
        title={`Day ${day} — ${STATE_LABEL[state]}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={className}
      aria-label={`Day ${day}, ${STATE_LABEL[state]}`}
      title={`Day ${day} — ${STATE_LABEL[state]}`}
    >
      {content}
    </div>
  );
}
