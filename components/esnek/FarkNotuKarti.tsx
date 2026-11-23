'use client'
/**
 * ESNEK-MUAYENE-B4 — "Kontrol: yalnız değişeni yazın". The doctor writes only the change; the preview shows the merged kontrol
 * note (changed highlighted, unchanged stated as unchanged, new labelled, nothing invented) before anything is saved; "Kontrol
 * notunu oluştur" creates the visit's draft for the normal review / approval. Loaded lazily from the patient file.
 * Country-neutral (words, API and routes injected).
 */
import { useState } from 'react'
import type { EsnekMetinleri } from '@/core/esnek/metinTr'
import type { FarkSonucu, SoapBolum } from '@/core/esnek/farkNotu'
import { EL_RENK as R } from '@/components/elNotu/renk'
import { dugme, type Getirici } from '@/components/elNotu/ElNotuYakala'

const BOLUM_ETIKET: Record<SoapBolum, 'subjektif' | 'objektif' | 'degerlendirme' | 'plan'> = { subjektif: 'subjektif', objektif: 'objektif', degerlendirme: 'degerlendirme', plan: 'plan' }

export default function FarkNotuKarti(p: { metin: EsnekMetinleri; getir: Getirici; api: string; patientId: string; notFormu: (noteId: string) => string; git: (yol: string) => void; kapat: () => void }) {
  const M = p.metin.fark
  const [metin, setMetin] = useState('')
  const [onizleme, setOnizleme] = useState<{ onceki: { tarih: string }; sonuc: FarkSonucu } | null>(null)
  const [hata, setHata] = useState('')
  const [kayit, setKayit] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  async function gonder(islem: 'onizle' | 'kaydet') {
    if (metin.trim().length < 2) return
    setCalisiyor(true); setHata('')
    const r = await p.getir(`${p.api}/fark`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ islem, patientId: p.patientId, metin }) }).catch(() => null)
    const j = await r?.json().catch(() => null)
    setCalisiyor(false)
    if (!r?.ok) { setHata((j as { error?: string } | null)?.error || p.metin.hata); return }
    if (islem === 'onizle') setOnizleme(j)
    else setKayit(String(j.noteId))
  }

  const renk = { degisti: R.amberAcik, yeni: '#E4F3F1', degismedi: 'transparent' }
  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 16, display: 'grid', gap: 10, color: R.murekkep }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 650 }}>{M.baslik}</div>
          <div style={{ fontSize: 13, color: R.soluk, marginTop: 2 }}>{M.alt}</div>
        </div>
        <button type="button" style={dugme('kucuk')} onClick={p.kapat}>×</button>
      </div>
      <textarea value={metin} onChange={(e) => { setMetin(e.target.value); setOnizleme(null) }} placeholder={M.yer} rows={3} aria-label={M.baslik}
        style={{ width: '100%', borderRadius: 10, border: `1px solid ${R.cizgi}`, padding: 10, fontSize: 15, fontFamily: 'inherit', background: '#fff', color: R.murekkep }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={dugme('ikincil')} disabled={calisiyor || metin.trim().length < 2} onClick={() => void gonder('onizle')}>{M.onizle}</button>
        <button type="button" style={dugme('birincil')} disabled={calisiyor || !onizleme || !!kayit} onClick={() => void gonder('kaydet')}>{M.kaydet}</button>
      </div>
      {hata && <div role="alert" style={{ color: R.uyari, fontSize: 13 }}>{hata}</div>}
      {kayit && (
        <div role="status" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: R.cam }}>
          {M.kaydedildi}<button type="button" style={dugme('kucuk')} onClick={() => p.git(p.notFormu(kayit))}>{M.notaGit}</button>
        </div>
      )}
      {onizleme && (
        <div style={{ display: 'grid', gap: 8, background: '#fff', borderRadius: 12, padding: 12, border: `1px solid ${R.cizgi}` }}>
          <div style={{ fontSize: 12, color: R.soluk }}>{M.sayim(onizleme.sonuc.sayim.degisti, onizleme.sonuc.sayim.degismedi, onizleme.sonuc.sayim.yeni)} · {M.tarih(onizleme.onceki.tarih)}</div>
          {(Object.keys(BOLUM_ETIKET) as SoapBolum[]).filter((b) => onizleme.sonuc.bolumler[b].length).map((b) => (
            <div key={b} style={{ display: 'grid', gap: 3 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: R.soluk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.metin.ozerklik.alan[BOLUM_ETIKET[b]]}</div>
              {onizleme.sonuc.bolumler[b].map((s, i) => (
                <div key={i} style={{ fontSize: 14, background: renk[s.durum], borderRadius: 6, padding: s.durum === 'degismedi' ? '0 6px' : '3px 6px', color: s.durum === 'degismedi' ? R.soluk : R.murekkep, fontWeight: s.durum === 'degisti' ? 600 : 400 }}>
                  {s.durum === 'degisti' ? `${M.kelimeler.degisen}: ` : s.durum === 'yeni' ? `${M.kelimeler.yeni}: ` : ''}{s.metin}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
