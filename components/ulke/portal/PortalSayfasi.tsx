'use client'

/**
 * NOTYA-ULKE-PORTAL-01 — /portal: THE PATIENT'S PAGE. No account: a link the doctor gave, and a PIN.
 *
 *   The link is  <site>/portal?dil=<form>#<token>.  The token rides in the FRAGMENT: a browser never sends a
 *   fragment to a server as part of an address, so it is in no access log and in no Referer. This page reads it,
 *   and sends it once, in the body of the sign-in request, together with the PIN.
 *
 *   THE TOKEN ALONE SHOWS NOTHING. Until the PIN is right the page holds the PIN form and nothing else — no name,
 *   no doctor, not even whether the link exists.
 *
 *   After the PIN: the patient's name, the doctor's name and role, upcoming appointments, the summaries the doctor
 *   chose to share, and (where the country has appointments) a request for an appointment. Never a clinical note.
 *
 *   THE SESSION is an HttpOnly cookie this script cannot read, sent only to the portal's own routes. Every request
 *   says which link the page is open for (the SHA-256 of the token): on a shared phone, a second patient's link
 *   never shows the first patient's page. The session ends by itself; the page then asks for the PIN again.
 *
 *   NOT THE DOCTOR'S APPLICATION. This file imports nothing of the signed-in application (no ./uygulama/Kabuk, no
 *   Supabase client): a doctor's session can neither be read nor used here (lib/ulke/ulkePortalEkrani.test.ts).
 *
 * Language: the form in the link (`?dil=`) for the PIN page; after sign-in, the form the server names — the
 * patient's language, in the doctor's script where the language has several. Every sentence is the pack's
 * (portalMetni); days, times and weekday names are written as the country writes them.
 */
import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { CHROME_FONT, CHROME_FONT_HREF, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { formMetni, gunAdi, marka, portalMetni, randevuMetni, uygulamaDili, type PortalMetni, type RandevuMetni } from '@/lib/ulke/arayuz'
import { saatGoster, tarihDeseni } from '@/lib/ulke/arayuz/bicim'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ANAHTAR_BICIMI, ISTEK_GUN_AZAMI, ISTEK_NEDEN_AZAMI, PIN_HANE, PORTAL_API, PORTAL_BAGLANTI_BASLIGI, PORTAL_ISTEK_BASLIGI, pinBicimiGecerli } from '@/lib/ulke/portal/sabitler'
import type { PortalIcerigi } from '@/lib/ulke/portal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import { gunYazDesenle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { ulkeYolu } from '@/lib/ulke/yol'
import { PortalFormKarti, PortalFormu, type PortalIstegi } from './HastaFormu'
import { PortalMesajlar } from './Mesajlar'

const DEGISKENLER = {
  '--uza-krem': R.cream, '--uza-kagit': R.paper, '--uza-murekkep': R.ink, '--uza-soluk': R.muted, '--uza-cam': R.pine,
  '--uza-uyari': R.warn, '--uza-cizgi': R.border, '--uza-altin': R.gold, '--uza-serif': CHROME_FONT.serif, '--uza-sans': CHROME_FONT.sans,
} as CSSProperties

const Hata = ({ children }: { children: ReactNode }) => (children ? <div role="alert" className="uza-uyari-kutu">{children}</div> : null)
const Bilgi = ({ children }: { children: ReactNode }) => (children ? <div role="status" className="uza-bilgi-kutu">{children}</div> : null)

const gunYaz = (gun: string): string => gunYazDesenle(gun, tarihDeseni())
/**
 * A day with its weekday where the country has appointments (the weekday names are the appointment catalogue's).
 * `uzun` false = the short weekday name, for a button. THE DAY IS ALWAYS WRITTEN IN FULL, in the pack's own pattern:
 * the short form used to be the first five characters of the written date, which in a year-first country is the year
 * and no day ("Sat 2026-"), so a patient could not tell one Saturday from the next (NOTYA-ULKE-DENETIM-01c).
 */
export const portalGunu = (r: RandevuMetni | null, gun: string, uzun = true): string => (r ? `${gunAdi(r, haftaGunu(gun), uzun)}${uzun ? ',' : ''} ${gunYaz(gun)}` : gunYaz(gun))

/** The ambulance number the pack states, or null: the kit has none of its own and never falls back to one. */
export function portalAcilNumarasi(): string | null {
  const n = ulkePaketi().uygulama?.portal?.acilNumara
  return typeof n === 'string' && n.trim() ? n.trim() : null
}

