'use client'

/**
 * FOTO-ARSIV-01 — "Fotoğraflar" tab of the patient file: every clinical photo of the patient across visits, newest first and
 * grouped by day / visit, with region, tag, visit, favourite, star and key-photo filters, free-text search, batch actions,
 * a full-screen viewer, compare mode, a referral-ready PDF report, and a pre-save quality gate on new photos.
 * Universal for every branş (the content of a photo is the doctor's; nothing specialty-specific lives here).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bolgeEtiketi, BOLGELER } from '@/lib/doktor/fotoArsiv/bolgeler'
import {
  BOS_FILTRE, bolgeSayilari, etiketOzeti, filtreAktifMi, filtrele, gruplandir, yenidenEskiye,
  type Filtre, type FotoOge,
} from '@/lib/doktor/fotoArsiv/zamanCizelgesi'
import { RAPOR_OGE_AZAMI_ISTEMCI } from './sabitler'
import { ApiHatasi, bitmapAl, detayGetir, fotoYukle, kaliteKontrolEt, kucukYaz, listeGetir, metaYama, raporUret, topluYap, type ArsivYaniti, type TopluIslem } from './api'
import FotoGoruntuleyici, { tarihMetni } from './FotoGoruntuleyici'
import FotoKarsilastirma from './FotoKarsilastirma'
import FotoKucukResim, { kucukUnut } from './FotoKucukResim'
import VucutHaritasi from './VucutHaritasi'
import { bitmapKalitesi, blobaCevir, disaAktarGorseli, kucukResimUret, tuval, turevUret } from './istemciGorsel'
import { baslikKucuk, birincil, dugme, girdi, kart, R, rozet, tehlike } from './stil'
import { calismaBoyutu } from '@/lib/doktor/fotoArsiv/piksel'

type Durum = 'yukleniyor' | 'hazir' | 'yetkisiz' | 'etkin-degil' | 'kapali' | 'hata'

const CSS = `
.fa-kok{display:grid;gap:12px}
.fa-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}
.fa-grup{content-visibility:auto;contain-intrinsic-size:auto 340px}
.fa-kutu{position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden;cursor:pointer;border:2px solid transparent;background:#e7dfd0;padding:0;-webkit-tap-highlight-color:transparent}
.fa-kutu:focus-visible{outline:3px solid #2f4334;outline-offset:2px}
.fa-kutu[data-secili="1"]{border-color:#2f4334}
.fa-rozet{position:absolute;font-size:11px;line-height:1.2;padding:2px 6px;border-radius:999px;background:rgba(20,17,14,.72);color:#fff;pointer-events:none}
.fa-filtre{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
.fa-filtre>*{flex:none}
.fa-secim-cubugu{position:sticky;bottom:0;z-index:5;background:#fff;border:1px solid rgba(58,44,34,.18);border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;box-shadow:0 -4px 16px rgba(0,0,0,.12)}
@media (min-width:900px){.fa-izgara{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.fa-grup{contain-intrinsic-size:auto 420px}}
.fa-kok button{font-family:inherit}
`

const SAYFA = 90

function arsivdenHata(e: unknown): { durum: Durum; mesaj: string } {
  if (e instanceof ApiHatasi) {
    if (e.durum === 403) return { durum: 'yetkisiz', mesaj: 'Klinik fotoğraflar bu rol için kapalıdır.' }
    if (e.durum === 503) return { durum: 'etkin-degil', mesaj: e.message }
    if (e.durum === 404) return { durum: 'kapali', mesaj: 'Fotoğraf arşivi bu hesap için kapalı.' }
    return { durum: 'hata', mesaj: e.message }
  }
  return { durum: 'hata', mesaj: e instanceof Error ? e.message : 'Fotoğraflar yüklenemedi.' }
}

interface KaliteBekleyen { key: string; dosya: File; onizleme: string; mesaj: string; kaynak: 'cihaz' | 'ayse'; bolgeOnerisi: string | null }

/** Re-encodes through a canvas: strips EXIF/GPS, applies the orientation and bounds the size (the API body limit is ~4.5 MB). */
async function yuklemeyeHazirla(bmp: ImageBitmap): Promise<Blob> {
  const k = calismaBoyutu(bmp.width, bmp.height, 3000)
  const c = tuval(k.w, k.h)
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Tuval açılamadı')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  let q = 0.92
  for (let i = 0; i < 6; i++) {
    const b = await blobaCevir(c, 'image/jpeg', q)
    if (b && b.size <= 3_800_000) return b
    q -= 0.12
  }
  throw new Error('Fotoğraf yükleme sınırının altına küçültülemedi.')
}

