'use client'
/**
 * ESNEK-MUAYENE-A — the doctor's El Notu settings (profile; changeable any time): approval required or not, who prepares
 * hand notes, the baseline minutes per note (time meter), his abbreviation lexicon, his form templates (header band + drawing
 * regions mapped to anatomy; the region editor draws on a MASKED page of that form). Country-neutral.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { CizimBolgesi, Kutu, Sablon, Taraf } from '@/core/elNotu/tipler'
import { EL_RENK as R } from './renk'
import { dugme, type Getirici } from './ElNotuYakala'

export type AnatomiSecenegi = { anahtar: string; etiket: string; taraf: boolean }
type SozlukSatiri = { id: string; kisaltma: string; anlam: string; kaynak: string }

export default function ElNotuAyarKarti(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; anatomi: AnatomiSecenegi[] }) {
  const M = p.metin
  const [ayar, setAyar] = useState<{ hekimOnayiGerekli: boolean; hazirlayan: 'doktor' | 'sekreter'; tabanDk: number | null; gelistirmeOnayi?: boolean } | null>(null)
  const [sozluk, setSozluk] = useState<SozlukSatiri[]>([])
  const [sablonlar, setSablonlar] = useState<(Sablon & { ornekBelgeId?: string | null })[]>([])
  const [yeni, setYeni] = useState({ kisaltma: '', anlam: '' })
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState('')

  const yukle = useCallback(async () => {
    const [a, s, t] = await Promise.all([
      p.getir(`${p.api}/ayar`).then((r) => (r.ok ? r.json() : null)),
      p.getir(`${p.api}/sozluk`).then((r) => (r.ok ? r.json() : { girdiler: [] })),
      p.getir(`${p.api}/sablon`).then((r) => (r.ok ? r.json() : { sablonlar: [] })),
    ]).catch(() => [null, { girdiler: [] }, { sablonlar: [] }])
    if (a?.ayar) setAyar(a.ayar)
    setSozluk(s.girdiler || [])
    setSablonlar(t.sablonlar || [])
  }, [p])
  useEffect(() => { void yukle() }, [yukle])

  async function kaydet(degisen: Partial<NonNullable<typeof ayar>>) {
    if (!ayar) return
    const yeniAyar = { ...ayar, ...degisen }
    setAyar(yeniAyar)
    const r = await p.getir(`${p.api}/ayar`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(yeniAyar) })
    setMesaj(r.ok ? '✓' : M.hata.genel)
  }

  if (!ayar) return null
  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 18, display: 'grid', gap: 16, color: R.murekkep }}>
      <div style={{ fontWeight: 650, fontSize: 17 }}>{M.ayar.baslik}</div>

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.hazirlayan}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['doktor', 'sekreter'] as const).map((h) => <button key={h} type="button" style={dugme(ayar.hazirlayan === h ? 'birincil' : 'ikincil')} onClick={() => void kaydet({ hazirlayan: h })}>{h === 'doktor' ? M.ayar.hazirlayanDoktor : M.ayar.hazirlayanSekreter}</button>)}
        </div>
      </div>

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" checked={ayar.hekimOnayiGerekli} onChange={(e) => void kaydet({ hekimOnayiGerekli: e.target.checked })} style={{ width: 20, height: 20, marginTop: 2 }} />
        <span><span style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.hekimOnayi}</span><span style={{ display: 'block', fontSize: 12, color: R.soluk, marginTop: 2 }}>{M.ayar.hekimOnayiAlt}</span></span>
      </label>

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.taban}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={1} max={120} step={0.5} defaultValue={ayar.tabanDk ?? ''} onBlur={(e) => void kaydet({ tabanDk: e.target.value ? Number(e.target.value) : null })} style={{ width: 96, minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '0 10px', fontSize: 15 }} />
          <span style={{ fontSize: 14 }}>{M.zaman.dk}</span>
        </div>
        <div style={{ fontSize: 12, color: R.soluk }}>{M.ayar.tabanAlt}</div>
      </div>

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" checked={ayar.gelistirmeOnayi === true} onChange={(e) => void kaydet({ gelistirmeOnayi: e.target.checked })} style={{ width: 20, height: 20, marginTop: 2 }} />
        <span><span style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.gelistirme}</span><span style={{ display: 'block', fontSize: 12, color: R.soluk, marginTop: 2 }}>{M.ayar.gelistirmeAlt}</span></span>
      </label>

      <div style={{ display: 'grid', gap: 8 }}>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.sozluk}</div><div style={{ fontSize: 12, color: R.soluk }}>{M.ayar.sozlukAlt}</div></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input value={yeni.kisaltma} onChange={(e) => setYeni({ ...yeni, kisaltma: e.target.value })} placeholder={M.ayar.kisaltma} style={{ width: 110, minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '0 10px' }} />
          <input value={yeni.anlam} onChange={(e) => setYeni({ ...yeni, anlam: e.target.value })} placeholder={M.ayar.anlam} style={{ flex: 1, minWidth: 160, minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '0 10px' }} />
          <button type="button" style={dugme('birincil')} disabled={!yeni.kisaltma.trim() || !yeni.anlam.trim()} onClick={async () => { await p.getir(`${p.api}/sozluk`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(yeni) }); setYeni({ kisaltma: '', anlam: '' }); void yukle() }}>{M.ayar.ekle}</button>
        </div>
        <div style={{ display: 'grid', gap: 4, maxHeight: 240, overflow: 'auto' }}>
          {sozluk.map((g) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14, background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '6px 10px' }}>
              <span><b>{g.kisaltma}</b> = {g.anlam}</span>
              <button type="button" style={dugme('kucuk')} onClick={async () => { await p.getir(`${p.api}/sozluk?id=${g.id}`, { method: 'DELETE' }); void yukle() }}>{M.sil}</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div><div style={{ fontSize: 14, fontWeight: 600 }}>{M.ayar.sablonlar}</div><div style={{ fontSize: 12, color: R.soluk }}>{M.ayar.sablonAlt}</div></div>
        {!sablonlar.length && <div style={{ fontSize: 13, color: R.soluk }}>{M.ayar.sablonYok}</div>}
        {sablonlar.map((s) => (
          <div key={s.id} style={{ background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>{s.tur === 'serbest' ? M.ayar.serbestSablon : s.ad} {s.tur === 'formlu' ? `· ${s.cizimBolgeleri.length}` : ''}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                {s.tur === 'formlu' && s.ornekBelgeId && <button type="button" style={dugme('kucuk')} onClick={() => setDuzenlenen(duzenlenen === s.id ? null : s.id)}>{M.dogrula.duzelt}</button>}
                <button type="button" style={dugme('kucuk')} onClick={async () => { await p.getir(`${p.api}/sablon?id=${s.id}`, { method: 'DELETE' }); void yukle() }}>{M.sil}</button>
              </span>
            </div>
            {duzenlenen === s.id && s.ornekBelgeId && <BolgeEditoru metin={M} getir={p.getir} api={p.api} sablon={s} belgeId={s.ornekBelgeId} anatomi={p.anatomi} onKaydet={() => { setDuzenlenen(null); void yukle() }} />}
          </div>
        ))}
      </div>
      {mesaj && <div role="status" style={{ fontSize: 12, color: R.soluk }}>{mesaj}</div>}
    </section>
  )
}

/** Drawing regions of a form: drag a rectangle on a masked page of it, pick the anatomy and (for paired organs) the side. */
function BolgeEditoru(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; sablon: Sablon; belgeId: string; anatomi: AnatomiSecenegi[]; onKaydet: () => void }) {
  const M = p.metin
  const [url, setUrl] = useState<string | null>(null)
  const [bolgeler, setBolgeler] = useState<CizimBolgesi[]>(p.sablon.cizimBolgeleri)
  const [taslak, setTaslak] = useState<Kutu | null>(null)
  const [anatomi, setAnatomi] = useState(p.anatomi[0]?.anahtar || '')
  const [taraf, setTaraf] = useState<Taraf>('sag')
  const ref = useRef<HTMLDivElement>(null)
  const bas = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => { void p.getir(`${p.api}/gorsel?belgeId=${encodeURIComponent(p.belgeId)}`).then((r) => (r.ok ? r.blob() : null)).then((b) => b && setUrl(URL.createObjectURL(b))) }, [p])
  const nokta = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) } }
  const secili = p.anatomi.find((a) => a.anahtar === anatomi)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 460, aspectRatio: `${p.sablon.enBoy}`, touchAction: 'none', cursor: 'crosshair', border: `1px solid ${R.cizgi}`, borderRadius: 8, overflow: 'hidden', background: R.krem }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); bas.current = nokta(e) }}
        onPointerMove={(e) => { if (!bas.current) return; const n = nokta(e); setTaslak({ x0: Math.min(bas.current.x, n.x), y0: Math.min(bas.current.y, n.y), x1: Math.max(bas.current.x, n.x), y1: Math.max(bas.current.y, n.y) }) }}
        onPointerUp={() => { bas.current = null }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }} />}
        {bolgeler.map((b) => <div key={b.id} title={b.etiket} style={{ position: 'absolute', left: `${b.kutu.x0 * 100}%`, top: `${b.kutu.y0 * 100}%`, width: `${(b.kutu.x1 - b.kutu.x0) * 100}%`, height: `${(b.kutu.y1 - b.kutu.y0) * 100}%`, outline: `2px solid ${R.cam}`, background: 'rgba(47,67,52,0.12)', fontSize: 10, color: R.cam, overflow: 'hidden' }}>{b.etiket}</div>)}
        {taslak && <div style={{ position: 'absolute', left: `${taslak.x0 * 100}%`, top: `${taslak.y0 * 100}%`, width: `${(taslak.x1 - taslak.x0) * 100}%`, height: `${(taslak.y1 - taslak.y0) * 100}%`, outline: `2px dashed ${R.amber}` }} />}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={anatomi} onChange={(e) => setAnatomi(e.target.value)} style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${R.cizgi}`, padding: '0 8px' }}>{p.anatomi.map((a) => <option key={a.anahtar} value={a.anahtar}>{a.etiket}</option>)}</select>
        {secili?.taraf && <select value={taraf || ''} onChange={(e) => setTaraf((e.target.value || null) as Taraf)} style={{ minHeight: 40, borderRadius: 8, border: `1px solid ${R.cizgi}`, padding: '0 8px' }}>
          <option value="sag">{M.dil.taraf.sag}</option><option value="sol">{M.dil.taraf.sol}</option><option value="iki">{M.dil.taraf.iki}</option>
        </select>}
        <button type="button" style={dugme('ikincil')} disabled={!taslak || !secili} onClick={() => { if (!taslak || !secili) return; setBolgeler((b) => [...b, { id: `b${Date.now().toString(36)}`, anatomi: secili.anahtar, etiket: secili.etiket, taraf: secili.taraf ? taraf : null, kutu: taslak }]); setTaslak(null) }}>{M.ayar.ekle}</button>
        <button type="button" style={dugme('kucuk')} disabled={!bolgeler.length} onClick={() => setBolgeler((b) => b.slice(0, -1))}>{M.sil}</button>
        <button type="button" style={dugme('birincil')} onClick={async () => {
          await p.getir(`${p.api}/sablon`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: p.sablon.id, ad: p.sablon.ad, tur: 'formlu', brans: p.sablon.brans, enBoy: p.sablon.enBoy, baslik: p.sablon.baslikBolgeleri, cizim: bolgeler, parmakIzi: p.sablon.parmakIzi }) })
          p.onKaydet()
        }}>{M.kaydet}</button>
      </div>
    </div>
  )
}
