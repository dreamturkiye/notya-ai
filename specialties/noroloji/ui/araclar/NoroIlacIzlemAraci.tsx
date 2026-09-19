'use client'
import React, { useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { noroStil, NoroHastaSecici, KopyalaButonu, Istatistik, TaslakNotu, MuayeneFormunaEkle } from './NoroAracKabugu'
import { NORO_IZLEM_KURALLARI } from '../../engines/ilacIzlem'
import { HEKIM_KILIT_METNI } from '../../engines/noroloji'

type Gorev = { kod: string; ad: string; due: string; labs: string[]; ilac: string; kaynak: string }
type Veri = { izlem: Gorev[]; ilaclar: Array<{ id: string; ilac_adi: string; etken_madde: string | null }> }

export default function NoroIlacIzlemAraci() {
  const [hastaId, setHastaId] = useState('')
  const [veri, setVeri] = useState<Veri | null>(null)
  const [durum, setDurum] = useState('')
  const [hata, setHata] = useState('')
  const bugun = new Date().toISOString().slice(0, 10)

  const yukle = async (id: string) => {
    setVeri(null); setDurum(''); setHata('')
    if (!id) return
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/noroloji?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Yüklenemedi'); return }
      setVeri({ izlem: j.izlem || [], ilaclar: j.ilaclar || [] })
    } catch { setHata('Yüklenemedi') }
  }

  const gorevAc = async () => {
    setDurum(''); setHata('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/noroloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: hastaId, adim: 'ilac_izlem' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setHata(j.error || 'Açılamadı'); return }
      setDurum(`${j.eklenen ?? 0} yeni görev açıldı (${j.sayi ?? 0} kural eşleşti).`)
      await yukle(hastaId)
    } catch { setHata('Açılamadı') }
  }

  return (
    <>
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Hasta</div>
        <NoroHastaSecici secili={hastaId} sec={(id) => { setHastaId(id); yukle(id) }} />
        {hata && <div style={{ ...noroStil.kucuk, color: '#F87171', marginTop: 8 }}>{hata}</div>}
      </div>
      {veri && (
        <div style={noroStil.kutu}>
          <div style={noroStil.etiket}>İzlem görevleri</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Istatistik deger={veri.izlem.length} etiket="Açılacak izlem görevi" ton={veri.izlem.length ? 'uyari' : 'iyi'} />
            <Istatistik deger={veri.izlem.filter((g) => g.due < bugun).length} etiket="Vadesi geçmiş" ton={veri.izlem.some((g) => g.due < bugun) ? 'kirmizi' : 'notr'} />
            <Istatistik deger={veri.ilaclar.length} etiket="Aktif nöro ilaç" />
          </div>
          {!veri.ilaclar.length && <div style={noroStil.kucuk}>Aktif ilaç kaydı yok. Görevler hasta ilaç listesinden üretilir; Notya ilaç veya doz eklemez.</div>}
          {veri.izlem.map((g) => (
            <div key={g.kod} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ ...noroStil.metin, color: g.due < bugun ? '#FCA5A5' : '#EDF1F7' }}>{g.ad}</div>
              <div style={noroStil.kucuk}>{g.ilac} · vade {g.due}{g.labs.length ? ` · ${g.labs.join(', ')}` : ''}</div>
            </div>
          ))}
          <div style={noroStil.satir}>
            <button type="button" style={noroStil.btn} onClick={gorevAc} disabled={!veri.izlem.length}>Görevleri hasta dosyasında aç</button>
          </div>
          {durum && <div style={{ ...noroStil.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
          <KopyalaButonu metin={veri.izlem.map((g) => `${g.ad} — ${g.ilac} — vade ${g.due}`).join('\n')} etiket="İzlem planını kopyala" />
          <MuayeneFormunaEkle hastaId={hastaId} arac="AED izlem" satirlar={veri.izlem.map((g) => `${g.ad} (${g.ilac}) — ${g.due}`)} alan="content_degerlendirme" />
          <TaslakNotu>SINIF düzeyi izlem; doz, titrasyon ve kesme kararı hekimindir.</TaslakNotu>
        </div>
      )}
      <div style={noroStil.kutu}>
        <div style={noroStil.etiket}>Kural kütüphanesi (doz yok)</div>
        {NORO_IZLEM_KURALLARI.map((k) => (
          <div key={k.kod} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={noroStil.metin}>{k.ad}</div>
            <div style={noroStil.kucuk}>{k.dipnot}</div>
          </div>
        ))}
        <div style={{ ...noroStil.kucuk, marginTop: 10 }}>{HEKIM_KILIT_METNI}</div>
      </div>
    </>
  )
}
