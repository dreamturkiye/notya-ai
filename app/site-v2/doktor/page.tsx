import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { siteV2Yol } from '@/lib/site-v2/sandbox'

export default function SiteV2Landing() {
  return (
    <Cerceve>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 40, alignItems: 'end', minHeight: '62vh' }} className="notya-grid-yigin">
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5A6B62', marginBottom: 14 }}>Klinik asistan</div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 6vw, 64px)', lineHeight: 1.05, fontWeight: 500, margin: 0 }}>
            Muayene bittiğinde not da bitmiş olsun.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: '#3D5348', maxWidth: 480, margin: '22px 0 28px' }}>
            Ses, dosya, reçete, veli ve portal — tek hasta ceketi. Taslak hekim onayına kadar hastaya gitmez.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={siteV2Yol('/kayit')} style={btn}>15 gün deneyin</Link>
            <Link href={siteV2Yol('/giris')} style={ghost}>Giriş</Link>
          </div>
        </div>
        <aside style={{ background: '#1B4332', color: '#F4EFE6', padding: 28, minHeight: 280 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>Ayşe</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 1.4, margin: '16px 0 0' }}>
            “Gökhan Hocam, Elif’in dünkü ateşi düşmüş. Aşı rapeli onayınızı bekliyor.”
          </p>
        </aside>
      </section>
    </Cerceve>
  )
}

const btn: CSSProperties = { background: '#1B4332', color: '#F4EFE6', textDecoration: 'none', padding: '12px 18px', fontWeight: 700, fontSize: 14 }
const ghost: CSSProperties = { ...btn, background: 'transparent', color: '#1B4332', border: '1px solid #1B4332' }
