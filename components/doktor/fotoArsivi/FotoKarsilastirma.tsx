'use client'

/**
 * FOTO-ARSIV-01 — compare two photos of the same region: side by side or a before/after slider, with ONE shared
 * zoom/pan (so the same spot stays under the finger on both), each photo's own adjustments and annotations, the dates and
 * "N gün arayla", and Ayşe's change analysis for the doctor.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { varsayilanAyarlar, type Ayarlar, type Notasyon } from '@/lib/doktor/fotoArsiv/duzenleme'
import { BASLANGIC_GORUNUMU, type Gorunum, type Kutu } from '@/lib/doktor/fotoArsiv/gorunum'
import { bolgeEtiketi, ayniBolgeMi } from '@/lib/doktor/fotoArsiv/bolgeler'
import { aralikMetni, eskidenYeniye, type FotoOge } from '@/lib/doktor/fotoArsiv/zamanCizelgesi'
import { detayGetir } from './api'
import { FotoDegisimPaneli } from './FotoAiPaneli'
import FotoTuval from './FotoTuval'
import { tarihMetni } from './FotoGoruntuleyici'
import { useJestler } from './jestler'
import { dugme, girdi } from './stil'

const CSS = `
.fa-kp{position:fixed;inset:0;z-index:1250;background:#0f0d0b;color:#f4eee3;display:flex;flex-direction:column}
.fa-kp-ust{display:flex;align-items:center;gap:6px;padding:8px 10px;padding-top:max(8px,env(safe-area-inset-top));background:#1b1713;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.08)}
.fa-kp-govde{flex:1;min-height:0;display:flex;flex-direction:column}
.fa-kp-sahne{flex:1;min-height:0;position:relative}
.fa-kp-yan{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#000}
.fa-kp-hucre{position:relative;min-width:0;min-height:0}
.fa-kp-alt{background:#faf6ee;color:#3b2e24;max-height:44vh;overflow:auto;padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom))}
.fa-kp-alt[data-kapali="1"]{display:none}
@media (max-width:899px) and (orientation:portrait){.fa-kp-yan{grid-template-columns:1fr;grid-template-rows:1fr 1fr}}
@media (min-width:900px){.fa-kp-govde{flex-direction:row}.fa-kp-alt{max-height:none;width:380px;flex:none}.fa-kp-alt[data-kapali="1"]{display:block}.fa-kp-alt-dugme{display:none}}
`

const bos = (): { ayarlar: Ayarlar; notasyonlar: Notasyon[] } => ({ ayarlar: varsayilanAyarlar(), notasyonlar: [] })

const etiketKutusu: React.CSSProperties = { position: 'absolute', left: 8, top: 8, background: 'rgba(0,0,0,.7)', borderRadius: 8, padding: '4px 8px', fontSize: 12, pointerEvents: 'none', zIndex: 3, lineHeight: 1.3, userSelect: 'none', WebkitUserSelect: 'none' }

interface Props {
  patientId: string
  ogeler: FotoOge[]
  eskiId: string
  yeniId: string
  rol: string | undefined
  veliDili?: boolean
  onKapat: () => void
}

export default function FotoKarsilastirma({ patientId, ogeler, eskiId, yeniId, rol, onKapat }: Props) {
  const doktorMu = rol === undefined || rol === 'doktor'
  const [aId, setAId] = useState(eskiId)
  const [bId, setBId] = useState(yeniId)
  const [mod, setMod] = useState<'yan' | 'kaydirici'>('yan')
  const [pos, setPos] = useState(0.5)
  const [gorunum, setGorunum] = useState<Gorunum>({ ...BASLANGIC_GORUNUMU })
  const [da, setDa] = useState(bos())
  const [db, setDb] = useState(bos())
  const [kap, setKap] = useState<{ kap: Kutu; icerik: Kutu }>({ kap: { w: 0, h: 0 }, icerik: { w: 0, h: 0 } })
  const [altAcik, setAltAcik] = useState(false)
  const sahneRef = useRef<HTMLDivElement>(null)
  const kaydiriciRef = useRef<HTMLDivElement>(null)

  const a = ogeler.find((o) => o.belgeId === aId)
  const b = ogeler.find((o) => o.belgeId === bId)

  useEffect(() => {
    let iptal = false
    detayGetir(patientId, aId).then((d) => { if (!iptal) setDa({ ayarlar: d.meta.ozel.ayarlar, notasyonlar: d.meta.ozel.notasyonlar }) }).catch(() => { if (!iptal) setDa(bos()) })
    return () => { iptal = true }
  }, [patientId, aId])
  useEffect(() => {
    let iptal = false
    detayGetir(patientId, bId).then((d) => { if (!iptal) setDb({ ayarlar: d.meta.ozel.ayarlar, notasyonlar: d.meta.ozel.notasyonlar }) }).catch(() => { if (!iptal) setDb(bos()) })
    return () => { iptal = true }
  }, [patientId, bId])

  useEffect(() => { setGorunum({ ...BASLANGIC_GORUNUMU }) }, [aId, bId])
  useEffect(() => {
    const onceki = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tus = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return
      if (e.key === 'Escape') onKapat()
      else if (e.key === '0') setGorunum({ ...BASLANGIC_GORUNUMU })
      else if (e.key === 'ArrowLeft' && mod === 'kaydirici') setPos((p) => Math.max(0, p - 0.05))
      else if (e.key === 'ArrowRight' && mod === 'kaydirici') setPos((p) => Math.min(1, p + 0.05))
    }
    window.addEventListener('keydown', tus)
    return () => { document.body.style.overflow = onceki; window.removeEventListener('keydown', tus) }
  }, [onKapat, mod])

  // slider mode: gestures on the shared stage
  useJestler(sahneRef, { gorunum, onGorunum: setGorunum, kap: kap.kap, icerik: kap.icerik, devreDisi: mod !== 'kaydirici' })

  const surukle = (e: React.PointerEvent) => {
    const el = kaydiriciRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const hareket = (ev: PointerEvent) => { const r = el.getBoundingClientRect(); setPos(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width))) }
    const bitir = () => { el.removeEventListener('pointermove', hareket); el.removeEventListener('pointerup', bitir); el.removeEventListener('pointercancel', bitir) }
    el.addEventListener('pointermove', hareket); el.addEventListener('pointerup', bitir); el.addEventListener('pointercancel', bitir)
    const r = el.getBoundingClientRect(); setPos(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
  }

  if (typeof document === 'undefined' || !a || !b) return null

  // candidates for each side: same region as the other side (any region when none is set), oldest first
  const adaylar = (diger: FotoOge) => eskidenYeniye(ogeler).filter((o) => (diger.bolge ? ayniBolgeMi(o.bolge, diger.bolge) : true))
  const aralik = aralikMetni(a.cekimAt, b.cekimAt)
  const eskiOge = Date.parse(a.cekimAt) <= Date.parse(b.cekimAt) ? a : b
  const yeniOge = eskiOge === a ? b : a
  const secici = (deger: string, diger: FotoOge, f: (id: string) => void, ad: string) => (
    <select style={{ ...girdi, minHeight: 36, width: 'auto', maxWidth: 190, padding: '4px 6px', fontSize: 12.5 }} value={deger} onChange={(e) => f(e.target.value)} aria-label={ad}>
      {adaylar(diger).map((o) => <option key={o.belgeId} value={o.belgeId}>{tarihMetni(o.cekimAt)}{o.bolge ? '' : ' (bölgesiz)'}</option>)}
    </select>
  )
  const tuvalA = (pasif: boolean) => (
    <FotoTuval patientId={patientId} belgeId={aId} ayarlar={da.ayarlar} notasyonlar={da.notasyonlar} gorunum={gorunum} onGorunum={setGorunum} pasif={pasif} onKap={(k, i) => setKap({ kap: k, icerik: i })} etiket={`Fotoğraf ${tarihMetni(a.cekimAt)}`} />
  )
  const tuvalB = (pasif: boolean) => (
    <FotoTuval patientId={patientId} belgeId={bId} ayarlar={db.ayarlar} notasyonlar={db.notasyonlar} gorunum={gorunum} onGorunum={setGorunum} pasif={pasif} etiket={`Fotoğraf ${tarihMetni(b.cekimAt)}`} />
  )

  return createPortal(
    <div className="fa-kp" role="dialog" aria-modal="true" aria-label="Fotoğraf karşılaştırma" data-testid="foto-karsilastirma">
      <style>{CSS}</style>
      <div className="fa-kp-ust">
        <button onClick={onKapat} aria-label="Kapat" style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)', minWidth: 40 }} data-testid="kp-kapat">✕</button>
        <div style={{ flex: 1, minWidth: 140, lineHeight: 1.25 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }} data-testid="kp-aralik">{aralik}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{a.bolge && ayniBolgeMi(a.bolge, b.bolge) ? bolgeEtiketi(a.bolge) : 'Farklı / belirsiz bölge'} · {tarihMetni(eskiOge.cekimAt)} → {tarihMetni(yeniOge.cekimAt)}</div>
        </div>
        <div role="group" aria-label="Görünüm" style={{ display: 'flex', gap: 4 }}>
          {(['yan', 'kaydirici'] as const).map((m) => (
            <button key={m} aria-pressed={mod === m} onClick={() => setMod(m)} data-testid={`kp-mod-${m}`}
              style={{ ...dugme, background: mod === m ? '#d4c196' : 'transparent', color: mod === m ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }}>{m === 'yan' ? 'Yan yana' : 'Kaydırıcı'}</button>
          ))}
        </div>
        <button onClick={() => { setAId(bId); setBId(aId) }} style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} aria-label="Taraf değiştir">⇄</button>
        {secici(aId, b, setAId, 'Sol / önceki fotoğraf')}
        {secici(bId, a, setBId, 'Sağ / sonraki fotoğraf')}
        <button onClick={() => setGorunum({ ...BASLANGIC_GORUNUMU })} style={{ ...dugme, background: 'transparent', color: '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }}>{Math.round(gorunum.olcek * 100)}%</button>
        {doktorMu && <button className="fa-kp-alt-dugme" onClick={() => setAltAcik((x) => !x)} aria-expanded={altAcik} style={{ ...dugme, background: altAcik ? '#d4c196' : 'transparent', color: altAcik ? '#2c3326' : '#f4eee3', borderColor: 'rgba(255,255,255,.2)' }} data-testid="kp-ai-ac">Ayşe</button>}
      </div>

      <div className="fa-kp-govde">
        <div className="fa-kp-sahne">
          {mod === 'yan' ? (
            <div className="fa-kp-yan" data-testid="kp-yan">
              <div className="fa-kp-hucre"><div style={etiketKutusu}>{tarihMetni(a.cekimAt)}</div>{tuvalA(false)}</div>
              <div className="fa-kp-hucre"><div style={etiketKutusu}>{tarihMetni(b.cekimAt)}</div>{tuvalB(false)}</div>
            </div>
          ) : (
            <div ref={kaydiriciRef} style={{ position: 'absolute', inset: 0 }} data-testid="kp-kaydirici">
              <div ref={sahneRef} style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: gorunum.olcek > 1 ? 'grab' : 'default' }}>
                <div style={{ position: 'absolute', inset: 0 }}>{tuvalA(true)}</div>
                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${pos * 100}%)` }}>{tuvalB(true)}</div>
              </div>
              <div style={{ ...etiketKutusu, left: 8 }}>{tarihMetni(a.cekimAt)}</div>
              <div style={{ ...etiketKutusu, left: 'auto', right: 8 }}>{tarihMetni(b.cekimAt)}</div>
              <div
                role="slider" tabIndex={0} aria-label="Önce / sonra kaydırıcı" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos * 100)}
                onPointerDown={surukle}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); setPos((p) => Math.max(0, p - 0.03)) } else if (e.key === 'ArrowRight') { e.preventDefault(); setPos((p) => Math.min(1, p + 0.03)) } }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${pos * 100}% - 22px)`, width: 44, cursor: 'ew-resize', touchAction: 'none', zIndex: 4, display: 'grid', placeItems: 'center' }} data-testid="kp-tutamac">
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: '#f4eee3', boxShadow: '0 0 4px rgba(0,0,0,.6)' }} />
                <div style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', background: '#f4eee3', color: '#2c3326', display: 'grid', placeItems: 'center', fontSize: 14, boxShadow: '0 1px 6px rgba(0,0,0,.5)' }}>⇆</div>
              </div>
            </div>
          )}
        </div>
        {doktorMu && (
          <div className="fa-kp-alt" data-kapali={altAcik ? '0' : '1'} data-testid="kp-alt">
            <FotoDegisimPaneli patientId={patientId} belgeId={yeniOge.belgeId} oncekiId={eskiOge.belgeId} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
