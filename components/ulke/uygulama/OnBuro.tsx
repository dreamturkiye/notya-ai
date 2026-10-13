'use client'

/**
 * NOTYA-ULKE-KLINIK-01 — /desk: THE FRONT-DESK WORKSPACE of a clinic.
 *
 * A front-desk member works for the doctors who gave them a permission, one doctor at a time:
 *   · that doctor's appointments of a day: who is coming, when; mark arrived, did not come, cancelled, planned again
 *   · find one of that doctor's patients by name or phone: the card — name, birth date, phone — and book
 *   · create a patient for that doctor (name, birth date, sex, phone, language), where the doctor allowed it
 *   · give a patient the portal link and PIN, or ask for the intake form, where the doctor allowed it
 *
 * WHAT IS NOT HERE, because the server never sends it to this screen: a note, a visit, a transcript, the answers of
 * a form, a tool record, the reason of an appointment, an identity number. The screen says so once, in the pack's
 * words. Each control is drawn only for a permission the member holds; the server checks again on every request.
 *
 * Every sentence is the pack's — klinikMetni, and for appointments and the patient's fields the appointment
 * catalogue and the application's own — in the account's form. The server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Cerceve, Hata, tarihYaz, useUygulama, Yukleniyor } from './Kabuk'
import { tamAd } from './Hastalar'
import { panoyaKopyala } from './pano'
import { portalAdresi } from './PortalErisimi'
import { DurumRozeti, gunBasligi, saatAraligi, type RandevuDurumu } from './randevuOrtak'
import { dilAdi, klinikMetni, randevuMetni, type GirdiMetni, type KlinikMetni, type RandevuMetni, type UygulamaMetni } from '@/lib/ulke/arayuz'
import { GIRDI_GECERSIZ } from '@/lib/ulke/arayuz/zamanGirdisi'
import { SaatGirisi } from '../girdi/SaatGirisi'
import { TarihGirisi } from '../girdi/TarihGirisi'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { HastaKarti, KlinikYetkiTuru, OnBuroRandevusu } from '@/lib/ulke/klinikHesabi/tipler'
import { gunEkle, gunGecerli, saatCoz } from '@/lib/ulke/uygulama/zaman'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'

const API = '/api/ulke/klinik/on-buro'
export type OnBuroHekimi = { hekimId: string; ad: string; yetkiler: KlinikYetkiTuru[] }
export type GunVerisi = { gun: string; bugun: string; randevular: OnBuroRandevusu[] }
export type YeniErisim = { adres: string; pin: string }
export type OnBuroBildirimi = 'alindi' | 'degistirildi' | 'hasta-kaydedildi' | 'form-istendi' | 'kopyalandi' | 'kopyalanamadi' | 'dolu' | 'mesai-disi' | 'gecersiz' | 'gecis-yok' | 'yetki-yok' | 'yapilamadi' | null
export type RandevuFormu = { gun: string; saat: string; sureDk: number; yineDe: boolean }
export type HastaFormu = { ad: string; otaIsmi: string; dogumTarihi: string; cinsiyet: '' | 'male' | 'female'; telefon: string; dil: string }

/** The status changes the front desk may make from a status: never "done". */
export const onBuroGecisleri = (durum: string): ('geldi' | 'gelmedi' | 'iptal' | 'planlandi')[] =>
  durum === 'planlandi' ? ['geldi', 'gelmedi', 'iptal'] : durum === 'geldi' ? ['planlandi', 'gelmedi', 'iptal'] : durum === 'gelmedi' ? ['planlandi', 'geldi', 'iptal'] : []
const gecisAdi = (r: RandevuMetni, d: 'geldi' | 'gelmedi' | 'iptal' | 'planlandi') => (d === 'geldi' ? r.randevu.geldi : d === 'gelmedi' ? r.randevu.gelmedi : d === 'iptal' ? r.randevu.iptalEt : r.randevu.planaAl)

