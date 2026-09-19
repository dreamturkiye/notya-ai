'use client'
/**
 * UROLOJI-EXCEPTIONAL-01 — Araçlar › PSA izlem (tanı değil).
 * Bant KARAR DESTEĞİDİR — prostat kanseri yazılmaz.
 */
import React, { useMemo, useState } from 'react'
import {
  UroHastaSecici, uroStil, Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './UroAracKabugu'
import { skorlaSeri, PSA_BANT_AD } from '../../engines/psa'
import { REF_ACIKLAMA } from '../../engines/uroloji'

const S = uroStil

export default function UroPsaAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [deger, setDeger] = useState('')
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10))
  const [oncekiDeger, setOncekiDeger] = useState('')
  const [oncekiTarih, setOncekiTarih] = useState('')
  const [yas, setYas] = useState('')

  const sonuc = useMemo(() => {
    const noktalar = []
    if (oncekiDeger !== '' && oncekiTarih) noktalar.push({ tarih: oncekiTarih, deger: Number(oncekiDeger) })
    if (deger !== '' && tarih) noktalar.push({ tarih, deger: Number(deger) })
    return skorlaSeri(noktalar, yas === '' ? null : Number(yas))
  }, [deger, tarih, oncekiDeger, oncekiTarih, yas])

  const satirlar = [
    sonuc.deger != null ? sonuc.ozet : null,
    sonuc.hizNgMlYil != null ? sonuc.hizNot : null,
  ].filter(Boolean) as string[]

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <UroHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>PSA ng/mL izlem</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Etiketli ad="Değer (ng/mL)">
            <input type="number" step="0.01" value={deger} onChange={(e) => setDeger(e.target.value)} style={{ ...S.input, width: 110 }} />
          </Etiketli>
          <Etiketli ad="Tarih">
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...S.input, width: 150 }} />
          </Etiketli>
          <Etiketli ad="Yaş (opsiyonel)">
            <input type="number" value={yas} onChange={(e) => setYas(e.target.value)} style={{ ...S.input, width: 80 }} />
          </Etiketli>
        </div>
        <div style={{ ...S.etiket, marginTop: 12 }}>Önceki ölçüm (hız için)</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Etiketli ad="Önceki ng/mL">
            <input type="number" step="0.01" value={oncekiDeger} onChange={(e) => setOncekiDeger(e.target.value)} style={{ ...S.input, width: 110 }} />
          </Etiketli>
          <Etiketli ad="Önceki tarih">
            <input type="date" value={oncekiTarih} onChange={(e) => setOncekiTarih(e.target.value)} style={{ ...S.input, width: 150 }} />
          </Etiketli>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={sonuc.deger != null ? `${sonuc.deger}` : '—'} etiket="PSA ng/mL" ton={sonuc.deger != null ? 'notr' : 'uyari'} />
          <Istatistik deger={sonuc.bantAd} etiket="İzlem bandı · karar desteği" />
          <Istatistik deger={sonuc.hizNgMlYil != null ? String(sonuc.hizNgMlYil) : '—'} etiket="Hız ng/mL/yıl" />
        </div>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Değer girin.</div>}
        <TaslakNotu>PSA bandı ve hız karar desteğidir; kanser tanısı yazılmaz. İleri tetkik hekimindir.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="PSA izlem" satirlar={satirlar} alan="content_objektif" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.PSA_IZLEM}</div>
        <div style={{ ...S.kucuk, marginTop: 4 }}>Bantlar: {Object.values(PSA_BANT_AD).join(' · ')}</div>
      </div>
    </>
  )
}
