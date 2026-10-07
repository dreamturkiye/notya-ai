'use client'

/**
 * NOTYA-SES-PROFILI-01 — Ayarlar › Ses profili: enrol later, re-record, delete (immediately, row gone).
 * Optional; not a security feature. Consent text: lib/asistan/sesProfili/rizaMetni.ts (PENDING LAWYER REVIEW).
 */
import { useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth'
import { sesProfiliGetir, sesProfiliSil, type SesProfiliKaydi } from '@/lib/asistan/sesProfili/istemci'
import SesProfiliKayit from '@/components/sesProfili/SesProfiliKayit'

function tarih(s: string | null): string {
  if (!s) return ''
  try { return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
}

export default function SesProfiliPage() {
  const [kayit, setKayit] = useState<SesProfiliKaydi | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayitAcik, setKayitAcik] = useState(false)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [siliniyor, setSiliniyor] = useState(false)

  const yukle = async () => {
    const t = await ensureDoctorAccessToken()
    if (!t) { window.location.href = DOKTOR_GIRIS; return }
    setKayit(await sesProfiliGetir(t))
    setYukleniyor(false)
  }
  useEffect(() => { void yukle() }, [])

  const sil = async () => {
    if (!window.confirm('Ses profiliniz kalıcı olarak silinecek. Emin misiniz?')) return
    setSiliniyor(true)
    const t = await ensureDoctorAccessToken()
    const ok = t ? await sesProfiliSil(t) : false
    setSiliniyor(false)
    setMesaj(ok ? 'Ses profiliniz silindi.' : 'Ses profili silinemedi. Lütfen tekrar deneyin.')
    await yukle()
  }

  const kart = { background: '#fff', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: '18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)' } as const
  const dugme = { padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${CHROME_RENK.pine}` } as const

  return (
    <div style={{ maxWidth: 680, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Ayarlar</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d' }}>Ses profili</h1>
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 22 }}>
        İsteğe bağlı. Ayşe konuşurken sizin sesinizi odadaki diğer seslerden ayırt etmesine yardım eder. Ses kaydınız saklanmaz; yalnızca matematiksel profil saklanır.
      </p>
      {mesaj && <div style={{ fontSize: 14, color: CHROME_RENK.pine, marginBottom: 14 }}>{mesaj}</div>}
      {yukleniyor && <div style={{ color: CHROME_RENK.muted }}>Yükleniyor…</div>}
      {!yukleniyor && !kayitAcik && (
        <div style={kart}>
          {kayit?.var ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Ses profiliniz var</div>
              <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 4 }}>
                Oluşturma: {tarih(kayit.olusturma)}{kayit.guncelleme && kayit.guncelleme !== kayit.olusturma ? ` · Son kayıt: ${tarih(kayit.guncelleme)}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setMesaj(null); setKayitAcik(true) }} style={{ ...dugme, background: CHROME_RENK.pine, color: '#fff' }}>Yeniden kaydet</button>
                <button type="button" disabled={siliniyor} onClick={() => void sil()} style={{ ...dugme, background: '#fff', color: CHROME_RENK.warn, borderColor: CHROME_RENK.warn }}>Ses profilimi sil</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Ses profiliniz yok</div>
              <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 4 }}>Ayşe şu an sesinizi diğer seslerden ayırt etmeden dinliyor.</div>
              <button type="button" onClick={() => { setMesaj(null); setKayitAcik(true) }} style={{ ...dugme, marginTop: 16, background: CHROME_RENK.pine, color: '#fff' }}>Ses profili oluştur</button>
            </>
          )}
        </div>
      )}
      {kayitAcik && (
        <div style={kart}>
          <SesProfiliKayit
            simdiDegilMetni="Vazgeç"
            onSimdiDegil={() => setKayitAcik(false)}
            onBitti={(ok) => { setKayitAcik(false); if (ok) setMesaj('Ses profiliniz kaydedildi.'); void yukle() }}
          />
        </div>
      )}
    </div>
  )
}
