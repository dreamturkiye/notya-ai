import { Cerceve } from '@/components/site-v2/Cerceve'
import { PORTAL_VELI } from '@/lib/site-v2/demoVeri'

export default function SiteV2Sagligim() {
  return (
    <Cerceve baslik="Sağlığım">
      <p style={{ color: '#5A6B62' }}>{PORTAL_VELI.veli} · {PORTAL_VELI.hasta} · {PORTAL_VELI.hekim}</p>
      <section style={{ background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 16, marginTop: 16 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>Büyüme</h2>
        <p>{PORTAL_VELI.buyume.kilo} · {PORTAL_VELI.buyume.boy}</p>
      </section>
      <section style={{ background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 16, marginTop: 12 }}>
        <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>Aşılar</h2>
        <p>{PORTAL_VELI.asilar.map((a) => a.ad).join(' · ')}</p>
      </section>
      <p style={{ fontSize: 13, color: '#5A6B62', marginTop: 16 }}>{PORTAL_VELI.dipnot}</p>
      <p style={{ fontSize: 12, color: '#8A7F72' }}>Ham AI / tanı % / model adı yok. Görüntü taslağı yok.</p>
    </Cerceve>
  )
}
