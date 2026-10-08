'use client'

/**
 * NOTYA-UZ-MUAYENE-01 — patients: the list with its search (/patients), the form for a new patient (/patients/new)
 * and one patient's file (/patient?id=…). A doctor sees only their own patients: the server answers with nothing
 * else (lib/ulke/uygulama/hastalar.ts), and another doctor's patient id answers "not found".
 */
import React, { useEffect, useState, type FormEvent } from 'react'
import { AramaFormu } from './Bugun'
import { Cerceve, Hata, HAZIR, Secim, tarihYaz, useUygulama, YOL, Yukleniyor } from './Kabuk'
import { metninDili, UZ_UYGULAMA_METINLERI, yaziSec, type UygulamaMetni, type UzUygulamaDili } from './metinler'
import { randevuMetni } from './randevuMetinleri'
import { bitisSaati, DurumRozeti, takvimYolu, type RandevuKaydi } from './randevuOrtak'

export type HastaKaydi = { id: string; ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: 'male' | 'female' | ''; telefon: string; dil: string; ulusalKimlik: string }
export type DosyaMuayenesi = { seansId: string; notId: string | null; baslangic: string; durum: 'taslak' | 'onayli' | 'notsuz' }

/** "Familiya Ism Otasining ismi" — the patronymic follows the name when there is one. */
export const tamAd = (h: Pick<HastaKaydi, 'ad' | 'otaIsmi'>) => [h.ad, h.otaIsmi].filter(Boolean).join(' ')

/** The patient's language, named in the screen's language. */
export function hastaDiliAdi(m: UygulamaMetni, dil: string): string {
  return dil === 'uz' ? m.diller.uz : dil === 'ru' ? m.diller.ru : ''
}

/** Whole years; under two years, months ("7 oy"). '' when there is no birth date. */
export function yasYaz(m: UygulamaMetni, dogumTarihi: string, bugun: Date = new Date()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dogumTarihi)) return ''
  const [y, a, g] = dogumTarihi.split('-').map(Number)
  let ay = (bugun.getUTCFullYear() - y) * 12 + (bugun.getUTCMonth() + 1 - a)
  if (bugun.getUTCDate() < g) ay -= 1
  if (ay < 0) return ''
  return ay < 24 ? `${ay} ${m.hasta.ay}` : String(Math.floor(ay / 12))
}

// ───────────────────────── list ─────────────────────────

