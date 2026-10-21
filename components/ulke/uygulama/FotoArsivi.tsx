'use client'

/**
 * FOTO-ARSIV-01 — the patient photo archive, on the patient's file: upload, a plain viewer, a basic two-up
 * compare. Mounted the same way as the tools card (./AracKayitlari.tsx → HastaAracKayitlariKarti): a prop of
 * HastaDosyasiGorunumu (./Hastalar.tsx), supplied from HastaDosyasi() only where the country has `fotoArsivi` on.
 *
 * STORAGE AND VIEWING ONLY. No model reads a photo kept here — that is FOTO-ARSIV-02, a separate, not-yet-
 * authorized item (regulatory sign-off outstanding per country); this screen calls no model and sends a photo
 * to nobody.
 *
 * UPLOAD IS TWO STEPS, like MUAYENE-EKLERI-07 and a visit recording: the browser puts the image straight into its
 * OWN folder of the `hasta-fotograflari` bucket, then this component tells the server the resulting path, the
 * type, the size, the clinical date and an optional label (lib/ulke/fotoArsivi/fotoArsivi.ts does the
 * registering and the isolation).
 *
 * THE CLINICAL DATE IS TYPED WITH THE KIT'S OWN DATE FIELD (../girdi/TarihGirisi.tsx) — never a browser date
 * input, which reorders itself by the browser's own language (NOTYA-ULKE-DENETIM-01b).
 *
 * V1 LEAVES OUT, DELIBERATELY (this is a first version, not a port of the ~4,800-line Turkish implementation):
 *   - thumbnails in the list (a signed URL is asked for only when a photo is opened or put into the compare,
 *     not for every row at once — a thumbnail grid would mean a signed URL per photo on every visit to the file);
 *   - zoom, pan, rotation, measurement and any ANNOTATION of a photo;
 *   - a filmstrip / slider compare — the compare here is two photos, chosen by hand, shown side by side, nothing more;
 *   - grouping by body site or by visit, and bulk upload (one file, one submit, like every other uploader in this kit).
 * A native reader and a clinician have not read this screen's wording where the country's own catalogue says so.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, tarihYaz, saatYaz, type Uygulama } from './Kabuk'
import { TarihGirisi } from '../girdi/TarihGirisi'
import { GIRDI_GECERSIZ } from '@/lib/ulke/arayuz/zamanGirdisi'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { sesKlasoru } from '@/lib/ulke/uygulama/tablolar'
import { HASTA_FOTO_DOSYA_AZAMI, HASTA_FOTO_KOVASI, HASTA_FOTO_MIME_TURLERI } from '@/lib/ulke/tipler'

type HastaFotosu = { id: string; seansId: string | null; cekimTarihi: string; etiket: string; mimeTuru: string; boyut: number; olusturuldu: string }

function boyutYaz(b: number): string {
  if (b < 1_048_576) return `${Math.max(1, Math.round(b / 1024))} KB`
  return `${(b / 1_048_576).toFixed(1)} MB`
}

/**
 * AU-ARAC-GORUNUM-01 — one photo's row, shared by BOTH views (the flat list and the timeline): same label, same
 * date, same open/edit/delete/compare actions, same lazily-fetched image. Only the wrapping list element differs.
 */
