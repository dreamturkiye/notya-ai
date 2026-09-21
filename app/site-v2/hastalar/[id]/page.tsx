import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Cerceve } from '@/components/site-v2/Cerceve'
import { ASILAR, BUYUME, GORUNTULER, ILACLAR, hastaBul } from '@/lib/site-v2/demoVeri'

export default function SiteV2HastaDosya({ params }: { params: { id: string } }) {
  const h = hastaBul(params.id)
  if (!h) notFound()
  const buyume = h.id === 'elif' || h.id === 'can' ? BUYUME[h.id] : null
  const asilar = h.id === 'elif' || h.id === 'can' ? ASILAR[h.id] : []
  const film = GORUNTULER[h.id as keyof typeof GORUNTULER] || []

  return (
    <Cerceve baslik={h.ad}>
      <p style={{ color: '#5A6B62', marginTop: 0 }}>
        {h.yasMetin} · {h.brans === 'pediatri' ? 'Pediatri' : 'Kadın Hastalıkları ve Doğum'}
        {h.veli ? ` · Veli: ${h.veli}` : ' · yetişkin — veli yok'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0 22px' }}>
        {h.sekmeler.map((s) => (
          <span key={s} style={{ fontSize: 12, padding: '6px 10px', border: '1px solid #D8D0C4', background: '#FBF7F0' }}>{s}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        <Kart baslik="Özet">Son geliş {h.sonGelis} · {h.neden}</Kart>
        {buyume && (
          <Kart baslik="Büyüme Eğrileri">{buyume.kilo} · {buyume.boy} · Baş çevresi {buyume.bas} (yalnız çocuk). {buyume.not}</Kart>
        )}
        <Kart baslik="İlaçlar">{(ILACLAR[h.id] || ['Kayıt yok']).join(' · ')}</Kart>
        {asilar.length > 0 && (
          <Kart baslik="Aşılar">{asilar.map((a) => `${a.ad} (${a.tarih})`).join(' · ')}</Kart>
        )}
        <Kart baslik="Görüntüler">
          {film.length ? film.map((f) => `${f.chip} · ${f.durum}`).join(' · ') : 'Henüz film yok.'}
          <div style={{ fontSize: 12, color: '#5A6B62', marginTop: 8 }}>Taslak. Tanı değildir. Hekim onaylamadan hastaya gitmez.</div>
        </Kart>
        {h.sekmeler.includes('M-CHAT-R/F') && <Kart baslik="M-CHAT-R/F">20 soru · Testi Değerlendir — sahne, skor sentetik değil boş.</Kart>}
      </div>
    </Cerceve>
  )
}

function Kart({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section style={{ background: '#FBF7F0', border: '1px solid #D8D0C4', padding: 16 }}>
      <h2 style={{ fontSize: 14, margin: '0 0 8px' }}>{baslik}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{children}</div>
    </section>
  )
}
