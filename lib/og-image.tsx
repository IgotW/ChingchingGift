import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT =
  "ChingChingGift — free Secret Santa generator and private wishlists";

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0d3527",
          color: "#f7f1e3",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "#1b4a38",
            right: -140,
            top: -180,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 9999,
            background: "#cc3a2e",
            right: 90,
            bottom: -190,
            opacity: 0.45,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: 9999,
            background: "#e8b95c",
            right: 330,
            top: 110,
            opacity: 0.18,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#e8b95c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0d3527",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 6,
                color: "#e8b95c",
              }}
            >
              CHINGCHINGGIFT
            </div>
            <div style={{ fontSize: 18, color: "#c8d8cf" }}>
              Secret Santa, sorted
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            Swap gifts.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: -2,
              color: "#e8b95c",
            }}
          >
            Keep the secret.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.35,
              color: "#dbe7df",
              maxWidth: 720,
            }}
          >
            Draw names fairly, protect every assignment, and share wishlists
            privately. Free, online, no spreadsheet.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            fontSize: 20,
            color: "#c8d8cf",
          }}
        >
          <div style={{ display: "flex" }}>Fair one-to-one draw</div>
          <div style={{ display: "flex", color: "#e8b95c" }}>•</div>
          <div style={{ display: "flex" }}>Private wishlists</div>
          <div style={{ display: "flex", color: "#e8b95c" }}>•</div>
          <div style={{ display: "flex" }}>Organizer calm</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
