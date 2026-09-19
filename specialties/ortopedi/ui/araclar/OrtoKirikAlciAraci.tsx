'use client'
/**
 * ORTOPEDI-EXCEPTIONAL-01 — Araçlar › Kırık / alçı-ortez takip (ortopedi'ye özel).
 */
import React, { useMemo, useState } from 'react'
import {
  OrtoHastaSecici, ortoStil, Alan, Etiketli, Secim, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './OrtoAracKabugu'
import { ozetle, BOLGELER, TARAFLAR, NV_DURUMLARI, TIP_AD, type KirikAlciTip } from '../../engines/kirikAlci'
import { REF_ACIKLAMA } from '../../engines/ortopedi'

const S = ortoStil
const TIPLER = Object.keys(TIP_AD).filter((t) => t !== 'op_sonrasi') as KirikAlciTip[]

export default function OrtoKirikAlciAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [tip, setTip] = useState<KirikAlciTip>('alci')
  const [bolge, setBolge] = useState(BOLGELER[0])
  const [taraf, setTaraf] = useState(TARAFLAR[0])
  const [baslangic, setBaslangic] = useState('')
  const [alciAlma, setAlciAlma] = useState('')
  const [yukVerme, setYukVerme] = useState('')
  const [nvDurum, setNvDurum] = useState(NV_DURUMLARI[0])
  const [goruntuHazir, setGoruntuHazir] = useState(false)
  const [not, setNot] = useState('')

  const bugun = new Date().toISOString().slice(0, 10)
  const sonuc = useMemo(() => ozetle({
    tip, bolge, taraf,
    baslangic: baslangic || null,
    alciAlma: alciAlma || null,
    yukVerme: yukVerme || null,
    nvDurum, goruntuHazir, notHekim: not || null, bugun,
  }), [tip, bolge, taraf, baslangic, alciAlma, yukVerme, nvDurum, goruntuHazir, not, bugun])

  const satirlar = sonuc.ozet.split('\n')

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <OrtoHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>İzlem girdisi</div>
        <Etiketli ad="Tip">
          <Secim deger={tip} set={(v) => setTip(v as KirikAlciTip)} secenekler={TIPLER.map((t) => [t, TIP_AD[t]] as [string, string])} />
        </Etiketli>
        <Etiketli ad="Bölge">
          <Secim deger={bolge} set={(v) => setBolge(v as typeof bolge)} secenekler={BOLGELER.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <Etiketli ad="Taraf">
          <Secim deger={taraf} set={(v) => setTaraf(v as typeof taraf)} secenekler={TARAFLAR.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <Etiketli ad="Başlangıç / uygulama tarihi">
          <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="Alçı alma planı">
          <input type="date" value={alciAlma} onChange={(e) => setAlciAlma(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="Yük verme / mobilizasyon">
          <input type="date" value={yukVerme} onChange={(e) => setYukVerme(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="NV durumu">
          <Secim deger={nvDurum} set={(v) => setNvDurum(v as typeof nvDurum)} secenekler={NV_DURUMLARI.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <label style={{ ...S.metin, display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={goruntuHazir} onChange={(e) => setGoruntuHazir(e.target.checked)} />
          Görüntüleme kaydı hazır (yorum hekimde)
        </label>
        <textarea value={not} onChange={(e) => setNot(e.target.value)} placeholder="Hekim notu (isteğe bağlı)" style={{ ...S.input, width: '100%', minHeight: 60, marginTop: 8 }} />
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>)}
        {sonuc.uyarilar.map((u) => <div key={u} style={{ ...S.kucuk, color: '#FCA5A5' }}>⚑ {u}</div>)}
        <TaslakNotu>İzlem özeti karar desteğidir; kaynama / artroz tanısı yazılmaz. OR scheduling yoktur.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Kırık/alçı" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.TOTBID}</div>
      </div>
    </>
  )
}