export default function FotoArsivi({ patientId, veliDili, hastaAdi }: { patientId: string; veliDili: boolean; hastaAdi?: string }) {
  const [durum, setDurum] = useState<Durum>('yukleniyor')
  const [hataMesaji, setHataMesaji] = useState('')
  const [veri, setVeri] = useState<ArsivYaniti | null>(null)
  const [ogeler, setOgeler] = useState<FotoOge[]>([])
  const [filtre, setFiltre] = useState<Filtre>({ ...BOS_FILTRE })
  const [haritaAcik, setHaritaAcik] = useState(false)
  const [secimModu, setSecimModu] = useState(false)
  const [secili, setSecili] = useState<Set<string>>(new Set())
  const [acik, setAcik] = useState<string | null>(null)
  const [karsilastir, setKarsilastir] = useState<{ eski: string; yeni: string } | null>(null)
  const [gorunenAdet, setGorunenAdet] = useState(SAYFA)
  const [bildirim, setBildirim] = useState('')
  const [yukleme, setYukleme] = useState<{ toplam: number; biten: number; hatalar: string[] } | null>(null)
  const [kaliteBekleyen, setKaliteBekleyen] = useState<KaliteBekleyen[]>([])
  const [belgelerAcik, setBelgelerAcik] = useState(false)
  const [belgeSecili, setBelgeSecili] = useState<Set<string>>(new Set())
  const [raporAcik, setRaporAcik] = useState(false)
  const [raporDuzen, setRaporDuzen] = useState<'kolaj' | 'tek' | 'karsilastirma'>('kolaj')
  const [raporBaslik, setRaporBaslik] = useState('Klinik fotoğraf raporu')
  const [raporDurum, setRaporDurum] = useState('')
  const [topluEtiket, setTopluEtiket] = useState('')
  const dosyaRef = useRef<HTMLInputElement>(null)
  const kameraRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const uzunBasma = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const uzunBasildi = useRef(false)

  const doktorMu = !veri?.rol || veri.rol === 'doktor'

  const yukle = useCallback(async () => {
    try {
      const v = await listeGetir(patientId)
      setVeri(v); setOgeler(v.fotograflar); setDurum('hazir')
    } catch (e) {
      const h = arsivdenHata(e)
      setDurum(h.durum); setHataMesaji(h.mesaj)
    }
  }, [patientId])
  useEffect(() => { setDurum('yukleniyor'); void yukle() }, [yukle])

  const gorunen = useMemo(() => yenidenEskiye(filtrele(ogeler, filtre)), [ogeler, filtre])
  const gruplar = useMemo(() => gruplandir(gorunen), [gorunen])
  const sayilar = useMemo(() => bolgeSayilari(ogeler), [ogeler])
  const etiketler = useMemo(() => etiketOzeti(ogeler), [ogeler])
  const aktifFiltre = filtreAktifMi(filtre)

  // paged rendering: groups are cut at `gorunenAdet` tiles; a sentinel loads the next page
  const sayfalanmis = useMemo(() => {
    let kalan = gorunenAdet
    const cikti: typeof gruplar = []
    for (const g of gruplar) {
      if (kalan <= 0) break
      cikti.push(kalan >= g.ogeler.length ? g : { ...g, ogeler: g.ogeler.slice(0, kalan) })
      kalan -= g.ogeler.length
    }
    return cikti
  }, [gruplar, gorunenAdet])
  useEffect(() => { setGorunenAdet(SAYFA) }, [filtre])
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((g) => { if (g.some((x) => x.isIntersecting)) setGorunenAdet((n) => n + SAYFA) }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [gorunen.length, gorunenAdet])

  const yamala = useCallback((belgeId: string, yama: Partial<FotoOge>) => {
    setOgeler((l) => l.map((o) => (o.belgeId === belgeId ? { ...o, ...yama } : o)))
  }, [])

  // ─── selection ─────────────────────────────────────────────────────────────────────────────────────
  const secimiDegistir = (id: string) => setSecili((s) => { const y = new Set(s); if (y.has(id)) y.delete(id); else y.add(id); return y })
  const kutuyaBasildi = (o: FotoOge) => {
    if (uzunBasildi.current) { uzunBasildi.current = false; return }
    if (secimModu) secimiDegistir(o.belgeId)
    else setAcik(o.belgeId)
  }
  const uzunBasmaBasla = (o: FotoOge) => {
    uzunBasildi.current = false
    clearTimeout(uzunBasma.current)
    uzunBasma.current = setTimeout(() => { uzunBasildi.current = true; setSecimModu(true); setSecili((s) => new Set(s).add(o.belgeId)) }, 520)
  }
  const uzunBasmaBitir = () => clearTimeout(uzunBasma.current)
  const seciliListe = [...secili]

  const toplu = async (i: TopluIslem, yerel: (o: FotoOge) => Partial<FotoOge>) => {
    setBildirim('')
    try {
      const r = await topluYap(patientId, i)
      const set = new Set(r.guncellenen)
      setOgeler((l) => l.map((o) => (set.has(o.belgeId) ? { ...o, ...yerel(o) } : o)))
      setBildirim(`${r.guncellenen.length} fotoğraf güncellendi.`)
      if (i.islem === 'gizle') { setSecili(new Set()); void yukle() }
    } catch (e) { setBildirim(e instanceof Error ? e.message : 'İşlem tamamlanamadı.') }
  }

  // ─── upload with the pre-save quality gate ─────────────────────────────────────────────────────────
  const kaydet = useCallback(async (dosya: File, bolgeOnerisi: string | null) => {
    const bmp = await createImageBitmap(dosya, { imageOrientation: 'from-image' })
    try {
      const blob = await yuklemeyeHazirla(bmp)
      const ad = (dosya.name || 'fotograf').replace(/\.[^.]+$/, '') + '.jpg'
      const id = await fotoYukle(patientId, blob, ad)
      if (bolgeOnerisi) { try { await metaYama(patientId, id, { bolge: bolgeOnerisi, bolgeKaynagi: 'ayse' }) } catch { /* the photo is saved; the suggestion is optional */ } }
      try { const k = await kucukResimUret(bmp); await kucukYaz(patientId, id, k.blob, k.w, k.h) } catch { /* made later on demand */ }
    } finally { bmp.close() }
  }, [patientId])

  const dosyalariIsle = async (dosyalar: File[]) => {
    const liste = dosyalar.filter((f) => f.type.startsWith('image/')).slice(0, 20)
    if (!liste.length) { setBildirim('Yalnızca görüntü dosyaları eklenebilir.'); return }
    setBildirim('')
    setYukleme({ toplam: liste.length, biten: 0, hatalar: [] })
    const bekleyen: KaliteBekleyen[] = []
    for (const f of liste) {
      try {
        let bmp: ImageBitmap
        try { bmp = await createImageBitmap(f, { imageOrientation: 'from-image' }) }
        catch { throw new Error(`${f.name || 'Dosya'}: bu görüntü biçimi tarayıcıda açılamadı (HEIC ise JPEG olarak paylaşın).`) }
        let sorun: { mesaj: string; kaynak: 'cihaz' | 'ayse' } | null = null
        let bolgeOnerisi: string | null = null
        try {
          const k = bitmapKalitesi(bmp)
          if (k.durum === 'yetersiz') sorun = { mesaj: k.oneri || 'Fotoğraf yeterince net veya aydınlık görünmüyor.', kaynak: 'cihaz' }
          if (doktorMu) {
            try {
              const y = await kaliteKontrolEt(patientId, await turevUret(bmp, 1024, 0.8))
              if (y.durum === 'tamam') {
                if (y.sonuc.bolge.id && y.sonuc.bolge.guven !== 'dusuk') bolgeOnerisi = y.sonuc.bolge.id
                if (y.sonuc.yenile || y.sonuc.kalite.genel === 'yetersiz') sorun = { mesaj: y.sonuc.kalite.yenidenCekim || 'Ayşe: görüntü değerlendirme için yetersiz.', kaynak: 'ayse' }
              }
            } catch { /* the AI gate is advisory: it never blocks saving */ }
          }
        } finally { bmp.close() }
        if (sorun) bekleyen.push({ key: `${f.name}-${f.size}-${Math.random()}`, dosya: f, onizleme: URL.createObjectURL(f), mesaj: sorun.mesaj, kaynak: sorun.kaynak, bolgeOnerisi })
        else { await kaydet(f, bolgeOnerisi); setYukleme((y) => y && { ...y, biten: y.biten + 1 }) }
      } catch (e) {
        const m = e instanceof Error ? e.message : 'Yüklenemedi.'
        setYukleme((y) => y && { ...y, biten: y.biten + 1, hatalar: [...y.hatalar, m] })
      }
    }
    if (bekleyen.length) setKaliteBekleyen((l) => [...l, ...bekleyen])
    setYukleme((y) => (y && !y.hatalar.length ? null : y))
    await yukle()
  }

  const bekleyeniKaydet = async (b: KaliteBekleyen) => {
    setKaliteBekleyen((l) => l.filter((x) => x.key !== b.key))
    URL.revokeObjectURL(b.onizleme)
    try { await kaydet(b.dosya, b.bolgeOnerisi); await yukle(); setBildirim('Fotoğraf kaydedildi.') }
    catch (e) { setBildirim(e instanceof Error ? e.message : 'Yüklenemedi.') }
  }
  const bekleyeniAt = (b: KaliteBekleyen, yenidenCek: boolean) => {
    setKaliteBekleyen((l) => l.filter((x) => x.key !== b.key))
    URL.revokeObjectURL(b.onizleme)
    if (yenidenCek) kameraRef.current?.click()
  }

  // existing patient documents -> archive
  const belgelerdenEkle = async () => {
    const idler = [...belgeSecili]
    setBelgelerAcik(false); setBelgeSecili(new Set())
    let tamam = 0
    for (const id of idler) { try { await metaYama(patientId, id, { gizli: false }); tamam++ } catch { /* reported by the count */ } }
    setBildirim(`${tamam} belge fotoğraf arşivine eklendi.`)
    await yukle()
  }

  // ─── report ────────────────────────────────────────────────────────────────────────────────────────
  const raporOlustur = async () => {
    const idler = (gorunen.filter((o) => secili.has(o.belgeId)).map((o) => o.belgeId))
    if (!idler.length) { setRaporDurum('Önce fotoğraf seçin.'); return }
    if (idler.length > RAPOR_OGE_AZAMI_ISTEMCI) { setRaporDurum(`Bir raporda en fazla ${RAPOR_OGE_AZAMI_ISTEMCI} fotoğraf olabilir.`); return }
    if (raporDuzen === 'karsilastirma' && idler.length !== 2) { setRaporDurum('Karşılaştırma raporu için tam iki fotoğraf seçin.'); return }
    try {
      const ogelerR: { belgeId: string; gorsel: string }[] = []
      let toplam = 0
      const kalite = idler.length > 8 ? 0.7 : 0.8
      const kenar = idler.length > 8 ? 900 : raporDuzen === 'tek' || raporDuzen === 'karsilastirma' ? 1400 : 1100
      for (let i = 0; i < idler.length; i++) {
        setRaporDurum(`Hazırlanıyor… ${i + 1}/${idler.length}`)
        const [bmp, d] = await Promise.all([bitmapAl(patientId, idler[i]), detayGetir(patientId, idler[i])])
        const g = await disaAktarGorseli(bmp, d.meta.ozel.ayarlar, d.meta.ozel.notasyonlar, kenar, kalite)
        toplam += g.length
        ogelerR.push({ belgeId: idler[i], gorsel: g })
      }
      if (toplam > 4_000_000) throw new Error('Seçilen fotoğraflar rapor için fazla büyük; daha az fotoğraf seçin.')
      setRaporDurum('PDF oluşturuluyor…')
      const pdf = await raporUret(patientId, { baslik: raporBaslik, duzen: raporDuzen, ogeler: ogelerR })
      const u = URL.createObjectURL(pdf)
      const a = document.createElement('a')
      a.href = u; a.download = 'fotograf-raporu.pdf'; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(u), 10_000)
      setRaporDurum(''); setRaporAcik(false)
      setBildirim('Fotoğraf raporu indirildi.')
    } catch (e) { setRaporDurum(e instanceof Error ? e.message : 'Rapor oluşturulamadı.') }
  }

  const filtreGuncelle = (y: Partial<Filtre>) => setFiltre((f) => ({ ...f, ...y }))

  // ─── render ────────────────────────────────────────────────────────────────────────────────────────
  if (durum === 'yukleniyor') return <div style={{ ...kart, color: R.muted }} role="status">Fotoğraflar yükleniyor…</div>
  if (durum !== 'hazir') {
    const baslik = durum === 'yetkisiz' ? 'Bu bölüm bu rol için kapalı' : durum === 'etkin-degil' ? 'Fotoğraf arşivi henüz etkinleştirilmedi' : durum === 'kapali' ? 'Fotoğraf arşivi kapalı' : 'Fotoğraflar yüklenemedi'
    return (
      <div style={kart} role={durum === 'hata' ? 'alert' : 'status'} data-testid="foto-durum" data-durum={durum}>
        <strong>{baslik}</strong>
        <p style={{ margin: '6px 0 0', color: R.muted, fontSize: 13.5 }}>{hataMesaji}</p>
        {durum === 'hata' && <button style={{ ...birincil, marginTop: 8 }} onClick={() => { setDurum('yukleniyor'); void yukle() }}>Yeniden dene</button>}
      </div>
    )
  }

  const bos = ogeler.length === 0
  const seansEtiketi = (id: string) => { const s = veri?.seanslar.find((x) => x.id === id); return s ? `Muayene ${tarihMetni(s.tarih)}` : 'Muayene' }

  return (
    <div className="fa-kok" data-testid="foto-arsivi">
      <style>{CSS}</style>
      <input ref={dosyaRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) void dosyalariIsle(f) }} data-testid="foto-dosya-girdisi" />
      <input ref={kameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) void dosyalariIsle(f) }} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: R.ink }}>Fotoğraflar <span style={{ color: R.muted, fontWeight: 400, fontSize: 14 }}>({ogeler.length}{aktifFiltre ? `, ${gorunen.length} gösteriliyor` : ''})</span></h2>
          {hastaAdi && <div style={{ fontSize: 12, color: R.muted }}>{hastaAdi}</div>}
        </div>
        <button style={birincil} onClick={() => dosyaRef.current?.click()} data-testid="foto-ekle">Fotoğraf ekle</button>
        <button style={dugme} onClick={() => kameraRef.current?.click()}>Kamerayla çek</button>
        {veri && veri.eklenebilir.length > 0 && <button style={dugme} onClick={() => setBelgelerAcik(true)} data-testid="belgelerden-ekle">Belgelerden ekle ({veri.eklenebilir.length})</button>}
        {!bos && <button style={{ ...dugme, ...(secimModu ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }} aria-pressed={secimModu} onClick={() => { setSecimModu((s) => !s); setSecili(new Set()) }} data-testid="foto-sec">Seç</button>}
      </div>

      {veri && !veri.ozelliklerAcik && <div role="status" style={{ ...kart, background: '#faf6ee', fontSize: 13 }}>Etiket, yıldız ve düzenleme kayıtları henüz etkinleştirilmedi; fotoğraflar yalnızca görüntülenebilir.</div>}
      {veri?.kesildi && <div role="status" style={{ ...kart, fontSize: 13 }}>Çok sayıda belge var; en yeni kayıtlar gösteriliyor.</div>}
      {bildirim && <div role="status" style={{ fontSize: 13, color: R.pine }} data-testid="foto-bildirim">{bildirim}</div>}
      {yukleme && (
        <div role="status" style={{ ...kart, fontSize: 13 }} data-testid="foto-yukleme">
          Yükleniyor… {yukleme.biten}/{yukleme.toplam}
          {yukleme.hatalar.map((h, i) => <div key={i} style={{ color: R.warn }}>{h}</div>)}
          {yukleme.hatalar.length > 0 && yukleme.biten >= yukleme.toplam && <button style={{ ...dugme, marginTop: 6 }} onClick={() => setYukleme(null)}>Kapat</button>}
        </div>
      )}

      {!bos && (
        <div style={{ display: 'grid', gap: 8 }}>
          <input style={girdi} type="search" value={filtre.arama} placeholder="Ara: not, etiket, bölge, dosya adı" aria-label="Fotoğraflarda ara" onChange={(e) => filtreGuncelle({ arama: e.target.value })} data-testid="foto-ara" />
          <div className="fa-filtre" role="group" aria-label="Filtreler">
            <select style={{ ...girdi, width: 'auto' }} value={filtre.bolge ?? ''} onChange={(e) => filtreGuncelle({ bolge: e.target.value || null })} aria-label="Bölge" data-testid="filtre-bolge">
              <option value="">Tüm bölgeler</option>
              {BOLGELER.filter((b) => sayilar[b.id]).map((b) => <option key={b.id} value={b.id}>{b.etiket} ({sayilar[b.id]})</option>)}
            </select>
            <select style={{ ...girdi, width: 'auto' }} value={filtre.etiket ?? ''} onChange={(e) => filtreGuncelle({ etiket: e.target.value || null })} aria-label="Etiket" data-testid="filtre-etiket">
              <option value="">Tüm etiketler</option>
              {etiketler.map((t) => <option key={t.etiket} value={t.etiket}>#{t.etiket} ({t.adet})</option>)}
            </select>
            <select style={{ ...girdi, width: 'auto' }} value={filtre.seansId ?? ''} onChange={(e) => filtreGuncelle({ seansId: e.target.value || null })} aria-label="Muayene">
              <option value="">Tüm muayeneler</option>
              {veri?.seanslar.map((s) => <option key={s.id} value={s.id}>{tarihMetni(s.tarih)}</option>)}
            </select>
            <select style={{ ...girdi, width: 'auto' }} value={filtre.minYildiz} onChange={(e) => filtreGuncelle({ minYildiz: Number(e.target.value) })} aria-label="En az yıldız">
              <option value={0}>Her puan</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ yıldız</option>)}
            </select>
            <button style={{ ...dugme, ...(filtre.yalnizFavori ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }} aria-pressed={filtre.yalnizFavori} onClick={() => filtreGuncelle({ yalnizFavori: !filtre.yalnizFavori })} data-testid="filtre-favori">♥ Favoriler</button>
            <button style={{ ...dugme, ...(filtre.yalnizAnahtar ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }} aria-pressed={filtre.yalnizAnahtar} onClick={() => filtreGuncelle({ yalnizAnahtar: !filtre.yalnizAnahtar })}>Anahtar fotoğraflar</button>
            <button style={{ ...dugme, ...(haritaAcik ? { background: R.pine, color: '#fff', borderColor: R.pine } : {}) }} aria-pressed={haritaAcik} onClick={() => setHaritaAcik((a) => !a)} data-testid="filtre-harita">Vücut haritası</button>
            {aktifFiltre && <button style={tehlike} onClick={() => setFiltre({ ...BOS_FILTRE })} data-testid="filtre-temizle">Filtreleri temizle</button>}
          </div>
          {haritaAcik && (
            <div style={kart}>
              <div style={baslikKucuk}>Bölgeye göre filtrele</div>
              <VucutHaritasi deger={filtre.bolge} onSec={(id) => filtreGuncelle({ bolge: id })} sayilar={sayilar} />
            </div>
          )}
        </div>
      )}

      {bos && (
        <div style={{ ...kart, textAlign: 'center', padding: 24 }} data-testid="foto-bos">
          <strong>Bu hasta için klinik fotoğraf yok</strong>
          <p style={{ color: R.muted, fontSize: 13.5, margin: '6px 0 12px' }}>Muayenede çekilen fotoğraflar burada zaman çizelgesinde toplanır. Fotoğraf ekleyerek başlayın; bölge, etiket ve not ekleyebilir, iki tarihi karşılaştırabilirsiniz.</p>
          <button style={birincil} onClick={() => dosyaRef.current?.click()}>Fotoğraf ekle</button>
        </div>
      )}

      {!bos && gorunen.length === 0 && (
        <div style={{ ...kart, textAlign: 'center' }} data-testid="foto-sonuc-yok">Filtreye uyan fotoğraf yok. <button style={{ ...dugme, marginLeft: 6 }} onClick={() => setFiltre({ ...BOS_FILTRE })}>Filtreleri temizle</button></div>
      )}

      {sayfalanmis.map((g) => (
        <section key={g.anahtar} className="fa-grup" aria-label={g.baslik}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 6px' }}>
            <h3 style={{ margin: 0, fontSize: 14.5, color: R.ink }}>{g.baslik}</h3>
            {g.seansId && <span style={rozet()}>{seansEtiketi(g.seansId)}</span>}
            <span style={{ color: R.muted, fontSize: 12 }}>{g.ogeler.length} fotoğraf</span>
            {secimModu && <button style={{ ...dugme, minHeight: 32, padding: '2px 10px', fontSize: 12, marginLeft: 'auto' }} onClick={() => setSecili((s) => { const y = new Set(s); g.ogeler.forEach((o) => y.add(o.belgeId)); return y })}>Grubu seç</button>}
          </div>
          <div className="fa-izgara">
            {g.ogeler.map((o) => (
              <button
                key={o.belgeId} className="fa-kutu" data-testid="foto-kutu" data-belge={o.belgeId} data-secili={secili.has(o.belgeId) ? '1' : '0'}
                aria-label={`${o.bolge ? bolgeEtiketi(o.bolge) : 'Bölgesiz'} fotoğrafı, ${tarihMetni(o.cekimAt)}${o.favori ? ', favori' : ''}${o.yildiz ? `, ${o.yildiz} yıldız` : ''}`}
                aria-pressed={secimModu ? secili.has(o.belgeId) : undefined}
                onClick={() => kutuyaBasildi(o)} onPointerDown={() => uzunBasmaBasla(o)} onPointerUp={uzunBasmaBitir} onPointerLeave={uzunBasmaBitir} onPointerCancel={uzunBasmaBitir}
                onContextMenu={(e) => { if (secimModu || uzunBasildi.current) e.preventDefault() }}
              >
                <FotoKucukResim patientId={patientId} belgeId={o.belgeId} kucukVar={o.kucukVar} alt={`${o.bolge ? bolgeEtiketi(o.bolge) : 'Klinik fotoğraf'} ${tarihMetni(o.cekimAt)}`} />
                {o.favori && <span className="fa-rozet" style={{ right: 6, top: 6 }}>♥</span>}
                {secimModu && <span className="fa-rozet" style={{ left: 6, top: 6, background: secili.has(o.belgeId) ? R.pine : 'rgba(20,17,14,.55)', fontSize: 13, padding: '1px 7px' }}>{secili.has(o.belgeId) ? '✓' : '○'}</span>}
                <span style={{ position: 'absolute', left: 6, bottom: 6, right: 6, display: 'flex', gap: 4, flexWrap: 'wrap', pointerEvents: 'none' }}>
                  {o.bolge && <span className="fa-rozet" style={{ position: 'static' }}>{bolgeEtiketi(o.bolge)}</span>}
                  {o.yildiz > 0 && <span className="fa-rozet" style={{ position: 'static' }}>★ {o.yildiz}</span>}
                  {o.anahtar && <span className="fa-rozet" style={{ position: 'static', background: R.pine }}>Anahtar</span>}
                  {(o.duzenlendi || o.notasyonSayisi > 0) && <span className="fa-rozet" style={{ position: 'static' }}>{o.duzenlendi ? 'Düz.' : ''}{o.duzenlendi && o.notasyonSayisi ? ' · ' : ''}{o.notasyonSayisi ? `${o.notasyonSayisi} not.` : ''}</span>}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      {gorunen.length > gorunenAdet && <button style={dugme} onClick={() => setGorunenAdet((n) => n + SAYFA)}>Daha fazla göster ({gorunen.length - gorunenAdet})</button>}

      {secimModu && (
        <div className="fa-secim-cubugu" role="toolbar" aria-label="Toplu işlemler" data-testid="toplu-cubuk">
          <strong style={{ fontSize: 13 }}>{secili.size} seçili</strong>
          <button style={dugme} disabled={!secili.size} onClick={() => toplu({ islem: 'favori', belgeIds: seciliListe, deger: true }, () => ({ favori: true }))}>♥ Favori</button>
          <button style={dugme} disabled={!secili.size} onClick={() => toplu({ islem: 'anahtar', belgeIds: seciliListe, deger: true }, () => ({ anahtar: true }))}>Anahtar</button>
          <select style={{ ...girdi, width: 'auto' }} disabled={!secili.size} value="" aria-label="Yıldız ver" onChange={(e) => { const n = Number(e.target.value); if (n >= 0) void toplu({ islem: 'yildiz', belgeIds: seciliListe, deger: n }, () => ({ yildiz: n })) }}>
            <option value="">Yıldız…</option>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? 'Puanı kaldır' : `${n} yıldız`}</option>)}
          </select>
          <select style={{ ...girdi, width: 'auto' }} disabled={!secili.size} value="" aria-label="Bölge ata" data-testid="toplu-bolge" onChange={(e) => { const v = e.target.value; if (v) void toplu({ islem: 'bolge', belgeIds: seciliListe, deger: v === '_kaldir' ? null : v }, () => ({ bolge: v === '_kaldir' ? null : v, bolgeKaynagi: v === '_kaldir' ? null : 'hekim' })) }}>
            <option value="">Bölge…</option><option value="_kaldir">Bölgeyi kaldır</option>{BOLGELER.map((b) => <option key={b.id} value={b.id}>{b.etiket}</option>)}
          </select>
          <span style={{ display: 'flex', gap: 4 }}>
            <input style={{ ...girdi, width: 120 }} value={topluEtiket} maxLength={24} placeholder="Etiket" aria-label="Toplu etiket" onChange={(e) => setTopluEtiket(e.target.value)} />
            <button style={dugme} disabled={!secili.size || !topluEtiket.trim()} onClick={() => { const t = topluEtiket.trim(); void toplu({ islem: 'etiket-ekle', belgeIds: seciliListe, etiket: t }, (o) => ({ etiketler: o.etiketler.some((x) => x.toLocaleLowerCase('tr-TR') === t.toLocaleLowerCase('tr-TR')) ? o.etiketler : [...o.etiketler, t] })); setTopluEtiket('') }} data-testid="toplu-etiket-ekle">Etiketle</button>
          </span>
          <button style={dugme} disabled={secili.size !== 2} title="İki fotoğraf seçin" onClick={() => {
            const iki = gorunen.filter((o) => secili.has(o.belgeId)).sort((a, b) => Date.parse(a.cekimAt) - Date.parse(b.cekimAt))
            if (iki.length === 2) setKarsilastir({ eski: iki[0].belgeId, yeni: iki[1].belgeId })
          }} data-testid="toplu-karsilastir">Karşılaştır</button>
          <button style={dugme} disabled={!secili.size} onClick={() => { setRaporAcik(true); setRaporDuzen(secili.size === 2 ? 'karsilastirma' : 'kolaj'); setRaporDurum('') }} data-testid="toplu-rapor">Rapor (PDF)</button>
          <button style={tehlike} disabled={!secili.size} onClick={() => { if (window.confirm(`${secili.size} fotoğraf arşivden çıkarılsın mı? Belge hasta dosyasında kalır, silinmez.`)) void toplu({ islem: 'gizle', belgeIds: seciliListe, deger: true }, () => ({})) }}>Arşivden çıkar</button>
          <button style={dugme} onClick={() => { setSecimModu(false); setSecili(new Set()) }}>Bitti</button>
        </div>
      )}

      {raporAcik && (
        <Modal baslik="Fotoğraf raporu (PDF)" onKapat={() => setRaporAcik(false)}>
          <label style={{ fontSize: 13 }}>Başlık<input style={girdi} value={raporBaslik} maxLength={80} onChange={(e) => setRaporBaslik(e.target.value)} /></label>
          <div role="radiogroup" aria-label="Düzen" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {([['kolaj', 'Kolaj (sayfada birkaç fotoğraf)'], ['tek', 'Sayfa başına bir fotoğraf'], ['karsilastirma', 'Önce / sonra (tam iki fotoğraf)']] as const).map(([k, e]) => (
              <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, minHeight: 36 }}>
                <input type="radio" name="rapor-duzen" checked={raporDuzen === k} onChange={() => setRaporDuzen(k)} /> {e}
              </label>
            ))}
          </div>
          <p style={{ fontSize: 12, color: R.muted }}>{secili.size} fotoğraf · tarih, bölge, etiket, not ve notasyonlar rapora girer. Yapay zekâ metni rapora eklenmez.</p>
          {raporDurum && <div role="status" style={{ fontSize: 13, color: raporDurum.includes('…') ? R.ink : R.warn }}>{raporDurum}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={dugme} onClick={() => setRaporAcik(false)}>Vazgeç</button>
            <button style={birincil} onClick={raporOlustur} disabled={raporDurum.includes('…')} data-testid="rapor-uret">PDF oluştur</button>
          </div>
        </Modal>
      )}

      {belgelerAcik && veri && (
        <Modal baslik="Belgelerden fotoğraf ekle" onKapat={() => setBelgelerAcik(false)}>
          <p style={{ fontSize: 12.5, color: R.muted, margin: 0 }}>Hasta dosyasındaki görüntü belgelerinden arşive eklenecekleri seçin. Belgeler olduğu gibi kalır.</p>
          <div style={{ display: 'grid', gap: 4, maxHeight: '45vh', overflow: 'auto', margin: '8px 0' }}>
            {veri.eklenebilir.map((b) => (
              <label key={b.belgeId} style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 40, fontSize: 13.5 }}>
                <input type="checkbox" checked={belgeSecili.has(b.belgeId)} onChange={() => setBelgeSecili((s) => { const y = new Set(s); if (y.has(b.belgeId)) y.delete(b.belgeId); else y.add(b.belgeId); return y })} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.dosyaAdi}</span><span style={{ color: R.muted, fontSize: 12 }}>{tarihMetni(b.yuklenmeAt)}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={dugme} onClick={() => setBelgelerAcik(false)}>Vazgeç</button>
            <button style={birincil} disabled={!belgeSecili.size} onClick={belgelerdenEkle}>Arşive ekle ({belgeSecili.size})</button>
          </div>
        </Modal>
      )}

      {kaliteBekleyen[0] && (
        <Modal baslik="Çekimi yenileyin" onKapat={() => bekleyeniAt(kaliteBekleyen[0], false)} testid="kalite-modal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kaliteBekleyen[0].onizleme} alt="Yüklenecek fotoğraf" style={{ width: '100%', maxHeight: '38vh', objectFit: 'contain', background: '#14110e', borderRadius: 8 }} />
          <p style={{ fontSize: 13.5, margin: '8px 0 0' }} data-testid="kalite-mesaj"><strong>{kaliteBekleyen[0].kaynak === 'ayse' ? 'Ayşe’ye göre bu fotoğraf yetersiz: ' : 'Bu fotoğraf yetersiz görünüyor: '}</strong>{kaliteBekleyen[0].mesaj}</p>
          <p style={{ fontSize: 12, color: R.muted, margin: '4px 0 8px' }}>Kaydetmeden önce yeniden çekmeniz önerilir. Yine de kaydetmek isterseniz fotoğraf olduğu gibi arşive eklenir.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button style={dugme} onClick={() => bekleyeniAt(kaliteBekleyen[0], false)}>Vazgeç</button>
            <button style={dugme} onClick={() => bekleyeniKaydet(kaliteBekleyen[0])} data-testid="kalite-yine-de">Yine de kaydet</button>
            <button style={birincil} onClick={() => bekleyeniAt(kaliteBekleyen[0], true)} data-testid="kalite-yeniden-cek">Yeniden çek</button>
          </div>
          {kaliteBekleyen.length > 1 && <div style={{ fontSize: 12, color: R.muted, marginTop: 6 }}>Sırada {kaliteBekleyen.length - 1} fotoğraf daha var.</div>}
        </Modal>
      )}

      {acik && (
        <FotoGoruntuleyici
          patientId={patientId} ogeler={ogeler} gorunen={gorunen} belgeId={acik} rol={veri?.rol} veliDili={veliDili}
          etiketOnerileri={etiketler.map((t) => t.etiket)}
          onGit={setAcik} onKapat={() => { kucukUnut(patientId, acik); setAcik(null) }} onDegisti={yamala}
          onKarsilastir={(eski, yeni) => { setAcik(null); setKarsilastir({ eski, yeni }) }}
        />
      )}
      {karsilastir && (
        <FotoKarsilastirma patientId={patientId} ogeler={ogeler} eskiId={karsilastir.eski} yeniId={karsilastir.yeni} rol={veri?.rol} veliDili={veliDili} onKapat={() => setKarsilastir(null)} />
      )}
    </div>
  )
}

function Modal({ baslik, onKapat, children, testid }: { baslik: string; onKapat: () => void; children: React.ReactNode; testid?: string }) {
  useEffect(() => {
    const tus = (e: KeyboardEvent) => { if (e.key === 'Escape') onKapat() }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [onKapat])
  return (
    <div role="dialog" aria-modal="true" aria-label={baslik} data-testid={testid} style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(20,17,14,.55)', display: 'grid', placeItems: 'center', padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) onKapat() }}>
      <div style={{ background: '#faf6ee', borderRadius: 14, padding: 16, width: 'min(480px, 100%)', maxHeight: '90vh', overflow: 'auto', color: R.ink }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{baslik}</h3>
        {children}
      </div>
    </div>
  )
}

