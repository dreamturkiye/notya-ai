'use client'

/**
 * NOTYA-FISILTI-UNIVERSAL (Kaan, 2026-09-24) -- standalone production port of "Notya fısıldıyor",
 * styled for the CURRENT dark-navy production theme (this file intentionally does not import
 * anything from the yeni-görünüm redesign -- lib/doktor/chromeTheme.ts etc. don't exist on main).
 * Purpose: let Dr. Gökhan test the real capability on production without the redesign merge
 * decision being made for anyone -- see docs/OPEN-COMMITMENTS.md NOTYA-FISILTI-UNIVERSAL.
 *
 * Same backend, same behavior as the redesign version: calls the universal /api/doktor/fisilti
 * endpoint (resolves the doctor's own branş, reuses that branş's existing kohort route, also
 * checks overdue unread portal messages), same "clear by resolving, not dismissing" rule, same
 * honest empty state instead of rendering nothing.
 *
 * NOTYA-FISILTI-GIZLE-01: "Gizle" per item — until the facts change, or "7 gün sonra hatırlat".
 * "Gizlenenler (n)" lists hidden items with "Geri getir". Hiding never changes clinical data and
 * there is deliberately no delete (clinical safety). Every fetch is no-store so a dose written by
 * an approved note (NOTYA-ASI-NOT) shows on the next load.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

interface Gizlenen { gizleId: string; ad: string; baslik: string; detay: string; until: string | null }

const LEAF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

const kucukBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, color: '#C9D4E3',
  fontSize: 12, padding: '6px 12px', minHeight: 32, cursor: 'pointer',
}
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 0', color: '#8FA0B5', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }

const tarihGoster = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })

async function istek(yol: string, init?: RequestInit): Promise<Response | null> {
  const t = await ensureDoctorAccessToken()
  if (!t) return null
  return fetch(yol, { ...init, cache: 'no-store', headers: { ...(init?.headers || {}), Authorization: `Bearer ${t}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
}

export default function NotyaFisildiyor({ specialty }: { specialty: string }) {
  const router = useRouter()
  const [item, setItem] = useState<FisiltiItem | null>(null)
  const [toplam, setToplam] = useState(0)
  const [gizliSayisi, setGizliSayisi] = useState(0)
  const [kapsamDisi, setKapsamDisi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gizleMenu, setGizleMenu] = useState(false)
  const [gizlenenler, setGizlenenler] = useState<Gizlenen[] | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const r = await istek('/api/doktor/fisilti')
      if (!r?.ok) return
      const j = await r.json()
      setItem(j.item || null)
      setToplam(Number(j.toplam) || 0)
      setGizliSayisi(Number(j.gizliSayisi) || 0)
      setKapsamDisi(!!j.kapsamDisi)
    } catch { /* Fısıltı kritik değil */ } finally { setYukleniyor(false) }
  }, [])

  const gizlenenleriYukle = useCallback(async () => {
    try {
      const r = await istek('/api/doktor/fisilti/gizle')
      if (!r?.ok) return
      const j = await r.json()
      setGizlenenler(Array.isArray(j.gizlenenler) ? j.gizlenenler : [])
    } catch { /* sessiz */ }
  }, [])

  useEffect(() => { yukle() }, [yukle, specialty])

  const gizle = async (sure: 'kalici' | '7gun') => {
    if (!item || mesgul) return
    setMesgul(true); setHata('')
    try {
      const r = await istek('/api/doktor/fisilti/gizle', { method: 'POST', body: JSON.stringify({ itemId: item.id, sure }) })
      if (!r?.ok) { const j = await r?.json().catch(() => ({})); setHata(j?.error || 'Gizlenemedi — tekrar deneyin.'); return }
      setGizleMenu(false)
      await yukle()
      if (gizlenenler) await gizlenenleriYukle()
    } finally { setMesgul(false) }
  }

  const geriGetir = async (gizleId: string) => {
    if (mesgul) return
    setMesgul(true); setHata('')
    try {
      const r = await istek('/api/doktor/fisilti/gizle', { method: 'PATCH', body: JSON.stringify({ gizleId }) })
      if (!r?.ok) { setHata('Geri getirilemedi — tekrar deneyin.'); return }
      await Promise.all([yukle(), gizlenenleriYukle()])
    } finally { setMesgul(false) }
  }

  if (kapsamDisi) return null
  if (yukleniyor) return null

  const panel: React.CSSProperties = {
    background: '#0D1C33',
    border: '1px solid rgba(255,255,255,0.08)',
    borderLeft: '3px solid #0F9B8E',
    borderRadius: 16,
    padding: '18px 20px',
    marginTop: 18,
  }

  const gizlenenBolumu = gizliSayisi > 0 && (
    <div style={{ marginTop: 10 }}>
      <button type="button" style={linkBtn} aria-expanded={!!gizlenenler} onClick={() => (gizlenenler ? setGizlenenler(null) : gizlenenleriYukle())}>
        Gizlenenler ({gizliSayisi})
      </button>
      {gizlenenler && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gizlenenler.map((g) => (
            <div key={g.gizleId} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: '#C9D4E3', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 10px' }}>
              <span style={{ flex: '1 1 220px', overflowWrap: 'anywhere' }}>
                <strong style={{ color: '#EDF1F7' }}>{g.ad}</strong> — {g.baslik}
                {g.until && <span style={{ color: '#8FA0B5' }}> · {tarihGoster(g.until)} tarihinde yeniden görünecek</span>}
              </span>
              <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => geriGetir(g.gizleId)}>Geri getir</button>
            </div>
          ))}
          {!gizlenenler.length && <div style={{ fontSize: 12, color: '#8FA0B5' }}>Gizlenen uyarı yok.</div>}
        </div>
      )}
    </div>
  )

  if (!item) {
    return (
      <div style={panel}>
        <div style={{ fontStyle: 'italic', color: '#2DD4BF', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 16, lineHeight: 1.3, color: '#EDF1F7' }}>
          Şu an bekleyen bir şey yok — her şey güncel.
        </div>
        {gizlenenBolumu}
      </div>
    )
  }

  return (
    <div style={panel}>
      <button
        type="button"
        onClick={() => router.push(item.hedefYol)}
        style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit' }}
      >
        <div style={{ fontStyle: 'italic', color: '#2DD4BF', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 17, lineHeight: 1.3, fontWeight: 600, color: '#EDF1F7' }}>
          {item.ad} — {item.baslik}
        </div>
        {item.detay[0] && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#C9D4E3', lineHeight: 1.5 }}>{item.detay[0]}</div>
        )}
        {toplam > 1 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#8FA0B5' }}>+{toplam - 1} hastada daha bekleyen kontrol var</div>
        )}
      </button>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {!gizleMenu ? (
          <button type="button" style={kucukBtn} aria-expanded={false} onClick={() => setGizleMenu(true)}>Gizle</button>
        ) : (
          <>
            <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => gizle('kalici')}>Bu uyarıyı gizle</button>
            <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => gizle('7gun')}>7 gün sonra hatırlat</button>
            <button type="button" style={linkBtn} onClick={() => setGizleMenu(false)}>Vazgeç</button>
          </>
        )}
      </div>
      {gizleMenu && <div style={{ marginTop: 6, fontSize: 12, color: '#8FA0B5' }}>Gizlemek kayıtları değiştirmez; uyarının içeriği değişirse (yeni gecikme, yeni tarih) yeniden görünür.</div>}
      {hata && <div style={{ marginTop: 6, fontSize: 12, color: '#FCA5A5' }}>{hata}</div>}
      {gizlenenBolumu}
    </div>
  )
}
