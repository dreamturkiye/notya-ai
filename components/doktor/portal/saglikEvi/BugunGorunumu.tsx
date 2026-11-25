'use client'
/**
 * HASTA-PORTALI-GUNLUK → BUGUN-V2 — Sağlığım › Bugün, the daily health home (Kaan, 2026-11-24: "more modern and
 * exceptional — minimalistic, great colours and graphics, easy to understand"; habit-forming for the patient who takes five
 * medicines and measures twice a day). Shared presentational view: every word comes from `s`, every action from `eylemler`,
 * every bridge link from `kopru` (gorunum-paritesi-ulke — one look in every country).
 *
 * First screen = one glance: greeting + streak, the three day rings (İlaç / Ölçüm / Hedef) with big numbers, ONE next
 * step in a plain sentence with one big action (today's missed dose fixable in one tap under it). Below, quiet sections:
 * friendly notes (with the metric's own curve), measurements (one tap → entry sheet) and today's doses (order follows the
 * branş config), trends as smooth curves with the target band, the game layer (streak + kalkan, this week's habit karne,
 * badges — habits are celebrated, never medical results), and the bridge to the doctor. Core for every branş: only what
 * the patient logs / the doctor planned is shown (lib/saglikEvi/bugunGorunum.ts).
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { GunlukDurum, OlcumKarti } from '@/lib/saglikEvi/ozet'
import type { SaglikEviSozleri } from '@/lib/saglikEvi/sozler'
import { kisaTarih, onceMetni } from '@/lib/saglikEvi/sozler'
import { degerMetni, OLCUM_TANIMLARI } from '@/lib/saglikEvi/olcumler'
import { kisaAd, metrikRengi, metrikTipi, sayi } from '@/lib/saglikEvi/evVerisiGorunum'
import { adlarMetni, bugunKazanildiMi, eksikDozlar, gunHalkalari, ilkCumle, siradakiAdim, uyariEgilimi, type GunHalkasi } from '@/lib/saglikEvi/bugunGorunum'
import { trDakika } from '@/lib/saglikEvi/zaman'
import type { GunlukEylemleri } from './eylemler'
import { GunHalkalari, type HalkaEtiketi } from './GunHalkalari'
import { Egri } from './Egri'
import { RozetSvg } from './Rozet'
import { OlcumGirisi } from './OlcumGirisi'
import { DozListesi } from './DozListesi'
import { UyariKarti } from './UyariKarti'
import { OnayKarti } from './OnayKarti'
import { RozetAcilisi } from './RozetAcilisi'

export interface BugunKoprusu {
  randevu: string | null
  randevuHref: string
  mesajSayisi: number
  mesajHref: string
  sonZiyaret: { baslik: string; tarih: string; href: string } | null
  sonucSayisi: number
  sonucHref: string
  karneHref: string
  gunlukHref: string
  dozHref: string
  tercihHref: string
  kvkkHref: string
}

const titret = () => { try { navigator.vibrate?.(12) } catch { /* yok */ } }
const Ikon = ({ d, boyut = 20 }: { d: string; boyut?: number }) => <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
const Tik = ({ boyut = 22 }: { boyut?: number }) => <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
const Alev = ({ aktif, boyut = 22 }: { aktif: boolean; boyut?: number }) => (
  <svg width={boyut} height={boyut * 1.17} viewBox="0 0 24 28" aria-hidden className="sgb-alev">
    <path d="M12 27c-5.5 0-9-3.8-9-8.6C3 12 9 10 8.4 2.5c4.8 2.7 9.6 7.6 9.6 13.1 1.4-1.1 2.2-2.8 2.4-4.6 1.6 1.9 2.6 4.4 2.6 6.9C23 23.1 18.4 27 12 27z" fill={aktif ? '#d0673f' : '#d8cfc4'} />
    <path d="M12 27c-2.4 0-4-1.7-4-4 0-3 3-4 3-7 2.4 1.3 5 3.7 5 6.7 0 2.4-1.7 4.3-4 4.3z" fill={aktif ? '#f6c06a' : '#efe9e1'} />
  </svg>
)
const Kalkan = ({ boyut = 16, dolu = true }: { boyut?: number; dolu?: boolean }) => (
  <svg width={boyut} height={boyut * 1.08} viewBox="0 0 24 26" aria-hidden><path d="M12 2l9 3.4c0 8-3.4 14-9 18-5.6-4-9-10-9-18z" fill={dolu ? '#2f4334' : 'none'} stroke="#2f4334" strokeWidth={dolu ? 0 : 1.6} /></svg>
)

