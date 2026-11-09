'use client'
/**
 * TR-PARITE-01 — branşın kendi istem / yönlendirme listesi (lib/doktor/bransIstemleri.ts) için tek seçici. Tetkik İstek
 * sayfası (30 tıp branşı) ve Özel Branşlar istem sayfası (10 dal) aynı bileşeni kullanır: tek görünüm. Bir kalemi
 * işaretlemek hiçbir şey istemez/göndermez; hekim düzenler ve kâğıda yazdırır. Boş grup çizilmez (müttefik meslekte
 * laboratuvar ve görüntüleme grubu yoktur).
 */
import React from 'react'
import type { BransIstemListesi } from '@/lib/doktor/bransIstemleri'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

export type IstemGrubu = 'lab' | 'goruntuleme' | 'sevk'

const GRUP_ADI: Record<IstemGrubu, string> = { lab: 'Laboratuvar', goruntuleme: 'Görüntüleme ve testler', sevk: 'Yönlendirme ve konsültasyon' }

export function BransIstemSecici({ bransAdi, liste, secili, degistir, hepsiniEkle }: {
  bransAdi: string
  liste: BransIstemListesi
  /** kalem adı → seçili mi */
  secili: (grup: IstemGrubu, ad: string) => boolean
  degistir: (grup: IstemGrubu, ad: string) => void
  hepsiniEkle: (grup: IstemGrubu, adlar: readonly string[]) => void
}) {
  const gruplar = (['lab', 'goruntuleme', 'sevk'] as const).filter((g) => liste[g].length > 0)
  return (
    <div data-alan="brans-istem-listesi">
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 6 }}>{bransAdi} — sık istemleriniz</label>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: CHROME_RENK.muted }}>İşaretlediğiniz kalemler forma eklenir; hiçbir şey kendiliğinden istenmez veya gönderilmez.</p>
      {gruplar.map((g) => (
        <div key={g} data-istem-grubu={g} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.ink }}>{GRUP_ADI[g]}</span>
            <button type="button" onClick={() => hepsiniEkle(g, liste[g])} style={{ background: 'none', border: 'none', color: CHROME_RENK.pine, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Tümünü ekle</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {liste[g].map((ad) => {
              const acik = secili(g, ad)
              return (
                <button key={ad} type="button" aria-pressed={acik} onClick={() => degistir(g, ad)} data-istem={ad}
                  style={{ background: acik ? CHROME_RENK.pine : '#E4F3F1', border: `1px solid ${CHROME_RENK.pine}70`, color: acik ? '#FAF8F4' : CHROME_RENK.pine, borderRadius: 999, padding: '6px 12px', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                  {acik ? '✓ ' : '+ '}{ad}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
