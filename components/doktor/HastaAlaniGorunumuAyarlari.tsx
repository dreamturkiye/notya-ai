'use client'
/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — Ayarlar › Hasta Alanı Görünümü. The doctor decides how his patients' Sağlığım
 * opens: his logo, his photo (the profile photo he already has — reused, not copied), a display name, an accent from a
 * fixed accessible list; a live preview of the patient header on a phone and on a desktop and of the PIN screen, drawn
 * with the SAME components the portal uses (components/doktor/portal/HekimMarkasi.tsx). Core: every branş.
 * Logos are resized to 512 px in the browser (canvas → PNG, which also drops file metadata) before upload; the server
 * re-checks type by magic bytes, size, pixel size and strips metadata again (lib/portal/markaGorsel.ts). No SVG.
 * `klinikModu` = Notya Klinik › Ayarlar: the clinic logo instead of the doctor's own (POST /api/klinik/logo).
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Newsreader, Outfit } from 'next/font/google'
import { CHROME_RENK as R, CHROME_FONT as F } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { BOLUM_ADI, MARKA_HEDEF_PIKSEL, VURGU_SECENEKLERI, markaCoz, type MarkaGirdisi, type VurguAnahtari, VARSAYILAN_VURGU } from '@/lib/portal/marka'
import { MarkaBasligi, MarkaKarsilama, NotyaAltyapi } from '@/components/doktor/portal/HekimMarkasi'
import '@/components/doktor/portal/hekimMarkasi.css'

const newsreader = Newsreader({ subsets: ['latin', 'latin-ext'], variable: '--font-newsreader', display: 'swap' })
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], variable: '--font-outfit', display: 'swap' })

const kart: CSSProperties = { background: '#fff', border: `1px solid ${R.border}`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 18px rgba(58,44,34,0.045)', marginBottom: 14 }
const baslik: CSSProperties = { fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: R.ink }
const kucuk: CSSProperties = { fontSize: 13, color: R.muted, lineHeight: 1.5, margin: 0 }
const girdiStil: CSSProperties = { minHeight: 42, width: '100%', borderRadius: 10, border: '1px solid rgba(58,44,34,0.18)', padding: '0 12px', fontSize: 15, color: R.ink, background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }
const btn: CSSProperties = { minHeight: 40, padding: '0 16px', borderRadius: 999, border: `1px solid ${R.border}`, background: '#f6f0e6', color: R.ink, font: `600 14px ${F.sans}`, cursor: 'pointer' }
const btnAna: CSSProperties = { ...btn, background: R.pine, borderColor: R.pine, color: '#faf6ee' }

const IZINLI = ['image/png', 'image/jpeg', 'image/webp']

/** Resize in the browser: fit inside 512 px, re-encode (PNG keeps a logo's transparency; JPEG for a photo). */
export async function gorselKucult(file: File, tur: 'image/png' | 'image/jpeg'): Promise<Blob> {
  if (!IZINLI.includes(file.type) || /\.svgz?$/i.test(file.name)) throw new Error('Yalnızca PNG, JPG veya WebP yükleyebilirsiniz (SVG kabul edilmez).')
  if (file.size > 8 * 1024 * 1024) throw new Error('Dosya çok büyük.')
  const bmp = await createImageBitmap(file)
  const o = Math.min(1, MARKA_HEDEF_PIKSEL / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * o))
  c.height = Math.max(1, Math.round(bmp.height * o))
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Görsel hazırlanamadı.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, tur, 0.88))
  if (!blob) throw new Error('Görsel hazırlanamadı.')
  if (blob.size > 2 * 1024 * 1024) throw new Error('Logo en fazla 2 MB olabilir.')
  return blob
}

const ORNEK_NAV = ['Bugün', 'Randevu', 'Mesajlar', 'Ziyaretler', 'Sonuçlar', 'İlaçlar']