function halkaEtiketleri(s: SaglikEviSozleri, h: GunHalkasi[]): HalkaEtiketi[] {
  return h.map((x) => {
    if (x.anahtar === 'ilac') {
      const sirada = x.toplam - x.yapilan - x.eksik
      return { ad: s.halkaIlac, deger: String(x.yapilan), pay: String(x.toplam), alt: x.tamam ? s.halkaAlt.tamam : x.eksik ? s.halkaAlt.ilacEksik(x.eksik) : s.halkaAlt.ilacSirada(sirada), altVurgu: x.tamam ? 'tamam' : x.eksik ? 'uyari' : null }
    }
    if (x.anahtar === 'olcum') return { ad: s.halkaOlcum, deger: String(x.yapilan), pay: String(x.toplam), alt: x.tamam ? s.halkaAlt.tamam : s.halkaAlt.olcumKalan(x.eksik), altVurgu: x.tamam ? 'tamam' : null }
    return { ad: s.halkaHedef, deger: x.oran == null ? '' : `%${x.yapilan}`, alt: x.oran == null ? s.halkaAlt.hedefBekliyor : s.halkaAlt.hedef, altVurgu: null }
  })
}

/** One measurement: big last value, today's progress, a round + in the metric's colour. */
function OlcumKutusu({ k, s, ac }: { k: OlcumKarti; s: SaglikEviSozleri; ac: () => void }) {
  const renk = metrikRengi(k.tip)
  const tamam = k.gunlukHedef > 0 && k.bugunSayi >= k.gunlukHedef
  const su = k.tip === 'su'
  return (
    <button type="button" className={`sgb-olcum${tamam ? ' sgb-olcum--tamam' : ''}`} onClick={ac} aria-label={s.olcumEkleAria(k.ad)} style={{ ['--sgb-renk' as string]: renk }}>
      <span className="sgb-olcum-ad"><i />{k.ad}</span>
      {su ? (
        <span className="sgb-olcum-deger">{k.bugunSayi}<small>/ {k.gunlukHedef || 8} {k.birim}</small></span>
      ) : k.son ? (
        <span className="sgb-olcum-deger">{degerMetni({ tip: k.tip, deger: k.son.deger, deger2: k.son.deger2 })}<small>{k.birim}</small></span>
      ) : (
        <span className="sgb-olcum-deger sgb-olcum-deger--ilk">{s.hizliIlk}</span>
      )}
      <span className="sgb-olcum-alt">
        {tamam ? <span className="sgb-olcum-tamam"><Tik boyut={14} />{s.bugunTamam}</span> : <span>{k.son && !su ? onceMetni(Date.now() - Date.parse(k.son.olcumAt)) : s.hizliGunluk(k.bugunSayi, k.gunlukHedef)}</span>}
        {k.gunlukHedef > 0 && k.gunlukHedef <= 4 ? <span className="sgb-noktalar" aria-hidden>{Array.from({ length: k.gunlukHedef }, (_, i) => <i key={i} className={i < k.bugunSayi ? 'dolu' : ''} />)}</span> : null}
      </span>
      <span className="sgb-olcum-arti" aria-hidden><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
    </button>
  )
}

