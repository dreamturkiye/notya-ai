'use client'
import React, { useMemo, useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { noroStil, NoroHastaSecici, Onay, KopyalaButonu, Istatistik, TaslakNotu, useUrlHasta } from './NoroAracKabugu'
import { acilTara, hekimOnayiGerekliMi, ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, type AcilKod } from '../../engines/acil'
import { ACIL_YONLENDIRME_METNI } from '../../engines/noroloji'

export default function NoroInmeAraci() {
  const [isaretli, setIsaretli] = useState<AcilKod[]>([])
  const [metin, setMetin] = useState('')
  const [liste, setListe] = useState<number[]>([])
  const [eylem, setEylem] = useState('')
  const [onay, setOnay] = useState(false)
  const [hastaId, setHastaId] = useState('')
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  useUrlHasta(setHastaId)

  const bayraklar = useMemo(() => acilTara([metin], isaretli), [metin, isaretli])
  const onayGerek = hekimOnayiGerekliMi(bayraklar)
  const ozet = [
    bayraklar.length ? `İnme/TIA bayrakları: ${bayraklar.map((b) => b.ad).join('; ')}` : 'İnme/TIA bayrağı saptanmadı (hekim değerlendirmesi esas)',
    ...liste.map((i) => `✓ ${ACIL_KONTROL_LISTESI[i]}`),
    eylem ? `Hekim eylemi: ${eylem}` : '',
  ].filter(Boolean).join('\n')

  const kaydet = async () => {
    setDurum(''); setHata('')
    if (!hastaId) { setHata('Kaydetmek için hasta seçin.'); return }
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/noroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: hastaId, adim: 'risk', bayraklar: isaretli, metin,
          eylem: [eylem, ...liste.map((i) => ACIL_KONTROL_LISTESI[i])].filter(Boolean).join(' | '),
          hekimOnay: onay,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi'); return }
      setDurum('Değerlendirme hasta dosyasına kaydedildi.')
    } catch { setHata('Kaydedilemedi') }
  }

  return (
    <>
      <div style={{ ...noroStil.kutu, borderColor: 'rgba(248,113,113,0.45)', background: 'rgba(248,113,113,0.08)' }}>{ACIL_YONLENDIRME_METNI}</div>
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Hasta (isteğe bağlı kayıt için)</div>
        <NoroHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
        <div style={{ ...noroStil.etiket, marginTop: 12 }}>Hekim işareti</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ACIL_KODLARI.map((k) => (
            <Onay key={k.kod} ad={k.ad} deger={isaretli.includes(k.kod)} set={(b) => setIsaretli((p) => (b ? [...p, k.kod] : p.filter((x) => x !== k.kod)))} />
          ))}
        </div>
        <div style={{ ...noroStil.etiket, marginTop: 12 }}>Hastanın ifadesi (isteğe bağlı)</div>
        <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={3} aria-label="Hastanın ifadesi" style={{ ...noroStil.input, width: '100%', marginTop: 8, resize: 'vertical' }} />
      </div>
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Triyaj sonucu</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <Istatistik deger={bayraklar.length} etiket="Bayrak" ton={bayraklar.length ? 'kirmizi' : 'iyi'} />
          <Istatistik deger={onayGerek ? 'Gerekli' : 'Gerekmiyor'} etiket="Hekim onayı" ton={onayGerek ? 'uyari' : 'notr'} />
        </div>
        {bayraklar.map((b) => (
          <div key={b.kod} style={{ ...noroStil.metin, marginBottom: 6 }}>
            <b>{b.ad}</b> — {b.eylem}
          </div>
        ))}
        {!bayraklar.length && <div style={noroStil.kucuk}>Henüz bayrak yok — hekim değerlendirmesi esas.</div>}
        <div style={{ ...noroStil.etiket, marginTop: 12 }}>Kontrol listesi</div>
        {ACIL_KONTROL_LISTESI.map((x, i) => (
          <Onay key={x} ad={x} deger={liste.includes(i)} set={(b) => setListe((p) => (b ? [...p, i] : p.filter((y) => y !== i)))} />
        ))}
        <div style={{ marginTop: 10 }}>
          <input value={eylem} onChange={(e) => setEylem(e.target.value)} placeholder="Hekim eylemi (serbest)" style={noroStil.input} />
        </div>
        {onayGerek && (
          <div style={{ marginTop: 10 }}>
            <Onay ad="Hekim gördü ve eylemi yazdı (kayıt için zorunlu)" deger={onay} set={setOnay} />
          </div>
        )}
        <TaslakNotu>İnme/TIA bayrakları karar desteğidir; tanı yazmaz. Açık “hemen” bayrakta hekim onayı olmadan kayıt yok (409).</TaslakNotu>
        <div style={{ ...noroStil.satir, marginTop: 10 }}>
          <KopyalaButonu metin={ozet} etiket="Özeti kopyala" />
          <button type="button" onClick={kaydet} style={noroStil.btn}>Kaydet</button>
        </div>
        {durum && <div style={{ ...noroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
        {hata && <div style={{ ...noroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
        <div style={{ ...noroStil.kucuk, marginTop: 10 }}>{HASTA_ACIL_METNI}</div>
      </div>
    </>
  )
}
