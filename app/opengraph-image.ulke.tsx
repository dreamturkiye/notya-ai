/**
 * AU-SEO-01 — static social preview for a country build's root landing page. Same palette as the
 * Türkiye /doktor OG card (lib/seo/doktor.ts on main) so every Notya preview reads as one family.
 * One file, shared across all six country builds: the tagline comes from the active pack's own SEO
 * copy (lib/ulke/seo/metinler.ts) at request time, country-adapted automatically. Inherited by every
 * nested route (for-clinics, legal pages, …) that does not define its own.
 */
import { ImageResponse } from 'next/og'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { seoMetni } from '@/lib/ulke/seo/metinler'

export const runtime = 'nodejs'
export const alt = 'Notya'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const R = { cream: '#f4eee3', paper: '#faf6ee', ink: '#3b2e24', pine: '#2f4334', gold: '#d4c196' }

export default async function Image() {
  const p = ulkePaketi()
  const t = seoMetni(p.kod as string, 'home')
  const tagline = t?.aciklama ?? p.kabuk.aciklama

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(165deg, ${R.paper} 0%, ${R.cream} 55%, #ebe3d4 100%)`,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: R.gold, opacity: 0.85 }} />
        <div style={{ display: 'flex', fontSize: 140, fontWeight: 700, color: R.pine, letterSpacing: '-0.04em', fontStyle: 'italic' }}>
          notya
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 30,
            fontWeight: 500,
            color: R.ink,
            textAlign: 'center',
            maxWidth: 980,
            padding: '0 48px',
            lineHeight: 1.35,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  )
}