export function BugunGorunumu({ s, durum, eylemler, kopru, hastaAdi }: { s: SaglikEviSozleri; durum: GunlukDurum; eylemler: GunlukEylemleri; kopru: BugunKoprusu; hastaAdi: string | null }) {
  const [giris, setGiris] = useState<OlcumKarti | null>(null)
  const [soru, setSoru] = useState('')
  const [onaySonra, setOnaySonra] = useState(true)
  const [mesgul, setMesgul] = useState(false)
  useEffect(() => { try { setOnaySonra(Date.now() - Number(localStorage.getItem('sg-onay-sonra') || 0) < 7 * 86_400_000) } catch { setOnaySonra(false) } }, [])

  const simdiMs = Date.now()
  const ad = hastaAdi ? hastaAdi.split(' ')[0] : null
  const adim = siradakiAdim(durum, simdiMs)
  const eksik = eksikDozlar(durum)
  const halkalar = gunHalkalari(durum)
  const etiketler = halkaEtiketleri(s, halkalar)
  const yeniRozet = durum.rozetler.find((r) => r.yeni)
  const acikUyarilar = durum.uyarilar.filter((u) => !u.hastaGorduAt)
  const sonrakiRozet = useMemo(() => durum.rozetler.filter((r) => !r.kazanildi).sort((a, b) => b.deger / b.hedef - a.deger / a.hedef)[0], [durum.rozetler])
  const kazanilan = useMemo(() => durum.rozetler.filter((r) => r.kazanildi).sort((a, b) => Number(bugunKazanildiMi(b.kazanildiAt, durum.bugun) || b.yeni) - Number(bugunKazanildiMi(a.kazanildiAt, durum.bugun) || a.yeni) || (b.kazanildiAt || '').localeCompare(a.kazanildiAt || '')), [durum.rozetler, durum.bugun])
  const habit = durum.karne.hafta.dersler.filter((d) => d.anahtar !== 'hedef' && d.not)

  const doz = async (planIds: string[], at: string, d: 'alindi' | 'atlandi' | 'ertelendi') => {
    if (d === 'alindi') titret()
    setMesgul(true)
    try { await eylemler.doz(planIds, at, d) } finally { setMesgul(false) }
  }
  const olcumAc = (k: OlcumKarti) => (k.tip === 'su' ? (titret(), void eylemler.olcumEkle({ tip: 'su', deger: 1 })) : setGiris(k))

  // ── the one next step ──
  const siradaki = (
    <section className="sgb-siradaki" aria-live="polite" aria-labelledby="sgb-siradaki-b">
      {adim.tur === 'doz' ? (
        <div key={adim.at} className="sgb-siradaki-ic">
          <div className="sgb-siradaki-ust">
            <span id="sgb-siradaki-b" className="sgb-etiket"><i style={{ background: 'var(--sge-ilac)' }} />{s.siradakiIlac}</span>
            <span className={`sgb-zaman${adim.durum === 'zamani' ? ' sgb-zaman--simdi' : ''}`}>{adim.durum === 'ertelendi' ? s.ertelendiAlt : s.kalan(adim.kalanDk)}</span>
          </div>
          <p className="sgb-cumle"><span className="sgb-cumle-saat">{adim.saat}</span> — {adlarMetni(adim.adlar, s.ve)}</p>
          <button type="button" className="sgb-ana" disabled={mesgul} onClick={() => doz(adim.planIds, adim.at, 'alindi')}><Tik />{s.aldimGrup(adim.planIds.length)}</button>
          <div className="sgb-ikincil">
            <button type="button" disabled={mesgul} onClick={() => doz(adim.planIds, adim.at, 'ertelendi')}>{s.simdiErtele}</button>
            <button type="button" disabled={mesgul} onClick={() => doz(adim.planIds, adim.at, 'atlandi')}>{s.simdiAtladim}</button>
          </div>
        </div>
      ) : adim.tur === 'olcum' ? (
        <div key={`o-${adim.tip}`} className="sgb-siradaki-ic">
          <div className="sgb-siradaki-ust"><span id="sgb-siradaki-b" className="sgb-etiket"><i style={{ background: 'var(--sge-olcum)' }} />{s.siradakiOlcum}</span></div>
          <p className="sgb-cumle">{s.olcumCumle(adim.ad)}</p>
          <p className="sgb-cumle-alt">{s.olcumAlt(adim.yapilan, adim.hedef)}</p>
          <button type="button" className="sgb-ana" onClick={() => { const k = durum.olcumKartlari.find((x) => x.tip === adim.tip); if (k) setGiris(k) }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>{s.olcumGir}
          </button>
        </div>
      ) : (
        <div key={adim.tur} className="sgb-siradaki-ic sgb-siradaki-ic--tamam">
          <span className={`sgb-tamam-isaret${adim.tur === 'bos' ? ' sgb-tamam-isaret--bos' : ''}`} aria-hidden>{adim.tur === 'tamam' ? <Tik boyut={30} /> : <Ikon d="M12 6v6l4 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" boyut={28} />}</span>
          <div>
            <p id="sgb-siradaki-b" className="sgb-cumle">{adim.tur === 'tamam' ? s.planTamam : s.planBos}</p>
            <p className="sgb-cumle-alt">{adim.tur === 'tamam' ? s.planTamamAlt : s.planBosAlt}</p>
          </div>
        </div>
      )}
      {eksik.slice(0, 2).map((e) => (
        <div key={e.at} className="sgb-eksik">
          <span className="sgb-eksik-nokta" aria-hidden />
          <span className="sgb-eksik-metin"><b>{adlarMetni(e.adlar, s.ve)}</b><small>{s.eksik(e.saat)}</small></span>
          <button type="button" className="sgb-eksik-btn" disabled={mesgul} onClick={() => doz(e.planIds, e.at, 'alindi')}>{s.simdiAldim}</button>
        </div>
      ))}
    </section>
  )

  const olcumler = durum.olcumKartlari.length ? (
    <section className="sgb-bolum" aria-labelledby="sgb-olcum-b">
      <div className="sgb-bolum-bas"><h2 id="sgb-olcum-b">{s.olcumlerBaslik}</h2><Link href={kopru.gunlukHref}>{s.hizliHepsi}</Link></div>
      <div className="sgb-olcum-izgara">{durum.olcumKartlari.map((k) => <OlcumKutusu key={k.tip} k={k} s={s} ac={() => olcumAc(k)} />)}</div>
      {durum.ldl ? <p className="sgb-not">{s.ldl(durum.ldl.deger, durum.ldl.hedef, kisaTarih(durum.ldl.tarih))}</p> : null}
    </section>
  ) : null

  const dozlar = durum.bugunDozlar.length || durum.gerektikce.length ? (
    <section className="sgb-bolum" aria-labelledby="sgb-doz-b">
      <div className="sgb-bolum-bas"><h2 id="sgb-doz-b">{s.dozBaslik}</h2><Link href={kopru.dozHref}>{s.dozHepsi}</Link></div>
      <div className="sgb-kart sgb-kart--doz"><DozListesi s={s} durum={durum} eylemler={eylemler} /></div>
    </section>
  ) : null

  const seri = durum.seri
  return (
    <div className="sge sgb">
      <header className="sgb-ust">
        <div>
          <h1 className="sgb-selam">{s.selam(trDakika(simdiMs))}{ad ? `, ${ad}` : ''}</h1>
          <p className="sgb-tarih">{s.tarihKisa(durum.simdi)}</p>
        </div>
        {seri.seri > 0 ? <Link href={kopru.karneHref} className={`sgb-seri${seri.bugunAktif ? ' sgb-seri--aktif' : ''}`} aria-label={s.seriAria(seri.seri, seri.kalkan)}>
          <Alev aktif={seri.bugunAktif} />
          <b>{seri.seri}</b><small>{s.seriKisa}</small>
          {seri.kalkan ? <span className="sgb-seri-kalkan">{Array.from({ length: seri.kalkan }, (_, i) => <Kalkan key={i} boyut={13} />)}</span> : null}
        </Link> : null}
      </header>

      <div className="sgb-kahraman">
        {halkalar.length ? <GunHalkalari halkalar={halkalar} etiketler={etiketler} aria={s.halkaAria(etiketler.map((e) => `${e.ad} ${e.deger}${e.pay ? `/${e.pay}` : ''}`))} /> : null}
        {siradaki}
      </div>

      {!durum.tercihler.paylasimOnayi && !onaySonra ? (
        <OnayKarti s={s} kvkkHref={kopru.kvkkHref} onayla={async () => { await eylemler.tercih({ paylasimOnayi: true }) }} sonra={() => { try { localStorage.setItem('sg-onay-sonra', String(Date.now())) } catch { /* yok */ } setOnaySonra(true) }} />
      ) : null}

      {acikUyarilar.length ? (
        <section className="sgb-uyarilar" aria-label={s.uyariBaslik}>
          {acikUyarilar.map((u) => {
            const e = uyariEgilimi(u.metrik, durum.egilimler)
            const yon = e?.yon === 'yukari' || e?.yon === 'asagi' ? e.yon : null
            const [ilk, kalan] = ilkCumle(u.hastaMetni)
            const baslik = u.duzey !== 'acil' && yon && e ? s.uyariEgilim(kisaAd(e.anahtar), yon) : ilk
            const metin = baslik === ilk ? kalan || u.hastaMetni : u.hastaMetni
            return (
              <UyariKarti key={u.id} s={s} duzey={u.duzey} baslik={baslik} metin={metin} mesajHref={kopru.mesajHref} okudum={() => eylemler.uyariGoruldu([u.id])}>
                {e && e.hafta.n >= 3 ? <Egri e={e} renk={metrikRengi(e.anahtar)} genis aria={kisaAd(e.anahtar)} buHafta={s.buHafta} /> : null}
              </UyariKarti>
            )
          })}
        </section>
      ) : null}

      <div className="sgb-ikili">
        {durum.vurgu === 'olcum' ? <>{olcumler}{dozlar}</> : <>{dozlar}{olcumler}</>}
      </div>

      {durum.egilimler.length ? (
        <section className="sgb-bolum" aria-labelledby="sgb-egilim-b">
          <div className="sgb-bolum-bas"><h2 id="sgb-egilim-b">{s.egilimBaslik}</h2></div>
          <div className="sgb-egilim-izgara">
            {durum.egilimler.slice(0, 6).map((e) => {
              const kb = e.anahtar === 'kb'
              const renk = metrikRengi(e.anahtar)
              const od = OLCUM_TANIMLARI[metrikTipi(e.anahtar)]?.ondalik ?? 0
              const yuvarla = (v: number) => sayi(v, od)
              const ort = e.hafta.ort == null ? '—' : kb ? `${Math.round(e.hafta.ort)}/${Math.round(e.hafta.ort2 ?? 0)}` : yuvarla(e.hafta.ort)
              const onc = e.onceki.ort == null ? null : kb ? `${Math.round(e.onceki.ort)}/${Math.round(e.onceki.ort2 ?? 0)}` : yuvarla(e.onceki.ort)
              const az = e.gunluk.filter((g) => g.ort != null).length < 4
              const uyarili = acikUyarilar.some((u) => u.metrik === e.anahtar)
              return (
                <div key={e.anahtar} className="sgb-egilim" style={{ ['--sgb-renk' as string]: renk }}>
                  <span className="sgb-egilim-ad"><i />{kisaAd(e.anahtar)}</span>
                  <span className="sgb-egilim-deger">{ort}<small>{e.birim}</small></span>
                  <span className={`sgb-egilim-yon${uyarili && e.yon === 'yukari' ? ' sgb-egilim-yon--dikkat' : ''}`}>
                    {az ? s.egilimAz : (
                      <>
                        {e.yon ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d={e.yon === 'sabit' ? 'M2 6h8M7.5 3.5 10 6 7.5 8.5' : e.yon === 'yukari' ? 'M6 10V2M2.8 5.2 6 2l3.2 3.2' : 'M6 2v8M2.8 6.8 6 10l3.2-3.2'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                        {e.yon ? s.egilimYon[e.yon] : s.haftaOrt}{onc ? <span className="sgb-egilim-onc">{s.onceki2(onc)}</span> : null}
                      </>
                    )}
                  </span>
                  {az ? null : <Egri e={e} renk={renk} aria={kisaAd(e.anahtar)} />}
                </div>
              )
            })}
          </div>
        </section>
      ) : durum.olcumKartlari.length ? (
        <section className="sgb-bolum"><div className="sgb-bos">{s.egilimBos}</div></section>
      ) : null}

      <div className="sgb-ikili sgb-ikili--alt">
        <section className="sgb-bolum" aria-labelledby="sgb-karne-b">
          <div className="sgb-bolum-bas"><h2 id="sgb-karne-b">{s.karneBaslik}</h2><Link href={kopru.karneHref}>{s.karneGit}</Link></div>
          <div className="sgb-kart sgb-oyun">
            <div className="sgb-oyun-seri">
              <Alev aktif={seri.bugunAktif} boyut={34} />
              <div>
                <div className="sgb-oyun-sayi">{seri.seri}<small>{s.seriBuyuk}</small></div>
                <p className="sgb-oyun-alt">{seri.seri === 0 ? s.seriSifir : seri.bugunAktif ? s.seriBugunTamam : s.seriBugunBekliyor}</p>
              </div>
              <span className="sgb-oyun-kalkan" title={s.kalkanNot}>
                <span>{Array.from({ length: 2 }, (_, i) => <Kalkan key={i} boyut={18} dolu={i < seri.kalkan} />)}</span>
                <small>{s.kalkanSayi(seri.kalkan)}</small>
              </span>
            </div>
            <ol className="sgb-gunler" aria-hidden>
              {durum.son14.map((g) => (
                <li key={g.gun} className={g.aktif ? 'aktif' : g.kalkan ? 'kalkan' : g.gun === durum.bugun ? 'bugun' : ''}>
                  {g.kalkan && !g.aktif ? <Kalkan boyut={10} /> : null}
                  <span>{Number(g.gun.slice(8))}</span>
                </li>
              ))}
            </ol>
            {habit.length ? (
              <div className="sgb-dersler">
                <span className="sgb-dersler-b">{s.haftaDuzen}</span>
                <div>
                  {habit.map((d) => (
                    <span key={d.anahtar} className={`sgb-ders sgb-ders--${d.not!.puan}`}><span>{d.ad}</span><b>{d.not!.ad}</b>{d.yuzde != null && d.not!.puan >= 3 ? <small>%{d.yuzde}</small> : null}</span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="sgb-rozetler">
              {[...kazanilan.slice(0, sonrakiRozet ? 3 : 4), ...(sonrakiRozet ? [sonrakiRozet] : [])].map((r) => {
                const bugun = r.kazanildi && (r.yeni || bugunKazanildiMi(r.kazanildiAt, durum.bugun))
                return (
                  <Link key={r.id} href={kopru.karneHref} className={`sgb-rozet${r.kazanildi ? '' : ' sgb-rozet--kilitli'}${bugun ? ' sgb-rozet--yeni' : ''}`}>
                    <RozetSvg rozet={r} kilitli={!r.kazanildi} ilerleme={r.deger / r.hedef} />
                    <span className="sgb-rozet-ad">{r.ad}</span>
                    <span className="sgb-rozet-alt">{bugun ? s.rozetBugun : r.kazanildi ? (r.kazanildiAt ? kisaTarih(r.kazanildiAt) : '✓') : s.rozetIlerleme(r.deger, r.hedef)}</span>
                  </Link>
                )
              })}
            </div>
            {sonrakiRozet ? <p className="sgb-not">{s.rozetSonraki(sonrakiRozet.ad, sonrakiRozet.kosul)}</p> : null}
          </div>
        </section>

        <section className="sgb-bolum" aria-labelledby="sgb-kopru-b">
          <div className="sgb-bolum-bas"><h2 id="sgb-kopru-b">{s.kopruBaslik}</h2></div>
          <nav className="sgb-kart sgb-kopru" aria-labelledby="sgb-kopru-b">
            <Link href={kopru.randevuHref} className="sgb-kopru-s"><span className="sgb-kopru-ikon"><Ikon d="M7 3v3M17 3v3M4 8h16M5 5h14v15H5z" /></span><span className="sgb-kopru-m"><b>{s.randevu}</b><small>{kopru.randevu || s.randevuYok}</small></span></Link>
            <Link href={kopru.mesajHref} className="sgb-kopru-s"><span className="sgb-kopru-ikon"><Ikon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></span><span className="sgb-kopru-m"><b>{s.mesajlar}</b><small>{kopru.mesajSayisi ? s.mesajYeni(kopru.mesajSayisi) : s.mesajYok}</small></span>{kopru.mesajSayisi ? <span className="sgb-rozetsayi">{kopru.mesajSayisi}</span> : null}</Link>
            <Link href={kopru.sonZiyaret?.href || kopru.randevuHref} className="sgb-kopru-s"><span className="sgb-kopru-ikon"><Ikon d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" /></span><span className="sgb-kopru-m"><b>{s.sonZiyaret}</b><small>{kopru.sonZiyaret ? `${kopru.sonZiyaret.tarih} · ${kopru.sonZiyaret.baslik}` : s.ziyaretYok}</small></span></Link>
            <Link href={kopru.sonucHref} className="sgb-kopru-s"><span className="sgb-kopru-ikon"><Ikon d="M9 3v6L4 18a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3M8 3h8M7 14h10" /></span><span className="sgb-kopru-m"><b>{s.sonuclar}</b><small>{s.sonucSayisi(kopru.sonucSayisi)}</small></span></Link>
          </nav>
          <div className="sgb-kart sgb-soru">
            <label htmlFor="sgb-soru-i" className="sgb-soru-b">{s.soruBaslik}</label>
            {durum.sorular.length ? (
              <ul className="sgb-soru-liste">{durum.sorular.map((q) => <li key={q.id}><span>“{q.metin}”</span><button type="button" onClick={() => eylemler.soruSil(q.id)}>{s.soruSil}</button></li>)}</ul>
            ) : null}
            <form className="sgb-soru-form" onSubmit={async (e) => { e.preventDefault(); const m = soru.trim(); if (!m) return; const r = await eylemler.soru(m); if (r.ok) setSoru('') }}>
              <input id="sgb-soru-i" value={soru} onChange={(e) => setSoru(e.target.value)} placeholder={s.soruYer} maxLength={500} />
              <button type="submit" disabled={!soru.trim()}>{s.soruEkle}</button>
            </form>
            <p className="sgb-not">{s.soruNot}</p>
          </div>
        </section>
      </div>

      <p className="sgb-dip">{s.acilDegil} <Link href={kopru.tercihHref}>{s.tercihlerBaslik}</Link></p>

      {giris ? <OlcumGirisi kart={giris} s={s} eylemler={eylemler} kapat={() => setGiris(null)} /> : null}
      {yeniRozet ? <RozetAcilisi s={s} rozet={yeniRozet} tamam={() => eylemler.rozetGoruldu()} /> : null}
    </div>
  )
}
