'use client'

/**
 * MUAYENE-EKLERI-07 — "Yüklenen dosyalar" on the visit/note screen: upload, list, download, delete of a file
 * attached to ONE visit (a lab PDF, a scanned referral, a photographed document). Mounted in Not.tsx exactly
 * where DosyaEk is, after the note — not inside it: this is a separate card, with its own catalogue group.
 *
 * UPLOAD IS TWO STEPS, like a visit recording (Muayene.tsx): the file goes straight into the caller's own folder
 * of the `muayene-ekleri` bucket; only then does this component tell the server the resulting path, the name and
 * the type. The server does the registering and the isolation (lib/ulke/muayeneEki/muayeneEki.ts) — nothing here
 * is trusted on its own.
 *
 * V1 LEAVES OUT: a preview of the file (the list shows its name, size and date only — opening it means
 * downloading it); more than one file chosen at once (one upload, one submit, like the recording picker).
 *
 * Machine-written catalogue sentences (countries/.../ "muayeneEkleri"). No clinician or native reader has signed
 * this wording in a country where the pack flags it as such.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, tarihYaz, saatYaz, type Api } from './Kabuk'
import { ulkeIstemciSupabase } from '@/lib/ulke/istemciSupabase'
import { sesKlasoru } from '@/lib/ulke/uygulama/tablolar'
import { MUAYENE_EKI_DOSYA_AZAMI, MUAYENE_EKLERI_KOVASI, MUAYENE_EKI_MIME_TURLERI } from '@/lib/ulke/tipler'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'

type MuayeneEki = { id: string; ad: string; mimeTuru: string; boyut: number; olusturuldu: string }

/** '245 KB' under 1 MB, '2.3 MB' at or above it — matching the catalogue's own "10 MB" / "12 MB" wording. */
function boyutYaz(b: number): string {
  if (b < 1_048_576) return `${Math.max(1, Math.round(b / 1024))} KB`
  return `${(b / 1_048_576).toFixed(1)} MB`
}

