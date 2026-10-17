'use client'
/**
 * MUAYENE-EKLERI-07 (Dr. Gökhan Mamur, 2026-10-16) — "Yüklenen dosyalar" section + file viewer for the muayene note.
 *
 * Section: every document uploaded during the visit (original name + classification label), each a link. Nothing is
 * rendered while loading, when the visit has no files, or when the NOTYA_MUAYENE_EKLERI switch is off (the list route
 * answers 404) — pre-existing notes without attachments look exactly as before.
 * Viewer: a panel to the RIGHT of the report on desktop (the page gets padding-right through the --yd-sag CSS
 * variable, so the report stays visible and scrollable), a full-screen sheet with a big "Kapat" on phones. The page is
 * never unmounted or navigated, so form state and scroll position are untouched. Images zoom/pan, PDFs embed, other
 * types offer download. Bytes arrive through the authenticated stream route and are shown from blob: URLs — no token
 * or signed link is ever placed in a URL.
 * Print: the interactive list is hidden and a plain numbered list of full names (+ classification) is printed instead.
 * Universal chrome — identical for every branş (no specialty wording).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { YUKLENEN_DOSYALAR_BASLIGI, boyutMetni, yazdirSatirlari, type YuklenenDosya } from '@/lib/doktor/muayeneEk/yuklenenDosyalar'

const YOL = '/api/doktor/muayene-ekleri/yuklenenler'
const ZOOM_MIN = 1
const ZOOM_MAX = 6

export const YUKLENEN_DOSYALAR_CSS = `
:root.yd-acik{--yd-genislik:clamp(380px,42vw,640px)}
@media (min-width:1024px){:root.yd-acik{--yd-sag:clamp(380px,42vw,640px)}}
.yd-yazdir{display:none}
.yd-baglanti{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:8px;cursor:pointer;color:${CHROME_RENK.ink};font:600 13.5px/1.35 system-ui}
.yd-baglanti:hover{background:rgba(47,67,52,0.07)}
.yd-baglanti:focus-visible{outline:2px solid ${CHROME_RENK.pine};outline-offset:1px}
.yd-baglanti[aria-current="true"]{background:rgba(47,67,52,0.12)}
.yd-ad{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:underline;text-decoration-color:rgba(47,67,52,0.35);text-underline-offset:3px}
.yd-panel{position:fixed;top:0;right:0;bottom:0;width:var(--yd-genislik,520px);z-index:60;background:#FAF8F4;border-left:1px solid rgba(58,44,34,0.18);box-shadow:-6px 0 24px rgba(0,0,0,0.12);display:flex;flex-direction:column;font-family:system-ui;color:${CHROME_RENK.ink}}
@media (max-width:1023px){.yd-panel{inset:0;width:auto;border-left:0;box-shadow:none}}
.yd-dugme{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 12px;border-radius:8px;border:1px solid rgba(58,44,34,0.18);background:#fff;font:600 13px/1 system-ui;color:${CHROME_RENK.ink};white-space:nowrap}
.yd-dugme:hover{background:#F6F0E4}
.yd-dugme:focus-visible{outline:2px solid ${CHROME_RENK.pine};outline-offset:1px}
.yd-dugme[disabled]{opacity:.4;cursor:default}
.yd-kapat{background:${CHROME_RENK.pine};color:#FAF8F4;border-color:${CHROME_RENK.pine};padding:9px 16px;font-size:14px}
.yd-kapat:hover{background:#243628}
@media print{.yd-ekran,.yd-panel{display:none!important}.yd-yazdir{display:block!important}}
`

type Durum = { tur: 'bos' } | { tur: 'yukleniyor' } | { tur: 'hazir'; blob: Blob; url: string } | { tur: 'hata'; mesaj: string }

async function dosyaGetir(sessionId: string, id: string, indir: boolean, sinyal?: AbortSignal): Promise<Blob> {
  const t = await ensureDoctorAccessToken()
  const r = await fetch(`${YOL}/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}${indir ? '&indir=1' : ''}`, { headers: { Authorization: `Bearer ${t}` }, signal: sinyal })
  if (!r.ok) throw new Error(r.status === 404 ? 'Dosya bulunamadı.' : 'Dosya açılamadı.')
  return r.blob()
}

function kaydet(blob: Blob, ad: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ad
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function simge(d: YuklenenDosya): string {
  return d.gorunum === 'gorsel' ? '🖼' : d.gorunum === 'pdf' ? '📄' : '📎'
}

interface Props {
  /** The visit (sessions.id) the note belongs to. Nothing renders without it. */
  sessionId: string | null | undefined
  /** Receives the loaded list (e.g. for the plain-text HBYS export). */
  onListe?: (liste: YuklenenDosya[]) => void
  /** Print page: wrap in the print stylesheet's own section classes. */
  yazdirSayfasi?: boolean
}