function FotoSatiri(p: {
  f: HastaFotosu
  n: Uygulama['m']['fotoArsivi']
  acik: string | null
  urller: Record<string, string>
  karsilastir: readonly string[]
  silOnay: string | null
  duzenleId: string | null
  duzenleTarih: string
  duzenleEtiket: string
  m: Uygulama['m']
  ac: (id: string) => void
  karsilastirSecimDegistir: (id: string) => void
  duzenleAc: (f: HastaFotosu) => void
  duzenleKaydet: () => void
  sil: (id: string) => void
  setSilOnay: (id: string | null) => void
  setDuzenleId: (id: string | null) => void
  setDuzenleTarih: (v: string) => void
  setDuzenleEtiket: (v: string) => void
}) {
  const { f, n, acik, urller, karsilastir, silOnay, duzenleId, duzenleTarih, duzenleEtiket, m, ac, karsilastirSecimDegistir, duzenleAc, duzenleKaydet, sil, setSilOnay, setDuzenleId, setDuzenleTarih, setDuzenleEtiket } = p
  return (
    <li key={f.id} data-foto={f.id}>
      <div className="uza-satir">
        <label className="uza-liste-ad" style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-yazdirma-gizle>
          <input type="checkbox" checked={karsilastir.includes(f.id)} onChange={() => karsilastirSecimDegistir(f.id)} aria-label={n.karsilastir} />
          <span>
            {f.etiket || n.etiketYokYazi}
            <span className="uza-liste-alt">{tarihYaz(f.cekimTarihi)} · {boyutYaz(f.boyut)}</span>
          </span>
        </label>
        <div className="uza-eylemler" style={{ marginTop: 0 }} data-yazdirma-gizle>
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => ac(f.id)} data-eylem="foto-ac">{acik === f.id ? n.kapat : n.goster}</button>
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => duzenleAc(f)} data-eylem="foto-duzenle">{n.duzenle}</button>
          {silOnay === f.id ? (
            <>
              <button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => sil(f.id)} data-eylem="foto-sil-onayla">{n.sil}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setSilOnay(null)}>{n.iptal}</button>
            </>
          ) : (
            <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setSilOnay(f.id)} data-eylem="foto-sil">{n.sil}</button>
          )}
        </div>
      </div>
      {acik === f.id && urller[f.id] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urller[f.id]} alt={f.etiket || tarihYaz(f.cekimTarihi)} style={{ maxWidth: '100%', maxHeight: 420, marginTop: 8, borderRadius: 8 }} />
      ) : null}
      {duzenleId === f.id ? (
        <form className="uza-form" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); duzenleKaydet() }} data-yazdirma-gizle>
          <TarihGirisi id={`uza-foto-duzenle-${f.id}`} etiket={n.tarih} deger={duzenleTarih} degistir={setDuzenleTarih} m={m.girdi} />
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor={`uza-foto-etiket-${f.id}`}>{n.etiket}</label>
            <input id={`uza-foto-etiket-${f.id}`} className="uza-girdi" value={duzenleEtiket} onChange={(e) => setDuzenleEtiket(e.target.value)} maxLength={300} />
          </div>
          <div className="uza-eylemler">
            <button type="submit" className="uza-dugme">{n.kaydet}</button>
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => setDuzenleId(null)}>{n.iptal}</button>
          </div>
        </form>
      ) : null}
    </li>
  )
}

