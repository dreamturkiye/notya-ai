'use client'

/**
 * NOTYA-ULKE-KLINIK-01 — /clinic?gorunum=yetkiler: "WHO CAN HELP WITH MY PATIENTS", and THE RECORD.
 *
 * The account gives a member of its clinic ONE capability at a time, for its OWN patients: the front desk the
 * appointments, creating a patient, or the portal link; an allied professional one named patient's approved notes;
 * another doctor cover for a stated period. Before it is given, the screen says in the pack's words what the
 * capability lets the member do — for the portal link, plainly, that the member will see the link and the PIN.
 * A permission is withdrawn with one press and opens nothing from the next request on.
 *
 * THE RECORD under it is the account's own: every permission given, withdrawn or ended, and every read and write
 * made about its patients through one — who, what, which patient, when. Nobody else reads it.
 *
 * The account also sees what it HOLDS itself, and can give any of it up.
 * Every sentence is the pack's (klinikMetni), in the account's form; the server answers with codes.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Hata, saatYaz, tarihYaz, type Uygulama } from './Kabuk'
import { tamAd } from './Hastalar'
import { klinikMetni, type KlinikMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { YETKI_ALAN_KONUMLARI, KLINIK_YETKI_TURLERI, type ErisimKaydi, type KlinikGorunumu, type KlinikUyesi, type KlinikYetkisi, type KlinikYetkiTuru } from '@/lib/ulke/klinikHesabi/tipler'
import type { KlinikAyarOzeti } from './Klinik'

const YETKI_API = '/api/ulke/klinik/yetki'
export type VerilenYetki = KlinikYetkisi & { alanAdi: string; hastaAdi: string }
export type AlinanYetki = KlinikYetkisi & { hekimAdi: string }
export type YetkiBildirimi = 'verildi' | 'zaten-var' | 'geri-alindi' | 'KONUM' | 'ROL' | 'TUR_KAPALI' | 'GECERSIZ' | 'NOT_FOUND' | 'yapilamadi' | null
export type HastaSecenegi = { id: string; ad: string; otaIsmi: string }

/** The capabilities this account can give to that member here: what the pack has, and what the member's position may hold. */
export const verilebilirTurler = (ayarlar: Pick<KlinikAyarOzeti, 'yetkiTurleri'>, uye: Pick<KlinikUyesi, 'konum'> | undefined): KlinikYetkiTuru[] =>
  uye ? KLINIK_YETKI_TURLERI.filter((t) => ayarlar.yetkiTurleri.includes(t) && YETKI_ALAN_KONUMLARI[t].includes(uye.konum)) : []

const donem = (k: KlinikMetni, y: Pick<KlinikYetkisi, 'baslangic' | 'bitis'>): string => {
  if (!y.baslangic || !y.bitis) return ''
  // The period ends at the start of the day AFTER its last day: the last day is the one before that instant.
  return yerine(k.yetki.donem, tarihYaz(y.baslangic), tarihYaz(new Date(new Date(y.bitis).getTime() - 1000).toISOString()))
}