/** The patient header as the portal draws it (same lockup), inside a device frame. */
function Onizleme({ girdi, genislik, etiket, olcek = 1 }: { girdi: MarkaGirdisi; genislik: number; etiket: string; olcek?: number }) {
  const marka = markaCoz(girdi)
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ width: genislik * olcek, height: 250 * olcek, overflow: 'hidden', borderRadius: genislik < 500 ? 26 : 14, border: '1px solid rgba(58,44,34,0.14)', boxShadow: '0 14px 30px rgba(58,44,34,0.1)', background: '#f4eee3' }}>
        <div style={{ width: genislik, transform: `scale(${olcek})`, transformOrigin: 'top left', fontFamily: 'var(--sg-font-ui)' }}>
          <div style={{ background: 'rgba(236,241,235,0.92)', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '14px 18px 0' }}>
            <MarkaBasligi marka={marka} sag="Ayşe Yılmaz" />
            <div style={{ display: 'flex', gap: 6, padding: '10px 0 12px', overflow: 'hidden' }}>
              {ORNEK_NAV.map((n, i) => (
                <span key={n} style={{ flex: '0 0 auto', padding: '9px 13px', borderRadius: 999, fontSize: 13, fontWeight: 650, color: i === 0 ? '#0F9B8E' : '#8b7d70', background: i === 0 ? '#E4F3F1' : 'transparent' }}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ padding: '18px 18px 0' }}>
            <p style={{ margin: 0, fontFamily: 'var(--sg-font-display)', fontSize: 24, color: '#3b2e24' }}>Günaydın, Ayşe</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={{ padding: '10px 14px', borderRadius: 999, background: '#3b2e24', color: '#f4f8fa', fontSize: 13, fontWeight: 600 }}>Randevu al</span>
              <span style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(58,44,34,0.16)', background: '#fff', color: '#3b2e24', fontSize: 13, fontWeight: 600 }}>Doktoruma yaz</span>
            </div>
          </div>
        </div>
      </div>
      <figcaption style={{ ...kucuk, marginTop: 8 }}>{etiket}</figcaption>
    </figure>
  )
}

function PinOnizleme({ girdi }: { girdi: MarkaGirdisi }) {
  const marka = markaCoz(girdi)
  const olcek = 0.62
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ width: 360 * olcek, height: 620 * olcek, overflow: 'hidden', borderRadius: 26, border: '1px solid rgba(58,44,34,0.14)', boxShadow: '0 14px 30px rgba(58,44,34,0.1)', background: 'linear-gradient(180deg,#faf6ee 0%,#f4eee3 60%,#efe9dc 100%)' }}>
        <div style={{ width: 360, height: 620, transform: `scale(${olcek})`, transformOrigin: 'top left', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 22px', boxSizing: 'border-box', fontFamily: 'var(--sg-font-ui)' }}>
          <div style={{ marginTop: 'auto' }} />
          <MarkaKarsilama marka={marka} />
          <p style={{ margin: '0 0 18px', color: '#8b7d70', fontSize: 15, lineHeight: 1.55, textAlign: 'center', maxWidth: 300 }}>Alanınızı açmak için doktorunuzun verdiği 6 haneli PIN&apos;i girin.</p>
          <div style={{ width: 240, height: 56, borderRadius: 14, border: '1px solid rgba(58,44,34,0.1)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.4em', fontSize: 24, color: '#c9bea9' }}>······</div>
          <div style={{ marginTop: 'auto' }}><NotyaAltyapi /></div>
        </div>
      </div>
      <figcaption style={{ ...kucuk, marginTop: 8 }}>İlk açılış (PIN)</figcaption>
    </figure>
  )
}

type Durum = { girdi: MarkaGirdisi; fotoVar: boolean }

