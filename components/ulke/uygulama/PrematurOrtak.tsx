'use client'

/**
 * PREMATUR-ULKE-01 — the small pieces the two prematurity screens share: a card, a badge, a figure, a folding section, the
 * list of sources with how each was read. The look is the tool shell's (AracKabugu: white 16px cards, the accent, the same
 * labels) and the colours are Türkiye's own badge colours. NO WORD IS WRITTEN HERE: every string is a prop.
 */
import React, { useState, type ReactNode } from 'react'
import { CHROME_RENK } from '@/lib/doktor/chromeRenk'
import { bicimli } from '@/lib/ulke/araclar/paket'
import type { Kaynak } from '@/lib/ulke/prematur/tipler'
import type { PrematurMetni } from '@/lib/ulke/prematur/metin'

export type Ton = 'iyi' | 'uyari' | 'kirmizi' | 'notr' | 'bilgi'
const TON: Record<Ton, { arka: string; yazi: string }> = {
  iyi: { arka: '#E4F3EA', yazi: '#1F6B3E' },
  uyari: { arka: '#FBF0DC', yazi: '#8A5A12' },
  kirmizi: { arka: '#FBE4DE', yazi: '#9C3420' },
  notr: { arka: '#F1ECE4', yazi: CHROME_RENK.muted },
  bilgi: { arka: '#E6EEF8', yazi: '#2A5A8C' },
}

export function Rozet({ ton, children }: { ton: Ton; children: ReactNode }) {
  const t = TON[ton]
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: t.arka, color: t.yazi, whiteSpace: 'nowrap' }}>{children}</span>
}

export function Istatistik({ deger, etiket, ton = 'notr' }: { deger: ReactNode; etiket: string; ton?: Ton }) {
  const t = TON[ton]
  return (
    <div style={{ background: ton === 'notr' ? '#FAF6EE' : t.arka, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: '8px 12px', minWidth: 92 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: ton === 'notr' ? CHROME_RENK.ink : t.yazi, lineHeight: 1.2 }}>{deger}</div>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 2 }}>{etiket}</div>
    </div>
  )
}

export function Katlanir({ baslik, acik = false, rozet, children }: { baslik: string; acik?: boolean; rozet?: string; children: ReactNode }) {
  const [a, setA] = useState(acik)
  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" aria-expanded={a} onClick={() => setA(!a)} style={{ all: 'unset', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: CHROME_RENK.pine, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span aria-hidden="true">{a ? '▾' : '▸'}</span><span>{baslik}</span>{rozet ? <span style={{ color: CHROME_RENK.muted, fontWeight: 500 }}>{rozet}</span> : null}
      </button>
      {a ? <div style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  )
}

/** The sources of an item with HOW EACH WAS READ: a source that was only cited, or only read in a summary, says so. */
export function KaynakListesi({ kaynaklar, o, dil }: { kaynaklar: readonly Kaynak[]; o: PrematurMetni['ortak']; dil: string }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {kaynaklar.map((k) => (
        <div key={k.kisa} className="uza-ipucu">
          <b>{k.kisa}</b> {'—'} {k.tam}
          <div><Rozet ton={k.durum === 'birincil-okundu' ? 'iyi' : k.durum === 'ikincil-ozet' ? 'uyari' : 'notr'}>{k.durum === 'birincil-okundu' ? o.kaynakDurumu.birincil : k.durum === 'ikincil-ozet' ? o.kaynakDurumu.ikincil : o.kaynakDurumu.dogrulanmadi}</Rozet>{k.not ? ` ${bicimli(k.not, dil)}` : ''}</div>
        </div>
      ))}
    </div>
  )
}

/** A yes / no / not-known choice, in the words of the pack. */
export function UcDurum({ etiket, deger, degistir, o, ad }: { etiket: string; deger: boolean | null | undefined; degistir: (d: boolean | null) => void; o: PrematurMetni['ortak']; ad: string }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span className="uza-etiket">{etiket}</span>
      <select className="uza-girdi" data-alan={ad} value={deger === true ? 'evet' : deger === false ? 'hayir' : ''} onChange={(e) => degistir(e.target.value === 'evet' ? true : e.target.value === 'hayir' ? false : null)}>
        <option value="">{o.bilinmiyor}</option><option value="evet">{o.evet}</option><option value="hayir">{o.hayir}</option>
      </select>
    </label>
  )
}
