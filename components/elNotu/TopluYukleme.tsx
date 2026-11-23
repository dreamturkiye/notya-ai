'use client'
/**
 * ESNEK-MUAYENE-A — batch upload for the secretary: the day's handwritten pages in one go, split per patient with today's
 * appointments (on-device header reading when the header is printed / typed; otherwise in appointment order) — always shown
 * for confirmation before anything is filed. Each patient's visit is dated to the appointment (NOTYA-GECMIS-MUAYENE-01).
 */
import { useEffect, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { Rgba } from '@/core/elNotu/tipler'
import { EL_RENK as R } from './renk'
import { dugme, type Getirici } from './ElNotuYakala'
import { adEslestir, kaynagiOkut } from './islem'

export type RandevuOzeti = { patientId: string; hastaAdi: string; baslangic: string }
type Sayfa = { raster: Rgba; kucuk: string; patientId: string | null; durum?: string }

export default function TopluYukleme(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; randevular: () => Promise<RandevuOzeti[]>; hastaSec: (onSec: (h: { id: string; ad: string }) => void) => React.ReactNode; onBitti: () => void }) {
  const M = p.metin
  const [randevu, setRandevu] = useState<RandevuOzeti[]>([])
  const [ekHastalar, setEkHastalar] = useState<{ id: string; ad: string }[]>([])
  const [sayfalar, setSayfalar] = useState<Sayfa[]>([])
  const [calisiyor, setCalisiyor] = useState(false)
  const [mesaj, setMesaj] = useState('')
  useEffect(() => { void p.randevular().then(setRandevu).catch(() => setRandevu([])) }, [p])
  const adaylar = [...randevu.filter((r) => r.patientId).map((r) => ({ id: r.patientId, ad: r.hastaAdi })), ...ekHastalar]

  async function ekle(dosyalar: File[]) {
    setCalisiyor(true); setMesaj('')
    try {
      const { dosyalariRastereCevir, rasterdenTuval, tarayiciOcr } = await import('@/core/elNotu/tarayici')
      const rasterler = await dosyalariRastereCevir(dosyalar)
      const yeni: Sayfa[] = []
      let sira = sayfalar.filter((s) => s.patientId).length
      for (const r of rasterler) {
        const c = rasterdenTuval(r), k = document.createElement('canvas'); k.width = 120; k.height = Math.round(120 * (r.h / r.w))
        k.getContext('2d')!.drawImage(c, 0, 0, k.width, k.height)
        // header words on THIS device only (nothing leaves): top 35% of the page
        const bantH = Math.round(r.h * 0.35)
        const bant: Rgba = { w: r.w, h: bantH, d: r.d.slice(0, r.w * bantH * 4) }
        const ocr = await tarayiciOcr(bant).catch(() => null)
        const eslesen = ocr ? adEslestir(ocr.map((l) => l.kelimeler.filter((w) => w.conf >= 60).map((w) => w.text).join(' ')), adaylar) : null
        const sirali = randevu.filter((x) => x.patientId)[sira]?.patientId || null
        yeni.push({ raster: r, kucuk: k.toDataURL('image/jpeg', 0.6), patientId: eslesen?.id || sirali })
        if (!eslesen) sira++
      }
      setSayfalar((s) => [...s, ...yeni])
    } catch { setMesaj(M.hata.genel) } finally { setCalisiyor(false) }
  }

  async function dosyala() {
    setCalisiyor(true); setMesaj('')
    try {
      // consecutive pages of the same patient = one source (a two-page form stays one note)
      const gruplar: { patientId: string; rasterler: Rgba[]; idx: number[] }[] = []
      sayfalar.forEach((s, i) => {
        if (!s.patientId) return
        const son = gruplar[gruplar.length - 1]
        if (son && son.patientId === s.patientId && son.idx[son.idx.length - 1] === i - 1) { son.rasterler.push(s.raster); son.idx.push(i) }
        else gruplar.push({ patientId: s.patientId, rasterler: [s.raster], idx: [i] })
      })
      for (const g of gruplar) {
        const rv = randevu.find((r) => r.patientId === g.patientId)
        const sonuc = await kaynagiOkut({ getir: p.getir, api: p.api, patientId: g.patientId, kanal: 'toplu', ziyaretTarihi: rv?.baslangic || null, rasterler: g.rasterler })
        setSayfalar((s) => s.map((x, i) => {
          const j = g.idx.indexOf(i)
          if (j < 0) return x
          const r = sonuc.sayfalar[j]
          return { ...x, durum: r?.durum === 'okundu' ? M.okundu : r?.durum === 'tekrar' ? M.tekrarCekin : r?.durum === 'baslik' ? M.gizlilik.baslikGerekli : r?.durum === 'gizlenemedi' ? M.gizlilik.gizlenemedi : M.hata.genel }
        }))
      }
      setMesaj(M.toplu.tamamlandi)
      p.onBitti()
    } catch (e) { setMesaj(e instanceof Error ? e.message : M.hata.genel) } finally { setCalisiyor(false) }
  }

  return (
    <section style={{ background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12, color: R.murekkep }}>
      <div>
        <div style={{ fontWeight: 650, fontSize: 16 }}>{M.toplu.baslik}</div>
        <div style={{ fontSize: 13, color: R.soluk }}>{M.toplu.alt}</div>
        {!randevu.length && <div style={{ fontSize: 13, color: R.amber, marginTop: 4 }}>{M.toplu.randevuYok}</div>}
      </div>
      <label style={{ ...dugme('ikincil'), display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
        {M.dosyaSec}
        <input type="file" multiple accept="image/*,application/pdf,.pdf" hidden disabled={calisiyor} onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) void ekle(f) }} />
      </label>
      <div style={{ display: 'grid', gap: 8 }}>
        {sayfalar.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: `1px solid ${R.cizgi}`, borderRadius: 10, padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.kucuk} alt="" style={{ width: 48, borderRadius: 4, border: `1px solid ${R.cizgi}` }} />
            <span style={{ fontSize: 13, minWidth: 54 }}>{M.sayfa} {i + 1}</span>
            <select value={s.patientId || ''} onChange={(e) => setSayfalar((x) => x.map((y, j) => (j === i ? { ...y, patientId: e.target.value || null } : y)))} style={{ flex: 1, minHeight: 40, borderRadius: 8, border: `1px solid ${s.patientId ? R.cizgi : R.amber}`, fontSize: 14, padding: '0 8px' }}>
              <option value="">{M.toplu.eslesmedi}</option>
              {adaylar.map((a) => <option key={a.id} value={a.id}>{a.ad}</option>)}
            </select>
            {s.durum && <span style={{ fontSize: 12, color: R.soluk }}>{s.durum}</span>}
          </div>
        ))}
      </div>
      {sayfalar.some((s) => !s.patientId) && p.hastaSec((h) => setEkHastalar((e) => (e.some((x) => x.id === h.id) ? e : [...e, h])))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={dugme('birincil')} disabled={calisiyor || !sayfalar.length || sayfalar.some((s) => !s.patientId)} onClick={() => void dosyala()}>{calisiyor ? M.okunuyor : M.toplu.dosyala}</button>
      </div>
      {mesaj && <div role="status" style={{ fontSize: 13 }}>{mesaj}</div>}
    </section>
  )
}
