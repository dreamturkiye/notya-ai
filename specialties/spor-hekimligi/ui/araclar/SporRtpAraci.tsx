'use client'
/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Araçlar › RTP basamak (spor-hekimligi'ye özel).
 * Basamak KARAR DESTEĞİDİR — dönüş tanısı yazılmaz.
 */
import React, { useMemo, useState } from 'react'
import {
  SporHastaSecici, sporStil, Alan, Etiketli, Istatistik, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta,
} from './SporAracKabugu'
import { rtpDegerlendir, RTP_BASAMAKLAR } from '../../engines/rtp'
import { REF_ACIKLAMA } from '../../engines/spor'

const S = sporStil

export default function SporRtpAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [basamak, setBasamak] = useState('0')
  const [not, setNot] = useState('')

  const sonuc = useMemo(() => rtpDegerlendir(Number(basamak), not || null), [basamak, not])
  const ok = !('hata' in sonuc)

  const satirlar = ok
    ? [sonuc.ozet, `Kontrol önerisi ~${sonuc.sonrakiKontrolGun} gün (hekim karar verir).`, sonuc.dipnot.not]
    : []

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)">
          <SporHastaSecici secili={hasta} sec={(id) => setHasta(id)} />
        </Alan>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>RTP basamağı (0–5)</div>
        <Etiketli ad="Basamak">
          <select value={basamak} onChange={(e) => setBasamak(e.target.value)} style={S.input}>
            {RTP_BASAMAKLAR.map((b) => (
              <option key={b.basamak} value={b.basamak}>{b.basamak} — {b.ad}</option>
            ))}
          </select>
        </Etiketli>
        <Etiketli ad="Hekim notu (isteğe bağlı)">
          <input value={not} onChange={(e) => setNot(e.target.value)} style={S.input} placeholder="Klinik gözlem — tanı yazılmaz" />
        </Etiketli>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <Istatistik deger={ok ? String(sonuc.basamak) : '—'} etiket="Basamak" ton={ok ? 'notr' : 'uyari'} />
          <Istatistik deger={ok ? sonuc.basamakAd : '—'} etiket="Aşama · karar desteği" />
        </div>
      </div>
      <div style={S.kutu}>
        <div style={S.etiket}>Özet</div>
        {satirlar.length ? satirlar.map((x) => <div key={x} style={S.metin}>{x}</div>) : <div style={S.kucuk}>Basamak seçin.</div>}
        <TaslakNotu>RTP basamağı karar desteğidir; spora dönüş ve tanı hekimindir. Doz yazılmaz.</TaslakNotu>
        <div style={{ ...S.satir, marginTop: 10 }}>
          <KopyalaButonu metin={satirlar.join('\n')} etiket="Özeti kopyala" />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="RTP" satirlar={satirlar} alan="content_degerlendirme" />
        <div style={{ ...S.kucuk, marginTop: 10 }}>{REF_ACIKLAMA.RTP_BASAMAK}</div>
      </div>
    </>
  )
}