export function HekimSecimiGorunumu({ k, hekimler, hekimId, sec }: { k: KlinikMetni; hekimler: OnBuroHekimi[]; hekimId: string; sec: (id: string) => void }) {
  const o = k.onBuro
  const secili = hekimler.find((h) => h.hekimId === hekimId)
  return (
    <section className="uza-kart" data-alan="on-buro-hekim">
      <h1 className="uza-h1">{o.baslik}</h1>
      <p className="uza-aciklama">{o.aciklama}</p>
      {hekimler.length === 0 ? <p className="uza-bos" data-alan="hekim-yok">{o.hekimYok}</p> : (
        <>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ob-hekim">{o.hekim}</label>
            <select id="uza-ob-hekim" className="uza-girdi" value={hekimId} onChange={(e) => sec(e.target.value)} data-alan="on-buro-hekimi">
              {hekimler.map((h) => <option key={h.hekimId} value={h.hekimId}>{h.ad}</option>)}
            </select>
          </div>
          {secili ? <ul className="uza-liste" data-alan="on-buro-yetkileri">{secili.yetkiler.map((t) => <li key={t} data-tur={t}><div className="uza-satir"><span className="uza-liste-ad">{k.yetkiTuru[t]}</span></div></li>)}</ul> : null}
          <p className="uza-ipucu" data-alan="gordugunuz">{o.gordugunuz}</p>
        </>
      )}
    </section>
  )
}