export function YetkiFormuGorunumu({ k, uyeler, ayarlar, alanId, setAlanId, tur, setTur, hastalar, hastaQ, setHastaQ, hastaAra, hastaId, setHastaId, bitisGun, setBitisGun, gonder, bekliyor }: {
  k: KlinikMetni; uyeler: KlinikUyesi[]; ayarlar: KlinikAyarOzeti
  alanId: string; setAlanId: (x: string) => void; tur: KlinikYetkiTuru | ''; setTur: (x: KlinikYetkiTuru | '') => void
  /** null = no search yet. */
  hastalar: HastaSecenegi[] | null; hastaQ: string; setHastaQ: (x: string) => void; hastaAra: () => void; hastaId: string; setHastaId: (x: string) => void
  bitisGun: string; setBitisGun: (x: string) => void; gonder: () => void; bekliyor: boolean
}) {
  const y = k.yetki
  const uye = uyeler.find((u) => u.hesapId === alanId)
  const turler = verilebilirTurler(ayarlar, uye)
  return (
    <section className="uza-kart" data-alan="yetki-ver">
      <h2 className="uza-h2">{y.ver}</h2>
      {uyeler.length === 0 ? <p className="uza-bos">{y.uyeYok}</p> : (
        <form className="uza-form" onSubmit={(e) => { e.preventDefault(); gonder() }}>
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-yt-uye">{y.uye}</label>
            <select id="uza-yt-uye" className="uza-girdi" value={alanId} onChange={(e) => setAlanId(e.target.value)} data-alan="yetki-uyesi" required>
              <option value="" disabled>{y.uyeSec}</option>
              {uyeler.map((u) => <option key={u.hesapId} value={u.hesapId}>{u.ad} · {k.konum[u.konum]}</option>)}
            </select>
          </div>
          {uye ? (
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-yt-tur">{y.tur}</label>
              <select id="uza-yt-tur" className="uza-girdi" value={tur} onChange={(e) => setTur(e.target.value as KlinikYetkiTuru)} data-alan="yetki-turu" required>
                <option value="" disabled>{y.turSec}</option>
                {turler.map((t) => <option key={t} value={t}>{k.yetkiTuru[t]}</option>)}
              </select>
            </div>
          ) : null}
          {/* WHAT IT LETS THE MEMBER DO, before it is given. For the portal link: that the member will see the link and the PIN. */}
          {tur ? <div className="uza-bilgi-kutu" role="note" data-alan="yetki-aciklamasi" data-tur={tur}>{k.yetkiAciklama[tur]}</div> : null}
          {tur === 'paylasim' ? (
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-yt-hasta-q">{y.hasta}</label>
              <div className="uza-arama-satir">
                <input id="uza-yt-hasta-q" className="uza-girdi" value={hastaQ} onChange={(e) => setHastaQ(e.target.value)} data-alan="yetki-hasta-arama" />
                <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={hastaAra} data-eylem="yetki-hasta-ara">{y.hastaAra}</button>
              </div>
              {hastalar === null ? null : hastalar.length === 0 ? <p className="uza-ipucu">{y.hastaYok}</p> : (
                <select className="uza-girdi" style={{ marginTop: 8 }} value={hastaId} onChange={(e) => setHastaId(e.target.value)} aria-label={y.hastaSec} data-alan="yetki-hastasi" required>
                  <option value="" disabled>{y.hastaSec}</option>
                  {hastalar.map((h) => <option key={h.id} value={h.id}>{tamAd(h)}</option>)}
                </select>
              )}
            </div>
          ) : null}
          {tur === 'vekalet' ? (
            <div className="uza-alan">
              <label className="uza-etiket" htmlFor="uza-yt-bitis">{y.bitisGun}</label>
              <input id="uza-yt-bitis" type="date" className="uza-girdi" value={bitisGun} onChange={(e) => setBitisGun(e.target.value)} data-alan="vekalet-bitis" required />
              <p className="uza-ipucu">{yerine(y.bitisIpucu, ayarlar.vekaletAzamiGun)}</p>
            </div>
          ) : null}
          <button type="submit" className="uza-dugme" disabled={bekliyor || !tur} data-eylem="yetki-ver">{bekliyor ? y.bekliyor : y.gonder}</button>
        </form>
      )}
    </section>
  )
}

