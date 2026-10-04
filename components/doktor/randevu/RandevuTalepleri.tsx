'use client'
/**
 * NOTYA-RANDEVU-V2 — patient appointment requests on Ana Sayfa and Randevular (doktor + sekreter).
 * Onayla / Başka saat öner / Reddet. Hidden when there is nothing open — with 'Hasta Portalı Randevu' OFF
 * (or before migration 111) the list is always empty, so the screen is exactly as before.
 * Requests past the doctor's escalation period, or whose time has passed, are pinned on top in red.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

const R = CHROME_RENK

type Talep = {
  id: string
  hastaAdi: string
  gun: string
  saat: string
  oneriBekliyor: boolean
  gecikti: boolean
  zamaniGecti: boolean
}
type Gun = { gun: string; slotlar: { bas: string; saat: string }[] }

/** Card title. Pure, exported for the test. */
export const talepBasligi = (n: number) => (n === 1 ? '1 randevu talebi' : `${n} randevu talebi`)

const gunAdi = (gun: string) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${gun}T12:00:00Z`))

async function istek<T>(yol: string, init?: RequestInit): Promise<T> {
  const t = await ensureDoctorAccessToken()
  const r = await fetch(yol, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j as { error?: string }).error || 'İşlem yapılamadı.')
  return j as T
}

const dugme = (vurgu: boolean): React.CSSProperties => ({
  minHeight: 36, padding: '6px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  border: vurgu ? 'none' : `1px solid ${R.border}`, background: vurgu ? R.pine : 'transparent', color: vurgu ? R.paper : R.ink,
})

export default function RandevuTalepleri({ kartStili }: { kartStili?: React.CSSProperties } = {}) {
  const [talepler, setTalepler] = useState<Talep[]>([])
  const [oneri, setOneri] = useState<{ id: string; gunler: Gun[] | null; gun: string } | null>(null)
  const [mesgul, setMesgul] = useState('')
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const j = await istek<{ talepler: Talep[] }>('/api/doktor/randevu-portal/talepler')
      setTalepler(j.talepler || [])
    } catch { setTalepler([]) }
  }, [])
  useEffect(() => { void yukle() }, [yukle])

  const isle = async (id: string, islem: 'onayla' | 'oner' | 'reddet', baslangic?: string) => {
    setMesgul(id); setHata('')
    try {
      await istek('/api/doktor/randevu-portal/talepler', { method: 'POST', body: JSON.stringify({ id, islem, baslangic }) })
      setOneri(null)
      await yukle()
    } catch (e) {
      setHata((e as Error).message)
    } finally {
      setMesgul('')
    }
  }

  const oneriAc = async (id: string) => {
    if (oneri?.id === id) { setOneri(null); return }
    setOneri({ id, gunler: null, gun: '' })
    try {
      const j = await istek<{ gunler: Gun[] }>(`/api/doktor/randevu-portal/talepler?slotlar=${encodeURIComponent(id)}`)
      setOneri({ id, gunler: j.gunler || [], gun: j.gunler?.[0]?.gun || '' })
    } catch (e) {
      setHata((e as Error).message); setOneri(null)
    }
  }

  if (!talepler.length) return null
  return (
    <div style={{ background: R.paper, border: `1px solid ${R.border}`, borderRadius: 20, padding: '16px 20px', boxShadow: '0 16px 34px rgba(58,44,34,0.06)', fontFamily: CHROME_FONT.sans, color: R.ink, ...kartStili }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{talepBasligi(talepler.length)}</div>
      <div style={{ fontSize: 13, color: R.muted, marginBottom: 10 }}>Sağlığım’dan gelen talepler; saat siz yanıtlayana kadar ayrılı kalır.</div>
      {talepler.map((t) => {
        const kirmizi = t.gecikti || t.zamaniGecti
        return (
          <div key={t.id} style={{ borderTop: `1px solid ${R.borderSoft}`, padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>{t.hastaAdi} · {t.gun} {t.saat}</span>
              {t.oneriBekliyor
                ? <span style={{ fontSize: 12, color: R.muted }}>Önerinize yanıt bekleniyor</span>
                : kirmizi && <span style={{ fontSize: 12, fontWeight: 700, color: R.warn }}>{t.zamaniGecti ? 'Saati geçti — hastaya bilgi verin' : 'Yanıt bekliyor'}</span>}
            </div>
            {!t.oneriBekliyor && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {!t.zamaniGecti && <button type="button" disabled={!!mesgul} style={dugme(true)} onClick={() => void isle(t.id, 'onayla')}>Onayla</button>}
                <button type="button" disabled={!!mesgul} style={dugme(false)} onClick={() => void oneriAc(t.id)}>Başka saat öner</button>
                <button type="button" disabled={!!mesgul} style={{ ...dugme(false), color: R.warn }} onClick={() => { if (window.confirm('Talep reddedilsin mi? Hastaya bildirilir.')) void isle(t.id, 'reddet') }}>Reddet</button>
              </div>
            )}
            {oneri?.id === t.id && (
              <div style={{ marginTop: 10 }}>
                {oneri.gunler === null ? <span style={{ fontSize: 13, color: R.muted }}>Boş saatler yükleniyor…</span>
                  : !oneri.gunler.length ? <span style={{ fontSize: 13, color: R.muted }}>Önümüzdeki günlerde boş saat yok.</span>
                    : (
                      <>
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                          {oneri.gunler.map((g) => (
                            <button key={g.gun} type="button" style={{ ...dugme(g.gun === oneri.gun), whiteSpace: 'nowrap' }} onClick={() => setOneri({ ...oneri, gun: g.gun })}>{gunAdi(g.gun)}</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(oneri.gunler.find((g) => g.gun === oneri.gun)?.slotlar || []).map((s) => (
                            <button key={s.bas} type="button" disabled={!!mesgul} style={dugme(false)} onClick={() => void isle(t.id, 'oner', s.bas)}>{s.saat}</button>
                          ))}
                        </div>
                      </>
                    )}
              </div>
            )}
          </div>
        )
      })}
      {hata && <div style={{ color: R.warn, fontSize: 13, marginTop: 6 }}>{hata}</div>}
    </div>
  )
}
