'use client'
import type { CSSProperties } from 'react'
import { kuralBagla, kuralDosyaSatirlari, kuralVitrin, kuralYasaklari, ULUSAL_TAKVIM_YOK } from '@/lib/klinik/kuralBag'

const kutu: CSSProperties = {
  background: '#faf6ee',
  border: '1px solid rgba(58,44,34,0.08)',
  borderRadius: 14,
  padding: 14,
  display: 'grid',
  gap: 8,
}

export function KuralDefteri({ slug }: { slug: string }) {
  const bag = kuralBagla(slug)
  const kanun = kuralVitrin(slug, 4)
  if (!bag || !kanun.length) return null
  const oneri = bag.filter((k) => !k.dogrulandi).length
  const yasak = kuralYasaklari(slug)
  return (
    <section data-kural={slug} style={kutu}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#2f4334' }}>KAYNAK BAĞI</div>
      <p style={{ margin: 0, fontSize: 13, color: '#3b2e24' }}>{ULUSAL_TAKVIM_YOK}</p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#3b2e24' }}>
        {kanun.map((k) => (
          <li key={k.id}>
            <b>kaynak bağlı</b> · {k.metin}
          </li>
        ))}
      </ul>
      <p style={{ margin: 0, fontSize: 12, color: '#8b7d70' }}>{oneri} satır öneri — hekim kilitler.</p>
      {yasak.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#6b5420' }}>
          {yasak.map((y) => <li key={y}>{y}</li>)}
        </ul>
      )}
    </section>
  )
}

export function KuralDosya({ slug }: { slug: string }) {
  const satirlar = kuralDosyaSatirlari(slug)
  if (!satirlar.length) return null
  return (
    <section data-kural-dosya={slug} style={{ ...kutu, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#2f4334' }}>KAYIT OMURGASI</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#3b2e24' }}>
        {satirlar.map((k) => (
          <li key={k.id}>
            <b>kaynak bağlı</b> · {k.metin}
          </li>
        ))}
      </ul>
      <p style={{ margin: 0, fontSize: 12, color: '#8b7d70' }}>{ULUSAL_TAKVIM_YOK} E-imza ve SBİYS iddia edilmez. İki nüsha dosyaya yazılır: dosya ve hasta.{slug === 'sac-ekimi' ? ' Donör ve alıcı görüntüsü bu dosyaya yazılır.' : ''}</p>
    </section>
  )
}
