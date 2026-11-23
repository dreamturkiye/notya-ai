'use client'
/**
 * ESNEK-MUAYENE-A — Doğrula: every reading the reader was not sure about, shown WITH ITS IMAGE CROP (cut from the masked page).
 * Doctor or secretary answers reading questions; every answer teaches (abbreviation → lexicon, word → personal handwriting
 * memory with its crop). Protected readings (sağ/sol, var/yok, sayı, doz, ilaç, alerji) are labelled as such.
 * Conflicts between sources are the doctor's (shown here only to the doctor). Country-neutral: words + API injected.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { DogrulaSinif, KorumaliTur, Kutu } from '@/core/elNotu/tipler'
import { AktifSure } from '@/core/elNotu/zaman'
import { EL_RENK as R } from './renk'
import { dugme, type Getirici } from './ElNotuYakala'

export type DogrulaSatiri = { kaynak_id: string; soru_anahtari: string; sinif: DogrulaSinif; korumali_tur: KorumaliTur | null; okunan: string | null; adaylar: string[] | null; sayfa: number; kutu: (Kutu & { alan?: string }) | null }
export type KaynakGorunumu = { id: string; okuma?: { sayfalar?: { sayfa: number; maskeliBelgeId?: string }[] } | null; sorular: DogrulaSatiri[] }

/** Masked page canvases, loaded once per vault id. */
export function useSayfaTuvalleri(getir: Getirici, api: string) {
  const onbellek = useRef(new Map<string, Promise<HTMLCanvasElement | null>>())
  return (belgeId: string | undefined | null): Promise<HTMLCanvasElement | null> => {
    if (!belgeId) return Promise.resolve(null)
    let s = onbellek.current.get(belgeId)
    if (!s) {
      s = (async () => {
        const r = await getir(`${api}/gorsel?belgeId=${encodeURIComponent(belgeId)}`)
        if (!r.ok) return null
        const { maskeliSayfaTuvali } = await import('@/core/elNotu/tarayici')
        return maskeliSayfaTuvali(await r.blob())
      })().catch(() => null)
      onbellek.current.set(belgeId, s)
    }
    return s
  }
}

export function Kirpinti(p: { tuval: Promise<HTMLCanvasElement | null>; kutu: Kutu | null; yukseklik?: number }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let iptal = false
    void p.tuval.then((c) => {
      if (!c || !p.kutu || iptal) return
      const px = (p.kutu.x1 - p.kutu.x0) * 0.08, py = (p.kutu.y1 - p.kutu.y0) * 0.25
      const x0 = Math.max(0, (p.kutu.x0 - px) * c.width), y0 = Math.max(0, (p.kutu.y0 - py) * c.height)
      const w = Math.min(c.width - x0, (p.kutu.x1 - p.kutu.x0 + 2 * px) * c.width), h = Math.min(c.height - y0, (p.kutu.y1 - p.kutu.y0 + 2 * py) * c.height)
      if (w < 2 || h < 2) return
      const k = document.createElement('canvas'); k.width = Math.round(w); k.height = Math.round(h)
      k.getContext('2d')!.drawImage(c, x0, y0, w, h, 0, 0, k.width, k.height)
      setUrl(k.toDataURL('image/jpeg', 0.9))
    })
    return () => { iptal = true }
  }, [p.tuval, p.kutu])
  if (!url) return <div style={{ height: p.yukseklik ?? 56, background: R.krem, borderRadius: 8 }} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" style={{ maxHeight: p.yukseklik ?? 72, maxWidth: '100%', borderRadius: 8, border: `1px solid ${R.cizgi}`, background: '#fff', display: 'block' }} />
}

