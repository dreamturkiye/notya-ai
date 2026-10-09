'use client'

/**
 * NOTYA-ULKE-KLINIK-01 — /clinic: THE CLINIC. One address, several views.
 *
 *   an account in no clinic     create a clinic (and be its owner), or join one with an invitation code
 *   a member                    the clinic's name, the member's own position, the members
 *   the owner, an administrator also: invitations (a code is shown ONCE), positions, removing a member, and the
 *                               clinic's schedule — when each member has an appointment, with nothing of any patient
 *   ?gorunum=yetkiler           "who can help with my patients" and the record (./KlinikYetkiler.tsx)
 *   ?gorunum=paylasilan         what was shared with the account, and what it covers (./KlinikPaylasilan.tsx)
 *
 * A POSITION OPENS NO PATIENT, and this screen says so. Nothing here shows a patient: members are accounts.
 * Every sentence is the pack's (klinikMetni), in the account's form; the server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Cerceve, Hata, tarihYaz, useUygulama, YOL, Yukleniyor, type Uygulama } from './Kabuk'
import { panoyaKopyala } from './pano'
import { DurumRozeti, gunBasligi, saatAraligi, type RandevuDurumu } from './randevuOrtak'
import { KlinikYetkiler } from './KlinikYetkiler'
import { KlinikPaylasilan } from './KlinikPaylasilan'
import { klinikMetni, randevuMetni, rolAdi, type KlinikMetni, type RandevuMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { DAVET_KONUMLARI, yonetebilir, yoneticiMi, type KlinikDaveti, type KlinikGorunumu, type KlinikKonumu, type KlinikTakvimDilimi, type KlinikUyesi, type KlinikYetkiTuru } from '@/lib/ulke/klinikHesabi/tipler'
import { gunEkle } from '@/lib/ulke/uygulama/zaman'
import { ozellikAcik } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'

export const KLINIK_API = '/api/ulke/klinik'
export type KlinikAyarOzeti = { yetkiTurleri: KlinikYetkiTuru[]; sahipHekimAdinaVerebilir: boolean; paylasimRolleri: string[]; vekaletAzamiGun: number }
export type KlinikVerisi = { klinik: KlinikGorunumu | null; ayarlar: KlinikAyarOzeti; ben: string; davetler?: KlinikDaveti[] }
export type YeniDavet = { kod: string; konum: KlinikKonumu; sonGecerlilik: string }
export type KlinikBildirimi = 'degistirildi' | 'cikarildi' | 'davet-geri-alindi' | 'kopyalandi' | 'kopyalanamadi' | 'yetki-yok' | 'yapilamadi' | null
export const klinikYolu = (gorunum?: 'yetkiler' | 'paylasilan') => (gorunum ? `${YOL.klinik}?gorunum=${gorunum}` : YOL.klinik)

// ───────────────────────── an account in no clinic ─────────────────────────

export type GirisHatasi = 'ad' | 'kod' | 'uye' | 'yapilamadi' | null

export function KlinikGirisGorunumu({ k, ad, setAd, kod, setKod, kur, katil, bekliyor, hata }: {
  k: KlinikMetni; ad: string; setAd: (x: string) => void; kod: string; setKod: (x: string) => void
  kur: () => void; katil: () => void; bekliyor: boolean; hata: GirisHatasi
}) {
  const g = k.giris
  return (
    <>
      <section className="uza-kart uza-dar" data-alan="klinik-giris">
        <h1 className="uza-h1">{g.baslik}</h1>
        <p className="uza-aciklama">{g.aciklama}</p>
        <Hata>{hata === 'ad' ? g.adGerekli : hata === 'kod' ? g.kodGecersiz : hata === 'uye' ? g.zatenUye : hata === 'yapilamadi' ? g.yapilamadi : null}</Hata>
      </section>
      <section className="uza-kart uza-dar" data-alan="klinik-katil">
        <h2 className="uza-h2">{g.katilBaslik}</h2>
        <p className="uza-aciklama">{g.katilAciklama}</p>
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); katil() }}>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-kl-kod">{g.kod}</label>
            <input id="uza-kl-kod" className="uza-girdi" value={kod} onChange={(e) => setKod(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX" data-alan="davet-kodu" />
          </div>
          <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="klinige-katil">{bekliyor ? g.bekliyor : g.katil}</button>
        </form>
      </section>
      <section className="uza-kart uza-dar" data-alan="klinik-kur">
        <h2 className="uza-h2">{g.kurBaslik}</h2>
        <p className="uza-aciklama">{g.kurAciklama}</p>
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); kur() }}>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-kl-ad">{g.ad}</label>
            <input id="uza-kl-ad" className="uza-girdi" value={ad} onChange={(e) => setAd(e.target.value)} maxLength={120} data-alan="klinik-adi" />
          </div>
          <button type="submit" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} data-eylem="klinik-kur">{bekliyor ? g.bekliyor : g.kur}</button>
        </form>
      </section>
    </>
  )
}

// ───────────────────────── a member ─────────────────────────

/** The positions `yapan` may give to a member in `hedef` — never the owner's, and only what the server would accept. */
export const verilebilirKonumlar = (yapan: KlinikKonumu, hedef: KlinikKonumu): KlinikKonumu[] => (yonetebilir(yapan, hedef) ? DAVET_KONUMLARI.filter((x) => yonetebilir(yapan, x)) : [])

