'use client'
/**
 * NEFROLOJI-DEEPEN-01 — Araçlar › SGK nefro rapor. T.C. ve ESA dozu taslağa girmez.
 */
import React, { useMemo, useState } from 'react'
import {
  NefHastaSecici, nefStil, Alan, Etiketli, Secim, Istatistik, TaslakNotu, KopyalaButonu,
  useUrlHasta,
} from './NefAracKabugu'
import { nefRaporTaslagi, NEF_RAPOR_SABLONLARI, type NefRaporSablon } from '../../engines/sgkRapor'

const S = nefStil
const bugun = () => new Date().toISOString().slice(0, 10)

export default function NefSgkAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [sablon, setSablon] = useState<NefRaporSablon>('kbh_izlem')
  const [icd, setIcd] = useState('')
  const [icdAd, setIcdAd] = useState('')
  const [not, setNot] = useState('')
  const [isaretli, setIsaretli] = useState<Record<number, boolean>>({})

  const sonuc = useMemo(() => nefRaporTaslagi({
    sablon, hastaAdi: '', bugun: bugun(),
    tani: icd ? { icd10: icd, aciklama: icdAd || icd } : null,
    hekimDegerlendirmesi: not,
    isaretli,
  }), [sablon, icd, icdAd, not, isaretli])

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)"><NefHastaSecici secili={hasta} sec={(id) => setHasta(id)} /></Alan>
        <Secim
          etiket="Şablon"
          deger={sablon}
          set={(x) => { setSablon(x as NefRaporSablon); setIsaretli({}) }}
          secenekler={NEF_RAPOR_SABLONLARI.map((s) => [s.id, s.ad] as [string, string])}
        />
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Etiketli ad="ICD-10 (hekim)"><input value={icd} onChange={(e) => setIcd(e.target.value)} style={{ ...S.input, width: 100 }} /></Etiketli>
          <Etiketli ad="Tanı açıklaması"><input value={icdAd} onChange={(e) => setIcdAd(e.target.value)} style={{ ...S.input, width: 220 }} /></Etiketli>
        </div>
        <Alan etiket="Hekim değerlendirmesi">
          <textarea value={not} onChange={(e) => setNot(e.target.value)} rows={4} style={{ ...S.input, width: '100%' }} />
        </Alan>
        <div style={S.etiket}>SUT kontrol listesi</div>
        {sonuc.kontrolListesi.map((k, i) => (
          <label key={i} style={{ ...S.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={!!isaretli[i]} onChange={(e) => setIsaretli((p) => ({ ...p, [i]: e.target.checked }))} />
            {k.madde}
          </label>
        ))}
      </div>

      <div style={S.kutu}>
        <Istatistik deger={String(sonuc.eksikler.length)} etiket="Eksik madde" ton={sonuc.eksikler.length ? 'uyari' : 'iyi'} />
        <div style={{ ...S.kucuk, marginTop: 8 }}>T.C. kimlik numarası bu çıktıda yer almaz. ESA / ilaç dozu ve Medula e-imza hekimindir — canlı gönderim yok.</div>
        {sonuc.eksikler.slice(0, 5).map((e, i) => <div key={i} style={{ ...S.kucuk, color: '#7A5B1E' }}>{e}</div>)}
        <TaslakNotu>TASLAK — SUT kontrol listesi karar desteğidir; tanı hekimde, ESA dozu yazılmaz, Medula canlı yok.</TaslakNotu>
        <KopyalaButonu metin={[sonuc.draft.sablonAd, sonuc.draft.hekimDegerlendirmesi, ...(sonuc.draft.tani ? [`ICD: ${sonuc.draft.tani.icd10}`] : [])].join('\n')} />
      </div>
    </>
  )
}