export function GunRandevulariGorunumu({ k, r, veri, git, durumDegistir, bekliyor }: {
  k: KlinikMetni; r: RandevuMetni; veri: GunVerisi | null; git: (gun: string) => void
  durumDegistir: (randevuId: string, durum: 'geldi' | 'gelmedi' | 'iptal' | 'planlandi') => void; bekliyor: boolean
}) {
  const o = k.onBuro
  return (
    <section className="uza-kart" data-alan="on-buro-randevular">
      <h2 className="uza-h2">{o.randevular}</h2>
      {veri ? (
        <>
          <div className="uza-takvim-ust">
            <strong>{gunBasligi(r, veri.gun)}</strong>
            <div className="uza-takvim-gezinme">
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(veri.gun, -1))} data-eylem="gun-onceki">{r.takvim.onceki}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(veri.bugun)} data-eylem="gun-bugun">{r.takvim.bugun}</button>
              <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(veri.gun, 1))} data-eylem="gun-sonraki">{r.takvim.sonraki}</button>
            </div>
          </div>
          {veri.randevular.length === 0 ? <p className="uza-bos">{o.randevuYok}</p> : (
            <ul className="uza-liste">
              {veri.randevular.map((x) => (
                <li key={x.id} className="uza-randevu-satiri" data-randevu={x.id} data-randevu-durum={x.durum}>
                  <div className="uza-satir">
                    <span className="uza-saat">{saatAraligi(x.saat, x.sureDk)}</span>
                    <span className="uza-liste-ad">{x.hastaAdi}</span>
                    <DurumRozeti r={r} durum={x.durum as RandevuDurumu} />
                  </div>
                  <div className="uza-eylemler" style={{ marginTop: 4 }}>
                    {onBuroGecisleri(x.durum).map((d) => (
                      <button key={d} type="button" className={d === 'iptal' ? 'uza-dugme uza-dugme-uyari uza-dugme-kucuk' : 'uza-dugme uza-dugme-cizgi uza-dugme-kucuk'} disabled={bekliyor} onClick={() => durumDegistir(x.id, d)} data-eylem={`durum-${d}`}>{gecisAdi(r, d)}</button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  )
}

export function HastaAramaGorunumu({ k, q, setQ, ara, hastalar, aramaKisa, sec }: {
  k: KlinikMetni; q: string; setQ: (x: string) => void; ara: () => void; hastalar: HastaKarti[] | null; aramaKisa: boolean; sec: (h: HastaKarti) => void
}) {
  const o = k.onBuro
  return (
    <section className="uza-kart" data-alan="on-buro-arama">
      <h2 className="uza-h2">{o.hastaAra}</h2>
      <form className="uza-form" role="search" onSubmit={(e) => { e.preventDefault(); ara() }}>
        <div className="uza-arama-satir">
          <input type="search" className="uza-girdi" value={q} onChange={(e) => setQ(e.target.value)} aria-label={o.hastaAra} autoComplete="off" data-alan="on-buro-arama-girdisi" />
          <button type="submit" className="uza-dugme uza-dugme-cizgi" data-eylem="on-buro-ara">{o.ara}</button>
        </div>
      </form>
      <Hata>{aramaKisa ? o.aramaKisa : null}</Hata>
      {hastalar === null ? null : hastalar.length === 0 ? <p className="uza-bos">{o.sonucYok}</p> : (
        <ul className="uza-liste">
          {hastalar.map((h) => (
            <li key={h.id} data-hasta={h.id}>
              <div className="uza-satir">
                <span className="uza-liste-ad">{tamAd(h)}<span className="uza-liste-alt">{[h.dogumTarihi ? tarihYaz(h.dogumTarihi) : '', h.telefon].filter(Boolean).join(' · ')}</span></span>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => sec(h)} data-eylem="hasta-sec">{o.sec}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** THE CARD: everything the front desk sees of a patient, and what the doctor's permissions let it do for them. */
export function HastaKartiGorunumu({ k, r, g, hasta, yetkiler, form, setForm, sureler, randevuAl, portalVer, formIste, yeni, kopyala, kapat, bekliyor, portalVar, formVar }: {
  k: KlinikMetni; r: RandevuMetni
  /** The pack's words for the parts of a date and of a time, in the form of the screen. */
  g: GirdiMetni
  hasta: HastaKarti; yetkiler: KlinikYetkiTuru[]
  form: RandevuFormu; setForm: (f: RandevuFormu) => void; sureler: readonly number[]
  randevuAl: () => void; portalVer: () => void; formIste: () => void
  /** A link and PIN that were just made: on the screen until the card is closed, never again. */
  yeni: YeniErisim | null; kopyala: (ne: 'baglanti' | 'pin') => void; kapat: () => void; bekliyor: boolean
  portalVar: boolean; formVar: boolean
}) {
  const o = k.onBuro
  return (
    <section className="uza-kart" data-alan="on-buro-hasta-karti" data-hasta={hasta.id}>
      <div className="uza-baslik-satiri">
        <h2 className="uza-h2" style={{ marginBottom: 0 }}>{tamAd(hasta)}</h2>
        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={kapat}>{o.kapat}</button>
      </div>
      <p className="uza-aciklama" data-alan="kart-bilgisi">{[hasta.dogumTarihi ? yerine(o.dogum, tarihYaz(hasta.dogumTarihi)) : '', hasta.telefon || o.telefonYok].filter(Boolean).join(' · ')}</p>
      {yetkiler.includes('on-buro-randevu') ? (
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); randevuAl() }} data-alan="on-buro-randevu-formu">
          <h3 className="uza-alt-baslik">{o.randevuAl}</h3>
          <div className="uza-iki">
            {/* The kit's own date and time fields, in the pack's order and clock: never the browser's (NOTYA-ULKE-DENETIM-01b). */}
            <div className="uza-alan"><TarihGirisi id="uza-ob-gun" etiket={o.gun} deger={form.gun} degistir={(gun) => setForm({ ...form, gun })} m={g} alan="randevu-gunu" zorunlu /></div>
            <div className="uza-alan"><SaatGirisi id="uza-ob-saat" etiket={r.form.saat} deger={form.saat} degistir={(saat) => setForm({ ...form, saat })} m={g} alan="randevu-saati" zorunlu /></div>
          </div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ob-sure">{r.form.sure}</label>
            <select id="uza-ob-sure" className="uza-girdi" value={form.sureDk} onChange={(e) => setForm({ ...form, sureDk: Number(e.target.value) })} data-alan="randevu-suresi">
              {sureler.map((s) => <option key={s} value={s}>{s} {r.form.dakika}</option>)}
            </select>
          </div>
          <label className="uza-onay"><input type="checkbox" checked={form.yineDe} onChange={(e) => setForm({ ...form, yineDe: e.target.checked })} data-alan="yine-de" /><span>{r.form.yineDe}</span></label>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="on-buro-randevu-al">{bekliyor ? o.bekliyor : o.randevuAl}</button>
        </form>
      ) : null}
      {yetkiler.includes('on-buro-portal') && (portalVar || formVar) ? (
        <div data-alan="on-buro-portal" style={{ marginTop: 16 }}>
          <div className="uza-eylemler">
            {portalVar ? <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={portalVer} data-eylem="on-buro-portal-ver">{o.portalVer}</button> : null}
            {formVar ? <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={formIste} data-eylem="on-buro-form-iste">{o.formIste}</button> : null}
          </div>
          {yeni ? (
            <div className="uza-form" data-alan="yeni-erisim" style={{ marginTop: 14 }}>
              <Bilgi>{o.portalBirKez}</Bilgi>
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uza-ob-baglanti">{o.baglanti}</label>
                <div className="uza-arama-satir">
                  <input id="uza-ob-baglanti" className="uza-girdi" readOnly value={yeni.adres} data-alan="portal-baglanti" onFocus={(x) => x.currentTarget.select()} />
                  <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('baglanti')} data-eylem="baglanti-kopyala">{o.kopyala}</button>
                </div>
              </div>
              <div className="uza-alan">
                <label className="uza-etiket" htmlFor="uza-ob-pin">{o.pin}</label>
                <div className="uza-arama-satir">
                  <input id="uza-ob-pin" className="uza-girdi" readOnly value={yeni.pin} data-alan="portal-pin" inputMode="numeric" onFocus={(x) => x.currentTarget.select()} />
                  <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => kopyala('pin')} data-eylem="pin-kopyala">{o.kopyala}</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export function YeniHastaGorunumu({ k, m, f, setF, kaydet, bekliyor }: { k: KlinikMetni; m: UygulamaMetni; f: HastaFormu; setF: (f: HastaFormu) => void; kaydet: () => void; bekliyor: boolean }) {
  const y = m.yeniHasta
  const paket = ulkePaketi()
  return (
    <section className="uza-kart" data-alan="on-buro-yeni-hasta">
      <h2 className="uza-h2">{k.onBuro.yeniHasta}</h2>
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); kaydet() }}>
        <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ob-ad">{y.ad}</label><input id="uza-ob-ad" className="uza-girdi" value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} required maxLength={160} data-alan="hasta-adi" /></div>
        {paket.uygulama?.adAlanlari.ikinciAd && y.otaIsmi ? <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ob-ota">{y.otaIsmi} <small>{y.istegeBagli}</small></label><input id="uza-ob-ota" className="uza-girdi" value={f.otaIsmi} onChange={(e) => setF({ ...f, otaIsmi: e.target.value })} maxLength={120} /></div> : null}
        <div className="uza-iki">
          <div className="uza-alan"><TarihGirisi id="uza-ob-dogum" etiket={<>{y.dogumTarihi} <small>{y.istegeBagli}</small></>} deger={f.dogumTarihi} degistir={(dogumTarihi) => setF({ ...f, dogumTarihi })} m={m.girdi} alan="dogum-tarihi" /></div>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-ob-cinsiyet">{y.cinsiyet} <small>{y.istegeBagli}</small></label>
            <select id="uza-ob-cinsiyet" className="uza-girdi" value={f.cinsiyet} onChange={(e) => setF({ ...f, cinsiyet: e.target.value as HastaFormu['cinsiyet'] })}>
              <option value="">—</option><option value="male">{y.erkek}</option><option value="female">{y.kadin}</option>
            </select>
          </div>
        </div>
        <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ob-tel">{y.telefon} <small>{y.istegeBagli}</small></label><input id="uza-ob-tel" type="tel" className="uza-girdi" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} maxLength={40} placeholder={paket.telefon.ornek} /></div>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-ob-dil">{y.dil}</label>
          <select id="uza-ob-dil" className="uza-girdi" value={f.dil} onChange={(e) => setF({ ...f, dil: e.target.value })} required data-alan="hasta-dili">
            {(paket.uygulama?.hastaDilleri ?? []).map((d) => <option key={d} value={d}>{dilAdi(m, d) || d}</option>)}
          </select>
        </div>
        <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="on-buro-hasta-kaydet">{bekliyor ? y.kaydediliyor : y.kaydet}</button>
      </form>
    </section>
  )
}

const bosHasta = (): HastaFormu => ({ ad: '', otaIsmi: '', dogumTarihi: '', cinsiyet: '', telefon: '', dil: ulkePaketi().uygulama?.hastaDilleri[0] ?? '' })

export default function OnBuro() {
  const u = useUygulama('onBuro')
  const { hesap, api } = u
  const [hekimler, setHekimler] = useState<OnBuroHekimi[] | null>(null)
  const [hekimId, setHekimId] = useState('')
  const [gun, setGun] = useState<GunVerisi | null>(null)
  const [q, setQ] = useState('')
  const [hastalar, setHastalar] = useState<HastaKarti[] | null>(null)
  const [aramaKisa, setAramaKisa] = useState(false)
  const [hasta, setHasta] = useState<HastaKarti | null>(null)
  const [yeni, setYeni] = useState<YeniErisim | null>(null)
  const [form, setForm] = useState<RandevuFormu>({ gun: '', saat: '', sureDk: ulkePaketi().uygulama?.randevu?.varsayilan.sureDk ?? 30, yineDe: false })
  const [yeniHasta, setYeniHasta] = useState<HastaFormu>(bosHasta)
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<OnBuroBildirimi>(null)
  const [kopuk, setKopuk] = useState(false)

  const secili = hekimler?.find((h) => h.hekimId === hekimId)
  const yetkiler = secili?.yetkiler ?? []
  const randevuYetkisi = yetkiler.includes('on-buro-randevu')

  const gunYukle = useCallback(async (hekim: string, g: string) => {
    const r = await api(`${API}?hekim=${hekim}${g ? `&gun=${encodeURIComponent(g)}` : ''}`)
    if (r.ok && Array.isArray(r.j.randevular)) setGun({ gun: String(r.j.gunler?.[0] ?? g), bugun: String(r.j.bugun ?? g), randevular: r.j.randevular as OnBuroRandevusu[] })
    else setGun(null)
  }, [api])
  useEffect(() => {
    if (!hesap) return
    api(API).then((r) => {
      if (!r.ok) { setKopuk(true); return }
      const liste = (Array.isArray(r.j.hekimler) ? r.j.hekimler : []) as OnBuroHekimi[]
      setHekimler(liste); setHekimId((eski) => eski || liste[0]?.hekimId || '')
    }).catch(() => setKopuk(true))
  }, [hesap, api])
  useEffect(() => { setGun(null); setHastalar(null); setHasta(null); setYeni(null); if (hekimId && randevuYetkisi) gunYukle(hekimId, '').catch(() => {}) }, [hekimId, randevuYetkisi, gunYukle])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  const k = klinikMetni(u.dil)
  const r = randevuMetni(u.dil)
  const o = k.onBuro

  const kodBildirimi = (j: Record<string, unknown>, status: number): OnBuroBildirimi => (j.code === 'DOLU' ? 'dolu' : j.code === 'MESAI_DISI' ? 'mesai-disi' : j.code === 'GECERSIZ' ? 'gecersiz' : j.code === 'GECIS_YOK' ? 'gecis-yok' : status === 404 ? 'yetki-yok' : 'yapilamadi')
  async function yap(is: () => Promise<{ ok: boolean; status: number; j: Record<string, unknown> }>, tamam: (j: Record<string, unknown>) => OnBuroBildirimi | Promise<OnBuroBildirimi>) {
    setBekliyor(true); setBildirim(null)
    try { const c = await is(); setBildirim(c.ok ? await tamam(c.j) : kodBildirimi(c.j, c.status)) } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  async function ara() {
    setAramaKisa(false)
    try {
      const c = await api(`${API}?hekim=${hekimId}&q=${encodeURIComponent(q)}`)
      if (c.ok) setHastalar((Array.isArray(c.j.hastalar) ? c.j.hastalar : []) as HastaKarti[])
      else if (c.j.code === 'ARAMA_KISA') setAramaKisa(true)
      else setBildirim(c.status === 404 ? 'yetki-yok' : 'yapilamadi')
    } catch { setBildirim('yapilamadi') }
  }
  const hastaSec = (h: HastaKarti) => { setHasta(h); setYeni(null); setForm((f) => ({ ...f, gun: gun?.gun ?? f.gun, yineDe: false })) }

  const iyi = bildirim === 'alindi' ? o.alindi : bildirim === 'degistirildi' ? o.degistirildi : bildirim === 'hasta-kaydedildi' ? o.hastaKaydedildi : bildirim === 'form-istendi' ? o.formIstendi : bildirim === 'kopyalandi' ? o.kopyalandi : null
  const kotu = bildirim === 'dolu' ? r.form.dolu : bildirim === 'mesai-disi' ? r.form.mesaiDisi : bildirim === 'gecersiz' ? r.form.tarihGecersiz : bildirim === 'gecis-yok' ? r.randevu.gecisYok : bildirim === 'yetki-yok' ? o.yetkiYok : bildirim === 'yapilamadi' ? o.yapilamadi : bildirim === 'kopyalanamadi' ? o.kopyalanamadi : kopuk ? u.m.kabuk.hata : null
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="onBuro" cikis={u.cikis} onBuro={hesap.onBuro}>
      {hekimler === null ? (kopuk ? <Hata>{u.m.kabuk.hata}</Hata> : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>) : (
        <>
          <HekimSecimiGorunumu k={k} hekimler={hekimler} hekimId={hekimId} sec={setHekimId} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-alan="on-buro-bildirim"><Bilgi>{iyi}</Bilgi><Hata>{kotu}</Hata></div>
          {secili && randevuYetkisi ? (
            <>
              <GunRandevulariGorunumu k={k} r={r} veri={gun} git={(g) => { gunYukle(hekimId, g).catch(() => {}) }} bekliyor={bekliyor}
                durumDegistir={(randevuId, durum) => { void yap(() => api(API, { method: 'PATCH', govde: { hekimId, randevuId, durum } }), async () => { await gunYukle(hekimId, gun?.gun ?? ''); return 'degistirildi' as const }) }} />
              <HastaAramaGorunumu k={k} q={q} setQ={setQ} ara={() => { void ara() }} hastalar={hastalar} aramaKisa={aramaKisa} sec={hastaSec} />
            </>
          ) : null}
          {secili && hasta ? (
            <HastaKartiGorunumu k={k} r={r} g={u.m.girdi} hasta={hasta} yetkiler={yetkiler} form={form} setForm={setForm} sureler={ulkePaketi().uygulama?.randevu?.sureSecenekleri ?? [form.sureDk]} yeni={yeni} bekliyor={bekliyor}
              portalVar={ozellikAcik('hastaPortali')} formVar={ozellikAcik('hastaPortali') && ozellikAcik('hastaFormu')} kapat={() => { setHasta(null); setYeni(null) }}
              randevuAl={() => { if (!gunGecerli(form.gun) || saatCoz(form.saat) === null) { setBildirim('gecersiz'); return } void yap(() => api(API, { method: 'POST', govde: { hekimId, islem: 'randevu', hastaId: hasta.id, gun: form.gun, saat: form.saat, sureDk: form.sureDk, yineDe: form.yineDe } }), async (j) => { await gunYukle(hekimId, String((j.randevu as { gun?: string } | undefined)?.gun ?? form.gun)); return 'alindi' as const }) }}
              portalVer={() => { void yap(() => api(API, { method: 'POST', govde: { hekimId, islem: 'portal', hastaId: hasta.id } }), (j) => { setYeni({ adres: portalAdresi(window.location.origin, String(j.yol)), pin: String(j.pin) }); return null }) }}
              formIste={() => { void yap(() => api(API, { method: 'POST', govde: { hekimId, islem: 'form', hastaId: hasta.id } }), (j) => { if (typeof j.yol === 'string' && typeof j.pin === 'string') setYeni({ adres: portalAdresi(window.location.origin, j.yol), pin: j.pin }); return 'form-istendi' }) }}
              kopyala={(ne) => { if (yeni) void panoyaKopyala(ne === 'pin' ? yeni.pin : yeni.adres).then((t) => setBildirim(t ? 'kopyalandi' : 'kopyalanamadi')) }} />
          ) : null}
          {secili && yetkiler.includes('on-buro-hasta') ? (
            <YeniHastaGorunumu k={k} m={u.m} f={yeniHasta} setF={setYeniHasta} bekliyor={bekliyor}
              kaydet={() => { if (yeniHasta.dogumTarihi === GIRDI_GECERSIZ) { setBildirim('gecersiz'); return } void yap(() => api(API, { method: 'POST', govde: { hekimId, islem: 'hasta', ...yeniHasta } }), (j) => { const h = j.hasta as HastaKarti | undefined; setYeniHasta(bosHasta()); if (h && randevuYetkisi) hastaSec(h); return 'hasta-kaydedildi' }) }} />
          ) : null}
        </>
      )}
    </Cerceve>
  )
}