/** The frame: the word mark and nothing to navigate to. */
export function PortalCercevesi({ dil, children }: { dil: DilKodu; children: ReactNode }) {
  return (
    <div className="uza" lang={dil} style={DEGISKENLER} data-alan="portal-sayfasi">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} referrerPolicy="no-referrer" />
      <header className="uza-ust">
        <div className="uza-ic uza-ust-ic"><span className="uza-marka">{marka()}</span></div>
      </header>
      <main className="uza-ic uza-govde">{children}</main>
    </div>
  )
}

/** A page that says one thing: still loading, or a link that does not work, or a link that locked. */
export function PortalDurumGorunumu({ p, durum }: { p: PortalMetni; durum: 'yukleniyor' | 'gecersiz' | 'kilitli' }) {
  return (
    <section className="uza-kart uza-dar" data-alan="portal-durum" data-durum={durum}>
      <h1 className="uza-h1">{p.giris.baslik}</h1>
      {durum === 'yukleniyor' ? <p className="uza-bos" role="status">{p.giris.yukleniyor}</p> : <div style={{ marginTop: 14 }}><Hata>{durum === 'kilitli' ? p.giris.kilitli : p.giris.gecersiz}</Hata></div>}
    </section>
  )
}

export type GirisHatasi = { kod: 'PIN_BICIMI' | 'PIN_YANLIS' | 'YAVAS' | 'HATA' | 'BAGLANTI'; kalan?: number } | null

export function girisHataMetni(p: PortalMetni, h: GirisHatasi): string | null {
  if (!h) return null
  if (h.kod === 'PIN_BICIMI') return yerine(p.giris.pinBicimi, PIN_HANE)
  if (h.kod === 'PIN_YANLIS') return yerine(p.giris.pinYanlis, h.kalan ?? 0)
  if (h.kod === 'YAVAS') return p.giris.yavas
  if (h.kod === 'BAGLANTI') return p.giris.baglanti
  return p.giris.hata
}

/** The PIN form. It names nobody: until the PIN is right the page knows nothing about the patient. */
export function PortalGirisGorunumu({ p, pin, setPin, gonder, bekliyor, hata, oturumBitti }: {
  p: PortalMetni; pin: string; setPin: (y: string) => void; gonder: (e: FormEvent) => void; bekliyor: boolean; hata: GirisHatasi
  /** true = the patient was signed in and the session ended: said in plain words above the form. */
  oturumBitti?: boolean
}) {
  return (
    <section className="uza-kart uza-dar" data-alan="portal-giris">
      <h1 className="uza-h1">{p.giris.baslik}</h1>
      <p className="uza-aciklama">{p.giris.aciklama}</p>
      {oturumBitti ? <div style={{ marginTop: 12 }}><Bilgi>{p.sayfa.oturumBitti}</Bilgi></div> : null}
      <form className="uza-form" onSubmit={gonder} noValidate>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uzp-pin">{p.giris.pin}</label>
          <input id="uzp-pin" name="pin" className="uza-girdi" inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={PIN_HANE} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_HANE))} required />
        </div>
        <Hata>{girisHataMetni(p, hata)}</Hata>
        <div className="uza-eylemler" style={{ marginTop: 0 }}>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="portal-giris">{bekliyor ? p.giris.gonderiliyor : p.giris.gonder}</button>
        </div>
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{p.giris.gizlilik}</p>
      </form>
    </section>
  )
}

export type IstekFormu = { gunler: string[]; neden: string }
export type IstekHatasi = 'gun' | 'cok' | 'gonderilemedi' | 'baglanti' | null