export default function YuklenenDosyalar({ sessionId, onListe, yazdirSayfasi }: Props) {
  const [dosyalar, setDosyalar] = useState<YuklenenDosya[]>([])
  const [secili, setSecili] = useState<number | null>(null)
  const [durum, setDurum] = useState<Durum>({ tur: 'bos' })
  const [olcek, setOlcek] = useState(1)
  const [kayma, setKayma] = useState({ x: 0, y: 0 })
  const acanRef = useRef<HTMLElement | null>(null)
  const onListeRef = useRef(onListe)
  useEffect(() => { onListeRef.current = onListe }, [onListe])

  // Load the list. Any failure (switch off, no session, network) simply means: no section.
  useEffect(() => {
    if (!sessionId) { setDosyalar([]); return }
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        const r = await fetch(`${YOL}?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${t}` } })
        if (!r.ok) throw new Error('liste yok')
        const j = await r.json() as { dosyalar?: YuklenenDosya[] }
        if (iptal) return
        const liste = Array.isArray(j.dosyalar) ? j.dosyalar : []
        setDosyalar(liste)
        onListeRef.current?.(liste)
      } catch { if (!iptal) { setDosyalar([]); onListeRef.current?.([]) } }
    })()
    return () => { iptal = true }
  }, [sessionId])

  const aktif = secili != null ? dosyalar[secili] ?? null : null
  const kapat = useCallback(() => {
    setSecili(null)
    const el = acanRef.current
    acanRef.current = null
    if (el && typeof el.focus === 'function') setTimeout(() => el.focus(), 0)
  }, [])

  // Fetch the selected file (images / PDFs inline; other types wait for an explicit download).
  const aktifId = aktif?.id ?? null
  const aktifGorunum = aktif?.gorunum ?? null
  useEffect(() => {
    setOlcek(1); setKayma({ x: 0, y: 0 })
    if (!sessionId || !aktifId || aktifGorunum === 'diger') { setDurum({ tur: 'bos' }); return }
    const ac = new AbortController()
    let url: string | null = null
    setDurum({ tur: 'yukleniyor' })
    dosyaGetir(sessionId, aktifId, false, ac.signal)
      .then((blob) => { url = URL.createObjectURL(blob); setDurum({ tur: 'hazir', blob, url }) })
      .catch((e: unknown) => { if (!ac.signal.aborted) setDurum({ tur: 'hata', mesaj: e instanceof Error ? e.message : 'Dosya açılamadı.' }) })
    return () => { ac.abort(); if (url) URL.revokeObjectURL(url) }
  }, [sessionId, aktifId, aktifGorunum])

  // Layout flag (page padding on desktop), page scroll lock on phones and keyboard shortcuts — only while open.
  const acik = aktif != null
  useEffect(() => {
    if (!acik) return
    const kok = document.documentElement
    kok.classList.add('yd-acik')
    const onceki = document.body.style.overflow
    const telefon = window.matchMedia?.('(max-width:1023px)').matches
    if (telefon) document.body.style.overflow = 'hidden'
    const tus = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement | null
      if (h && (h.tagName === 'INPUT' || h.tagName === 'TEXTAREA' || h.tagName === 'SELECT' || h.isContentEditable)) return
      if (e.key === 'Escape') kapat()
      else if (e.key === 'ArrowLeft') setSecili((s) => (s != null && s > 0 ? s - 1 : s))
      else if (e.key === 'ArrowRight') setSecili((s) => (s != null && s < dosyalar.length - 1 ? s + 1 : s))
    }
    window.addEventListener('keydown', tus)
    return () => { kok.classList.remove('yd-acik'); document.body.style.overflow = onceki; window.removeEventListener('keydown', tus) }
  }, [acik, kapat, dosyalar.length])

  // Image pan / pinch
  const isaretciler = useRef(new Map<number, { x: number; y: number }>())
  const kıstırma = useRef<{ mesafe: number; olcek: number } | null>(null)
  const sinirla = (s: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s))
  const yakinlastir = (s: number) => { const n = sinirla(s); setOlcek(n); if (n === 1) setKayma({ x: 0, y: 0 }) }
  const basla = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    isaretciler.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (isaretciler.current.size === 2) {
      const [a, b] = Array.from(isaretciler.current.values())
      kıstırma.current = { mesafe: Math.hypot(a.x - b.x, a.y - b.y) || 1, olcek }
    }
  }
  const hareket = (e: React.PointerEvent) => {
    const onceki = isaretciler.current.get(e.pointerId)
    if (!onceki) return
    isaretciler.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (isaretciler.current.size === 2 && kıstırma.current) {
      const [a, b] = Array.from(isaretciler.current.values())
      yakinlastir(kıstırma.current.olcek * (Math.hypot(a.x - b.x, a.y - b.y) / kıstırma.current.mesafe))
    } else if (isaretciler.current.size === 1 && olcek > 1) {
      setKayma((k) => ({ x: k.x + e.clientX - onceki.x, y: k.y + e.clientY - onceki.y }))
    }
  }
  const bitir = (e: React.PointerEvent) => { isaretciler.current.delete(e.pointerId); if (isaretciler.current.size < 2) kıstırma.current = null }

  if (!sessionId || dosyalar.length === 0) return null

  const sekmedeAc = async () => {
    if (!aktif || !sessionId) return
    try {
      // Own blob URL for the new tab (the viewer's URL is revoked when the file changes); freed after a while.
      const blob = durum.tur === 'hazir' ? durum.blob : await dosyaGetir(sessionId, aktif.id, false)
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank')
      if (!w) kaydet(blob, aktif.ad)
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000)
    } catch (e) { setDurum({ tur: 'hata', mesaj: e instanceof Error ? e.message : 'Dosya açılamadı.' }) }
  }
  const indir = async () => {
    if (!aktif || !sessionId) return
    try { kaydet(durum.tur === 'hazir' ? durum.blob : await dosyaGetir(sessionId, aktif.id, true), aktif.ad) }
    catch (e) { setDurum({ tur: 'hata', mesaj: e instanceof Error ? e.message : 'Dosya indirilemedi.' }) }
  }

  const baslik = `${YUKLENEN_DOSYALAR_BASLIGI} (${dosyalar.length})`
  return (
    <div className={yazdirSayfasi ? 'not-bolum' : undefined} data-testid="yuklenen-dosyalar">
      <style>{YUKLENEN_DOSYALAR_CSS}</style>

      <div className="yd-ekran">
        <div className={yazdirSayfasi ? 'not-etiket' : undefined} style={yazdirSayfasi ? undefined : { fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 4 }}>{baslik}</div>
        <div style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginBottom: 6 }}>Bir dosyaya tıklayınca rapor kapanmadan yanında açılır.</div>
        <ul style={{ listStyle: 'none', margin: 0, display: 'grid', gap: 2, border: '1px solid rgba(58,44,34,0.12)', borderRadius: 10, background: '#FFFFFF', padding: 4 }}>
          {dosyalar.map((d, i) => (
            <li key={d.id}>
              <button type="button" className="yd-baglanti" title={d.ad} aria-current={secili === i} onClick={(e) => { acanRef.current = e.currentTarget; setSecili(i) }}>
                <span aria-hidden="true">{simge(d)}</span>
                <span className="yd-ad">{d.gorunenAd}</span>
                {d.sinif ? <span style={{ flex: '0 0 auto', fontSize: 11.5, fontWeight: 600, color: CHROME_RENK.pine, background: 'rgba(47,67,52,0.1)', borderRadius: 999, padding: '2px 8px' }}>{d.sinif}</span> : null}
                {d.boyut ? <span style={{ flex: '0 0 auto', fontSize: 11.5, fontWeight: 400, color: CHROME_RENK.muted }}>{boyutMetni(d.boyut)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Print / PDF: full names as plain text, no links (the files are not embedded). */}
      <div className="yd-yazdir">
        <div className={yazdirSayfasi ? 'not-etiket' : undefined}>{YUKLENEN_DOSYALAR_BASLIGI}</div>
        <div className={yazdirSayfasi ? 'not-metin' : undefined} style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{yazdirSatirlari(dosyalar).join('\n')}</div>
      </div>

      {aktif ? (
        <aside className="yd-panel" role="dialog" aria-label={`${YUKLENEN_DOSYALAR_BASLIGI}: ${aktif.ad}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(58,44,34,0.12)', background: '#F6F0E4', flexWrap: 'wrap' }}>
            <button type="button" className="yd-dugme yd-kapat" onClick={kapat} autoFocus aria-label="Dosya görüntüleyiciyi kapat">✕ Kapat</button>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div title={aktif.ad} style={{ fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aktif.gorunenAd}</div>
              <div style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>{secili! + 1} / {dosyalar.length}{aktif.sinif ? ` · ${aktif.sinif}` : ''}</div>
            </div>
            <button type="button" className="yd-dugme" onClick={() => setSecili((s) => (s != null && s > 0 ? s - 1 : s))} disabled={secili === 0} aria-label="Önceki dosya">‹ Önceki</button>
            <button type="button" className="yd-dugme" onClick={() => setSecili((s) => (s != null && s < dosyalar.length - 1 ? s + 1 : s))} disabled={secili === dosyalar.length - 1} aria-label="Sonraki dosya">Sonraki ›</button>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(58,44,34,0.08)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="yd-dugme" onClick={sekmedeAc} disabled={aktif.gorunum === 'diger'}>Yeni sekmede aç</button>
            <button type="button" className="yd-dugme" onClick={indir}>İndir</button>
            {aktif.gorunum === 'gorsel' ? (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button type="button" className="yd-dugme" onClick={() => yakinlastir(olcek - 0.5)} disabled={olcek <= ZOOM_MIN} aria-label="Uzaklaştır">−</button>
                <button type="button" className="yd-dugme" onClick={() => yakinlastir(1)} aria-label="Sığdır">{Math.round(olcek * 100)}%</button>
                <button type="button" className="yd-dugme" onClick={() => yakinlastir(olcek + 0.5)} disabled={olcek >= ZOOM_MAX} aria-label="Yakınlaştır">+</button>
              </span>
            ) : null}
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#2b2620', overflow: 'hidden' }}>
            {aktif.gorunum === 'diger' ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', color: '#EDE6DA', fontSize: 14, lineHeight: 1.5 }}>
                <div>Bu dosya türü ({aktif.mime || 'bilinmiyor'}) tarayıcıda önizlenemez.<br />Görüntülemek için indirin.</div>
              </div>
            ) : durum.tur === 'yukleniyor' || durum.tur === 'bos' ? (
              <div role="status" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#EDE6DA', fontSize: 14 }}>Dosya yükleniyor…</div>
            ) : durum.tur === 'hata' ? (
              <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', color: '#F3C9BD', fontSize: 14 }}>{durum.mesaj}</div>
            ) : aktif.gorunum === 'pdf' ? (
              <iframe key={aktif.id} src={durum.url} title={aktif.ad} style={{ width: '100%', height: '100%', border: 0, background: '#fff' }} />
            ) : (
              <div
                onPointerDown={basla} onPointerMove={hareket} onPointerUp={bitir} onPointerCancel={bitir}
                onDoubleClick={() => yakinlastir(olcek > 1 ? 1 : 2.5)}
                onWheel={(e) => yakinlastir(olcek + (e.deltaY < 0 ? 0.25 : -0.25))}
                style={{ position: 'absolute', inset: 0, touchAction: 'none', overscrollBehavior: 'contain', cursor: olcek > 1 ? 'grab' : 'zoom-in', display: 'grid', placeItems: 'center' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={durum.url} alt={aktif.ad} draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `translate(${kayma.x}px, ${kayma.y}px) scale(${olcek})`, transformOrigin: 'center', userSelect: 'none' }} />
              </div>
            )}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
