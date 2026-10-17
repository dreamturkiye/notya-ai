'use client'
/**
 * MOBIL-PERSONEL-01 (c) — Hesabım › Oturumlar. Shows the last sign-in and this device, and offers
 * "Tüm cihazlardan çıkış yap" (revokes every refresh token of the account). Doctor and staff alike.
 */
import { useEffect, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'

type Bilgi = { sonGiris: string | null; hesapOlusturma: string | null; buCihaz: string }

export default function OturumKarti() {
  const [bilgi, setBilgi] = useState<Bilgi | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState('')

  useEffect(() => {
    let iptal = false
    ;(async () => {
      const t = await ensureDoctorAccessToken()
      if (!t) return
      try {
        const r = await fetch('/api/doktor/hesap/oturum', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
        if (r.ok && !iptal) setBilgi(await r.json())
      } catch { /* kart bilgi göstermez */ }
    })()
    return () => { iptal = true }
  }, [])

  async function hepsindenCik() {
    if (!confirm('Bu hesap tüm cihazlardan çıkış yapsın mı? Diğer cihazlarda oturum en geç 1 saat içinde kapanır; yeniden giriş gerekir.')) return
    setMesgul(true); setHata('')
    try {
      const t = await ensureDoctorAccessToken()
      const r = await fetch('/api/doktor/hesap/oturum', { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } })
      if (!r.ok) { const j = await r.json().catch(() => ({})); setHata(j.error || 'Oturumlar kapatılamadı.'); return }
      const key = Object.keys(localStorage).find((k) => k.includes('auth-token')) || ''
      if (key) localStorage.removeItem(key)
      window.location.href = '/giris/doktor'
    } catch {
      setHata('Oturumlar kapatılamadı. Bağlantınızı kontrol edin.')
    } finally {
      setMesgul(false)
    }
  }

  const sonGiris = bilgi?.sonGiris
    ? new Date(bilgi.sonGiris).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 18, marginTop: 20, boxShadow: '0 8px 18px rgba(58,44,34,0.045)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: CHROME_RENK.ink }}>Oturumlar</div>
      <p style={{ fontSize: 12, color: CHROME_RENK.muted, margin: '0 0 12px' }}>
        Hesabınıza her yerden (ofis, ev, telefon) giriş yapabilirsiniz. Bir cihazı kaybettiyseniz ya da başkası şifrenizi öğrendiyse
        tüm cihazlardan çıkış yapıp şifrenizi değiştirin.
      </p>
      <dl style={{ margin: '0 0 14px', display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 14px', fontSize: 13 }}>
        <dt style={{ color: CHROME_RENK.muted }}>Son giriş</dt><dd style={{ margin: 0, color: CHROME_RENK.ink }}>{sonGiris}</dd>
        <dt style={{ color: CHROME_RENK.muted }}>Bu cihaz</dt><dd style={{ margin: 0, color: CHROME_RENK.ink }}>{bilgi?.buCihaz || '—'}</dd>
      </dl>
      {hata && <div style={{ color: CHROME_RENK.warn, fontSize: 13, marginBottom: 10 }}>{hata}</div>}
      <button
        type="button"
        onClick={hepsindenCik}
        disabled={mesgul}
        style={{ background: 'transparent', border: `1px solid ${CHROME_RENK.warn}55`, color: CHROME_RENK.warn, borderRadius: 8, padding: '10px 18px', minHeight: 44, fontWeight: 600, cursor: 'pointer', width: '100%' }}
      >
        {mesgul ? 'Kapatılıyor…' : 'Tüm cihazlardan çıkış yap'}
      </button>
    </div>
  )
}
