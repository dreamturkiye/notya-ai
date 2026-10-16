'use client'

/**
 * MBYS-BILDIR-01 — "Muayeneyi Bildir" on an approved muayene (the shared notlar page, every branş).
 * One click opens a confirmation dialog that shows the exact record; nothing leaves the page until the doctor ticks
 * the confirmation box and presses the confirm button. Honest wording: Notya does NOT submit to MBYS. The record is
 * handed to the doctor's browser helper (or copied to the clipboard) and the doctor presses every MBYS button.
 */
import { useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { MBYS_ADRES, yardimciyaGonder } from '@/lib/enabiz/mbys/yardimci'
import type { MbysEksik, MbysKayit } from '@/lib/enabiz/mbys/kontrol'

const API = '/api/doktor/araclar/enabiz/mbys/bildir'

type Onizleme = { hastaAd: string; onayli: boolean; kilit: boolean; eksikler: MbysEksik[]; metin: string; ozet: string }

async function yetkili(yol: string, init?: RequestInit) {
  const t = await ensureDoctorAccessToken()
  if (!t) throw new Error('Oturum bulunamadı.')
  const r = await fetch(yol, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(String(j.error || 'İşlem yapılamadı.'))
  return j
}

export default function MbysBildirButonu({ notId, onayli }: { notId: string; onayli: boolean }) {
  const [acik, setAcik] = useState(false)
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null)
  const [onay, setOnay] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState('')

  if (!onayli) return null

  const ac = async () => {
    setAcik(true); setOnizleme(null); setOnay(false); setHata(''); setSonuc(''); setMesgul(true)
    try {
      setOnizleme((await yetkili(`${API}?notId=${encodeURIComponent(notId)}`)) as Onizleme)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Kayıt hazırlanamadı.')
    } finally {
      setMesgul(false)
    }
  }

  const bildir = async () => {
    if (!onizleme || !onay) return
    setMesgul(true); setHata('')
    try {
      // 1) Confirm THIS record (fingerprint). The server writes the audit row before it releases the record.
      const j = await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'onayla', notId, onay: true, ozet: onizleme.ozet }) })
      // 2) Hand over inside this browser: helper first, clipboard as the fallback.
      let panoda = false
      try { await navigator.clipboard.writeText(String(j.metin || '')); panoda = true } catch { panoda = false }
      const yardimciAldi = await yardimciyaGonder(j.kayit as MbysKayit)
      const sonuc = yardimciAldi ? 'yardimci' : panoda ? 'panoya' : 'basarisiz'
      // 3) Report the outcome so the audit trail shows what really happened.
      await yetkili(API, { method: 'POST', body: JSON.stringify({ islem: 'sonuc', onayId: j.onayId, sonuc }) })
      if (sonuc === 'basarisiz') throw new Error('Kayıt devredilemedi: yardımcı bulunamadı ve panoya kopyalanamadı.')
      setSonuc(
        yardimciAldi
          ? `Kayıt MBYS Yardımcısı’na devredildi (10 dakika geçerli). MBYS sekmesinde “Notya'dan doldur”a basın; MBYS’deki düğmelere siz basarsınız.${panoda ? ' Metin ayrıca panoya kopyalandı.' : ''}`
          : 'MBYS Yardımcısı bulunamadı — kayıt metni panoya kopyalandı. MBYS formuna yapıştırabilirsiniz.',
      )
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bildirim yapılamadı.')
    } finally {
      setMesgul(false)
    }
  }

  const engel = onizleme && (onizleme.kilit || onizleme.eksikler.length > 0)

  return (
    <>
      <button
        type="button"
        onClick={() => { void ac() }}
        style={{ color: CHROME_RENK.pine, fontSize: 13, background: 'transparent', border: '1px solid rgba(47,67,52,0.4)', borderRadius: 999, padding: '7px 12px', cursor: 'pointer' }}
      >
        📤 Muayeneyi Bildir
      </button>
      {acik && (
        <div role="dialog" aria-modal="true" aria-label="Muayeneyi Bildir" style={{ position: 'fixed', inset: 0, background: 'rgba(30,24,18,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFDF8', borderRadius: 14, maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 20, border: '1px solid rgba(58,44,34,0.16)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Muayeneyi Bildir{onizleme ? ` — ${onizleme.hastaAd}` : ''}</div>
            <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, marginBottom: 12 }}>
              Notya MBYS’ye <b>kendisi göndermez</b>. Aşağıdaki kayıt tarayıcınızdaki MBYS Yardımcısı’na devredilir (yoksa panoya kopyalanır); MBYS formunu ({MBYS_ADRES.replace('https://', '')}) kontrol edip kaydetmek size aittir.
            </div>
            {mesgul && !onizleme && !hata ? <div style={{ fontSize: 13 }}>Kayıt hazırlanıyor…</div> : null}
            {onizleme?.kilit ? <div style={{ fontSize: 13, color: '#9B2C2C', marginBottom: 8 }}>Hasta e-Nabız’a gönderilmesini istemiyor; bildirim yapılamaz.</div> : null}
            {onizleme && onizleme.eksikler.length > 0 && !onizleme.kilit ? (
              <div style={{ fontSize: 13, color: '#9B2C2C', marginBottom: 8 }}>
                Eksik bilgi: {onizleme.eksikler.map((e) => e.mesaj).join('; ')}. Tamamlamak için Araçlar → e-Nabız → Gün sonu MBYS kuyruğu.
              </div>
            ) : null}
            {onizleme && !onizleme.kilit ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, background: '#F6F1E6', borderRadius: 10, padding: 12, margin: '0 0 12px', maxHeight: 300, overflow: 'auto' }}>{onizleme.metin}</pre>
            ) : null}
            {onizleme && !engel && !sonuc ? (
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginBottom: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} style={{ marginTop: 3 }} />
                <span>Yukarıdaki kaydı kontrol ettim; doğru olduğunu onaylıyorum ve MBYS’ye bildirilmek üzere devredilmesini istiyorum.</span>
              </label>
            ) : null}
            {hata ? <div role="alert" style={{ fontSize: 13, color: '#9B2C2C', marginBottom: 8 }}>{hata}</div> : null}
            {sonuc ? <div style={{ fontSize: 13, color: '#2E6E4E', marginBottom: 8 }}>{sonuc}</div> : null}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setAcik(false)} style={{ background: '#fff', border: '1px solid rgba(58,44,34,0.2)', borderRadius: 10, padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>
                {sonuc ? 'Kapat' : 'Vazgeç'}
              </button>
              {!sonuc && (
                <button
                  type="button"
                  disabled={!onizleme || !!engel || !onay || mesgul}
                  onClick={() => { void bildir() }}
                  style={{ background: CHROME_RENK.pine, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: !onizleme || engel || !onay || mesgul ? 0.5 : 1 }}
                >
                  {mesgul && onizleme ? 'Devrediliyor…' : 'Onaylıyorum, devret'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