export default function DogrulaPaneli(p: {
  metin: ElNotuMetinleri
  getir: Getirici
  api: string
  kaynaklar: KaynakGorunumu[]
  /** Note-level conflict questions (doctor only). */
  celiskiler?: { noteId: string; sorular: DogrulaSatiri[] }
  rol: 'doktor' | 'sekreter' | 'asistan' | 'hasta_danismani'
  onDegisti?: () => void
}) {
  const M = p.metin
  const tuvalAl = useSayfaTuvalleri(p.getir, p.api)
  const [bitti, setBitti] = useState<Set<string>>(new Set())
  const [duzenle, setDuzenle] = useState<Record<string, string>>({})
  const [hata, setHata] = useState('')
  const sure = useRef(new AktifSure())
  const sorular = useMemo(() => p.kaynaklar.flatMap((k) => k.sorular.map((s) => ({ s, k }))).filter(({ s }) => s.sinif !== 'celiski' && !bitti.has(`${s.kaynak_id}:${s.soru_anahtari}`)), [p.kaynaklar, bitti])
  const celiskiler = (p.celiskiler?.sorular || []).filter((s) => !bitti.has(`${s.kaynak_id}:${s.soru_anahtari}`))

  useEffect(() => () => {
    const ms = sure.current.al()
    if (ms > 0) void p.getir(`${p.api}/sure`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ asama: 'dogrulama', sureMs: ms, kaynakId: p.kaynaklar[0]?.id }) }).catch(() => undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function cevapla(k: KaynakGorunumu, s: DogrulaSatiri, cevap: string | null) {
    sure.current.etkilesim()
    setHata('')
    let ogrenme = null
    if (cevap && s.kutu && (s.sinif === 'kelime' || s.sinif === 'korumali')) {
      try {
        const sayfa = k.okuma?.sayfalar?.find((x) => x.sayfa === s.sayfa)
        const c = await tuvalAl(sayfa?.maskeliBelgeId)
        if (c) { const { ogrenmeKirpintisi } = await import('@/core/elNotu/tarayici'); ogrenme = ogrenmeKirpintisi(c, s.kutu) }
      } catch { ogrenme = null }
    }
    const r = await p.getir(`${p.api}/dogrula`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kaynakId: k.id, cevaplar: [{ anahtar: s.soru_anahtari, cevap, ogrenme }] }) })
    if (!r.ok) { const j = await r.json().catch(() => ({})); setHata(j.error || M.hata.genel); return }
    setBitti((b) => new Set(b).add(`${s.kaynak_id}:${s.soru_anahtari}`))
    p.onDegisti?.()
  }

  async function celiskiSec(s: DogrulaSatiri, secim: string) {
    sure.current.etkilesim()
    const r = await p.getir(`${p.api}/dogrula`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: p.celiskiler!.noteId, celiski: { anahtar: s.soru_anahtari, secim } }) })
    if (!r.ok) { setHata(M.hata.genel); return }
    setBitti((b) => new Set(b).add(`${s.kaynak_id}:${s.soru_anahtari}`))
    p.onDegisti?.()
  }

  if (!sorular.length && !celiskiler.length) return <div style={{ fontSize: 13, color: R.soluk }}>{M.dogrula.bos}</div>
  return (
    <div onPointerDown={() => sure.current.etkilesim()} style={{ display: 'grid', gap: 10 }}>
      <div>
        <div style={{ fontWeight: 650, fontSize: 15 }}>{M.dogrula.baslik} · {sorular.length + celiskiler.length} {M.dogrula.kalan}</div>
        <div style={{ fontSize: 12, color: R.soluk }}>{M.dogrula.alt}</div>
      </div>
      {p.rol === 'doktor' && celiskiler.map((s) => (
        <div key={s.soru_anahtari} style={{ border: `1px solid ${R.amber}`, background: R.amberAcik, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 650, color: R.amber }}>{M.dogrula.sinif.celiski}</div>
          <div style={{ fontSize: 14, margin: '4px 0 8px' }}>{s.okunan} — {M.dogrula.celiskiSec}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(s.adaylar || []).map((a) => <button key={a} type="button" style={dugme('ikincil')} onClick={() => void celiskiSec(s, a)}>{a}</button>)}</div>
        </div>
      ))}
      {sorular.map(({ s, k }) => {
        const anah = `${s.kaynak_id}:${s.soru_anahtari}`
        const sayfa = k.okuma?.sayfalar?.find((x) => x.sayfa === s.sayfa)
        const korumali = s.sinif === 'korumali'
        const adaylar = [...new Set([s.okunan || '', ...(s.adaylar || [])].filter((x) => x && x !== '?'))].slice(0, 5)
        return (
          <div key={anah} style={{ border: `1px solid ${korumali ? R.amber : R.cizgi}`, borderRadius: 12, padding: 12, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 650, color: korumali ? R.amber : R.cam }}>{korumali && s.korumali_tur ? `${M.dogrula.sinif.korumali}: ${M.dogrula.korumali[s.korumali_tur]}` : M.dogrula.sinif[s.sinif]}</span>
              <span style={{ color: R.soluk }}>{M.sayfa} {s.sayfa}</span>
            </div>
            <Kirpinti tuval={tuvalAl(sayfa?.maskeliBelgeId)} kutu={s.kutu} />
            {s.sinif === 'kisaltma' ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}><b>{s.okunan}</b> — {M.dogrula.kisaltmaSoru}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={duzenle[anah] ?? ''} onChange={(e) => setDuzenle((d) => ({ ...d, [anah]: e.target.value }))} placeholder={M.dogrula.kisaltmaYer} style={{ flex: 1, minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '0 10px', fontSize: 15 }} />
                  <button type="button" style={dugme('birincil')} disabled={!duzenle[anah]?.trim()} onClick={() => void cevapla(k, s, duzenle[anah].trim())}>{M.kaydet}</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {adaylar.map((a, i) => <button key={a} type="button" style={dugme(i === 0 ? 'birincil' : 'ikincil')} onClick={() => void cevapla(k, s, a)}>{i === 0 ? `${a} · ${M.dogrula.dogruOkundu}` : a}</button>)}
                  <button type="button" style={dugme('kucuk')} onClick={() => void cevapla(k, s, null)}>{M.dogrula.atla}</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={duzenle[anah] ?? ''} onChange={(e) => setDuzenle((d) => ({ ...d, [anah]: e.target.value }))} placeholder={M.dogrula.duzelt} aria-label={M.dogrula.duzelt} style={{ flex: 1, minHeight: 40, border: `1px solid ${R.cizgi}`, borderRadius: 8, padding: '0 10px', fontSize: 15 }} />
                  <button type="button" style={dugme('ikincil')} disabled={!duzenle[anah]?.trim()} onClick={() => void cevapla(k, s, duzenle[anah].trim())}>{M.kaydet}</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {hata && <div role="alert" style={{ color: R.uyari, fontSize: 13 }}>{hata}</div>}
    </div>
  )
}
