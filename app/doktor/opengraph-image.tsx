/**
 * NOTYA-DOKTOR-SEO-01 — static social preview for /doktor: krem/çam zemin, "notya" word mark, Türkçe
 * tanım satırı. 1200x630, the standard Open Graph / Twitter card size. Same palette as the intake
 * flow's doctor-branded OG card (lib/intake/doktorOg.ts) so every Notya preview reads as one family.
 */
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Notya — Hekimler için yapay zekâ klinik asistanı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const R = { cream: "#f4eee3", paper: "#faf6ee", ink: "#3b2e24", muted: "#8b7d70", pine: "#2f4334", gold: "#d4c196" };

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(165deg, ${R.paper} 0%, ${R.cream} 55%, #ebe3d4 100%)`,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: R.gold, opacity: 0.85 }} />
        <div style={{ display: "flex", fontSize: 140, fontWeight: 700, color: R.pine, letterSpacing: "-0.04em", fontStyle: "italic" }}>
          notya
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 36,
            fontWeight: 500,
            color: R.ink,
            textAlign: "center",
            maxWidth: 920,
            padding: "0 40px",
            lineHeight: 1.3,
          }}
        >
          Hekimler için yapay zekâ klinik asistanı
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            color: R.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          30 branş · Hasta portalı · Her karar hekim onayıyla
        </div>
      </div>
    ),
    { ...size },
  );
}
