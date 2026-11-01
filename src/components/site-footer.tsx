import Link from "next/link";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-10">
      <div className="shell flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-6 text-bone-dim">
            Thirty days. One decision. A public record of whether you showed up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] font-semibold text-bone-dim">
          <Link href="/leaderboard" className="link-underline">
            Leaderboard
          </Link>
          <Link href="/#rules" className="link-underline">
            Rules
          </Link>
          <Link href="/login" className="link-underline">
            Sign in
          </Link>
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            Nov 1–30, 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