export function UyelerGorunumu({ k, dil, klinik, ben, onay, setOnay, konumDegistir, cikar, bekliyor }: {
  k: KlinikMetni; dil: DilKodu; klinik: KlinikGorunumu; ben: string
  /** The member whose removal (or the account's own leaving) is being asked about. */
  onay: string | null; setOnay: (hesapId: string | null) => void
  konumDegistir: (hesapId: string, konum: KlinikKonumu) => void; cikar: (hesapId: string) => void; bekliyor: boolean
}) {
  const c = k.klinik
  return (
    <section className="uza-kart" data-alan="klinik-uyeler">
      <h2 className="uza-h2">{c.uyeler}</h2>
      <p className="uza-ipucu" style={{ marginTop: 0 }}>{c.konumAciklama}</p>
      <ul className="uza-liste">
        {klinik.uyeler.map((u) => {
          const kendisi = u.hesapId === ben
          const secenekler = kendisi ? [] : verilebilirKonumlar(klinik.konum, u.konum)
          const cikarilabilir = kendisi ? u.konum !== 'sahip' : yonetebilir(klinik.konum, u.konum)
          return (
            <li key={u.hesapId} data-uye={u.hesapId} data-konum={u.konum}>
              <div className="uza-satir">
                <span className="uza-liste-ad">
                  {u.ad}{kendisi ? ` ${c.siz}` : ''}
                  <span className="uza-liste-alt">{u.rol ? rolAdi(u.rol, dil) ?? c.rolYok : c.rolYok}</span>
                </span>
                <span className="uza-rozet" data-alan="uye-konumu">{k.konum[u.konum]}</span>
              </div>
              {secenekler.length || cikarilabilir ? (
                <div className="uza-eylemler" style={{ marginTop: 6 }}>
                  {secenekler.length ? (
                    <label className="uza-etiket" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{c.konumDegistir}</span>
                      <select className="uza-girdi" style={{ width: 'auto' }} value={u.konum} disabled={bekliyor} onChange={(e) => konumDegistir(u.hesapId, e.target.value as KlinikKonumu)} data-eylem="konum-degistir">
                        {secenekler.includes(u.konum) ? null : <option value={u.konum}>{k.konum[u.konum]}</option>}
                        {secenekler.map((x) => <option key={x} value={x}>{k.konum[x]}</option>)}
                      </select>
                    </label>
                  ) : null}
                  {cikarilabilir ? (onay === u.hesapId ? (
                    <span role="alertdialog" aria-label={kendisi ? c.ayrilOnay : yerine(c.cikarOnay, u.ad)} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="uza-ipucu" style={{ margin: 0 }}>{kendisi ? c.ayrilOnay : yerine(c.cikarOnay, u.ad)}</span>
                      <button type="button" className="uza-dugme uza-dugme-uyari uza-dugme-kucuk" disabled={bekliyor} onClick={() => cikar(u.hesapId)} data-eylem="cikar-onayla">{c.evet}</button>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setOnay(null)}>{c.vazgec}</button>
                    </span>
                  ) : (
                    <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setOnay(u.hesapId)} data-eylem={kendisi ? 'klinikten-ayril' : 'uye-cikar'}>{kendisi ? c.ayril : c.cikar}</button>
                  )) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      {klinik.uyeler.some((u) => u.hesapId !== ben && verilebilirKonumlar(klinik.konum, u.konum).length) ? <p className="uza-ipucu">{c.konumUyari}</p> : null}
    </section>
  )
}

export function DavetlerGorunumu({ k, konum, davetler, secili, setSecili, olustur, yeni, kopyala, geriAl, bekliyor }: {
  k: KlinikMetni; konum: KlinikKonumu; davetler: KlinikDaveti[]
  secili: KlinikKonumu; setSecili: (x: KlinikKonumu) => void; olustur: () => void
  /** The code that was just made: on the screen until the account leaves it, never again. */
  yeni: YeniDavet | null; kopyala: () => void; geriAl: (id: string) => void; bekliyor: boolean
}) {
  const d = k.davet
  const verilebilir = DAVET_KONUMLARI.filter((x) => yonetebilir(konum, x))
  return (
    <section className="uza-kart" data-alan="klinik-davetler">
      <h2 className="uza-h2">{d.baslik}</h2>
      <p className="uza-aciklama">{d.aciklama}</p>
      <form className="uza-form" onSubmit={(e) => { e.preventDefault(); olustur() }}>
        <div className="uza-alan">
          <label className="uza-etiket" htmlFor="uza-kl-davet-konum">{d.konum}</label>
          <select id="uza-kl-davet-konum" className="uza-girdi" value={secili} onChange={(e) => setSecili(e.target.value as KlinikKonumu)} data-alan="davet-konumu">
            {verilebilir.map((x) => <option key={x} value={x}>{k.konum[x]}</option>)}
          </select>
        </div>
        <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="davet-olustur">{d.olustur}</button>
      </form>
      {yeni ? (
        <div className="uza-form" data-alan="yeni-davet" style={{ marginTop: 14 }}>
          <Bilgi>{d.birKez}</Bilgi>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-kl-yeni-kod">{d.kod} · {k.konum[yeni.konum]}</label>
            <div className="uza-arama-satir">
              <input id="uza-kl-yeni-kod" className="uza-girdi" readOnly value={yeni.kod} data-alan="yeni-davet-kodu" onFocus={(x) => x.currentTarget.select()} />
              <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={kopyala} data-eylem="davet-kopyala">{d.kopyala}</button>
            </div>
          </div>
          <p className="uza-ipucu" style={{ marginTop: 0 }}>{yerine(d.sonGecerlilik, tarihYaz(yeni.sonGecerlilik))}</p>
        </div>
      ) : null}
      <h3 className="uza-alt-baslik" style={{ marginTop: 16 }}>{d.liste}</h3>
      {davetler.length === 0 ? <p className="uza-bos">{d.listeBos}</p> : (
        <ul className="uza-liste">
          {davetler.map((x) => (
            <li key={x.id} data-davet={x.id} data-davet-durumu={x.durum}>
              <div className="uza-satir">
                <span className="uza-liste-ad">{k.konum[x.konum]}<span className="uza-liste-alt">{yerine(d.sonGecerlilik, tarihYaz(x.sonGecerlilik))}</span></span>
                <span className="uza-rozet">{d.durum[x.durum]}</span>
                {x.durum === 'acik' ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => geriAl(x.id)} data-eylem="davet-geri-al">{d.geriAl}</button> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export type TakvimVerisi = { gunler: string[]; bugun: string; hekimler: { hekimId: string; ad: string }[]; dilimler: KlinikTakvimDilimi[] }

/** The clinic's schedule: per member, when — and nothing of any patient, because the server sends nothing of one. */
export function KlinikTakvimGorunumu({ k, r, veri, gun, git, hata }: { k: KlinikMetni; r: RandevuMetni; veri: TakvimVerisi | null; gun: string; git: (gun: string) => void; hata?: string | null }) {
  const t = k.takvim
  return (
    <section className="uza-kart" data-alan="klinik-takvimi">
      <h2 className="uza-h2">{t.baslik}</h2>
      <p className="uza-aciklama">{t.aciklama}</p>
      <div className="uza-takvim-ust">
        <strong>{gun ? gunBasligi(r, gun) : ''}</strong>
        <div className="uza-takvim-gezinme">
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(gun, -1))} data-eylem="takvim-onceki">{r.takvim.onceki}</button>
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(veri?.bugun ?? gun)} data-eylem="takvim-bugun">{r.takvim.bugun}</button>
          <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => git(gunEkle(gun, 1))} data-eylem="takvim-sonraki">{r.takvim.sonraki}</button>
        </div>
      </div>
      <Hata>{hata ?? null}</Hata>
      {veri && veri.dilimler.length === 0 ? <p className="uza-bos">{t.bos}</p> : null}
      {veri ? veri.hekimler.filter((h) => veri.dilimler.some((d) => d.hekimId === h.hekimId)).map((h) => (
        <div key={h.hekimId} data-takvim-hekimi={h.hekimId} style={{ marginTop: 12 }}>
          <h3 className="uza-alt-baslik">{h.ad}</h3>
          <ul className="uza-liste">
            {veri.dilimler.filter((d) => d.hekimId === h.hekimId).map((d) => (
              <li key={`${d.hekimId}-${d.baslangic}`}><div className="uza-satir"><span className="uza-saat">{saatAraligi(d.saat, d.sureDk)}</span><DurumRozeti r={r} durum={d.durum as RandevuDurumu} /></div></li>
            ))}
          </ul>
        </div>
      )) : null}
    </section>
  )
}

export function KlinikBasligi({ k, klinik }: { k: KlinikMetni; klinik: KlinikGorunumu }) {
  const c = k.klinik
  return (
    <section className="uza-kart" data-alan="klinik-basligi" data-konum={klinik.konum}>
      <h1 className="uza-h1">{klinik.ad}</h1>
      <p className="uza-aciklama">{yerine(c.konumunuz, k.konum[klinik.konum])}</p>
      <div className="uza-eylemler">
        {klinik.konum !== 'on-buro' ? <a className="uza-dugme" href={klinikYolu('yetkiler')} data-eylem="yetkileri-ac">{c.yetkilerBaglanti}</a> : null}
        {klinik.konum !== 'on-buro' ? <a className="uza-dugme uza-dugme-cizgi" href={klinikYolu('paylasilan')} data-eylem="paylasilani-ac">{c.paylasilanBaglanti}</a> : null}
        {klinik.konum === 'on-buro' && ozellikAcik('randevu') ? <a className="uza-dugme" href={YOL.onBuro} data-eylem="on-buroyu-ac">{c.onBuroBaglanti}</a> : null}
      </div>
    </section>
  )
}

// ───────────────────────── the screen ─────────────────────────

function KlinikAna({ u, veri, yenile }: { u: Uygulama; veri: KlinikVerisi; yenile: () => Promise<void> }) {
  const k = klinikMetni(u.dil)
  const [ad, setAd] = useState('')
  const [kod, setKod] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [girisHatasi, setGirisHatasi] = useState<GirisHatasi>(null)
  const [bildirim, setBildirim] = useState<KlinikBildirimi>(null)
  const [onay, setOnay] = useState<string | null>(null)
  const [secili, setSecili] = useState<KlinikKonumu>('hekim')
  const [yeni, setYeni] = useState<YeniDavet | null>(null)
  const [takvim, setTakvim] = useState<TakvimVerisi | null>(null)
  const [gun, setGun] = useState('')
  const { api } = u
  const yonetici = veri.klinik ? yoneticiMi(veri.klinik.konum) : false
  const takvimVar = yonetici && ozellikAcik('randevu')

  const takvimYukle = useCallback(async (g: string) => {
    const r = await api(`${KLINIK_API}/takvim${g ? `?gun=${encodeURIComponent(g)}` : ''}`)
    if (r.ok && Array.isArray(r.j.dilimler)) { setTakvim(r.j as unknown as TakvimVerisi); setGun(String(r.j.gunler?.[0] ?? g)) }
  }, [api])
  useEffect(() => { if (takvimVar) takvimYukle('').catch(() => {}) }, [takvimVar, takvimYukle])

  async function yap(is: () => Promise<{ ok: boolean; status: number; j: Record<string, unknown> }>, tamam: KlinikBildirimi) {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await is()
      if (r.ok) { setBildirim(tamam); setOnay(null); await yenile() }
      else setBildirim(r.status === 403 ? 'yetki-yok' : 'yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  async function girisYap(tur: 'kur' | 'katil') {
    if (tur === 'kur' && ad.trim().length < 2) { setGirisHatasi('ad'); return }
    setBekliyor(true); setGirisHatasi(null)
    try {
      const r = tur === 'kur' ? await api(KLINIK_API, { method: 'POST', govde: { ad } }) : await api(`${KLINIK_API}/katil`, { method: 'POST', govde: { kod } })
      // A front-desk member lands on the workspace; everybody else stays on the clinic.
      if (r.ok) { if (r.j.konum === 'on-buro' && ozellikAcik('randevu')) { window.location.assign(YOL.onBuro); return } await yenile() }
      else setGirisHatasi(r.j.code === 'UYE' ? 'uye' : r.j.code === 'KOD' ? 'kod' : r.j.code === 'GECERSIZ' ? 'ad' : 'yapilamadi')
    } catch { setGirisHatasi('yapilamadi') }
    setBekliyor(false)
  }
  async function davetOlustur() {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(`${KLINIK_API}/davet`, { method: 'POST', govde: { konum: secili } })
      if (r.ok && typeof r.j.kod === 'string') { setYeni({ kod: r.j.kod, konum: r.j.konum as KlinikKonumu, sonGecerlilik: String(r.j.sonGecerlilik) }); await yenile() }
      else setBildirim(r.status === 403 ? 'yetki-yok' : 'yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }

  if (!veri.klinik) return <KlinikGirisGorunumu k={k} ad={ad} setAd={setAd} kod={kod} setKod={setKod} kur={() => { void girisYap('kur') }} katil={() => { void girisYap('katil') }} bekliyor={bekliyor} hata={girisHatasi} />
  const klinik = veri.klinik
  const c = k.klinik
  return (
    <>
      <KlinikBasligi k={k} klinik={klinik} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bilgi>{bildirim === 'degistirildi' ? c.degistirildi : bildirim === 'cikarildi' ? c.cikarildi : bildirim === 'davet-geri-alindi' ? k.davet.geriAlindi : bildirim === 'kopyalandi' ? k.davet.kopyalandi : null}</Bilgi>
        <Hata>{bildirim === 'yetki-yok' ? c.yetkiYok : bildirim === 'yapilamadi' ? c.yapilamadi : bildirim === 'kopyalanamadi' ? k.davet.kopyalanamadi : null}</Hata>
      </div>
      <UyelerGorunumu k={k} dil={u.dil} klinik={klinik} ben={veri.ben} onay={onay} setOnay={setOnay} bekliyor={bekliyor}
        konumDegistir={(hesapId, konum) => { void yap(() => api(`${KLINIK_API}/uye`, { method: 'PATCH', govde: { hesapId, konum } }), 'degistirildi') }}
        cikar={(hesapId) => { void yap(() => api(`${KLINIK_API}/uye`, { method: 'DELETE', govde: { hesapId } }), 'cikarildi') }} />
      {yonetici ? (
        <DavetlerGorunumu k={k} konum={klinik.konum} davetler={veri.davetler ?? []} secili={secili} setSecili={setSecili} olustur={() => { void davetOlustur() }} yeni={yeni} bekliyor={bekliyor}
          kopyala={() => { if (yeni) void panoyaKopyala(yeni.kod).then((t) => setBildirim(t ? 'kopyalandi' : 'kopyalanamadi')) }}
          geriAl={(davetId) => { void yap(() => api(`${KLINIK_API}/davet`, { method: 'DELETE', govde: { davetId } }), 'davet-geri-alindi') }} />
      ) : null}
      {takvimVar && gun ? <KlinikTakvimGorunumu k={k} r={randevuMetni(u.dil)} veri={takvim} gun={gun} git={(g) => { setGun(g); takvimYukle(g).catch(() => {}) }} /> : null}
    </>
  )
}

export default function Klinik() {
  const u = useUygulama('klinik')
  const [veri, setVeri] = useState<KlinikVerisi | null>(null)
  const [kopuk, setKopuk] = useState(false)
  const [gorunum, setGorunum] = useState<'ana' | 'yetkiler' | 'paylasilan'>('ana')
  const { hesap, api } = u
  useEffect(() => { const g = new URLSearchParams(window.location.search).get('gorunum'); if (g === 'yetkiler' || g === 'paylasilan') setGorunum(g) }, [])
  const yukle = useCallback(async () => {
    const r = await api(KLINIK_API)
    if (r.ok && r.j.ayarlar) { setVeri(r.j as unknown as KlinikVerisi); setKopuk(false) } else setKopuk(true)
  }, [api])
  useEffect(() => { if (hesap) yukle().catch(() => setKopuk(true)) }, [hesap, yukle])

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  const k = klinikMetni(u.dil)
  // The two other views belong to a member who can have patients, or hold a share or cover: not to the front desk.
  const altGorunum = veri?.klinik && veri.klinik.konum !== 'on-buro' ? gorunum : 'ana'
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} aktif="klinik" cikis={u.cikis} onBuro={hesap.onBuro}>
      <Hata>{kopuk ? u.m.kabuk.hata : null}</Hata>
      {!veri ? (kopuk ? null : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>) : altGorunum === 'yetkiler' && veri.klinik ? (
        <><p className="uza-ipucu"><a className="uza-baglanti" href={klinikYolu()}>{k.klinik.geri}</a></p><KlinikYetkiler u={u} klinik={veri.klinik} ayarlar={veri.ayarlar} ben={veri.ben} /></>
      ) : altGorunum === 'paylasilan' && veri.klinik ? (
        <><p className="uza-ipucu"><a className="uza-baglanti" href={klinikYolu()}>{k.klinik.geri}</a></p><KlinikPaylasilan u={u} /></>
      ) : <KlinikAna u={u} veri={veri} yenile={yukle} />}
    </Cerceve>
  )
}
