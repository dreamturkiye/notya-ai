import Link from 'next/link'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { AYSE_GUN, HASTALAR, RANDEVULAR } from '@/lib/site-v2/demoVeri'
import { siteV2Yol } from '@/lib/site-v2/sandbox'

export default function SiteV2Uygulama() {
  return (
    <Cerceve baslik="Bugün">
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, maxWidth: 640 }}>{AYSE_GUN}</p>
      <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
        {RANDEVULAR.map((r) => {
          const h = HASTALAR.find((x) => x.id === r.hastaId)
          return (
            <Link key={r.saat + r.hastaId} href={siteV2Yol(`/hastalar/${r.hastaId}`)} style={{
              display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 12, alignItems: 'center',
              background: '#FBF7F0', border: '1px solid #D8D0C4', padding: '12px 14px', textDecoration: 'none', color: 'inherit',
            }}>
              <span style={{ fontWeight: 700 }}>{r.saat}</span>
              <span>{h?.ad} · {r.tur}</span>
              <span style={{ fontSize: 12, color: '#5A6B62' }}>{h?.yasMetin}</span>
            </Link>
          )
        })}
      </div>
    </Cerceve>
  )
}