export function MuayeneEkleri({ m, seansId, api }: { m: UygulamaMetni; seansId: string; api: Api }) {
  const n = m.muayeneEkleri
  const [ekler, setEkler] = useState<MuayeneEki[] | null>(null)
  const [okumaHatasi, setOkumaHatasi] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [islemHata, setIslemHata] = useState<string | null>(null)
  const [islemIyi, setIslemIyi] = useState<string | null>(null)
  const [silOnay, setSilOnay] = useState<string | null>(null)
  const [ad, setAd] = useState('')
  const [dosya, setDosya] = useState<File | null>(null)

  const yukle = useCallback(() => {
    api(`/api/ulke/muayene-ek?seansId=${encodeURIComponent(seansId)}`)
      .then((r) => { if (r.ok && Array.isArray(r.j.ekler)) { setEkler(r.j.ekler as MuayeneEki[]); setOkumaHatasi(false) } else setOkumaHatasi(true) })
      .catch(() => setOkumaHatasi(true))
  }, [api, seansId])
  useEffect(() => { yukle() }, [yukle])

  function dosyaSec(f: File) {
    setDosya(f)
    setIslemHata(null)
    if (!ad.trim()) setAd(f.name.replace(/\.[^.]+$/, '').slice(0, 200))
  }

  async function gonder() {
    if (!dosya) return
    if (!ad.trim()) { setIslemHata(n.adGerekli); return }
    if (!MUAYENE_EKI_MIME_TURLERI.includes(dosya.type as (typeof MUAYENE_EKI_MIME_TURLERI)[number])) { setIslemHata(n.dosyaTuru); return }
    if (dosya.size <= 0 || dosya.size > MUAYENE_EKI_DOSYA_AZAMI) { setIslemHata(n.buyuk); return }
    setYukleniyor(true); setIslemHata(null); setIslemIyi(null)
    try {
      const supabase = ulkeIstemciSupabase()
      const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } }
      const hesapId = data.session?.user?.id
      if (!supabase || !hesapId) { setIslemHata(m.kabuk.hata); setYukleniyor(false); return }
      // The browser uploads straight into its OWN folder; the storage policy accepts nothing else.
      const rastgele = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const uzanti = (dosya.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin'
      const yol = `${sesKlasoru(hesapId)}/${rastgele}.${uzanti}`
      const { error } = await supabase.storage.from(MUAYENE_EKLERI_KOVASI).upload(yol, dosya, { contentType: dosya.type })
      if (error) { setIslemHata(m.kabuk.hata); setYukleniyor(false); return }
      const r = await api('/api/ulke/muayene-ek', { method: 'POST', govde: { seansId, yol, ad: ad.trim(), mimeTuru: dosya.type, boyut: dosya.size } })
      if (r.ok) { setAd(''); setDosya(null); await yukle() } else {
        const kod = typeof r.j.code === 'string' ? r.j.code : ''
        setIslemHata(kod === 'AD_GEREKLI' ? n.adGerekli : kod === 'DOSYA_TURU' ? n.dosyaTuru : kod === 'BUYUK' ? n.buyuk : m.kabuk.hata)
      }
    } catch { setIslemHata(m.kabuk.baglanti) }
    setYukleniyor(false)
  }

  async function indir(id: string) {
    setIslemHata(null)
    try {
      const r = await api(`/api/ulke/muayene-ek?indir=${encodeURIComponent(id)}`)
      if (r.ok && typeof r.j.url === 'string') window.open(r.j.url, '_blank', 'noopener')
      else setIslemHata(n.indirilemedi)
    } catch { setIslemHata(m.kabuk.baglanti) }
  }

  async function sil(id: string) {
    setIslemHata(null); setIslemIyi(null)
    try {
      const r = await api('/api/ulke/muayene-ek', { method: 'DELETE', govde: { id } })
      if (r.ok) { setSilOnay(null); setIslemIyi(n.silindi); await yukle() } else setIslemHata(n.silinemedi)
    } catch { setIslemHata(m.kabuk.baglanti) }
  }

  return (
    <section className="uza-kart" data-alan="muayene-ekleri">
      <h2 className="uza-h2">{n.baslik}</h2>
      <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.aciklama}</p>

      {okumaHatasi ? <Hata>{n.okunamadi}</Hata> : !ekler ? <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p> : !ekler.length ? <p className="uza-bos">{n.bos}</p> : (
        <ul className="uza-liste">
          {ekler.map((e) => (
            <li key={e.id} data-ek={e.id}>
              <div className="uza-satir">
                <span className="uza-liste-ad">{e.ad}<span className="uza-liste-alt">{boyutYaz(e.boyut)} · {tarihYaz(e.olusturuldu)} {saatYaz(e.olusturuldu)}</span></span>
                <div className="uza-eylemler" style={{ marginTop: 0 }} data-yazdirma-gizle>
                  <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => void indir(e.id)} data-eylem="ek-indir">{n.indir}</button>
                  {silOnay === e.id ? (
                    <>
                      <button type="button" className="uza-dugme uza-dugme-kucuk" onClick={() => void sil(e.id)} data-eylem="ek-sil-onayla">{n.sil}</button>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setSilOnay(null)}>{n.iptal}</button>
                    </>
                  ) : (
                    <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setSilOnay(e.id)} data-eylem="ek-sil">{n.sil}</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); void gonder() }} data-yazdirma-gizle>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-ek-ad">{n.ad}</label>
          <input id="uza-ek-ad" className="uza-girdi" value={ad} onChange={(e) => setAd(e.target.value)} maxLength={200} disabled={yukleniyor} />
        </div>
        <input type="file" accept={MUAYENE_EKI_MIME_TURLERI.join(',')} className="uza-girdi" disabled={yukleniyor} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) dosyaSec(f) }} />
        <Hata>{islemHata}</Hata>
        <Bilgi>{islemIyi}</Bilgi>
        <button type="submit" className="uza-dugme" disabled={yukleniyor || !dosya} data-eylem="ek-yukle">{yukleniyor ? n.yukleniyor : n.yukle}</button>
      </form>
    </section>
  )
}
