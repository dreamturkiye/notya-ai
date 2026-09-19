'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Araçlar › IPSS-7 (üroloji'ye özel).
 * Bant KARAR DESTEĞİDİR — BPH / tanı yazılmaz.
 */
import React, { useMemo, useState } from 'react'
import {
  UroHastaSecici, uroStil, Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './UroAracKabugu'
import { skorla, IPSS_MADDELER, IPSS_BANT_AD } from '../../engines/ipss'
import { REF_ACIKLAMA } from '../../engines/uroloji'

const S = uroStil

export default function UroIpssAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [maddeler, setMaddeler] = useState<string[]>(Array(7).fill(''))
  const [qol, setQol] = useState('')

  const sonuc = useMemo(
    () => skorla(maddeler.map((x) => (x === '' ? null : Number(x))), qol === '' ? null : Number(qol)),
    [maddeler, qol],
  )

  const satirlar = [
    sonuc.tamamMi ? sonuc.ozet : null,
    sonuc.tamamMi ? `Bant aralıkları: 0–7 hafif · 8–19 orta · 20–35 şiddetli (karar desteği).` : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <UroHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>IPSS-7 maddeleri (0–5)</div>
        {IPSS_MADDELER.map((m, i) => (
          <Etiketli key={m.id} ad={m.ad}>
            <input
              type="number" min={0} max={5} inputMode="numeric" aria-label={m.ad}
              value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))}
              style={{ ...S.input, width: 72 }}
            />
          </Etiketli>
        ))}
        <Etiketli ad="Yaşam kalitesi (0–6, ayrı)">
          <input type="number" min={0} max={6} value={qol} onChange={(e) => setQol(e.target.value)} style={{ ...S.input, width: 72 }} />
        </Etiketli>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={sonuc.tamamMi ? String(sonuc.toplam) : '—'} etiket="Toplam / 35" ton={sonuc.tamamMi ? 'notr' : 'uyari'} />
          <Istatistik deger={sonuc.bantAd} etiket="Şiddet bandı · karar desteği" />
        </div>
        {!sonuc.tamamMi && <div style={{ ...S.kucuk, color: '#FDE68A', marginTop: 6 }}>{sonuc.eksikMadde} madde boş — toplam yorumlanmaz.</div>}
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Maddeleri girin.</div>}
        <TaslakNotu>IPSS bandı şiddet karar desteğidir; BPH veya başka tanı yazılmaz. Tanı ve doz hekimindir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="IPSS" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.IPSS}</div>
        <div style={{ ...S.kucuk, marginTop: 4 }}>Bantlar: {Object.values(IPSS_BANT_AD).join(' · ')}</div>
      </div>
    </>
  )
}
