import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="shell flex min-h-[62vh] flex-col items-center justify-center py-20 text-center">
        <div className="eyebrow">404 · No such day</div>
        <h1 className="display mt-5 text-[clamp(4.5rem,12vw,9rem)] text-bone">
          Off the <span className="text-ember">calendar.</span>
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-bone-dim">
          This page doesn&apos;t exist. November only has thirty days, and every one of them is
          accounted for.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Back to November
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost">
            See the board
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