export default function HastaAlaniGorunumuAyarlari({ klinikModu = false }: { klinikModu?: boolean }) {
  const [durum, setDurum] = useState<Durum | null>(null)
  const [foto, setFoto] = useState<string | null>(null)
  const [gorunenAd, setGorunenAd] = useState('')
  const [vurgu, setVurgu] = useState<VurguAnahtari>(VARSAYILAN_VURGU)
  const [fotoGoster, setFotoGoster] = useState(true)
  const [mesaj, setMesaj] = useState<{ tur: 'ok' | 'hata'; metin: string } | null>(null)
  const [mesgul, setMesgul] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let iptal = false
    Promise.all([
      doktorFetch('/api/doktor/hasta-alani', {}).then((r) => (r.ok ? r.json() : null)),
      doktorFetch('/api/doktor/profil/avatar', {}).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([a, av]) => {
      if (iptal || !a) { if (!iptal) setMesaj({ tur: 'hata', metin: 'Ayarlar yüklenemedi. Sayfayı yenileyin.' }); return }
      setDurum({ girdi: a.girdi, fotoVar: !!a.fotoVar })
      setGorunenAd(a.girdi.gorunenAd || '')
      setVurgu((a.girdi.vurgu as VurguAnahtari) || VARSAYILAN_VURGU)
      setFotoGoster(a.girdi.fotoGoster !== false)
      setFoto(av?.avatar?.dataUrl || null)
    })
    return () => { iptal = true }
  }, [])

  const girdi: MarkaGirdisi | null = useMemo(() => durum ? { ...durum.girdi, gorunenAd: klinikModu ? durum.girdi.gorunenAd : gorunenAd, vurgu, fotoGoster, fotoUrl: foto } : null, [durum, gorunenAd, vurgu, fotoGoster, foto, klinikModu])

  if (!durum || !girdi) return <p style={kucuk}>{mesaj?.metin || 'Yükleniyor…'}</p>

  const klinik = durum.girdi.notyaKlinik
  const logoUrl = klinikModu ? klinik?.logoUrl || null : durum.girdi.logoUrl || null
  const varsayilanAd = markaCoz({ ...durum.girdi, gorunenAd: null, notyaKlinik: null }).ad

  const logoYukle = async (file: File | undefined) => {
    if (!file) return
    setMesaj(null); setMesgul('logo')
    try {
      const blob = await gorselKucult(file, 'image/png')
      const fd = new FormData(); fd.append('file', blob, 'logo.png')
      const r = await doktorFetch(klinikModu ? '/api/klinik/logo' : '/api/doktor/hasta-alani/logo', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Logo yüklenemedi.')
      setDurum((d) => d && (klinikModu ? { ...d, girdi: { ...d.girdi, notyaKlinik: d.girdi.notyaKlinik ? { ...d.girdi.notyaKlinik, logoUrl: j.logoUrl } : null } } : { ...d, girdi: { ...d.girdi, logoUrl: j.logoUrl } }))
      setMesaj({ tur: 'ok', metin: 'Logo yüklendi. Hastalarınız artık bu logoyu görür.' })
    } catch (e) {
      setMesaj({ tur: 'hata', metin: (e as Error).message })
    } finally { setMesgul(null); if (logoRef.current) logoRef.current.value = '' }
  }
  const logoKaldir = async () => {
    setMesaj(null); setMesgul('logo')
    const r = await doktorFetch(klinikModu ? '/api/klinik/logo' : '/api/doktor/hasta-alani/logo', { method: 'DELETE' })
    setMesgul(null)
    if (!r.ok) { setMesaj({ tur: 'hata', metin: 'Logo kaldırılamadı.' }); return }
    setDurum((d) => d && (klinikModu ? { ...d, girdi: { ...d.girdi, notyaKlinik: d.girdi.notyaKlinik ? { ...d.girdi.notyaKlinik, logoUrl: null } : null } } : { ...d, girdi: { ...d.girdi, logoUrl: null } }))
    setMesaj({ tur: 'ok', metin: 'Logo kaldırıldı.' })
  }
  const fotoYukle = async (file: File | undefined) => {
    if (!file) return
    setMesaj(null); setMesgul('foto')
    try {
      const blob = await gorselKucult(file, 'image/jpeg')
      const fd = new FormData(); fd.append('file', new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
      const r = await doktorFetch('/api/doktor/profil/avatar', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Fotoğraf yüklenemedi.')
      setFoto(j.avatar?.dataUrl || null)
      setDurum((d) => d && { ...d, fotoVar: true })
      setMesaj({ tur: 'ok', metin: 'Fotoğrafınız güncellendi.' })
    } catch (e) {
      setMesaj({ tur: 'hata', metin: (e as Error).message })
    } finally { setMesgul(null); if (fotoRef.current) fotoRef.current.value = '' }
  }
  const kaydet = async () => {
    setMesaj(null); setMesgul('kaydet')
    const r = await doktorFetch('/api/doktor/hasta-alani', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gorunenAd: gorunenAd.trim() || null, vurgu, fotoGoster }) })
    const j = await r.json().catch(() => ({}))
    setMesgul(null)
    setMesaj(r.ok ? { tur: 'ok', metin: 'Kaydedildi. Hastalarınız bir sonraki açılışta yeni görünümü görür.' } : { tur: 'hata', metin: j.error || 'Kaydedilemedi.' })
  }

  const fontStil = { ['--sg-font-display' as string]: 'var(--font-newsreader), Georgia, serif', ['--sg-font-ui' as string]: 'var(--font-outfit), "Segoe UI", sans-serif' } as CSSProperties

  return (
    <div className={`${newsreader.variable} ${outfit.variable}`} style={{ ...fontStil, display: 'grid', gap: 0, maxWidth: 980 }}>
      {klinik && !klinikModu ? (
        <div style={{ ...kart, background: '#FBF6EC' }} data-alan="klinik-notu">
          <p style={baslik}>Notya Klinik üyesisiniz</p>
          <p style={kucuk}>Hastalarınız Sağlığım’ın üstünde kliniğinizin adını ({klinik.ad}) ve klinik logosunu görür; adınız ve branşınız hemen altında yer alır. Klinik logosu Notya Klinik › Ayarlar’dan değişir.</p>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: 14, alignItems: 'start' }}>
        <div>
          <section style={kart} aria-labelledby="ha-logo">
            <p id="ha-logo" style={baslik}>{klinikModu ? 'Klinik logosu' : 'Logo'}</p>
            <p style={kucuk}>{klinikModu ? 'Kliniğinizdeki tüm hekimlerin hastaları Sağlığım’ı bu logoyla açar.' : 'Muayenehanenizin logosu varsa hastalarınız Sağlığım’ı onunla açar.'} PNG, JPG veya WebP; en fazla 2 MB. SVG kabul edilmez. Logo 512 piksele küçültülür ve dosya bilgileri silinir.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, border: '1px solid rgba(58,44,34,0.12)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8, boxSizing: 'border-box' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logoUrl ? <img src={logoUrl} alt="Yüklü logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ ...kucuk, fontSize: 12, textAlign: 'center' }}>Logo yok</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={btnAna} disabled={!!mesgul} onClick={() => logoRef.current?.click()}>{mesgul === 'logo' ? 'Yükleniyor…' : logoUrl ? 'Logoyu değiştir' : 'Logo yükle'}</button>
                {logoUrl ? <button type="button" style={btn} disabled={!!mesgul} onClick={logoKaldir}>Kaldır</button> : null}
              </div>
              <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => logoYukle(e.target.files?.[0])} data-alan="logo-dosya" />
            </div>
          </section>

          {!klinikModu ? (
            <>
              <section style={kart} aria-labelledby="ha-foto">
                <p id="ha-foto" style={baslik}>Fotoğraf</p>
                <p style={kucuk}>Logo yoksa hastalarınız profil fotoğrafınızı görür. Bu, karşılama ekranınızdaki fotoğrafın aynısıdır.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#efe9dc', border: '1px solid rgba(58,44,34,0.12)', flex: '0 0 auto' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {foto ? <img src={foto} alt="Profil fotoğrafınız" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button type="button" style={btn} disabled={!!mesgul} onClick={() => fotoRef.current?.click()}>{mesgul === 'foto' ? 'Yükleniyor…' : foto ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'}</button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: R.ink, cursor: 'pointer' }}>
                      <input type="checkbox" checked={fotoGoster} onChange={(e) => setFotoGoster(e.target.checked)} />
                      Logo yokken fotoğrafımı göster
                    </label>
                  </div>
                  <input ref={fotoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => fotoYukle(e.target.files?.[0])} />
                </div>
              </section>

              <section style={kart} aria-labelledby="ha-ad">
                <label id="ha-ad" htmlFor="ha-ad-girdi" style={baslik}>Görünen ad</label>
                <p style={{ ...kucuk, marginBottom: 10 }}>Boş bırakırsanız hastalarınız “{varsayilanAd}” görür.</p>
                <input id="ha-ad-girdi" style={girdiStil} value={gorunenAd} maxLength={80} placeholder="Örnek: Dr. Kaan Arıoğlu Çocuk Kliniği" onChange={(e) => setGorunenAd(e.target.value)} />
              </section>
            </>
          ) : null}

          <section style={kart} aria-labelledby="ha-renk">
            <p id="ha-renk" style={baslik}>Renk</p>
            <p style={{ ...kucuk, marginBottom: 12 }}>Baş harfleriniz ve “{BOLUM_ADI}” yazısı bu renkle görünür. Hepsi kolay okunacak koyulukta.</p>
            <div role="radiogroup" aria-labelledby="ha-renk" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(Object.keys(VURGU_SECENEKLERI) as VurguAnahtari[]).map((k) => {
                const v = VURGU_SECENEKLERI[k]
                const secili = vurgu === k
                return (
                  <button key={k} type="button" role="radio" aria-checked={secili} onClick={() => setVurgu(k)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 999, border: secili ? `2px solid ${v.koyu}` : '1px solid rgba(58,44,34,0.14)', background: secili ? v.acik : '#fff', cursor: 'pointer', font: `600 13px ${F.sans}`, color: R.ink }}>
                    <span aria-hidden style={{ width: 24, height: 24, borderRadius: '50%', background: v.koyu }} />
                    {v.ad}
                  </button>
                )
              })}
            </div>
          </section>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '4px 0 18px' }}>
            {!klinikModu ? <button type="button" style={btnAna} disabled={!!mesgul} onClick={kaydet}>{mesgul === 'kaydet' ? 'Kaydediliyor…' : 'Kaydet'}</button> : null}
            {mesaj ? <p role={mesaj.tur === 'hata' ? 'alert' : 'status'} style={{ ...kucuk, color: mesaj.tur === 'hata' ? '#8B3A2E' : R.pine, fontWeight: 600 }}>{mesaj.metin}</p> : null}
          </div>
        </div>

        <section style={{ ...kart, background: '#FBF8F2' }} aria-labelledby="ha-onizleme" data-alan="hasta-alani-onizleme">
          <p id="ha-onizleme" style={baslik}>Hastanızın gördüğü</p>
          <p style={{ ...kucuk, marginBottom: 14 }}>Değişiklikler burada hemen görünür. Notya yalnız sayfanın en altında küçük bir satırdır.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Onizleme girdi={girdi} genislik={360} olcek={0.82} etiket="Telefon" />
            <PinOnizleme girdi={girdi} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Onizleme girdi={girdi} genislik={980} olcek={0.44} etiket="Bilgisayar" />
          </div>
        </section>
      </div>
    </div>
  )
}
