'use client'
/**
 * ORTOPEDI-EXCEPTIONAL-01 — Araçlar › VAS / fonksiyon (ortopedi'ye özel).
 * Bant KARAR DESTEĞİDİR — artroz / tanı yazılmaz.
 */
import React, { useMemo, useState } from 'react'
import {
  OrtoHastaSecici, ortoStil, Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './OrtoAracKabugu'
import { skorla, FONKSIYON_MADDELER, VAS_BANT_AD } from '../../engines/vasFonksiyon'
import { REF_ACIKLAMA } from '../../engines/ortopedi'

const S = ortoStil

export default function OrtoVasAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [vas, setVas] = useState('')
  const [maddeler, setMaddeler] = useState<string[]>(Array(4).fill(''))

  const sonuc = useMemo(
    () => skorla(vas === '' ? null : Number(vas), maddeler.map((x) => (x === '' ? null : Number(x)))),
    [vas, maddeler],
  )

  const satirlar = [
    sonuc.tamamMi ? sonuc.ozet : null,
    sonuc.tamamMi ? 'Bant birleşik VAS×0,8 + fonksiyon toplamıdır (karar desteği).' : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <OrtoHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>VAS (0–10) ve fonksiyon maddeleri (0–4)</div>
        <Etiketli ad="Ağrı VAS (0 = yok, 10 = en şiddetli)">
          <input type="number" min={0} max={10} value={vas} onChange={(e) => setVas(e.target.value)} style={{ ...S.input, width: 72 }} />
        </Etiketli>
        {FONKSIYON_MADDELER.map((m, i) => (
          <Etiketli key={m.id} ad={m.ad}>
            <input
              type="number" min={0} max={4} inputMode="numeric" aria-label={m.ad}
              value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))}
              style={{ ...S.input, width: 72 }}
            />
          </Etiketli>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={sonuc.tamamMi ? String(sonuc.vas) : '—'} etiket="VAS / 10" ton={sonuc.tamamMi ? 'notr' : 'uyari'} />
          <Istatistik deger={sonuc.tamamMi ? String(sonuc.fonksiyonToplam) : '—'} etiket="Fonksiyon / 16" />
          <Istatistik deger={sonuc.bantAd} etiket="Şiddet bandı · karar desteği" />
        </div>
        {!sonuc.tamamMi && <div style={{ ...S.kucuk, color: '#FDE68A', marginTop: 6 }}>{sonuc.eksikMadde} alan boş — bant yorumlanmaz.</div>}
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>VAS ve maddeleri girin.</div>}
        <TaslakNotu>VAS/fonksiyon bandı şiddet karar desteğidir; tanı yazılmaz. Tedavi kararı hekimindir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="VAS/fonksiyon" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.VAS}</div>
        <div style={{ ...S.kucuk, marginTop: 4 }}>Bantlar: {Object.values(VAS_BANT_AD).join(' · ')}</div>
      </div>
    </>
  )
}
