'use client'
/** GOGUS-EXCEPTIONAL-01 — İnhaler teknik & izlem. mcg/puff yok. */
import React, { useMemo, useState } from 'react'
import {
  GogusHastaSecici, gogusStil, Alan, Secim, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './GogusAracKabugu'
import {
  inhalerIzlem, inhalerCihazGecerliMi, INHALER_CIHAZLARI, INHALER_CIHAZ_AD, INHALER_TEKNIK_ORTAK, INHALER_TEKNIK_CIHAZ,
  type InhalerCihaz,
} from '../../engines/inhaler'

const S = gogusStil

export default function GogusInhalerAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [cihaz, setCihaz] = useState<InhalerCihaz>('odi')
  const [sinif, setSinif] = useState('')
  const [tamam, setTamam] = useState<string[]>([])

  const liste = useMemo(() => [...INHALER_TEKNIK_ORTAK, ...INHALER_TEKNIK_CIHAZ[cihaz]], [cihaz])
  const sonuc = useMemo(() => inhalerIzlem({
    cihaz, tamamlanan: tamam, sinifMetni: sinif,
    bugun: new Date().toISOString().slice(0, 10),
  }), [cihaz, tamam, sinif])

  const cevir = (m: string) => setTamam((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)"><GogusHastaSecici secili={hasta} sec={(id) => setHasta(id)} /></Alan>
        <Secim etiket="Cihaz" deger={cihaz} set={(x) => { if (inhalerCihazGecerliMi(x)) { setCihaz(x); setTamam([]) } }}
          secenekler={INHALER_CIHAZLARI.map((k) => [k, INHALER_CIHAZ_AD[k]] as [string, string])} />
        <Alan etiket="İdame sınıfı (doz yok)">
          <input value={sinif} onChange={(e) => setSinif(e.target.value)} style={S.input} placeholder="Örn. LAMA+LABA" />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Teknik kontrol listesi</div>
        {liste.map((m) => (
          <label key={m} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#EDF1F7', marginTop: 4 }}>
            <input type="checkbox" checked={tamam.includes(m)} onChange={() => cevir(m)} /> {m}
          </label>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={`${sonuc.tamamSayi}/${sonuc.toplam}`} etiket="Tamamlanan" />
          <Istatistik deger={sonuc.sonrakiKontrolIso} etiket="Tekrar kontrol taslağı" />
        </div>
        <div style={{ ...S.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <TaslakNotu>İnhaler teknik kontrolü taslağıdır; miktar şeması hekim reçetesindedir.</TaslakNotu>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="İnhaler teknik" satirlar={[sonuc.ozet]} alan="content_objektif" />
      </div>
    </>
  )
}
