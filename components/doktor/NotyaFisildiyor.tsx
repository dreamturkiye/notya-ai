'use client'

/**
 * NOTYA-FISILTI-UNIVERSAL (Kaan, 2026-09-24) — "Notya fısıldıyor" is no longer pediatri-only.
 * It now calls the universal `/api/doktor/fisilti` endpoint, which resolves the doctor's own
 * branş to the right existing kohort route and normalizes the result -- this component doesn't
 * need to know which of the 29 branş engines produced the flag.
 *
 * Everything from the original design carries over unchanged:
 * - "Clear by resolving, not dismissing": recomputed fresh from the real record every load, no
 *   separate dismiss state to get out of sync.
 * - Honest empty state when the doctor's branş IS supported but genuinely has nothing pending
 *   (renders a calm card, not nothing) -- vs. silently rendering nothing when the branş has no
 *   kohort engine at all yet (radyoloji has one; klinik doesn't -- that's Sprint 2).
 * - Own dark-blue visual identity (sampled from the header photo's leaves), separate from pine.
 *
 * NOTYA-FISILTI-GIZLE-01 (merged in from the production port's later work, 2026-09-24): "Gizle"
 * per item — until the facts change, or "7 gün sonra hatırlat". "Gizlenenler (n)" lists hidden
 * items with "Geri getir". Hiding never changes clinical data and there is deliberately no delete
 * (clinical safety). Every fetch is no-store so a dose written by an approved note (NOTYA-ASI-NOT)
 * shows on the next load. Functionality ported as-is from the production (dark-navy) version;
 * restyled here to the redesign's own cream/pine identity rather than carrying dark-theme colors.
 */
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

// Sampled from public/doktor-chrome/plant.jpg (blue-green leaf tones), not a design-system token --
// this box is deliberately its own accent, separate from the page's pine.
// 2026-09-24 (Kaan): the lighter leaf, as actually seen on screen -- raw tone run through the
// page's own filter (saturate .65, contrast .88, brightness 1.1) and 50% opacity blend over the
// cream background. Border added since this tone sits close to the page bg in lightness.
const FISILTI_KOYU = '#d0d8d5'
const FISILTI_KOYU2 = '#dde3e0'
const FISILTI_BORDER = 'rgba(30,51,54,0.18)'
const FISILTI_INK = '#1e3336'

interface Gizlenen { gizleId: string; ad: string; baslik: string; detay: string; until: string | null }

const LEAF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

const kucukBtn: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${FISILTI_BORDER}`, borderRadius: 999, color: FISILTI_INK,
  fontSize: 12, padding: '6px 12px', minHeight: 32, cursor: 'pointer', fontFamily: 'inherit',
}
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 0', color: '#3f5b5f', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }

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
  const [duzeltAcik, setDuzeltAcik] = useState(false)
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

  const kalkanKarar = async (islem: 'onayla' | 'duzelt', kapsam?: 'bu_gece' | 'kalan_kur') => {
    if (!item?.kalkanTaslakId || mesgul) return
    setMesgul(true); setHata('')
    try {
      const r = await istek('/api/doktor/fisilti/kalkan', { method: 'POST', body: JSON.stringify({ islem, taslakId: item.kalkanTaslakId, kapsam }) })
      if (!r?.ok) { const j = await r?.json().catch(() => ({})); setHata(j?.error || 'Kaydedilemedi.'); return }
      await yukle()
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

  // Bu branşta motor henüz yok -- kart hiç görünmez (bu, "kontrol edildi, boşçıktı"dan farklı).
  if (kapsamDisi) return null
  // Kontrol sürerken boş durumun yanıp sönmesini önler.
  if (yukleniyor) return null

  const S = (s: Record<string, unknown>) => s as React.CSSProperties

  const kartStil = S({
    background: `linear-gradient(165deg, ${FISILTI_KOYU}, ${FISILTI_KOYU2})`,
    border: `1px solid ${FISILTI_BORDER}`,
    color: FISILTI_INK, borderRadius: 20, padding: '20px 22px 18px', position: 'relative', overflow: 'hidden',
    boxShadow: '0 12px 28px rgba(30,51,54,0.1)',
  })

  const gizlenenBolumu = gizliSayisi > 0 && (
    <div style={{ marginTop: 10 }}>
      <button type="button" style={linkBtn} aria-expanded={!!gizlenenler} onClick={() => (gizlenenler ? setGizlenenler(null) : gizlenenleriYukle())}>
        Gizlenenler ({gizliSayisi})
      </button>
      {gizlenenler && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {gizlenenler.map((g) => (
            <div key={g.gizleId} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: FISILTI_INK, background: 'rgba(30,51,54,0.06)', borderRadius: 10, padding: '8px 10px' }}>
              <span style={{ flex: '1 1 220px', overflowWrap: 'anywhere' }}>
                <strong>{g.ad}</strong> — {g.baslik}
                {g.until && <span style={{ opacity: 0.7 }}> · {tarihGoster(g.until)} tarihinde yeniden görünecek</span>}
              </span>
              <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => geriGetir(g.gizleId)}>Geri getir</button>
            </div>
          ))}
          {!gizlenenler.length && <div style={{ fontSize: 12, opacity: 0.7 }}>Gizlenen uyarı yok.</div>}
        </div>
      )}
    </div>
  )

  if (!item) {
    // Gerçekten kontrol edildi, bekleyen yok -- kart kaybolmaz, durumu dürüstçe söyler.
    return (
      <div style={kartStil}>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.3, fontWeight: 500, color: FISILTI_INK })}>
          Şu an bekleyen bir şey yok — her şey güncel.
        </div>
        {gizlenenBolumu}
      </div>
    )
  }

  return (
    <div style={kartStil}>
      <button
        type="button"
        onClick={() => router.push(item.hedefYol)}
        style={S({ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit' })}
      >
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', color: '#2f5155', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 })}>
          {LEAF} Notya fısıldıyor
        </div>
        <div style={S({ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.3, fontWeight: 500, color: FISILTI_INK, whiteSpace: 'pre-wrap' })}>
          {item.kaynak === 'kalkan' ? item.detay[0] : `${item.ad} — ${item.baslik}`}
        </div>
        {item.kaynak !== 'kalkan' && item.detay[0] && (
          <div style={S({ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.5, color: FISILTI_INK })}>{item.detay[0]}</div>
        )}
        {toplam > 1 && (
          <div style={S({ marginTop: 10, fontSize: 12, opacity: 0.65, color: FISILTI_INK })}>+{toplam - 1} hastada daha bekleyen kontrol var</div>
        )}
      </button>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {item.kaynak === 'kalkan' && item.kalkanOnaylanabilir && (
          <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => void kalkanKarar('onayla')}>Onayla</button>
        )}
        {item.kaynak === 'kalkan' && !duzeltAcik && (
          <button type="button" style={kucukBtn} onClick={() => setDuzeltAcik(true)}>Düzelt</button>
        )}
        {item.kaynak === 'kalkan' && duzeltAcik && (
          <>
            <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => void kalkanKarar('duzelt', 'bu_gece')}>Yalnız bu gece</button>
            <button type="button" style={kucukBtn} disabled={mesgul} onClick={() => void kalkanKarar('duzelt', 'kalan_kur')}>Kürü bitir</button>
          </>
        )}
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
      {gizleMenu && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>Gizlemek kayıtları değiştirmez; uyarının içeriği değişirse (yeni gecikme, yeni tarih) yeniden görünür.</div>}
      {hata && <div style={{ marginTop: 6, fontSize: 12, color: '#B4453C' }}>{hata}</div>}
      {gizlenenBolumu}
    </div>
  )
}
