import Link from 'next/link'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { HASTALAR } from '@/lib/site-v2/demoVeri'
import { siteV2Yol } from '@/lib/site-v2/sandbox'

export default function SiteV2Hastalar() {
  return (
    <Cerceve baslik="Hastalar">
      <div style={{ display: 'grid', gap: 8 }}>
        {HASTALAR.map((h) => (
          <Link key={h.id} href={siteV2Yol(`/hastalar/${h.id}`)} style={{
            display: 'block', background: '#FBF7F0', border: '1px solid #D8D0C4', padding: '14px 16px',
            textDecoration: 'none', color: 'inherit',
          }}>
            <div style={{ fontWeight: 700 }}>{h.ad}</div>
            <div style={{ fontSize: 13, color: '#5A6B62', marginTop: 4 }}>
              {h.yasMetin} · {h.brans === 'pediatri' ? 'Pediatri' : 'KD'} · {h.neden}
              {h.veli ? ` · ${h.veli}` : ''}
            </div>
          </Link>
        ))}
      </div>
    </Cerceve>
  )
}
