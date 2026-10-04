'use client'
/**
 * NOTYA-RANDEVU-V2 PR2 — Entegrasyonlar › Google Takvim. Hidden entirely until the server has Google credentials
 * (GET answers hazir:false). Connect / disconnect; event titles are the patient's initials unless the doctor turns
 * on full names (KVKK). Google events become busy time for online booking; titles are never read into Notya.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import GoogleTakvimOnerileri from './GoogleTakvimOnerileri'

const R = CHROME_RENK
type Durum = { hazir: boolean; bagli?: boolean; durum?: 'bagli' | 'yenilenmeli' | null; adres?: string | null; tamAd?: boolean }

const SONUC: Record<string, string> = {
  baglandi: 'Google Takvim bağlandı.',
  vazgecildi: 'Bağlantı iptal edildi.',
  'izin-eksik': 'Takvim izni verilmedi. Lütfen izin ekranında takvim kutusunu işaretleyin.',
  hata: 'Bağlantı kurulamadı. Lütfen tekrar deneyin.',
  kapali: 'Google Takvim henüz açık değil.',
}

async function istek<T>(yol: string, init?: RequestInit): Promise<T> {
  const t = await ensureDoctorAccessToken()
  const r = await fetch(yol, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j as { error?: string }).error || 'İşlem yapılamadı.')
  return j as T
}

export default function GoogleTakvimKarti() {
  const [d, setD] = useState<Durum | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [mesaj, setMesaj] = useState('')

  const yukle = useCallback(async () => {
    try { setD(await istek<Durum>('/api/doktor/google-takvim')) } catch { setD({ hazir: false }) }
  }, [])
  useEffect(() => {
    void yukle()
    const s = new URLSearchParams(window.location.search).get('google')
    if (s && SONUC[s]) setMesaj(SONUC[s])
  }, [yukle])

  const baglan = async () => {
    setMesgul(true); setMesaj('')
    try {
      const j = await istek<{ url: string }>('/api/doktor/google-takvim/baslat', { method: 'POST' })
      window.location.href = j.url
    } catch (e) { setMesaj((e as Error).message); setMesgul(false) }
  }
  const kes = async () => {
    if (!window.confirm('Google Takvim bağlantısı kesilsin mi? Notya’nın eklediği yaklaşan etkinlikler takviminizden kaldırılır.')) return
    setMesgul(true)
    try { await istek('/api/doktor/google-takvim', { method: 'DELETE' }); await yukle(); setMesaj('Bağlantı kesildi.') }
    catch (e) { setMesaj((e as Error).message) } finally { setMesgul(false) }
  }
  const tamAd = async (v: boolean) => {
    setMesgul(true)
    try { await istek('/api/doktor/google-takvim', { method: 'PATCH', body: JSON.stringify({ tamAd: v }) }); await yukle() }
    catch (e) { setMesaj((e as Error).message) } finally { setMesgul(false) }
  }

  if (!d?.hazir) return null
  const dugme: React.CSSProperties = { height: 40, padding: '0 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  return (
    <div style={{ background: '#fff', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 20px', marginTop: 12, boxShadow: '0 8px 18px rgba(58,44,34,0.045)', color: R.ink, fontFamily: CHROME_FONT.sans }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Google Takvim</div>
          <div style={{ fontSize: 13, color: R.muted, marginTop: 4 }}>
            {d.bagli
              ? d.durum === 'yenilenmeli' ? 'Bağlantının yenilenmesi gerekiyor.' : `Bağlı${d.adres ? ` · ${d.adres}` : ''}`
              : 'Onaylı randevular takviminize düşer; takviminizdeki dolu saatler online randevuya kapanır.'}
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: d.bagli && d.durum === 'bagli' ? '#3F7D4A' : '#B4832F', whiteSpace: 'nowrap' }}>
          {d.bagli ? (d.durum === 'bagli' ? 'Bağlı' : 'Yenileyin') : 'Bağlı değil'}
        </span>
      </div>
      {d.bagli && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, marginTop: 12 }}>
          <input type="checkbox" checked={!!d.tamAd} disabled={mesgul} onChange={(e) => void tamAd(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Etkinlik başlığında hastanın tam adı görünsün<br /><span style={{ fontSize: 12, color: R.muted }}>Kapalıyken yalnız baş harfler (ör. “A. Y.”) yazılır. KVKK açısından kapalı tutmanız önerilir.</span></span>
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {(!d.bagli || d.durum === 'yenilenmeli') && (
          <button type="button" disabled={mesgul} onClick={() => void baglan()} style={{ ...dugme, border: 'none', background: R.pine, color: '#FAF8F4' }}>
            {d.bagli ? 'Yeniden bağla' : 'Google Takvim’i bağla'}
          </button>
        )}
        {d.bagli && (
          <button type="button" disabled={mesgul} onClick={() => void kes()} style={{ ...dugme, border: `1px solid ${R.border}`, background: 'transparent', color: R.warn }}>Bağlantıyı kes</button>
        )}
      </div>
      {mesaj && <div style={{ fontSize: 13, color: R.muted, marginTop: 10 }}>{mesaj}</div>}
      {d.bagli && <GoogleTakvimOnerileri kartStili={{ marginTop: 12, boxShadow: 'none' }} />}
    </div>
  )
}
