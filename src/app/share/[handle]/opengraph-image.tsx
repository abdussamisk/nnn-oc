import { ImageResponse } from "next/og";

import { getPublicProfile } from "@/lib/board";
import { renderShareCard, SHARE_CARD_SIZE } from "@/lib/share-card";

export const alt = "A public NNN November record";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getPublicProfile(decodeURIComponent(handle));

  if (!profile) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b0a09",
            color: "#f3ede2",
            fontSize: 54,
            fontFamily: "sans-serif",
          }}
        >
          NNN · Profile not found
        </div>
      ),
      SHARE_CARD_SIZE,
    );
  }

  return renderShareCard(profile);
}
