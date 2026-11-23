'use client'
/**
 * ESNEK-MUAYENE-B1 — the doctor's ONE daily shadow-mode line ("Bugünkü 18 notun 15'ini sekreterinizle aynı içerikte yazdım"),
 * the rolling match, the offer ("Yarın sekreteriniz yazmasın, siz yalnızca onaylayın — deneyelim mi?"), and on request the
 * fact-level detail of recent comparisons. Country-neutral (words + API injected).
 */
import { useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import { EL_RENK as R } from '@/components/elNotu/renk'
import { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'

export type GolgeVeri = {
  acik: boolean; sekreterYazmasin: boolean; sekreterYazmasinGun: string | null; hedef: number
  gunluk: { toplam: number; ayni: number }; kayan: { oran: number | null; not: number; ayni: number }; teklif: boolean; bekleyen: number
  son?: { id: string; hasta: string; ayniIcerik: boolean; skor: number; sayim: { ayni: number; farkli: number; eksik: number; fazla: number } | null; gun: string }[]
}

export default function GolgeSatiri(p: { metin: EsnekMetinleri; getir: Getirici; api: string; veri: GolgeVeri; degisti?: (v: GolgeVeri) => void }) {
  const M = p.metin.golge
  const [v, setV] = useState<GolgeVeri>(p.veri)
  const [ayrinti, setAyrinti] = useState<GolgeVeri['son'] | null>(null)
  const [mesaj, setMesaj] = useState('')

  async function islem(islem: string) {
    const r = await p.getir(p.api, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem }) }).catch(() => null)
    if (!r?.ok) { setMesaj(p.metin.hata); return }
    const j = (await r.json()) as GolgeVeri
    setV(j); p.degisti?.(j)
    if (islem === 'teklif_evet') setMesaj(M.teklifKabul)
  }
  async function ayrintiAc() {
    if (ayrinti) { setAyrinti(null); return }
    const r = await p.getir(`${p.api}?ayrinti=1`).catch(() => null)
    const j = r?.ok ? ((await r.json()) as GolgeVeri) : null
    setAyrinti(j?.son || [])
  }

  if (v.sekreterYazmasin) return <div style={{ background: R.camAcik, color: R.cam, borderRadius: 12, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>{M.yarindan}</div>
  if (!v.acik) return null
  return (
    <div style={{ background: R.camAcik, color: R.cam, borderRadius: 12, padding: '10px 14px', display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0, fontVariantNumeric: 'tabular-nums' }}>{v.gunluk.toplam ? M.gunluk(v.gunluk.toplam, v.gunluk.ayni) : M.gunlukBos}</span>
        <button type="button" onClick={() => void ayrintiAc()} style={{ border: 'none', background: 'none', color: R.cam, textDecoration: 'underline', fontSize: 12, cursor: 'pointer' }}>{M.ayrinti}</button>
      </div>
      {v.kayan.oran !== null && <div style={{ fontSize: 12, color: R.soluk }}>{M.kayan(v.kayan.oran, v.kayan.not)}</div>}
      {v.teklif && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', background: '#fff', borderRadius: 10, padding: '10px 12px', border: `1px solid ${R.cizgi}` }}>
          <span style={{ fontSize: 14, color: R.murekkep, flex: 1, minWidth: 200 }}>{M.teklif}</span>
          <button type="button" style={dugme('birincil')} onClick={() => void islem('teklif_evet')}>{M.teklifEvet}</button>
          <button type="button" style={dugme('ikincil')} onClick={() => void islem('teklif_hayir')}>{M.teklifHayir}</button>
        </div>
      )}
      {mesaj && <div role="status" style={{ fontSize: 13, color: R.cam }}>{mesaj}</div>}
      {ayrinti && (
        <div style={{ display: 'grid', gap: 4, background: '#fff', borderRadius: 10, padding: 10, border: `1px solid ${R.cizgi}` }}>
          {ayrinti.map((k) => (
            <div key={k.id} style={{ display: 'flex', gap: 8, fontSize: 12, color: R.murekkep, alignItems: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: k.ayniIcerik ? R.cam : R.amber, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.hasta}</span>
              {k.sayim && <span style={{ color: R.soluk, fontVariantNumeric: 'tabular-nums' }}>{M.durum.ayni} {k.sayim.ayni} · {M.durum.farkli} {k.sayim.farkli} · {M.durum.eksik} {k.sayim.eksik} · {M.durum.fazla} {k.sayim.fazla}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
