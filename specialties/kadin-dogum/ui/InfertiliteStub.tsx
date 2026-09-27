'use client'

import { useMemo, useState } from 'react'
import { kutu, btn, etiketS } from './clinic-styles'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { INFERTILITE_ADIM1_FULL, infertiliteSevkPaketi } from '../engines/kd-klinik-wow'

/**
 * KD-EXCEPTIONAL-01 — İnfertilite sekmesi artık boş stub değil: 1. basamak sevk checklist'i
 * (WOW). IVF laboratuvarı / stimülasyon protokolü kasıtlı olarak dışarıda.
 */
export function InfertiliteStub({ patientId }: { patientId?: string }) {
  const [tamam, setTamam] = useState<string[]>([])
  const [mesaj, setMesaj] = useState('')
  const paket = useMemo(() => infertiliteSevkPaketi(tamam), [tamam])

  const cevir = (kod: string) =>
    setTamam((p) => (p.includes(kod) ? p.filter((x) => x !== kod) : [...p, kod]))

  const kaydet = async () => {
    if (!patientId) { setMesaj('Hasta seçili değil — checklist yerel kalır.'); return }
    setMesaj('')
    try {
      const t = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/jinekoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, adim: 'infertilite_sevk', tamamlanan: tamam }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Kaydedilemedi')
      setMesaj('Sevk paketi kaydedildi.')
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : 'Kaydedilemedi')
    }
  }

  return (
    <section style={kutu} data-kd="infertilite-sevk">
      <h2 style={{ margin: 0, fontSize: 16, color: CHROME_RENK.ink }}>İnfertilite — 1. basamak sevk</h2>
      <p style={{ fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
        AMH, HSG, semen ve ÜYTE sevk checklist&apos;i. Notya IVF laboratuvarı veya stimülasyon protokolü tutmaz —
        sevk paketi hazır olunca merkez hekimindir.
      </p>
      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
        {INFERTILITE_ADIM1_FULL.map((a) => (
          <label key={a.kod} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: CHROME_RENK.ink }}>
            <input type="checkbox" checked={tamam.includes(a.kod)} onChange={() => cevir(a.kod)} style={{ marginTop: 3 }} />
            <span>{a.ad}{a.zorunlu ? '' : ' (isteğe bağlı)'}</span>
          </label>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: paket.hazir ? '#22C55E' : '#FBBF24' }}>{paket.sevkMetni}</div>
      {paket.eksik.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <span style={etiketS}>Eksik zorunlu maddeler</span>
          {paket.eksik.map((e) => <div key={e} style={{ fontSize: 12, color: '#FBBF24' }}>• {e}</div>)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={btn(true)} onClick={kaydet}>Sevk paketini kaydet</button>
        {mesaj && <span style={{ fontSize: 12, color: /amadı|Hata/.test(mesaj) ? '#F87171' : '#22C55E' }}>{mesaj}</span>}
      </div>
    </section>
  )
}

export default InfertiliteStub
