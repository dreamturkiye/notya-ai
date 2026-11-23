'use client'
/**
 * ESNEK-MUAYENE-A — "El notu ekle": multi-page camera, file / PDF upload, scanner PDF. Everything privacy-relevant happens on
 * this device before anything is sent: de-warp, quality gate ("tekrar çekin"), identity regions blacked out (template position
 * / OCR labels / rotated margins), crops cut from the masked page only. The doctor's own pages go to his vault re-encoded.
 * Country-neutral: words and the API prefix are injected (the Türkiye build passes EL_NOTU_TR and /api/doktor/el-notu).
 */
import { useEffect, useRef, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { Kutu, Rgba, Sablon } from '@/core/elNotu/tipler'
import type { PaketSonucu } from '@/core/elNotu/sayfaPaketi'
import { AktifSure } from '@/core/elNotu/zaman'
import { EL_RENK as R } from './renk'

export type Getirici = (url: string, init?: RequestInit) => Promise<Response>

type SayfaDurumu = {
  raster: Rgba
  durum: 'bekliyor' | 'hazirlaniyor' | 'tekrar' | 'baslik' | 'gizlenemedi' | 'okunuyor' | 'okundu' | 'hata'
  mesaj?: string
  onizleme?: { base64: string; w: number; h: number; parmakIzi: number[]; enBoy: number }
  isaret?: Kutu | null
  acik?: number
}

export type ElNotuSonucu = { kaynakId: string; sessionId: string | null; acik: number; okunan: number }

export default function ElNotuYakala(p: {
  metin: ElNotuMetinleri
  getir: Getirici
  api: string
  patientId: string
  sessionId?: string | null
  ziyaretTarihi?: string | null
  kanal?: 'kamera' | 'dosya' | 'tarayici' | 'gelen_belge' | 'toplu'
  gelenBelgeId?: string | null
  /** Pre-loaded pages (inbox photo, batch upload). */
  ilkDosyalar?: File[]
  onTamam: (s: ElNotuSonucu) => void
  onKapat: () => void
}) {
  const M = p.metin
  const [sayfalar, setSayfalar] = useState<SayfaDurumu[]>([])
  const [calisiyor, setCalisiyor] = useState(false)
  const [hata, setHata] = useState('')
  const sablonRef = useRef<Sablon[] | null>(null)
  const sureRef = useRef(new AktifSure())
  const kameraRef = useRef<HTMLInputElement>(null)
  const dosyaRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void import('@/core/belgeler/ocrKimlik').then((m) => m.ocrIsit()).catch(() => undefined) }, [])
  useEffect(() => { if (p.ilkDosyalar?.length) void dosyaEkle(p.ilkDosyalar) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  async function dosyaEkle(dosyalar: File[]) {
    sureRef.current.etkilesim()
    setHata('')
    try {
      const { dosyalariRastereCevir } = await import('@/core/elNotu/tarayici')
      const rasterler = await dosyalariRastereCevir(dosyalar)
      setSayfalar((s) => [...s, ...rasterler.map((raster) => ({ raster, durum: 'bekliyor' as const }))].slice(0, 20))
    } catch { setHata(M.hata.genel) }
  }

  async function sablonlar(): Promise<Sablon[]> {
    if (sablonRef.current) return sablonRef.current
    const r = await p.getir(`${p.api}/sablon`)
    const j = r.ok ? await r.json() : { sablonlar: [] }
    sablonRef.current = j.sablonlar || []
    return sablonRef.current!
  }

  const guncelle = (i: number, d: Partial<SayfaDurumu>) => setSayfalar((s) => s.map((x, j) => (j === i ? { ...x, ...d } : x)))

  async function okut() {
    if (!sayfalar.length || calisiyor) return
    sureRef.current.etkilesim()
    setCalisiyor(true); setHata('')
    try {
      const { icerikOzeti, tarayiciOcr, tarayiciTuvali, orijinalKopya } = await import('@/core/elNotu/tarayici')
      const { sayfaPaketiHazirla } = await import('@/core/elNotu/sayfaPaketi')
      const isleme = await icerikOzeti(sayfalar.map((s) => s.raster), p.patientId)
      const kr = await p.getir(`${p.api}/kaynak`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: p.patientId, sessionId: p.sessionId || null, kanal: p.kanal || 'kamera', isleme, ziyaretTarihi: p.ziyaretTarihi || null, gelenBelgeId: p.gelenBelgeId || null }) })
      const kj = await kr.json().catch(() => ({}))
      if (!kr.ok || !kj.kaynak?.id) throw new Error(kj.error || M.hata.genel)
      const kaynakId = String(kj.kaynak.id), sessionId = kj.kaynak.sessionId ? String(kj.kaynak.sessionId) : null
      let acik = 0, okunan = 0
      for (let i = 0; i < sayfalar.length; i++) {
        const s = sayfalar[i]
        if (s.durum === 'okundu') { okunan++; acik += s.acik || 0; continue }
        guncelle(i, { durum: 'hazirlaniyor', mesaj: M.hazirlaniyor })
        const sl = await sablonlar()
        const sonuc: PaketSonucu = await sayfaPaketiHazirla({ foto: s.raster, sayfa: i + 1, sablonlar: sl, serbestBeyan: sl.some((x) => x.tur === 'serbest'), kullaniciBolgeleri: s.isaret ? [s.isaret] : undefined, tuval: tarayiciTuvali, ocr: tarayiciOcr })
        if (sonuc.durum === 'tekrar') { guncelle(i, { durum: 'tekrar', mesaj: sonuc.kalite.nedenler.map((n) => M.kalite[n]).join(' ') }); continue }
        if (sonuc.durum === 'gizlenemedi') { guncelle(i, { durum: 'gizlenemedi', mesaj: M.gizlilik.gizlenemedi }); continue }
        if (sonuc.durum === 'baslik_gerekli') { guncelle(i, { durum: 'baslik', mesaj: M.gizlilik.baslikGerekli, onizleme: { base64: sonuc.onizleme.base64, w: sonuc.w, h: sonuc.h, parmakIzi: sonuc.parmakIzi, enBoy: sonuc.enBoy } }); continue }
        guncelle(i, { durum: 'okunuyor', mesaj: M.okunuyor })
        const kopya = await orijinalKopya(s.raster)
        const or = await p.getir(`${p.api}/orijinal`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kaynakId, sayfa: i + 1, ...kopya }) })
        const oj = await or.json().catch(() => ({}))
        const r = await p.getir(`${p.api}/oku`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kaynakId, paket: sonuc.paket, maskeliSayfa: sonuc.maskeliSayfa, orijinalBelgeId: oj.belgeId || null }) })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { guncelle(i, { durum: 'hata', mesaj: j.error || M.hata.genel }); continue }
        const sayfaAcik = Array.isArray(j.sayfa?.dogrula) ? j.sayfa.dogrula.length : 0
        acik = Number(j.acik) || acik + sayfaAcik
        okunan++
        guncelle(i, { durum: 'okundu', mesaj: M.okundu, acik: sayfaAcik })
      }
      const ms = sureRef.current.al()
      if (ms > 0) void p.getir(`${p.api}/sure`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ asama: 'yakalama', sureMs: ms, kaynakId }) }).catch(() => undefined)
      if (okunan) p.onTamam({ kaynakId, sessionId, acik, okunan })
    } catch (e) {
      setHata(e instanceof Error && e.message ? e.message : M.hata.genel)
    } finally { setCalisiyor(false) }
  }

  async function baslikKaydet(i: number, tur: 'formlu' | 'serbest') {
    const s = sayfalar[i]
    if (!s.onizleme) return
    sureRef.current.etkilesim()
    if (tur === 'formlu' && !s.isaret) return
    const govde = tur === 'formlu'
      ? { ad: M.ayar.sablonlar, tur, enBoy: s.onizleme.enBoy, baslik: [s.isaret], cizim: [], parmakIzi: s.onizleme.parmakIzi }
      : { ad: M.ayar.serbestSablon, tur, enBoy: s.onizleme.enBoy, baslik: [], cizim: [] }
    const r = await p.getir(`${p.api}/sablon`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) })
    if (!r.ok) { setHata(M.hata.genel); return }
    sablonRef.current = null
    guncelle(i, { durum: 'bekliyor', mesaj: M.gizlilik.sablonKaydedildi, onizleme: undefined })
  }

  const hepsiOkundu = sayfalar.length > 0 && sayfalar.every((s) => s.durum === 'okundu')

  return (
    <div role="dialog" aria-modal="true" aria-label={M.elNotuEkle} style={{ position: 'fixed', inset: 0, background: 'rgba(30,24,18,0.55)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onPointerDown={() => sureRef.current.etkilesim()}>
      <div style={{ background: R.kagit, borderRadius: 18, width: 'min(720px, 100%)', maxHeight: '92vh', overflow: 'auto', padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', color: R.murekkep }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 650 }}>{M.elNotuEkle}</div>
            <div style={{ fontSize: 13, color: R.soluk, marginTop: 4 }}>{M.elNotuAlt}</div>
          </div>
          <button type="button" onClick={p.onKapat} style={dugme('ikincil')} aria-label={M.kapat}>{M.kapat}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          <button type="button" style={dugme('birincil')} onClick={() => kameraRef.current?.click()} disabled={calisiyor}>{M.kameraIleCek}</button>
          <button type="button" style={dugme('ikincil')} onClick={() => dosyaRef.current?.click()} disabled={calisiyor}>{M.dosyaSec}</button>
          <input ref={kameraRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) void dosyaEkle(f) }} />
          <input ref={dosyaRef} type="file" accept="image/*,application/pdf,.pdf,.heic" multiple hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) void dosyaEkle(f) }} />
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {sayfalar.map((s, i) => (
            <div key={i} style={{ border: `1px solid ${R.cizgi}`, borderRadius: 12, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{M.sayfa} {i + 1}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: s.durum === 'okundu' ? R.cam : s.durum === 'tekrar' || s.durum === 'hata' || s.durum === 'gizlenemedi' ? R.uyari : R.soluk }}>{s.mesaj || ''}{s.durum === 'okundu' && s.acik ? ` · ${M.dogrula.baslik}: ${s.acik}` : ''}</span>
                  {!calisiyor && s.durum !== 'okundu' && <button type="button" style={dugme('kucuk')} onClick={() => setSayfalar((x) => x.filter((_, j) => j !== i))}>{M.sil}</button>}
                </div>
              </div>
              {s.durum === 'tekrar' && <div style={{ fontSize: 13, color: R.uyari, marginTop: 6 }}>{M.tekrarCekin}</div>}
              {s.durum === 'baslik' && s.onizleme && (
                <BaslikIsaretle metin={M} onizleme={s.onizleme} isaret={s.isaret || null} onIsaret={(k) => guncelle(i, { isaret: k })}
                  onKaydet={() => void baslikKaydet(i, 'formlu')} onSerbest={() => void baslikKaydet(i, 'serbest')} />
              )}
            </div>
          ))}
        </div>

        {sayfalar.some((s) => s.durum === 'okundu') && <div style={{ fontSize: 12, color: R.soluk, marginTop: 10 }}>{M.gizlilik.kopyadaGizli}</div>}
        {hata && <div role="alert" style={{ color: R.uyari, fontSize: 13, marginTop: 10 }}>{hata}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" style={dugme('ikincil')} onClick={p.onKapat}>{M.vazgec}</button>
          <button type="button" style={dugme('birincil')} disabled={!sayfalar.length || calisiyor || hepsiOkundu} onClick={() => void okut()}>
            {calisiyor ? M.okunuyor : `${M.gonder} (${sayfalar.length} ${M.sayfalar})`}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Marking the identity header once on an unknown form: drag a rectangle on the (already partly masked) preview. */
function BaslikIsaretle(p: { metin: ElNotuMetinleri; onizleme: { base64: string; w: number; h: number }; isaret: Kutu | null; onIsaret: (k: Kutu) => void; onKaydet: () => void; onSerbest: () => void }) {
  const M = p.metin
  const ref = useRef<HTMLDivElement>(null)
  const bas = useRef<{ x: number; y: number } | null>(null)
  const nokta = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }
  }
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>{M.gizlilik.baslikGerekli}</div>
      <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio: `${p.onizleme.w} / ${p.onizleme.h}`, touchAction: 'none', cursor: 'crosshair', border: `1px solid ${R.cizgi}`, borderRadius: 8, overflow: 'hidden' }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); bas.current = nokta(e) }}
        onPointerMove={(e) => { if (!bas.current) return; const n = nokta(e); p.onIsaret({ x0: Math.min(bas.current.x, n.x), y0: Math.min(bas.current.y, n.y), x1: Math.max(bas.current.x, n.x), y1: Math.max(bas.current.y, n.y) }) }}
        onPointerUp={() => { bas.current = null }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/jpeg;base64,${p.onizleme.base64}`} alt="" style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
        {p.isaret && <div style={{ position: 'absolute', left: `${p.isaret.x0 * 100}%`, top: `${p.isaret.y0 * 100}%`, width: `${(p.isaret.x1 - p.isaret.x0) * 100}%`, height: `${(p.isaret.y1 - p.isaret.y0) * 100}%`, background: 'rgba(20,20,20,0.75)', outline: `2px solid ${R.cam}` }} />}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" style={dugme('birincil')} disabled={!p.isaret} onClick={p.onKaydet}>{M.gizlilik.baslikIsaretle}</button>
        <button type="button" style={dugme('ikincil')} onClick={p.onSerbest}>{M.gizlilik.kimlikYokBeyan}</button>
      </div>
      <div style={{ fontSize: 12, color: R.soluk, marginTop: 6 }}>{M.gizlilik.kimlikYokAciklama}</div>
    </div>
  )
}

export function dugme(tur: 'birincil' | 'ikincil' | 'kucuk' | 'tehlike'): React.CSSProperties {
  const temel: React.CSSProperties = { borderRadius: 10, fontSize: tur === 'kucuk' ? 12 : 14, fontWeight: 600, cursor: 'pointer', padding: tur === 'kucuk' ? '4px 10px' : '10px 16px', minHeight: tur === 'kucuk' ? 28 : 40, border: '1px solid transparent' }
  if (tur === 'birincil') return { ...temel, background: R.cam, color: '#fff' }
  if (tur === 'tehlike') return { ...temel, background: '#fff', color: R.uyari, borderColor: R.uyari }
  return { ...temel, background: '#fff', color: R.murekkep, borderColor: R.cizgi }
}