export function FotoArsivKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const m = u.m
  const n = m.fotoArsivi
  const { hesap, api } = u
  const [fotolar, setFotolar] = useState<HastaFotosu[] | null>(null)
  const [okumaHatasi, setOkumaHatasi] = useState(false)
  const [urller, setUrller] = useState<Record<string, string>>({})
  // AU-ARAC-GORUNUM-01 — which of the two views is open. Only offered when the pack's own catalogue has both view
  // labels (n.gorunumListe / n.gorunumZaman); every other pack keeps exactly today's one view, no toggle rendered.
  const [gorunum, setGorunum] = useState<'liste' | 'zaman'>('liste')
  const [acik, setAcik] = useState<string | null>(null)
  const [karsilastir, setKarsilastir] = useState<string[]>([])
  const [karsilastirAcik, setKarsilastirAcik] = useState(false)
  const [duzenleId, setDuzenleId] = useState<string | null>(null)
  const [duzenleTarih, setDuzenleTarih] = useState('')
  const [duzenleEtiket, setDuzenleEtiket] = useState('')
  const [silOnay, setSilOnay] = useState<string | null>(null)
  const [islemHata, setIslemHata] = useState<string | null>(null)
  const [islemIyi, setIslemIyi] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [dosya, setDosya] = useState<File | null>(null)
  const [tarih, setTarih] = useState('')
  const [etiket, setEtiket] = useState('')

  const yukle = useCallback(() => {
    api(`/api/ulke/hasta-foto?hastaId=${encodeURIComponent(hastaId)}`)
      .then((r) => { if (r.ok && Array.isArray(r.j.fotolar)) { setFotolar(r.j.fotolar as HastaFotosu[]); setOkumaHatasi(false) } else setOkumaHatasi(true) })
      .catch(() => setOkumaHatasi(true))
  }, [api, hastaId])
  useEffect(() => { if (hesap) yukle() }, [hesap, yukle])

  /** The signed URL of one photo — asked for once, kept for the life of the screen. */
  const urlGetir = useCallback(async (id: string): Promise<string | null> => {
    if (urller[id]) return urller[id]
    const r = await api(`/api/ulke/hasta-foto?indir=${encodeURIComponent(id)}`)
    if (r.ok && typeof r.j.url === 'string') { setUrller((e) => ({ ...e, [id]: r.j.url as string })); return r.j.url as string }
    return null
  }, [api, urller])

  async function ac(id: string) {
    setIslemHata(null)
    if (acik === id) { setAcik(null); return }
    const url = await urlGetir(id)
    setAcik(url ? id : null)
    if (!url) setIslemHata(n.indirilemedi)
  }

  function karsilastirSecimDegistir(id: string) {
    setKarsilastir((eski) => (eski.includes(id) ? eski.filter((x) => x !== id) : eski.length >= 2 ? [eski[1], id] : [...eski, id]))
    setKarsilastirAcik(false)
  }

  async function karsilastirmayiGoster() {
    setIslemHata(null)
    const sonuc = await Promise.all(karsilastir.map((id) => urlGetir(id)))
    if (sonuc.some((u2) => !u2)) { setIslemHata(n.indirilemedi); return }
    setKarsilastirAcik(true)
  }

  function duzenleAc(f: HastaFotosu) {
    setDuzenleId(f.id); setDuzenleTarih(f.cekimTarihi); setDuzenleEtiket(f.etiket); setIslemHata(null); setIslemIyi(null)
  }

  async function duzenleKaydet() {
    if (!duzenleId) return
    if (duzenleTarih === GIRDI_GECERSIZ) { setIslemHata(n.tarihGecersiz); return }
    setIslemHata(null); setIslemIyi(null)
    try {
      const r = await api('/api/ulke/hasta-foto', { method: 'PATCH', govde: { id: duzenleId, cekimTarihi: duzenleTarih || undefined, etiket: duzenleEtiket } })
      if (r.ok) { setDuzenleId(null); setIslemIyi(n.kaydedildi); await yukle() } else setIslemHata(r.j.code === 'TARIH_GECERSIZ' ? n.tarihGecersiz : n.kaydedilemedi)
    } catch { setIslemHata(m.kabuk.baglanti) }
  }

  async function sil(id: string) {
    setIslemHata(null); setIslemIyi(null)
    try {
      const r = await api('/api/ulke/hasta-foto', { method: 'DELETE', govde: { id } })
      if (r.ok) { setSilOnay(null); setKarsilastir((e) => e.filter((x) => x !== id)); setIslemIyi(n.silindi); await yukle() } else setIslemHata(n.silinemedi)
    } catch { setIslemHata(m.kabuk.baglanti) }
  }

  function dosyaSec(f: File) { setDosya(f); setIslemHata(null) }

  async function gonder() {
    if (!dosya) return
    if (tarih === GIRDI_GECERSIZ || !tarih) { setIslemHata(n.tarihGecersiz); return }
    if (!HASTA_FOTO_MIME_TURLERI.includes(dosya.type as (typeof HASTA_FOTO_MIME_TURLERI)[number])) { setIslemHata(n.dosyaTuru); return }
    if (dosya.size <= 0 || dosya.size > HASTA_FOTO_DOSYA_AZAMI) { setIslemHata(n.buyuk); return }
    setYukleniyor(true); setIslemHata(null); setIslemIyi(null)
    try {
      const supabase = ulkeIstemciSupabase()
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
      const hesapId = data.session?.user?.id
      if (!supabase || !hesapId) { setIslemHata(m.kabuk.hata); setYukleniyor(false); return }
      const rastgele = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const uzanti = (dosya.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin'
      const yol = `${sesKlasoru(hesapId)}/${rastgele}.${uzanti}`
      const { error } = await supabase.storage.from(HASTA_FOTO_KOVASI).upload(yol, dosya, { contentType: dosya.type })
      if (error) { setIslemHata(m.kabuk.hata); setYukleniyor(false); return }
      const r = await api('/api/ulke/hasta-foto', { method: 'POST', govde: { hastaId, yol, mimeTuru: dosya.type, boyut: dosya.size, cekimTarihi: tarih, etiket: etiket.trim() || undefined } })
      if (r.ok) { setDosya(null); setTarih(''); setEtiket(''); await yukle() } else {
        const kod = typeof r.j.code === 'string' ? r.j.code : ''
        setIslemHata(kod === 'DOSYA_TURU' ? n.dosyaTuru : kod === 'BUYUK' ? n.buyuk : kod === 'TARIH_GECERSIZ' ? n.tarihGecersiz : m.kabuk.hata)
      }
    } catch { setIslemHata(m.kabuk.baglanti) }
    setYukleniyor(false)
  }

  return (
    <section className="uza-kart" id="belgeler" data-alan="belgeler">
      <h2 className="uza-h2">{m.pano?.belgeler ?? n.baslik}</h2>
      <p className="uza-ust-yazi" data-alan="foto-arsivi">{n.baslik}</p>
      <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.aciklama}</p>

      {okumaHatasi ? <Hata>{n.okunamadi}</Hata> : !fotolar ? <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p> : !fotolar.length ? <p className="uza-bos">{n.bos}</p> : (
        <>
          <p className="uza-ipucu" data-yazdirma-gizle>{n.karsilastirSec}</p>
          {n.gorunumListe && n.gorunumZaman ? (
            <div className="uza-eylemler" style={{ marginBottom: 8 }} data-yazdirma-gizle data-alan="foto-gorunum-secici">
              <button type="button" className={gorunum === 'liste' ? 'uza-dugme uza-dugme-kucuk' : 'uza-dugme uza-dugme-cizgi uza-dugme-kucuk'} aria-pressed={gorunum === 'liste'} onClick={() => setGorunum('liste')} data-eylem="foto-gorunum-liste">{n.gorunumListe}</button>
              <button type="button" className={gorunum === 'zaman' ? 'uza-dugme uza-dugme-kucuk' : 'uza-dugme uza-dugme-cizgi uza-dugme-kucuk'} aria-pressed={gorunum === 'zaman'} onClick={() => setGorunum('zaman')} data-eylem="foto-gorunum-zaman">{n.gorunumZaman}</button>
            </div>
          ) : null}
          {gorunum === 'zaman' && n.gorunumZaman ? (
            <ol className="uza-liste uza-zaman-cizgisi" data-gorunum="zaman" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {fotolar.map((f) => (
                <li key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: '2px solid rgba(100,116,139,0.3)', paddingLeft: 10, marginLeft: 4, paddingBottom: 14 }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor', opacity: 0.55, marginTop: 7, marginLeft: -16, flex: '0 0 auto' }} />
                  <ul className="uza-liste" style={{ flex: 1, margin: 0 }}>
                    <FotoSatiri f={f} n={n} acik={acik} urller={urller} karsilastir={karsilastir} silOnay={silOnay} duzenleId={duzenleId} duzenleTarih={duzenleTarih} duzenleEtiket={duzenleEtiket} m={m}
                      ac={(id) => void ac(id)} karsilastirSecimDegistir={karsilastirSecimDegistir} duzenleAc={duzenleAc} duzenleKaydet={() => void duzenleKaydet()} sil={(id) => void sil(id)}
                      setSilOnay={setSilOnay} setDuzenleId={setDuzenleId} setDuzenleTarih={setDuzenleTarih} setDuzenleEtiket={setDuzenleEtiket} />
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="uza-liste" data-gorunum="liste">
              {fotolar.map((f) => (
                <FotoSatiri key={f.id} f={f} n={n} acik={acik} urller={urller} karsilastir={karsilastir} silOnay={silOnay} duzenleId={duzenleId} duzenleTarih={duzenleTarih} duzenleEtiket={duzenleEtiket} m={m}
                  ac={(id) => void ac(id)} karsilastirSecimDegistir={karsilastirSecimDegistir} duzenleAc={duzenleAc} duzenleKaydet={() => void duzenleKaydet()} sil={(id) => void sil(id)}
                  setSilOnay={setSilOnay} setDuzenleId={setDuzenleId} setDuzenleTarih={setDuzenleTarih} setDuzenleEtiket={setDuzenleEtiket} />
              ))}
            </ul>
          )}
          {karsilastir.length === 2 ? (
            <div style={{ marginTop: 12 }} data-yazdirma-gizle>
              <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => void karsilastirmayiGoster()} data-eylem="foto-karsilastir">{n.karsilastir}</button>
              {karsilastirAcik ? (
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }} data-alan="foto-karsilastirma">
                  {karsilastir.map((id) => {
                    const f = fotolar.find((x) => x.id === id)
                    return urller[id] && f ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <figure key={id} style={{ flex: '1 1 260px', minWidth: 200, margin: 0 }}>
                        <img src={urller[id]} alt={f.etiket || tarihYaz(f.cekimTarihi)} style={{ maxWidth: '100%', borderRadius: 8 }} />
                        <figcaption className="uza-liste-alt">{tarihYaz(f.cekimTarihi)}{f.etiket ? ` · ${f.etiket}` : ''}</figcaption>
                      </figure>
                    ) : null
                  })}
                  <div style={{ flexBasis: '100%' }}>
                    <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setKarsilastirAcik(false)}>{n.karsilastirKapat}</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <Hata>{duzenleId || karsilastir.length ? null : islemHata}</Hata>
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); void gonder() }} data-yazdirma-gizle>
        <TarihGirisi id="uza-foto-tarih" etiket={n.tarih} deger={tarih} degistir={setTarih} m={m.girdi} />
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-foto-etiket">{n.etiket}</label>
          <input id="uza-foto-etiket" className="uza-girdi" value={etiket} onChange={(e) => setEtiket(e.target.value)} maxLength={300} disabled={yukleniyor} />
        </div>
        <input type="file" accept={HASTA_FOTO_MIME_TURLERI.join(',')} className="uza-girdi" disabled={yukleniyor} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) dosyaSec(f) }} />
        <Hata>{islemHata}</Hata>
        <Bilgi>{islemIyi}</Bilgi>
        <button type="submit" className="uza-dugme" disabled={yukleniyor || !dosya} data-eylem="foto-yukle">{yukleniyor ? n.yukleniyor : n.yukle}</button>
      </form>
    </section>
  )
}
