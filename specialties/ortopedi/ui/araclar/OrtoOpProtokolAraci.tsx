'use client'
/**
 * ORTOPEDI-EXCEPTIONAL-01 — Araçlar › Op-sonrası protokol (ortopedi'ye özel).
 * OR scheduling / HIS yok — yalnız hekim kilometre taşları.
 */
import React, { useMemo, useState } from 'react'
import {
  OrtoHastaSecici, ortoStil, Alan, Etiketli, Secim, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './OrtoAracKabugu'
import { ozetle, BOLGELER, TARAFLAR, NV_DURUMLARI, OP_PROTOKOL_MADDELERI } from '../../engines/kirikAlci'
import { KAPSAM_NOTU, REF_ACIKLAMA } from '../../engines/ortopedi'

const S = ortoStil

export default function OrtoOpProtokolAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [bolge, setBolge] = useState(BOLGELER[0])
  const [taraf, setTaraf] = useState(TARAFLAR[0])
  const [baslangic, setBaslangic] = useState('')
  const [alciAlma, setAlciAlma] = useState('')
  const [yukVerme, setYukVerme] = useState('')
  const [nvDurum, setNvDurum] = useState(NV_DURUMLARI[0])
  const [goruntuHazir, setGoruntuHazir] = useState(false)
  const [isaret, setIsaret] = useState<string[]>([])
  const [not, setNot] = useState('')

  const bugun = new Date().toISOString().slice(0, 10)
  const sonuc = useMemo(() => ozetle({
    tip: 'op_sonrasi', bolge, taraf,
    baslangic: baslangic || null,
    alciAlma: alciAlma || null,
    yukVerme: yukVerme || null,
    nvDurum, goruntuHazir, notHekim: not || null, bugun,
  }), [bolge, taraf, baslangic, alciAlma, yukVerme, nvDurum, goruntuHazir, not, bugun])

  const satirlar = [
    ...sonuc.ozet.split('\n'),
    isaret.length ? `Kontrol listesi: ${isaret.length}/${OP_PROTOKOL_MADDELERI.length} madde işaretli` : null,
  ].filter(Boolean) as string[]

  const cevir = (x: string) => setIsaret((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]))

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <OrtoHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Op-sonrası kilometre taşları (hekim)</div>
        <Etiketli ad="Bölge">
          <Secim deger={bolge} set={(v) => setBolge(v as typeof bolge)} secenekler={BOLGELER.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <Etiketli ad="Taraf">
          <Secim deger={taraf} set={(v) => setTaraf(v as typeof taraf)} secenekler={TARAFLAR.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <Etiketli ad="İşlem tarihi">
          <input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="Dikiş / yara kontrolü">
          <input type="date" value={alciAlma} onChange={(e) => setAlciAlma(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="Yük verme / hareket planı">
          <input type="date" value={yukVerme} onChange={(e) => setYukVerme(e.target.value)} style={S.input} />
        </Etiketli>
        <Etiketli ad="NV durumu">
          <Secim deger={nvDurum} set={(v) => setNvDurum(v as typeof nvDurum)} secenekler={NV_DURUMLARI.map((x) => [x, x] as [string, string])} />
        </Etiketli>
        <label style={{ ...S.metin, display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="checkbox" checked={goruntuHazir} onChange={(e) => setGoruntuHazir(e.target.checked)} />
          Görüntüleme kontrolü planlandı
        </label>
        <div style={{ ...S.etiket, marginTop: 12 }}>Kontrol listesi</div>
        {OP_PROTOKOL_MADDELERI.map((m) => (
          <label key={m} style={{ ...S.metin, display: 'flex', gap: 8, padding: '3px 0' }}>
            <input type="checkbox" checked={isaret.includes(m)} onChange={() => cevir(m)} />
            {m}
          </label>
        ))}
        <textarea value={not} onChange={(e) => setNot(e.target.value)} placeholder="Hekim notu" style={{ ...S.input, width: '100%', minHeight: 60, marginTop: 8 }} />
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>)}
        <TaslakNotu>Ameliyathane planı / OR scheduling / HIS bu ürünün kapsamı değildir. Tanı ve doz hekimindir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Op-sonrası" satirlar={satirlar} alan="content_degerlendirme" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{KAPSAM_NOTU}</div>
        <div style={{ ...S.kucuk, marginTop: 4 }}>{REF_ACIKLAMA.TOTBID}</div>
      </div>
    </>
  )
}
