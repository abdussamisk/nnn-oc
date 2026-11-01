import type { Phase } from "@/lib/types";

const COPY: Record<Phase, { label: string; className: string; dot: string }> = {
  pre: {
    label: "Opens Nov 1",
    className: "border-line-strong text-bone-dim",
    dot: "bg-bone-dim",
  },
  open: {
    label: "Live · Nov 1–30",
    className: "border-live/30 text-live",
    dot: "bg-live",
  },
  closed: {
    label: "Board frozen",
    className: "border-line-strong text-bone-dim",
    dot: "bg-muted",
  },
};

export function PhaseBadge({ phase, className = "" }: { phase: Phase; className?: string }) {
  const copy = COPY[phase];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase ${copy.className} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${copy.dot} ${
          phase === "open" ? "animate-[live-pulse_2.4s_ease-in-out_infinite]" : ""
        }`}
      />
      {copy.label}
    </span>
  );
}
