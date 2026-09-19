'use client'
/**
 * GOGUS-EXCEPTIONAL-01 — Araçlar › CAT / mMRC. Göğüs-only.
 * Skor ve GOLD grubu karar desteğidir; tanı ve doz yazılmaz.
 */
import React, { useMemo, useState } from 'react'
import {
  GogusHastaSecici, gogusStil, Alan, Etiketli, Secim, Istatistik, Rozet, TaslakNotu, KopyalaButonu,
  MuayeneFormunaEkle, useUrlHasta,
} from './GogusAracKabugu'
import { catMmrcDegerlendir, CAT_MADDELER, MMRC_AD, type MmrcSeviye } from '../../engines/catMmrc'
import { REF_ACIKLAMA } from '../../engines/gogus'

const S = gogusStil

export default function GogusCatMmrcAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [maddeler, setMaddeler] = useState<string[]>(Array(8).fill(''))
  const [mmrc, setMmrc] = useState('')
  const [orta, setOrta] = useState('0')
  const [yatis, setYatis] = useState('0')
  const [fev1, setFev1] = useState('')

  const sonuc = useMemo(() => catMmrcDegerlendir({
    catMaddeler: maddeler.map((x) => (x === '' ? null : Number(x))),
    mmrc: mmrc === '' ? null : Number(mmrc),
    ortaAlevlenme12Ay: Number(orta) || 0,
    yatisliAlevlenme12Ay: Number(yatis) || 0,
    fev1Yuzde: fev1 === '' ? null : Number(fev1),
  }), [maddeler, mmrc, orta, yatis, fev1])

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)" ipucu="Hasta seçerseniz özeti bugünkü muayene formuna ekleyebilirsiniz.">
          <GogusHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>

      <div style={S.kutu}>
        <div style={S.etiket}>CAT (0–5 her madde)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CAT_MADDELER.map((ad, i) => (
            <Etiketli key={ad} ad={`${i + 1}. ${ad}`}>
              <input type="number" min={0} max={5} inputMode="numeric" aria-label={`CAT ${ad}`}
                value={maddeler[i]} onChange={(e) => setMaddeler(maddeler.map((x, j) => (j === i ? e.target.value : x)))}
                style={{ ...S.input, width: 72 }} />
            </Etiketli>
          ))}
        </div>
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Alan etiket="mMRC">
            <Secim etiket="mMRC" deger={mmrc} set={setMmrc} bos="Seçilmedi"
              secenekler={([0, 1, 2, 3, 4] as MmrcSeviye[]).map((k) => [String(k), MMRC_AD[k]] as [string, string])} />
          </Alan>
          <Etiketli ad="Orta alevlenme (12 ay)">
            <input type="number" min={0} value={orta} onChange={(e) => setOrta(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
          <Etiketli ad="Yatışlı alevlenme (12 ay)">
            <input type="number" min={0} value={yatis} onChange={(e) => setYatis(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
          <Etiketli ad="FEV1 % (elle, isteğe bağlı)">
            <input type="number" min={0} max={150} value={fev1} onChange={(e) => setFev1(e.target.value)} style={{ ...S.input, width: 90 }} />
          </Etiketli>
        </div>
        <div style={{ ...S.kucuk, marginTop: 8 }}>Spirometri cihaz entegrasyonu yok — sayı hekim girer. {REF_ACIKLAMA.GOLD}</div>
      </div>

      <div style={S.kutu}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Istatistik deger={sonuc.catTamam && sonuc.cat != null ? String(sonuc.cat) : '—'} etiket="CAT /40" />
          <Istatistik deger={sonuc.mmrc != null ? String(sonuc.mmrc) : '—'} etiket="mMRC" />
          <Istatistik deger={sonuc.grup || '—'} etiket="GOLD grubu · karar desteği" ton={sonuc.grup === 'E' ? 'uyari' : 'notr'} />
          <Istatistik deger={sonuc.goldEvre != null ? String(sonuc.goldEvre) : '—'} etiket="GOLD evre (FEV1%)" />
        </div>
        {sonuc.uyarilar.map((u) => <div key={u} style={{ marginTop: 8 }}><Rozet ton="uyari">{u}</Rozet></div>)}
        <div style={{ ...S.metin, marginTop: 8 }}>{sonuc.ozet}</div>
        <TaslakNotu>CAT / mMRC ve GOLD grubu karar desteğidir; tanı ve doz hekimindir. Notya doz üretmez.</TaslakNotu>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={sonuc.ozet} />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="CAT / mMRC" satirlar={[sonuc.ozet]} alan="content_objektif" />
      </div>
    </>
  )
}
