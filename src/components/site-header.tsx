import Link from "next/link";

import { Logo } from "@/components/logo";
import { PhaseBadge } from "@/components/phase-badge";
import { getAuthUser } from "@/lib/auth";
import { phaseForUtcDate } from "@/lib/challenge";

export async function SiteHeader() {
  const user = await getAuthUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Logo />
          <span className="hidden h-4 w-px bg-line sm:block" />
          <div className="hidden sm:block">
            <PhaseBadge phase={phaseForUtcDate()} />
          </div>
        </div>

        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/leaderboard"
            className="hidden px-2 py-2 text-[13px] font-semibold text-bone-dim transition-colors hover:text-bone sm:block"
          >
            The board
          </Link>
          <Link
            href="/#rules"
            className="hidden px-2 py-2 text-[13px] font-semibold text-bone-dim transition-colors hover:text-bone sm:block"
          >
            The rules
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="btn btn-primary !min-h-9 !px-4 !text-[12px]">
            {user ? "Your November" : "Enter the challenge"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
