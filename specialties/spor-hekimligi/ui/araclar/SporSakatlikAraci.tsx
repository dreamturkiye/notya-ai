'use client'
/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › Sakatlık günlüğü (+ yüklenme uyarısı).
 */
import React, { useMemo, useState } from 'react'
import {
  SporHastaSecici, sporStil, Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './SporAracKabugu'
import { sakatlikDegerlendir, BOLGELER, MEKANIZMALAR, SIDDET_BANT_AD, type SiddetBant } from '../../engines/sakatlik'
import { REF_ACIKLAMA } from '../../engines/spor'

const S = sporStil

export default function SporSakatlikAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [bolge, setBolge] = useState(BOLGELER[0])
  const [mekanizma, setMekanizma] = useState(MEKANIZMALAR[0])
  const [siddet, setSiddet] = useState<SiddetBant | ''>('orta')
  const [durum, setDurum] = useState<'aktif' | 'iyilesiyor' | 'kapandi'>('aktif')
  const [dakika7, setDakika7] = useState('')
  const [dakikaOnce, setDakikaOnce] = useState('')

  const sonuc = useMemo(() => sakatlikDegerlendir({
    bolge,
    mekanizma,
    siddet: siddet || null,
    durum,
    yuklenmeDakika7: dakika7 === '' ? null : Number(dakika7),
    yuklenmeDakikaOnceki: dakikaOnce === '' ? null : Number(dakikaOnce),
  }), [bolge, mekanizma, siddet, durum, dakika7, dakikaOnce])
  const ok = !('hata' in sonuc)

  const satirlar = ok
    ? [sonuc.ozet, sonuc.yuklenmeNot, 'Şiddet bandı karar desteğidir; tanı hekimindir.'].filter(Boolean) as string[]
    : []

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <SporHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Sakatlık kaydı</div>
        <Etiketli ad="Bölge">
          <select value={bolge} onChange={(e) => setBolge(e.target.value as typeof bolge)} style={S.input}>
            {BOLGELER.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Etiketli>
        <Etiketli ad="Mekanizma">
          <select value={mekanizma} onChange={(e) => setMekanizma(e.target.value as typeof mekanizma)} style={S.input}>
            {MEKANIZMALAR.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Etiketli>
        <Etiketli ad="Şiddet bandı (karar desteği)">
          <select value={siddet} onChange={(e) => setSiddet(e.target.value as SiddetBant | '')} style={S.input}>
            <option value="">—</option>
            {(Object.keys(SIDDET_BANT_AD) as SiddetBant[]).map((k) => <option key={k} value={k}>{SIDDET_BANT_AD[k]}</option>)}
          </select>
        </Etiketli>
        <Etiketli ad="Durum">
          <select value={durum} onChange={(e) => setDurum(e.target.value as typeof durum)} style={S.input}>
            <option value="aktif">Aktif</option>
            <option value="iyilesiyor">İyileşiyor</option>
            <option value="kapandi">Kapandı</option>
          </select>
        </Etiketli>
        <div style={{ ...S.etiket, marginTop: 12 }}>Yüklenme (isteğe bağlı — doz değil)</div>
        <Etiketli ad="Son 7 gün antrenman (dk)">
          <input type="number" min={0} value={dakika7} onChange={(e) => setDakika7(e.target.value)} style={{ ...S.input, width: 100 }} />
        </Etiketli>
        <Etiketli ad="Önceki haftalık ort. (dk)">
          <input type="number" min={0} value={dakikaOnce} onChange={(e) => setDakikaOnce(e.target.value)} style={{ ...S.input, width: 100 }} />
        </Etiketli>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={ok ? sonuc.bolge : '—'} etiket="Bölge" />
          <Istatistik deger={ok ? sonuc.siddetAd : '—'} etiket="Şiddet · karar desteği" />
          <Istatistik deger={ok && sonuc.yuklenmeUyari ? 'Uyarı' : 'OK'} etiket="Yüklenme" ton={ok && sonuc.yuklenmeUyari ? 'uyari' : 'notr'} />
        </div>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Alanları doldurun.</div>}
        <TaslakNotu>Tanı (ACL, kırık vb.) yazılmaz. Yüklenme oranı karar desteğidir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Sakatlık günlüğü" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.TOTBID_SPOR}</div>
      </div>
    </>
  )
}