export function VerilenlerGorunumu({ k, verilen, geriAl, bekliyor }: { k: KlinikMetni; verilen: VerilenYetki[]; geriAl: (id: string) => void; bekliyor: boolean }) {
  const y = k.yetki
  return (
    <section className="uza-kart" data-alan="verilen-yetkiler">
      <h2 className="uza-h2">{y.verilen}</h2>
      {verilen.length === 0 ? <p className="uza-bos">{y.verilenBos}</p> : (
        <ul className="uza-liste">
          {verilen.map((v) => (
            <li key={v.id} data-yetki={v.id} data-tur={v.tur} data-gecerli={v.gecerli ? 'evet' : 'hayir'}>
              <div className="uza-satir">
                <span className="uza-liste-ad">
                  {v.alanAdi} · {k.yetkiTuru[v.tur]}
                  <span className="uza-liste-alt">{[v.hastaId ? yerine(y.hastaIcin, v.hastaAdi) : '', donem(k, v)].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="uza-rozet" data-durum={v.gecerli ? 'onayli' : undefined}>{v.gecerli ? y.durumGecerli : y.durumBitti}</span>
                {v.iptal ? null : <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => geriAl(v.id)} data-eylem="yetki-geri-al">{y.geriAl}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function AlinanlarGorunumu({ k, alinan, birak, bekliyor }: { k: KlinikMetni; alinan: AlinanYetki[]; birak: (id: string) => void; bekliyor: boolean }) {
  const y = k.yetki
  return (
    <section className="uza-kart" data-alan="alinan-yetkiler">
      <h2 className="uza-h2">{y.alinan}</h2>
      {alinan.length === 0 ? <p className="uza-bos">{y.alinanBos}</p> : (
        <ul className="uza-liste">
          {alinan.map((a) => (
            <li key={a.id} data-yetki={a.id} data-tur={a.tur}>
              <div className="uza-satir">
                <span className="uza-liste-ad">{k.yetkiTuru[a.tur]}<span className="uza-liste-alt">{[yerine(y.hekimden, a.hekimAdi), donem(k, a)].filter(Boolean).join(' · ')}</span></span>
                <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => birak(a.id)} data-eylem="yetki-birak">{y.birak}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** One line of the record, in the pack's words. */
export function kayitCumlesi(k: KlinikMetni, x: Pick<ErisimKaydi, 'olay' | 'tur' | 'ne' | 'alanAdi'>): string {
  if (x.olay === 'okuma' || x.olay === 'yazma') return x.ne ? k.kayit.ne[x.ne] : k.yetkiTuru[x.tur]
  return yerine(k.kayit.olay[x.olay], k.yetkiTuru[x.tur], x.alanAdi)
}

export function KayitGorunumu({ k, kayitlar }: { k: KlinikMetni; kayitlar: ErisimKaydi[] | null }) {
  const c = k.kayit
  return (
    <section className="uza-kart" data-alan="erisim-kaydi">
      <h2 className="uza-h2">{c.baslik}</h2>
      <p className="uza-aciklama">{c.aciklama}</p>
      {kayitlar === null ? null : kayitlar.length === 0 ? <p className="uza-bos">{c.bos}</p> : (
        <ul className="uza-liste">
          {kayitlar.map((x) => (
            <li key={x.id} data-olay={x.olay} data-ne={x.ne ?? undefined}>
              <div className="uza-satir">
                <span className="uza-saat">{tarihYaz(x.an)} {saatYaz(x.an)}</span>
                <span className="uza-liste-ad">{x.kisiAdi} — {kayitCumlesi(k, x)}{x.hastaAdi ? <span className="uza-liste-alt">{yerine(c.hasta, x.hastaAdi)}</span> : null}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function KlinikYetkiler({ u, klinik, ayarlar, ben }: { u: Uygulama; klinik: KlinikGorunumu; ayarlar: KlinikAyarOzeti; ben: string }) {
  const k = klinikMetni(u.dil)
  const y = k.yetki
  const { api, hesap } = u
  const [verilen, setVerilen] = useState<VerilenYetki[]>([])
  const [alinan, setAlinan] = useState<AlinanYetki[]>([])
  const [kayitlar, setKayitlar] = useState<ErisimKaydi[] | null>(null)
  const [alanId, setAlanId] = useState('')
  const [tur, setTur] = useState<KlinikYetkiTuru | ''>('')
  const [hastalar, setHastalar] = useState<HastaSecenegi[] | null>(null)
  const [hastaQ, setHastaQ] = useState('')
  const [hastaId, setHastaId] = useState('')
  const [bitisGun, setBitisGun] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<YetkiBildirimi>(null)
  const [kopuk, setKopuk] = useState(false)

  const yukle = useCallback(async () => {
    const [a, b] = await Promise.all([api(YETKI_API), api('/api/ulke/klinik/kayit')])
    if (a.ok) { setVerilen(Array.isArray(a.j.verilen) ? a.j.verilen : []); setAlinan(Array.isArray(a.j.alinan) ? a.j.alinan : []) }
    if (b.ok) setKayitlar(Array.isArray(b.j.kayitlar) ? b.j.kayitlar : [])
    setKopuk(!a.ok || !b.ok)
  }, [api])
  useEffect(() => { if (hesap) yukle().catch(() => setKopuk(true)) }, [hesap, yukle])

  // Everybody of the clinic but the account itself, and only those there is something to give to.
  const uyeler = klinik.uyeler.filter((x) => x.hesapId !== ben && verilebilirTurler(ayarlar, x).length > 0)

  async function hastaAra() {
    try {
      const r = await api(`/api/ulke/hastalar?q=${encodeURIComponent(hastaQ)}`)
      setHastalar(r.ok && Array.isArray(r.j.hastalar) ? (r.j.hastalar as HastaSecenegi[]).slice(0, 50) : [])
    } catch { setHastalar([]) }
  }
  async function gonder() {
    if (!alanId || !tur) return
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(YETKI_API, { method: 'POST', govde: { alanId, tur, ...(tur === 'paylasim' ? { hastaId } : {}), ...(tur === 'vekalet' ? { bitisGun } : {}) } })
      if (r.ok) { setBildirim(r.j.yeni === false ? 'zaten-var' : 'verildi'); setTur(''); setHastaId(''); setBitisGun(''); await yukle() }
      else setBildirim((['KONUM', 'ROL', 'TUR_KAPALI', 'GECERSIZ', 'NOT_FOUND'] as const).find((c) => c === r.j.code) ?? 'yapilamadi')
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }
  async function geriAl(yetkiId: string) {
    setBekliyor(true); setBildirim(null)
    try {
      const r = await api(YETKI_API, { method: 'DELETE', govde: { yetkiId } })
      setBildirim(r.ok || r.j.code === 'AYNI' ? 'geri-alindi' : 'yapilamadi')
      await yukle()
    } catch { setBildirim('yapilamadi') }
    setBekliyor(false)
  }

  const hataMetni = bildirim === 'KONUM' ? y.hataKonum : bildirim === 'ROL' ? y.hataRol : bildirim === 'TUR_KAPALI' ? y.hataTur : bildirim === 'GECERSIZ' ? y.hataGecersiz : bildirim === 'NOT_FOUND' ? y.hataBulunamadi : bildirim === 'yapilamadi' ? y.yapilamadi : kopuk ? u.m.kabuk.hata : null
  return (
    <>
      <section className="uza-kart" data-alan="yetkiler-basligi">
        <h1 className="uza-h1">{y.baslik}</h1>
        <p className="uza-aciklama">{y.aciklama}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bilgi>{bildirim === 'verildi' ? y.verildi : bildirim === 'zaten-var' ? y.zatenVar : bildirim === 'geri-alindi' ? y.geriAlindi : null}</Bilgi>
          <Hata>{hataMetni}</Hata>
        </div>
      </section>
      <YetkiFormuGorunumu k={k} uyeler={uyeler} ayarlar={ayarlar} alanId={alanId} setAlanId={(x) => { setAlanId(x); setTur('') }} tur={tur} setTur={setTur} hastalar={hastalar} hastaQ={hastaQ} setHastaQ={setHastaQ}
        hastaAra={() => { void hastaAra() }} hastaId={hastaId} setHastaId={setHastaId} bitisGun={bitisGun} setBitisGun={setBitisGun} gonder={() => { void gonder() }} bekliyor={bekliyor} />
      <VerilenlerGorunumu k={k} verilen={verilen} geriAl={(id) => { void geriAl(id) }} bekliyor={bekliyor} />
      <AlinanlarGorunumu k={k} alinan={alinan} birak={(id) => { void geriAl(id) }} bekliyor={bekliyor} />
      <KayitGorunumu k={k} kayitlar={kayitlar} />
    </>
  )
}
