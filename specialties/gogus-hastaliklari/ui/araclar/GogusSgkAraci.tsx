'use client'
/** GOGUS-EXCEPTIONAL-01 — SGK solunum raporu taslağı. T.C. / doz yok. */
import React, { useMemo, useState } from 'react'
import {
  GogusHastaSecici, gogusStil, Alan, Secim, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta, Rozet,
} from './GogusAracKabugu'
import { gogusRaporTaslagi, GOGUS_RAPOR_SABLONLARI, type GogusRaporSablon } from '../../engines/sgkRapor'

const S = gogusStil

export default function GogusSgkAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [sablon, setSablon] = useState<GogusRaporSablon>('uzun_oksijen')
  const [icd, setIcd] = useState('')
  const [icdAd, setIcdAd] = useState('')
  const [not, setNot] = useState('')
  const [isaret, setIsaret] = useState<Array<boolean | null>>([])

  const sonuc = useMemo(() => gogusRaporTaslagi({
    sablon,
    hastaAdi: '',
    tani: icd.trim() ? { icd10: icd.trim(), aciklama: icdAd.trim() } : null,
    hekimDegerlendirmesi: not,
    kontrolIsaretleri: isaret,
    bugun: new Date().toISOString().slice(0, 10),
  }), [sablon, icd, icdAd, not, isaret])

  const metin = [
    sonuc.draft.sablonAd,
    sonuc.draft.tani ? `Tanı (hekim): ${sonuc.draft.tani.icd10} — ${sonuc.draft.tani.aciklama}` : 'Tanı: hekim seçecek',
    `Süre taslağı: ${sonuc.draft.sureAy} ay`,
    '',
    'Hekim değerlendirmesi:',
    sonuc.draft.hekimDegerlendirmesi || '—',
    '',
    'SUT kontrol listesi:',
    ...sonuc.kontrolListesi.map((k, i) => `${isaret[i] === true ? '[x]' : '[ ]'} ${k.madde}`),
    '',
    sonuc.eksikler.length ? `Eksikler: ${sonuc.eksikler.join('; ')}` : 'Zorunlu alanlar dolu (hekim imzası ayrı).',
    'Medula e-imza bu üründe yoktur. T.C. kimlik yazılmaz.',
  ].join('\n')

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)"><GogusHastaSecici secili={hasta} sec={(id) => setHasta(id)} /></Alan>
        <Secim etiket="Şablon" deger={sablon} set={(x) => { setSablon(x as GogusRaporSablon); setIsaret([]) }}
          secenekler={GOGUS_RAPOR_SABLONLARI.map((s) => [s.id, s.ad] as [string, string])} />
        <Alan etiket="ICD-10 (hekim seçer)">
          <input value={icd} onChange={(e) => setIcd(e.target.value)} style={S.input} placeholder="Örn. J44.9" />
        </Alan>
        <Alan etiket="Tanı açıklaması">
          <input value={icdAd} onChange={(e) => setIcdAd(e.target.value)} style={S.input} />
        </Alan>
        <Alan etiket="Hekim değerlendirmesi">
          <textarea value={not} onChange={(e) => setNot(e.target.value)} style={{ ...S.input, minHeight: 80 }} />
        </Alan>
        <Rozet ton="uyari">T.C. kimlik, cihaz markası ve doz bu taslağa yazılmaz.</Rozet>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>SUT kontrol listesi</div>
        {sonuc.kontrolListesi.map((k, i) => (
          <label key={k.madde} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#EDF1F7', marginTop: 4 }}>
            <input type="checkbox" checked={isaret[i] === true} onChange={() => {
              const next = [...isaret]
              while (next.length < sonuc.kontrolListesi.length) next.push(null)
              next[i] = next[i] === true ? null : true
              setIsaret(next)
            }} /> {k.madde}
          </label>
        ))}
        <div style={{ ...S.metin, whiteSpace: 'pre-wrap', marginTop: 8 }}>{metin}</div>
        <TaslakNotu>Rapor taslağıdır; Medula e-imza ve T.C. kimlik bu üründe yoktur.</TaslakNotu>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={metin} />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="SGK solunum raporu" satirlar={metin.split('\n')} alan="content_degerlendirme" />
      </div>
    </>
  )
}
