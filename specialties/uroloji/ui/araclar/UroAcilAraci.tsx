'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Araçlar › Hematuri / taş acil triyaj.
 * Tanı yok; 112 yönlendirmesi var.
 */
import React, { useMemo, useState } from 'react'
import {
  UroHastaSecici, uroStil, Alan, Kutu, Rozet, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './UroAracKabugu'
import { acilTara, ACIL_KODLARI, HASTA_ACIL_METNI, hekimOnayiGerekliMi, type AcilKod } from '../../engines/acil'
import { ACIL_YONLENDIRME_METNI } from '../../engines/uroloji'

const S = uroStil

export default function UroAcilAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [kodlar, setKodlar] = useState<AcilKod[]>([])
  const [metin, setMetin] = useState('')

  const bayraklar = useMemo(() => acilTara([metin], kodlar), [metin, kodlar])
  const hemen = hekimOnayiGerekliMi(bayraklar)

  const satirlar = [
    ...bayraklar.map((b) => `${b.ad}: ${b.eylem}`),
    hemen ? ACIL_YONLENDIRME_METNI : null,
  ].filter(Boolean) as string[]

  const cevir = (k: AcilKod) => setKodlar((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <UroHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Kırmızı bayrak işaretleri</div>
        {ACIL_KODLARI.map((k) => (
          <Kutu key={k.kod} on={kodlar.includes(k.kod)} set={() => cevir(k.kod)}>{k.ad}</Kutu>
        ))}
        <Alan etiket="Serbest metin (opsiyonel)" ipucu="Şikâyet cümlesi tarama için.">
          <textarea value={metin} onChange={(e) => setMetin(e.target.value)} style={{ ...S.input, width: '100%', minHeight: 72 }} />
        </Alan>
        {hemen && <div style={{ marginTop: 8 }}><Rozet ton="kirmizi">Hemen — 112 / en yakın acil; portal mesajı beklenmez</Rozet></div>}
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Bayrak işaretleyin veya metin girin.</div>}
        <TaslakNotu>Acil triyaj tanı koymaz. Açık bayrakta hekim onayı olmadan risk kaydı yazılmaz (409).</TaslakNotu>
        <div style={{ ...S.kucuk, marginTop: 8 }}>{HASTA_ACIL_METNI}</div>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Üroloji acil triyaj" satirlar={satirlar} alan="content_objektif" />
      </div>
    </>
  )
}
