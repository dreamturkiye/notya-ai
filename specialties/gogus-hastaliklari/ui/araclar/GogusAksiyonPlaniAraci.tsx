'use client'
/** GOGUS-EXCEPTIONAL-01 — Astım-KOAH aksiyon planı. Doz yok. */
import React, { useMemo, useState } from 'react'
import {
  GogusHastaSecici, gogusStil, Alan, Secim, Segment, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, useUrlHasta, Rozet,
} from './GogusAracKabugu'
import { aksiyonPlaniOlustur, type AksiyonHedef } from '../../engines/aksiyonPlani'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const S = gogusStil

export default function GogusAksiyonPlaniAraci() {
  const [hasta, setHasta] = useState('')
  useUrlHasta(setHasta)
  const [hedef, setHedef] = useState<AksiyonHedef>('astim')
  const [idame, setIdame] = useState('')
  const [kurtarici, setKurtarici] = useState('')
  const [kontrol, setKontrol] = useState('')
  const [gunduz, setGunduz] = useState(false)
  const [gece, setGece] = useState(false)
  const [kurt, setKurt] = useState(false)
  const [aktivite, setAktivite] = useState(false)
  const [grup, setGrup] = useState('')

  const sonuc = useMemo(() => aksiyonPlaniOlustur({
    hedef,
    idameSinifi: idame,
    kurtariciSinifi: kurtarici,
    kontrolIso: kontrol || null,
    goldGrup: grup === 'A' || grup === 'B' || grup === 'E' ? grup : null,
    astimKontrol: hedef === 'astim' ? { gunduzSemptom: gunduz, geceUyanma: gece, kurtariciIhtiyac: kurt, aktiviteKisit: aktivite } : null,
    bugun: new Date().toISOString().slice(0, 10),
  }), [hedef, idame, kurtarici, kontrol, gunduz, gece, kurt, aktivite, grup])

  const metin = [
    sonuc.baslik,
    '',
    'Yeşil (iyi dönem):',
    ...sonuc.yesil.map((x) => `• ${x}`),
    '',
    'Sarı (dikkat):',
    ...sonuc.sari.map((x) => `• ${x}`),
    '',
    'Kırmızı (acil):',
    ...sonuc.kirmizi.map((x) => `• ${x}`),
    '',
    ...sonuc.genel,
    '',
    sonuc.ozetNot,
  ].join('\n')

  return (
    <>
      <div style={S.kutu}>
        <Alan etiket="Hasta (isteğe bağlı)"><GogusHastaSecici secili={hasta} sec={(id) => setHasta(id)} /></Alan>
        <Segment etiket="Plan türü" deger={hedef} set={setHedef} secenekler={[['astim', 'Astım'], ['koah', 'KOAH']]} />
      </div>
      <div style={S.kutu}>
        <Alan etiket="İdame sınıfı (doz yazmayın)" ipucu="Örn. ICS-LABA idame · LAMA+LABA">
          <input value={idame} onChange={(e) => setIdame(e.target.value)} style={S.input} placeholder="Hekim sınıfı" />
        </Alan>
        <Alan etiket="Kurtarıcı sınıfı (doz yazmayın)">
          <input value={kurtarici} onChange={(e) => setKurtarici(e.target.value)} style={S.input} placeholder="Örn. SABA gerektiğinde" />
        </Alan>
        <Alan etiket="Kontrol tarihi">
          <input type="date" value={kontrol} onChange={(e) => setKontrol(e.target.value)} style={S.input} />
        </Alan>
        {hedef === 'koah' && (
          <Secim etiket="GOLD grubu (karar desteği)" deger={grup} set={setGrup} bos="Seçilmedi"
            secenekler={[['A', 'A'], ['B', 'B'], ['E', 'E']]} />
        )}
        {hedef === 'astim' && (
          <div style={{ marginTop: 8 }}>
            <div style={S.etiket}>Astım kontrol soruları (son 4 hafta)</div>
            {([
              ['Gündüz semptom >2/hafta', gunduz, setGunduz],
              ['Gece uyanma', gece, setGece],
              ['Kurtarıcı ihtiyacı >2/hafta', kurt, setKurt],
              ['Aktivite kısıtı', aktivite, setAktivite],
            ] as const).map(([ad, v, set]) => (
              <label key={ad} style={{ display: 'flex', gap: 8, fontSize: 13, color: CHROME_RENK.ink, marginTop: 4 }}>
                <input type="checkbox" checked={v} onChange={() => set(!v)} /> {ad}
              </label>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8 }}><Rozet ton="uyari">mcg / puff / gün sayısı yazılmaz — reçete hekimindir.</Rozet></div>
      </div>
      <div style={S.kutu}>
        <div style={{ ...S.metin, whiteSpace: 'pre-wrap' }}>{metin}</div>
        <TaslakNotu>Yazılı aksiyon planı taslağıdır; doz ve basamak hekimindir.</TaslakNotu>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <KopyalaButonu metin={metin} />
        </div>
        <MuayeneFormunaEkle hastaId={hasta} arac="Astım-KOAH aksiyon planı" satirlar={metin.split('\n')} alan="content_degerlendirme" />
      </div>
    </>
  )
}
