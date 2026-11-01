import "server-only";

import { ImageResponse } from "next/og";

import { DAYS } from "@/lib/challenge";
import type { PublicProfile } from "@/lib/types";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 13, letterSpacing: 2, color: "#877d70", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 34, color: "#f3ede2", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function renderShareCard(profile: PublicProfile) {
  const marked = new Set(profile.marked_days);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b0a09",
          backgroundImage:
            "linear-gradient(135deg, rgba(255,77,31,0.20) 0%, rgba(11,10,9,0) 52%)",
          color: "#f3ede2",
          padding: "52px 64px 42px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 4, backgroundColor: "#ff4d1f" }} />
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 8, fontWeight: 700 }}>
              NNN
            </div>
            <div style={{ display: "flex", fontSize: 12, letterSpacing: 3, color: "#877d70" }}>
              NOV 2026
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 12, letterSpacing: 3, color: "#877d70" }}>
            PUBLIC RECORD
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ display: "flex", fontSize: 22, color: "#bcb2a4" }}>The November run of</div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: profile.handle.length > 13 ? 72 : 94,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 1,
              }}
            >
              @{profile.handle}
            </div>
            <div style={{ display: "flex", gap: 44, marginTop: 32 }}>
              <Stat label="Best" value={`${profile.best_streak}d`} />
              <Stat label="Current" value={`${profile.current_streak}d`} />
              <Stat label="Marked" value={`${profile.days_marked}/30`} />
              <Stat label="Rank" value={profile.rank ? `#${profile.rank}` : "—"} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              minWidth: 220,
            }}
          >
            <div style={{ display: "flex", fontSize: 13, letterSpacing: 3, color: "#877d70" }}>
              BEST STREAK
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 190,
                lineHeight: 1,
                color: "#ff4d1f",
                fontWeight: 700,
                letterSpacing: -10,
              }}
            >
              {profile.best_streak}
            </div>
            <div style={{ display: "flex", fontSize: 16, color: "#bcb2a4" }}>days in a row</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {DAYS.map((day) => {
            const isMarked = marked.has(day);
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  fontSize: 10,
                  backgroundColor: isMarked ? "#ff4d1f" : "rgba(243,237,226,0.055)",
                  color: isMarked ? "#1a0803" : "#877d70",
                  border: isMarked ? "1px solid #ff4d1f" : "1px solid rgba(243,237,226,0.10)",
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    ),
    SHARE_CARD_SIZE,
  );
}