export function HastalarGorunumu({ m, q, hastalar, hata }: { m: UygulamaMetni; q: string; hastalar: HastaKaydi[] | null; hata: boolean }) {
  return (
    <section className="uza-kart">
      <div className="uza-baslik-satiri">
        <h1 className="uza-h1">{m.hastalar.baslik}</h1>
        <a className="uza-dugme" href={YOL.yeniHasta}>{m.bugun.yeniHasta}</a>
      </div>
      <AramaFormu m={m} q={q} />
      <Hata>{hata ? m.kabuk.hata : null}</Hata>
      {hastalar === null ? (hata ? null : <p className="uza-bos" role="status">{m.kabuk.yukleniyor}</p>) : hastalar.length === 0 ? (
        <p className="uza-bos">{q ? m.arama.sonucYok : m.hastalar.bos}</p>
      ) : (
        <ul className="uza-liste" style={{ marginTop: 10 }}>
          {hastalar.map((h) => (
            <li key={h.id}>
              <a className="uza-satir" href={`${YOL.hasta}?id=${h.id}`} aria-label={`${m.hastalar.dosya}: ${tamAd(h)}`}>
                <span className="uza-liste-ad">
                  {tamAd(h)}
                  <span className="uza-liste-alt">{[tarihYaz(h.dogumTarihi), h.telefon].filter(Boolean).join(' · ')}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Hastalar() {
  const u = useUygulama('hastalar')
  const [q, setQ] = useState('')
  const [hastalar, setHastalar] = useState<HastaKaydi[] | null>(null)
  const [hata, setHata] = useState(false)
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const aranan = new URLSearchParams(window.location.search).get('q') ?? ''
    setQ(aranan)
    api(`/api/ulke/hastalar${aranan ? `?q=${encodeURIComponent(aranan)}` : ''}`)
      .then((r) => { if (iptal) return; if (r.ok && Array.isArray(r.j.hastalar)) setHastalar(r.j.hastalar); else setHata(true) })
      .catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="hastalar" cikis={u.cikis}>
      <HastalarGorunumu key={q} m={u.m} q={q} hastalar={hastalar} hata={hata} />
    </Cerceve>
  )
}

// ───────────────────────── new patient ─────────────────────────

export type YeniHastaAlanlari = { ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: 'male' | 'female' | ''; telefon: string; dil: 'uz' | 'ru' | ''; ulusalKimlik: string }
export const BOS_HASTA: YeniHastaAlanlari = { ad: '', otaIsmi: '', dogumTarihi: '', cinsiyet: '', telefon: '', dil: '', ulusalKimlik: '' }
export type YeniHastaHatasi = 'ad' | 'dogumTarihi' | 'dil' | 'kayit' | 'baglanti' | null

export function YeniHastaGorunumu({ m, dil, a, set, gonder, bekliyor, hata, telefonOrnek }: {
  m: UygulamaMetni; dil: UzUygulamaDili; a: YeniHastaAlanlari; set: (a: YeniHastaAlanlari) => void
  gonder: (e: FormEvent) => void; bekliyor: boolean; hata: YeniHastaHatasi; telefonOrnek: string
}) {
  const y = m.yeniHasta
  const hataMetni = hata === 'ad' ? y.adGerekli : hata === 'dogumTarihi' ? y.dogumGecersiz : hata === 'dil' ? y.dilGerekli : hata === 'kayit' ? y.kaydedilemedi : hata === 'baglanti' ? m.kabuk.baglanti : null
  const uz = yaziSec(dil) === 'Cyrl' ? 'uz-Cyrl' : 'uz-Latn'
  const istegeBagli = <small> ({y.istegeBagli})</small>
  return (
    <section className="uza-kart uza-dar">
      <h1 className="uza-h1">{y.baslik}</h1>
      <form className="uza-form" onSubmit={gonder} noValidate>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-h-ad">{y.ad}</label>
          <input id="uza-h-ad" className="uza-girdi" value={a.ad} onChange={(e) => set({ ...a, ad: e.target.value })} autoComplete="off" maxLength={160} />
        </div>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-h-ota">{y.otaIsmi}{istegeBagli}</label>
          <input id="uza-h-ota" className="uza-girdi" value={a.otaIsmi} onChange={(e) => set({ ...a, otaIsmi: e.target.value })} autoComplete="off" maxLength={120} />
        </div>
        <div className="uza-iki">
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-h-dogum">{y.dogumTarihi}</label>
            <input id="uza-h-dogum" className="uza-girdi" type="date" value={a.dogumTarihi} onChange={(e) => set({ ...a, dogumTarihi: e.target.value })} />
          </div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-h-tel">{y.telefon}</label>
            <input id="uza-h-tel" className="uza-girdi" type="tel" inputMode="tel" value={a.telefon} onChange={(e) => set({ ...a, telefon: e.target.value })} placeholder={telefonOrnek} autoComplete="off" maxLength={40} />
          </div>
        </div>
        <Secim etiket={y.cinsiyet} ad="cinsiyet" deger={a.cinsiyet} sec={(cinsiyet) => set({ ...a, cinsiyet })} secenekler={[{ deger: 'female', ad: y.kadin }, { deger: 'male', ad: y.erkek }]} />
        {/* The patient's language is offered in that language, so the patient can point at it. */}
        <Secim etiket={y.dil} ad="hasta-dili" deger={a.dil} sec={(d) => set({ ...a, dil: d })} secenekler={[
          { deger: 'uz', ad: UZ_UYGULAMA_METINLERI[uz].diller.uz, dil: uz },
          { deger: 'ru', ad: UZ_UYGULAMA_METINLERI.ru.diller.ru, dil: 'ru' },
        ]} />
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-h-kimlik">{y.ulusalKimlik}{istegeBagli}</label>
          <input id="uza-h-kimlik" className="uza-girdi" value={a.ulusalKimlik} onChange={(e) => set({ ...a, ulusalKimlik: e.target.value })} inputMode="numeric" autoComplete="off" maxLength={40} />
        </div>
        <Hata>{hataMetni}</Hata>
        <div className="uza-eylemler">
          <button type="submit" className="uza-dugme" disabled={bekliyor}>{bekliyor ? y.kaydediliyor : y.kaydet}</button>
          <a className="uza-dugme uza-dugme-cizgi" href={YOL.hastalar}>{y.iptal}</a>
        </div>
      </form>
    </section>
  )
}

export function YeniHasta() {
  const u = useUygulama('yeniHasta')
  const [a, setA] = useState<YeniHastaAlanlari>(BOS_HASTA)
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<YeniHastaHatasi>(null)
  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />

  async function gonder(e: FormEvent) {
    e.preventDefault()
    if (a.ad.trim().length < 2) { setHata('ad'); return }
    if (!a.dil) { setHata('dil'); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await u.api('/api/ulke/hastalar', { method: 'POST', govde: a })
      if (r.ok && r.j.hasta?.id) { window.location.assign(`${YOL.hasta}?id=${r.j.hasta.id}`); return }
      setHata(r.j.code === 'GECERSIZ' && (r.j.alan === 'ad' || r.j.alan === 'dogumTarihi' || r.j.alan === 'dil') ? r.j.alan : 'kayit')
    } catch { setHata('baglanti') }
    setBekliyor(false)
  }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} aktif="hastalar" cikis={u.cikis}>
      <YeniHastaGorunumu m={u.m} dil={u.dil} a={a} set={(yeni) => { setA(yeni); setHata(null) }} gonder={gonder} bekliyor={bekliyor} hata={hata} telefonOrnek="+998 90 123 45 67" />
    </Cerceve>
  )
}

// ───────────────────────── one patient's file ─────────────────────────

export function HastaDosyasiGorunumu({ m, hasta, muayeneler, bugun, randevular }: {
  m: UygulamaMetni; hasta: HastaKaydi; muayeneler: DosyaMuayenesi[]; bugun?: Date
  /** NOTYA-UZ-RANDEVU-01: this patient's appointments from today on. Absent = not loaded: no list is drawn. */
  randevular?: RandevuKaydi[] | null
}) {
  const r = randevuMetni(metninDili(m))
  const yas = yasYaz(m, hasta.dogumTarihi, bugun)
  const onayli = muayeneler.filter((v) => v.durum === 'onayli' && v.notId)
  const taslak = muayeneler.filter((v) => v.durum === 'taslak' && v.notId)
  // Recorded, transcribed, but no note yet: listed so that the visit can be reached again.
  const notsuz = HAZIR.muayene ? muayeneler.filter((v) => v.durum === 'notsuz') : []
  const satir = (v: DosyaMuayenesi) => (
    <li key={v.seansId}>
      <a className="uza-satir" href={HAZIR.muayene ? `${YOL.muayene}?not=${v.notId}` : undefined}>
        <span className="uza-saat">{tarihYaz(v.baslangic)}</span>
        <span className="uza-liste-ad">{m.not.baslik}</span>
        <span className="uza-rozet" data-durum={v.durum}>{v.durum === 'onayli' ? m.durum.onayli : m.durum.taslak}</span>
      </a>
    </li>
  )
  return (
    <>
      <section className="uza-kart">
        <p className="uza-ust-yazi">{m.hasta.baslik}</p>
        <div className="uza-baslik-satiri">
          <h1 className="uza-h1">{tamAd(hasta)}</h1>
          <div className="uza-eylemler" style={{ marginTop: 0 }}>
            {HAZIR.muayene ? <a className="uza-dugme" href={`${YOL.muayene}?hasta=${hasta.id}`}>{m.bugun.muayeneBaslat}</a> : null}
            {/* NOTYA-UZ-RANDEVU-01: booking from the patient's file — the form opens with this patient chosen. */}
            {HAZIR.takvim ? <a className="uza-dugme uza-dugme-cizgi" href={takvimYolu({ yeni: '1', hasta: hasta.id })} data-eylem="randevu-al">{r.hasta.randevuAl}</a> : null}
          </div>
        </div>
        <dl className="uza-bilgiler">
          {hasta.dogumTarihi ? <><dt>{m.yeniHasta.dogumTarihi}</dt><dd>{tarihYaz(hasta.dogumTarihi)}</dd></> : null}
          {yas ? <><dt>{m.hasta.yas}</dt><dd>{yas}</dd></> : null}
          {hasta.cinsiyet ? <><dt>{m.yeniHasta.cinsiyet}</dt><dd>{hasta.cinsiyet === 'female' ? m.yeniHasta.kadin : m.yeniHasta.erkek}</dd></> : null}
          {hasta.telefon ? <><dt>{m.yeniHasta.telefon}</dt><dd>{hasta.telefon}</dd></> : null}
          {hasta.dil ? <><dt>{m.yeniHasta.dil}</dt><dd>{hastaDiliAdi(m, hasta.dil)}</dd></> : null}
          {hasta.ulusalKimlik ? <><dt>{m.yeniHasta.ulusalKimlik}</dt><dd>{hasta.ulusalKimlik}</dd></> : null}
        </dl>
      </section>
      {HAZIR.takvim && randevular && randevular.length ? (
        <section className="uza-kart" data-alan="hasta-randevular">
          <h2 className="uza-h2">{r.hasta.randevular}</h2>
          <ul className="uza-liste">
            {randevular.map((x) => (
              <li key={x.id}>
                <a className="uza-satir" href={takvimYolu({ randevu: x.id })} data-randevu={x.id}>
                  <span className="uza-saat">{tarihYaz(x.gun)} {x.saat}–{bitisSaati(x.saat, x.sureDk)}</span>
                  <span className="uza-liste-ad">{x.neden}</span>
                  <DurumRozeti r={r} durum={x.durum} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {taslak.length ? (
        <section className="uza-kart">
          <h2 className="uza-h2">{m.hasta.taslaklar}</h2>
          <ul className="uza-liste">{taslak.map(satir)}</ul>
        </section>
      ) : null}
      {notsuz.length ? (
        <section className="uza-kart">
          <h2 className="uza-h2">{m.hasta.notsuzlar}</h2>
          <ul className="uza-liste">
            {notsuz.map((v) => (
              <li key={v.seansId}>
                <a className="uza-satir" href={`${YOL.muayene}?seans=${v.seansId}`}>
                  <span className="uza-saat">{tarihYaz(v.baslangic)}</span>
                  <span className="uza-liste-ad">{m.hasta.notsuz}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="uza-kart">
        <h2 className="uza-h2">{m.hasta.notlar}</h2>
        {onayli.length ? <ul className="uza-liste">{onayli.map(satir)}</ul> : <p className="uza-bos">{m.hasta.notYok}</p>}
      </section>
    </>
  )
}

export function HastaDosyasi() {
  const u = useUygulama('hasta')
  const [veri, setVeri] = useState<{ hasta: HastaKaydi; muayeneler: DosyaMuayenesi[] } | null>(null)
  const [randevular, setRandevular] = useState<RandevuKaydi[] | null>(null)
  const [durum, setDurum] = useState<'yukleniyor' | 'yok' | 'hata' | 'tamam'>('yukleniyor')
  const { hesap, api } = u

  useEffect(() => {
    if (!hesap) return
    let iptal = false
    const id = new URLSearchParams(window.location.search).get('id') ?? ''
    api(`/api/ulke/hasta?id=${encodeURIComponent(id)}`)
      .then((r) => {
        if (iptal) return
        if (r.ok && r.j.hasta) { setVeri({ hasta: r.j.hasta, muayeneler: Array.isArray(r.j.muayeneler) ? r.j.muayeneler : [] }); setDurum('tamam') }
        else setDurum(r.status === 404 ? 'yok' : 'hata')
      })
      .catch(() => { if (!iptal) setDurum('hata') })
    // The file is the file without them: if the appointments cannot be read, the list is simply not drawn.
    if (HAZIR.takvim) api(`/api/ulke/randevular?hasta=${encodeURIComponent(id)}`).then((r) => { if (!iptal && r.ok && Array.isArray(r.j.randevular)) setRandevular(r.j.randevular) }).catch(() => { /* no list */ })
    return () => { iptal = true }
  }, [hesap, api])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="hastalar" cikis={u.cikis}>
      {durum === 'tamam' && veri ? <HastaDosyasiGorunumu m={u.m} hasta={veri.hasta} muayeneler={veri.muayeneler} randevular={randevular} /> : (
        <section className="uza-kart">
          {durum === 'yukleniyor' ? <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p> : <Hata>{durum === 'yok' ? u.m.hasta.bulunamadi : u.m.kabuk.hata}</Hata>}
          {durum === 'yukleniyor' ? null : <p className="uza-ipucu"><a className="uza-baglanti" href={YOL.hastalar}>{u.m.kabuk.geri}</a></p>}
        </section>
      )}
    </Cerceve>
  )
}