/** The patient's own page. `r` = the appointment catalogue in the same form, or null where the country has no appointments. */
export function PortalSayfaGorunumu({ p, r, icerik, acilNumara, form, setForm, istekGonder, istekBekliyor, istekHatasi, cikis, formKarti, mesajlar }: {
  p: PortalMetni; r: RandevuMetni | null; icerik: PortalIcerigi
  /** NOTYA-ULKE-MESAJ-01: the messages with the doctor, where the country has them. Drawn after the form's card. */
  mesajlar?: ReactNode
  /** NOTYA-ULKE-INTAKE-01: the card of the intake form, where one is waiting or was sent. Drawn first: it is the thing to do. */
  formKarti?: ReactNode
  /** The pack's ambulance number, or null where the pack states none: then no number is shown, and no sentence that would need one. */
  acilNumara: string | null
  form: IstekFormu; setForm: (y: IstekFormu) => void; istekGonder: (e: FormEvent) => void; istekBekliyor: boolean; istekHatasi: IstekHatasi
  cikis: () => void
}) {
  const i = icerik
  const s = p.sayfa
  const son = i.istek?.son ?? null
  // "Your doctor booked you" is said while that appointment is still to come; afterwards the list above says it all.
  const kabul = son?.durum === 'kabul' && son.randevu && (i.randevular ?? []).some((x) => x.gun === son.randevu?.gun && x.saat === son.randevu?.saat) ? son.randevu : null
  const istekHataMetni = istekHatasi === 'gun' ? s.istekGunGerekli : istekHatasi === 'cok' ? yerine(s.istekCokGun, ISTEK_GUN_AZAMI) : istekHatasi === 'baglanti' ? p.giris.baglanti : istekHatasi === 'gonderilemedi' ? s.istekGonderilemedi : null
  return (
    <>
      <section className="uza-kart" data-alan="portal-ust">
        <div className="uza-baslik-satiri">
          <h1 className="uza-h1" data-alan="hasta-ad">{yerine(s.selam, i.hasta.ad)}</h1>
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={cikis} data-eylem="portal-cikis">{s.cikis}</button>
        </div>
        <dl className="uza-bilgiler">
          <dt>{s.hekim}</dt><dd data-alan="hekim">{[i.hekim.ad, i.hekim.rol].filter(Boolean).join(' · ')}</dd>
        </dl>
        <p className="uza-ipucu">{s.yalniz}</p>
      </section>

      {formKarti ?? null}
      {mesajlar ?? null}

      {i.randevular && r ? (
        <section className="uza-kart" data-alan="portal-randevular">
          <h2 className="uza-h2">{s.randevular}</h2>
          {i.randevular.length === 0 ? <p className="uza-bos">{s.randevuYok}</p> : (
            <ul className="uza-liste">
              {i.randevular.map((x) => (
                <li key={`${x.gun} ${x.saat}`}>
                  <div className="uza-satir" data-randevu-gun={x.gun}>
                    <span className="uza-saat">{saatGoster(x.saat)}</span>
                    <span className="uza-liste-ad">{portalGunu(r, x.gun)}<span className="uza-liste-alt">{x.sureDk} {r.form.dakika}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {i.saatDilimi && s.saatDilimi ? <p className="uza-ipucu">{yerine(s.saatDilimi, i.saatDilimi.replace(/_/g, ' '))}</p> : null}
        </section>
      ) : null}

      <section className="uza-kart" data-alan="portal-ozetler">
        <h2 className="uza-h2">{s.ozetler}</h2>
        {i.ozetler.length === 0 ? <p className="uza-bos">{s.ozetYok}</p> : i.ozetler.map((o) => (
          <div className="uza-not-bolum" key={o.id} data-ozet={o.id}>
            <p className="uza-ust-yazi">{yerine(s.muayene, gunYaz(o.gun))}</p>
            <p className="uza-not-metin">{o.metin}</p>
          </div>
        ))}
      </section>

      {i.istek ? (
        <section className="uza-kart" data-alan="portal-istek" data-istek-durumu={son?.durum ?? 'yok'}>
          <h2 className="uza-h2">{s.istekBaslik}</h2>
          {son?.durum === 'bekliyor' ? (
            <>
              <div style={{ marginTop: 12 }}><Bilgi>{s.istekBekliyor}</Bilgi></div>
              <p className="uza-ipucu">{yerine(s.istekGunler, son.gunler.map((g) => portalGunu(r, g)).join('; '))}</p>
            </>
          ) : (
            <>
              {kabul ? <div style={{ marginTop: 12 }}><Bilgi>{yerine(s.istekKabul, portalGunu(r, kabul.gun), saatGoster(kabul.saat))}</Bilgi></div> : null}
              {son?.durum === 'red' ? <div style={{ marginTop: 12 }}><Bilgi>{s.istekRed}</Bilgi></div> : null}
              <form className="uza-form" onSubmit={istekGonder} noValidate>
                <fieldset className="uza-secim">
                  <legend className="uza-etiket">{yerine(s.istekAciklama, ISTEK_GUN_AZAMI)}</legend>
                  <div className="uza-secim-satir">
                    {i.istek.gunler.map((g) => {
                      const secili = form.gunler.includes(g)
                      return (
                        <label key={g} className="uza-secenek" data-secili={secili ? 'evet' : undefined} title={portalGunu(r, g)}>
                          <input type="checkbox" name="gunler" value={g} checked={secili} onChange={() => setForm({ ...form, gunler: secili ? form.gunler.filter((x) => x !== g) : [...form.gunler, g].sort() })} />
                          <span>{portalGunu(r, g, false)}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="uza-alan">
                  <label className="uza-etiket" htmlFor="uzp-neden">{s.istekNeden}</label>
                  <input id="uzp-neden" name="neden" className="uza-girdi" maxLength={ISTEK_NEDEN_AZAMI} value={form.neden} onChange={(e) => setForm({ ...form, neden: e.target.value })} />
                </div>
                <Hata>{istekHataMetni}</Hata>
                <div className="uza-eylemler" style={{ marginTop: 0 }}>
                  <button type="submit" className="uza-dugme" disabled={istekBekliyor} data-eylem="portal-istek">{istekBekliyor ? s.istekGonderiliyor : s.istekGonder}</button>
                </div>
              </form>
            </>
          )}
        </section>
      ) : null}

      <p className="uza-ipucu" data-alan="portal-acil" data-acil-numara={acilNumara ?? undefined} style={{ textAlign: 'center' }}>{s.acil}{acilNumara ? ` ${yerine(s.acilNumara, acilNumara)}` : ''}</p>
    </>
  )
}

// ───────────────────────── the page itself ─────────────────────────

/** SHA-256 of the link's token, hex: which link this page is open for. '' where the browser cannot compute it. */
async function baglantiOzeti(token: string): Promise<string> {
  try {
    const ozet = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
    return Array.from(new Uint8Array(ozet), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch { return '' }
}

type Asama = 'yukleniyor' | 'gecersiz' | 'kilitli' | 'pin' | 'sayfa'

export default function PortalSayfasi() {
  const [dil, setDil] = useState<DilKodu>(() => ulkePaketi().varsayilanDil)
  const [asama, setAsama] = useState<Asama>('yukleniyor')
  const [icerik, setIcerik] = useState<PortalIcerigi | null>(null)
  const [pin, setPin] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<GirisHatasi>(null)
  const [oturumBitti, setOturumBitti] = useState(false)
  const [form, setForm] = useState<IstekFormu>({ gunler: [], neden: '' })
  const [istekBekliyor, setIstekBekliyor] = useState(false)
  const [istekHatasi, setIstekHatasi] = useState<IstekHatasi>(null)
  /** NOTYA-ULKE-INTAKE-01: true = the intake form is open instead of the page. */
  const [formAcik, setFormAcik] = useState(false)
  const token = useRef('')
  const ozet = useRef('')

  /** One request to the portal's own routes: same origin, the cookie, the link's mark; a change also carries the portal's header. */
  const iste = useCallback<PortalIstegi>(async (yol, govde, yontem) => {
    const r = await fetch(ulkeYolu(`${PORTAL_API}${yol}`), {
      method: yontem ?? (govde === undefined ? 'GET' : 'POST'),
      headers: { [PORTAL_BAGLANTI_BASLIGI]: ozet.current, ...(govde === undefined ? {} : { 'Content-Type': 'application/json', [PORTAL_ISTEK_BASLIGI]: '1' }) },
      body: govde === undefined ? undefined : JSON.stringify(govde),
      credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer',
    })
    return { status: r.status, j: (await r.json().catch(() => ({}))) as Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [])

  /** Asks for the page. 200 = signed in; 401 = the PIN form; anything else = said as it is. */
  const yukle = useCallback(async (bittiMi = false): Promise<void> => {
    try {
      const r = await iste('')
      if (r.status === 200 && r.j.hasta) {
        const yeni = r.j as unknown as PortalIcerigi
        setIcerik(yeni); setDil(uygulamaDili(yeni.dil)); setAsama('sayfa'); setOturumBitti(false)
        return
      }
      setIcerik(null); setFormAcik(false)
      if (r.status === 401) { setOturumBitti(bittiMi); setAsama('pin') } else setAsama('gecersiz')
    } catch { setIcerik(null); setAsama('pin'); setHata({ kod: 'BAGLANTI' }) }
  }, [iste])

  useEffect(() => {
    let iptal = false
    // Another link typed or pasted into the same tab changes only the fragment, which loads nothing by itself: the
    // page starts again, so it can never go on showing one link's patient under another link's address.
    const yenidenBasla = () => window.location.reload()
    window.addEventListener('hashchange', yenidenBasla)
    const s = new URLSearchParams(window.location.search)
    if (s.get('dil')) setDil(uygulamaDili(s.get('dil')))
    const t = window.location.hash.replace(/^#/, '')
    if (!ANAHTAR_BICIMI.test(t)) setAsama('gecersiz')
    else {
      token.current = t
      void baglantiOzeti(t).then((o) => { if (iptal) return; if (!o) { setAsama('gecersiz'); return } ozet.current = o; void yukle() })
    }
    return () => { iptal = true; window.removeEventListener('hashchange', yenidenBasla) }
  }, [yukle])

  // The session ends by itself. When it does, the page puts everything away and asks for the PIN again.
  useEffect(() => {
    if (asama !== 'sayfa' || !icerik) return
    const kalan = new Date(icerik.bitis).getTime() - Date.now()
    const z = window.setTimeout(() => { setIcerik(null); setFormAcik(false); setPin(''); setOturumBitti(true); setAsama('pin') }, Math.max(0, Math.min(kalan, 2_000_000_000)))
    return () => window.clearTimeout(z)
  }, [asama, icerik])

  async function giris(e: FormEvent) {
    e.preventDefault()
    if (!pinBicimiGecerli(pin)) { setHata({ kod: 'PIN_BICIMI' }); return }
    setBekliyor(true); setHata(null)
    try {
      const r = await iste('/giris', { token: token.current, pin })
      setPin('')
      if (r.status === 200) { await yukle() }
      else if (r.j.code === 'PIN_YANLIS') setHata({ kod: 'PIN_YANLIS', kalan: Number(r.j.kalan) || 0 })
      else if (r.j.code === 'KILITLI') setAsama('kilitli')
      else if (r.j.code === 'YAVAS') setHata({ kod: 'YAVAS' })
      else if (r.status === 404) setAsama('gecersiz')
      else setHata({ kod: 'HATA' })
    } catch { setHata({ kod: 'BAGLANTI' }) }
    setBekliyor(false)
  }

  async function istekGonder(e: FormEvent) {
    e.preventDefault()
    if (form.gunler.length === 0) { setIstekHatasi('gun'); return }
    if (form.gunler.length > ISTEK_GUN_AZAMI) { setIstekHatasi('cok'); return }
    setIstekBekliyor(true); setIstekHatasi(null)
    try {
      const r = await iste('/randevu-istegi', { gunler: form.gunler, neden: form.neden })
      if (r.status === 200) { setForm({ gunler: [], neden: '' }); await yukle(true) }
      else if (r.status === 401) await yukle(true)
      // Somebody already sent one from another window: the page shows it.
      else if (r.j.code === 'BEKLEYEN_VAR') await yukle(true)
      else setIstekHatasi(r.j.alan === 'gunler' ? 'gun' : 'gonderilemedi')
    } catch { setIstekHatasi('baglanti') }
    setIstekBekliyor(false)
  }

  async function cikis() {
    try { await iste('/cikis', {}) } catch { /* the page is put away all the same */ }
    setIcerik(null); setFormAcik(false); setPin(''); setHata(null); setOturumBitti(false); setAsama('pin')
  }

  const p = portalMetni(dil)
  return (
    <PortalCercevesi dil={dil}>
      {asama === 'sayfa' && icerik && formAcik ? (
        // The form instead of the page: on a phone there is room for one of them. Closing it reads the page again.
        <PortalFormu dil={dil} iste={iste} kapat={() => { setFormAcik(false); void yukle(true) }} oturumBitti={() => { void yukle(true) }} />
      ) : asama === 'sayfa' && icerik ? (
        <PortalSayfaGorunumu p={p} formKarti={icerik.form ? <PortalFormKarti f={formMetni(dil)} ozet={icerik.form} ac={() => setFormAcik(true)} /> : null} r={ozellikAcik('randevu') ? randevuMetni(dil) : null} icerik={icerik} acilNumara={portalAcilNumarasi()}
          mesajlar={ozellikAcik('hastaMesajlari') ? <PortalMesajlar dil={dil} iste={iste} acilNumara={portalAcilNumarasi()} saatDilimi={icerik.saatDilimi} oturumBitti={() => { void yukle(true) }} /> : null}
          form={form} setForm={(y) => { setForm(y); setIstekHatasi(null) }} istekGonder={istekGonder} istekBekliyor={istekBekliyor} istekHatasi={istekHatasi} cikis={() => { void cikis() }} />
      ) : asama === 'pin' ? (
        <PortalGirisGorunumu p={p} pin={pin} setPin={(y) => { setPin(y); setHata(null) }} gonder={giris} bekliyor={bekliyor} hata={hata} oturumBitti={oturumBitti} />
      ) : (
        <PortalDurumGorunumu p={p} durum={asama === 'sayfa' ? 'yukleniyor' : asama} />
      )}
    </PortalCercevesi>
  )
}
