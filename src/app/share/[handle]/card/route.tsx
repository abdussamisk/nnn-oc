import { getPublicProfile } from "@/lib/board";
import { renderShareCard } from "@/lib/share-card";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  const { handle } = await context.params;
  const profile = await getPublicProfile(decodeURIComponent(handle));

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const image = renderShareCard(profile);
  const safeHandle = profile.handle.replace(/[^A-Za-z0-9_]/g, "");

  return new Response(image.body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="nnn-${safeHandle}.png"`,
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
