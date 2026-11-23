'use client'
/**
 * ESNEK-MUAYENE-A — on the doctor's muayene form: this note's sources (hand-note pages, typed note, transcript), the open
 * Doğrula questions with their crops (approval is refused while one is open), source conflicts, proposed patient-file
 * updates, and "where did this sentence come from" (tap → the line's crop). Renders nothing for a transcript-only note.
 */
import { useCallback, useEffect, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import { EL_RENK as R } from './renk'
import DogrulaPaneli, { Kirpinti, useSayfaTuvalleri, type DogrulaSatiri, type KaynakGorunumu } from './DogrulaPaneli'
import { dugme, type Getirici } from './ElNotuYakala'
import type { Kutu } from '@/core/elNotu/tipler'

type Veri = {
  not: { id: string; kaynak_izleri?: Record<string, { cumle: string; etiketler: string[] }[]> | null; kaynak_ozeti?: { kaynaklar?: { id: string; tur: string }[]; dosyaOnerileri?: { tur: 'alerji' | 'aliskanlik' | 'kronik' | 'surekli_ilac'; metin: string }[]; uygulananOneriler?: number[] } | null }
  sorular: DogrulaSatiri[]
  kaynaklar: (KaynakGorunumu & { tur: string; sayfa_sayisi?: number; okuma?: { sayfalar?: { sayfa: number; maskeliBelgeId?: string; satirlar: { normal: string; kutu: Kutu }[]; cizimler: { kutu?: Kutu }[] }[] } | null })[]
}

export default function NotKaynaklariKarti(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; noteId: string; onDegisti?: () => void }) {
  const M = p.metin
  const [veri, setVeri] = useState<Veri | null>(null)
  const [izAcik, setIzAcik] = useState(false)
  const tuvalAl = useSayfaTuvalleri(p.getir, p.api)
  const yukle = useCallback(async (cevapSonrasi = false) => {
    const r = await p.getir(`${p.api}/taslak?noteId=${encodeURIComponent(p.noteId)}`).catch(() => null)
    const v: Veri | null = r && r.ok ? await r.json() : null
    setVeri(v)
    // the last open question answered → the form reloads its fields (the placeholders were filled on the server)
    if (cevapSonrasi && v && !v.sorular.length) p.onDegisti?.()
  }, [p])
  useEffect(() => { void yukle() }, [yukle])
  const kaynakSirasi = veri?.not.kaynak_ozeti?.kaynaklar || []
  if (!veri || !kaynakSirasi.some((k) => k.tur !== 'transkript')) return null

  const konum = (etiket: string): { tuval: Promise<HTMLCanvasElement | null>; kutu: Kutu } | null => {
    const m = /^K(\d+)\.(\d+)$/.exec(etiket); if (!m) return null
    const k = veri.kaynaklar.find((x) => x.id === kaynakSirasi[Number(m[1]) - 1]?.id); if (!k?.okuma?.sayfalar) return null
    const satirlar: ({ kutu: Kutu; belge?: string } | null)[] = []
    for (const s of k.okuma.sayfalar) {
      for (const l of s.satirlar) if (l.normal.trim()) satirlar.push({ kutu: l.kutu, belge: s.maskeliBelgeId })
      if (s.cizimler.length) { satirlar.push(null); for (const c of s.cizimler) satirlar.push(c.kutu ? { kutu: c.kutu, belge: s.maskeliBelgeId } : null) }
    }
    const h = satirlar[Number(m[2]) - 1]
    return h ? { tuval: tuvalAl(h.belge), kutu: h.kutu } : null
  }
  const izler = Object.entries(veri.not.kaynak_izleri || {}).flatMap(([alan, l]) => l.map((x) => ({ alan, ...x })))
  const oneriler = veri.not.kaynak_ozeti?.dosyaOnerileri || []

  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12, margin: '12px 0', color: R.murekkep }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 650, fontSize: 15 }}>{M.derle.kaynaklar}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{kaynakSirasi.map((k, i) => <span key={k.id} style={{ fontSize: 12, background: R.camAcik, color: R.cam, borderRadius: 999, padding: '2px 10px' }}>K{i + 1} · {M.derle.kaynakTuru[k.tur as keyof typeof M.derle.kaynakTuru] || k.tur}</span>)}</div>
      </div>
      <DogrulaPaneli metin={M} getir={p.getir} api={p.api} kaynaklar={veri.kaynaklar.map((k) => ({ ...k, sorular: veri.sorular.filter((s) => s.kaynak_id === k.id) }))} celiskiler={{ noteId: p.noteId, sorular: veri.sorular.filter((s) => s.kaynak_id === p.noteId) }} rol="doktor" onDegisti={() => { void yukle(true) }} />
      {oneriler.length > 0 && (
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>{M.derle.dosyaOnerileri}</div>
          {oneriler.map((d, i) => {
            const eklendi = (veri.not.kaynak_ozeti?.uygulananOneriler || []).includes(i)
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}><b>{M.derle.dosyaTur[d.tur]}:</b> {d.metin}</span>
                {eklendi ? <span style={{ fontSize: 12, color: R.cam }}>{M.derle.eklendi}</span> : <button type="button" style={dugme('kucuk')} onClick={async () => { await p.getir(`${p.api}/dosya-onerisi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: p.noteId, index: i }) }); void yukle() }}>{M.derle.dosyayaEkle}</button>}
              </div>
            )
          })}
        </div>
      )}
      {izler.length > 0 && (
        <div>
          <button type="button" style={dugme('kucuk')} onClick={() => setIzAcik(!izAcik)}>{M.derle.kaynaktanGeldi} ({izler.length})</button>
          {izAcik && (
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {izler.map((x, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 10, padding: 8, display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 13 }}>{x.cumle}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{x.etiketler.map((e) => { const k = konum(e); return k ? <Kirpinti key={e} tuval={k.tuval} kutu={k.kutu} yukseklik={64} /> : <span key={e} style={{ fontSize: 11, color: R.soluk }}>{e}</span> })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
