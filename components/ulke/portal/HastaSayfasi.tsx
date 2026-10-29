'use client'

/**
 * AU-PORTAL-LOOK-01 (Kaan, 2026-10-24) — THE PATIENT'S PAGE IS TÜRKIYE'S "SAĞLIĞIM": the same frame, overview, visits, messages
 * and appointment views (components/doktor/portal/*), fed with this country's data and the pack's words. This file holds
 * no markup of its own except the appointment request (built from the shared chips and cards) and the footer.
 *
 *   Overview     the welcome hero with the doctor's card, four chips, shortcuts and recent activity
 *   Messages     the doctor's conversations, the reply box (a patient cannot start one), "not for emergencies" ALWAYS above
 *   Visits       the summaries the doctor shared, one page each
 *   Appointments the coming appointments and the request for days that suit the patient
 *   Privacy      the collection notice, consent and access/correction requests (where the pack brings them)
 *   My form      the intake form (where one is waiting or was sent)
 *
 * Only what the patient's own page already had is shown: there is no results, medicines or growth data on this page yet
 * (docs/OPEN-COMMITMENTS.md AU-PORTAL-DATA-01). NOT THE DOCTOR'S APPLICATION: nothing of the signed-in application is imported.
 */
import React, { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { PortalKabukGorunumu } from '@/components/doktor/portal/PortalKabukGorunumu'
import { PortalOzetGorunumu, type PortalAktivite, type PortalCip, type PortalKisayol } from '@/components/doktor/portal/PortalOzetGorunumu'
import { PortalZiyaretDetayGorunumu, PortalZiyaretListesiGorunumu, PortalZiyaretYokGorunumu } from '@/components/doktor/portal/PortalZiyaretlerGorunumu'
import { PortalMesajlarGorunumu, type PortalMesajKonusuG, type PortalMesajSonucu } from '@/components/doktor/portal/PortalMesajlarGorunumu'
import { PortalRandevuBasligi, PortalRandevuKarti, PortalSecimSirasi } from '@/components/doktor/portal/PortalRandevuGorunumu'
import { SoftPanel } from '@/components/doktor/portal/ui'
import { doktorBasHarfleri } from '@/lib/doktor/avatar'
import { CHROME_FONT, CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { formMetni, gunAdi, marka, mesajMetni, type MesajMetni, type PortalMetni, type RandevuMetni } from '@/lib/ulke/arayuz'
import { saatGoster, saatYaz, tarihDeseni, tarihYaz, varsayilanSaatDilimi } from '@/lib/ulke/arayuz/bicim'
import { gunYazDesenle, haftaGunu } from '@/lib/ulke/uygulama/zaman'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { ISTEK_GUN_AZAMI, ISTEK_NEDEN_AZAMI } from '@/lib/ulke/portal/sabitler'
import type { PortalIcerigi } from '@/lib/ulke/portal/tipler'
import { MESAJ_AZAMI, mesajMetniAl, type HastaMesajGorunumu } from '@/lib/ulke/mesaj/sabitler'
import { ozellikAcik, ulkePaketi } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'
import { okunmamisSayisi, sonMesajAni } from '../mesajOrtak'
import { PortalFormKarti, PortalFormu, type PortalIstegi } from './HastaFormu'
import { PortalGizlilikKarti } from './GizlilikKarti'
import { PortalBeslenmeKarti } from './BeslenmeKarti'

/** A day with its weekday where the country has appointments, in the pack's own pattern (the day is always written in full). */
export const portalGunu = (r: RandevuMetni | null, gun: string, uzun = true): string => {
  const yazi = gunYazDesenle(gun, tarihDeseni())
  return r ? `${gunAdi(r, haftaGunu(gun), uzun)}${uzun ? ',' : ''} ${yazi}` : yazi
}

export type Sekme = 'ozet' | 'mesajlar' | 'ziyaretler' | 'randevu' | 'beslenme' | 'gizlilik' | 'form'
export type IstekFormu = { gunler: string[]; neden: string }
export type IstekHatasi = 'gun' | 'cok' | 'gonderilemedi' | 'baglanti' | null

const UZA: CSSProperties = {
  '--uza-krem': R.cream, '--uza-kagit': R.paper, '--uza-murekkep': R.ink, '--uza-soluk': R.muted, '--uza-cam': R.pine,
  '--uza-uyari': R.warn, '--uza-cizgi': R.border, '--uza-altin': R.gold, '--uza-serif': CHROME_FONT.serif, '--uza-sans': CHROME_FONT.sans,
  background: 'transparent', minHeight: 0,
} as CSSProperties

/** The patient's older cards (privacy, intake form) keep their own look inside the page until they are converted. */
const Eski = ({ dil, children }: { dil: DilKodu; children: ReactNode }) => <div className="uza" lang={dil} style={UZA}>{children}</div>

const GIT = '#'
const href = (s: Sekme, id?: string) => `${GIT}${s}${id ? `/${id}` : ''}`

/** The day in the doctor's zone as YYYY-MM-DD, `ekGun` days from today. */
function gunDizesi(tz: string, ekGun = 0): string {
  const d = new Date(Date.now() + ekGun * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/** The messages of the page, loaded once and shared by the overview chip and the messages tab. */
function useMesajlar(acik: boolean, iste: PortalIstegi, oturumBitti: () => void) {
  const [g, setG] = useState<HastaMesajGorunumu | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const okunan = useRef('')
  const yukle = useCallback(async () => {
    const r = await iste('/mesaj')
    if (r.status === 401) { oturumBitti(); return }
    if (r.status !== 200 || !Array.isArray(r.j.yazismalar)) { setYuklenemedi(true); return }
    setG(r.j as unknown as HastaMesajGorunumu); setYuklenemedi(false)
  }, [iste, oturumBitti])
  useEffect(() => { if (acik) yukle().catch(() => setYuklenemedi(true)) }, [acik, yukle])
  /** "Read up to the newest message shown": the server marks nothing newer. */
  const oku = useCallback((id: string) => {
    if (!g) return
    const y = g.yazismalar.filter((e) => e.id === id)
    const son = sonMesajAni(y)
    if (!son || son === okunan.current) return
    okunan.current = son
    setG((eski) => (eski ? { ...eski, yazismalar: eski.yazismalar.map((e) => (e.id === id ? { ...e, mesajlar: e.mesajlar.map((m) => (m.gonderen === 'hekim' && m.an <= son ? { ...m, okundu: m.okundu ?? new Date().toISOString() } : m)) } : e)) } : eski))
    void iste('/mesaj', { kadar: son }, 'PUT').catch(() => { okunan.current = '' })
  }, [g, iste])
  return { g, yuklenemedi, yukle, oku }
}

export function PortalHastaSayfasi({ dil, p, r, icerik, acilNumara, iste, yenile, cikis, form, setForm, istekGonder, istekBekliyor, istekHatasi }: {
  dil: DilKodu
  p: PortalMetni
  /** The appointment catalogue in the same form, or null where the country has no appointments. */
  r: RandevuMetni | null
  icerik: PortalIcerigi
  acilNumara: string | null
  iste: PortalIstegi
  /** Reads the page again (a request was sent; the session ended). */
  yenile: () => void
  cikis: () => void
  form: IstekFormu; setForm: (y: IstekFormu) => void; istekGonder: (e: FormEvent) => void; istekBekliyor: boolean; istekHatasi: IstekHatasi
}) {
  const g = p.gorunum
  const s = p.sayfa
  const x: MesajMetni['hasta'] = mesajMetni(dil).hasta
  const [sekme, setSekme] = useState<Sekme>('ozet')
  const [ziyaret, setZiyaret] = useState<string | null>(null)
  const [formAcik, setFormAcik] = useState(false)
  const i = icerik
  const tz = i.saatDilimi || varsayilanSaatDilimi()
  const mesajVar = ozellikAcik('hastaMesajlari')
  const gizlilikVar = Boolean(ulkePaketi().uzanti?.gizlilik)
  const randevuVar = Boolean(r && (i.randevular || i.istek))
  const mesajlar = useMesajlar(mesajVar, iste, yenile)

  const gunYaz = (gun: string) => portalGunu(r, gun)

  const git = useCallback((h: string) => {
    const [, ham] = h.split('#')
    const [k, id] = (ham ?? 'ozet').split('/')
    if (k === 'ziyaretler' && id) { setSekme('ziyaretler'); setZiyaret(id) } else { setSekme((k as Sekme) || 'ozet'); setZiyaret(null) }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }, [])

  const okunmamis = mesajlar.g ? okunmamisSayisi(mesajlar.g.yazismalar, 'hasta') : 0
  const sonrakiRandevu = i.randevular?.[0] ?? null

  const beslenmeVar = Boolean(i.beslenme)
  const nav: Array<{ key: Sekme; label: string }> = [
    { key: 'ozet', label: g.sekmeOzet },
    ...(mesajVar ? [{ key: 'mesajlar' as const, label: g.sekmeMesajlar }] : []),
    { key: 'ziyaretler', label: g.sekmeZiyaretler },
    ...(randevuVar ? [{ key: 'randevu' as const, label: g.sekmeRandevu }] : []),
    ...(beslenmeVar ? [{ key: 'beslenme' as const, label: i.beslenme!.etiket.sekmeBaslik }] : []),
    ...(gizlilikVar ? [{ key: 'gizlilik' as const, label: g.sekmeGizlilik }] : []),
    ...(i.form ? [{ key: 'form' as const, label: g.sekmeForm }] : []),
  ]

  const altBilgi = (
    <>
      <p style={{ margin: '0 0 10px' }} data-alan="portal-acil" data-acil-numara={acilNumara ?? undefined}>{s.acil}{acilNumara ? ` ${yerine(s.acilNumara, acilNumara)}` : ''}</p>
      <p style={{ margin: '0 0 10px' }}>{s.yalniz}</p>
      <p style={{ margin: '0 0 10px', opacity: 0.85 }}>{p.giris.gizlilik}</p>
      <p style={{ margin: 0 }}><button type="button" className="sg-chip-btn" onClick={cikis} data-eylem="portal-cikis">{s.cikis}</button></p>
    </>
  )

  // ── overview ──
  const bugun = gunDizesi(tz)
  const yarin = gunDizesi(tz, 1)
  const yaklasan = sonrakiRandevu && (sonrakiRandevu.gun === bugun || sonrakiRandevu.gun === yarin) ? sonrakiRandevu : null
  const istekSon = i.istek?.son ?? null
  const bEtiket = i.beslenme?.etiket
  const sonGunluk = i.beslenme?.gunluk[0]
  const cipler: PortalCip[] = [
    { key: 'randevu', label: g.cipRandevu, value: sonrakiRandevu ? `${gunYaz(sonrakiRandevu.gun)} · ${saatGoster(sonrakiRandevu.saat)}` : g.cipRandevuYok, href: href('randevu'), vurgu: false, testId: 'chip-randevu' },
    ...(mesajVar ? [{ key: 'mesaj', label: g.cipMesaj, value: okunmamis > 0 ? g.cipYeniMesaj : g.cipMesajYok, href: href('mesajlar'), vurgu: okunmamis > 0, yeniAlt: yerine(g.cipOkunmamis, okunmamis), testId: 'chip-mesaj' }] : []),
    { key: 'ozet', label: g.cipOzet, value: i.ozetler.length ? String(i.ozetler.length) : g.cipOzetYok, href: href('ziyaretler'), vurgu: false },
    ...(i.istek ? [{ key: 'istek', label: g.cipIstek, value: istekSon?.durum === 'bekliyor' ? g.cipIstekBekliyor : g.cipIstekYok, href: href('randevu'), vurgu: false }] : []),
    ...(i.beslenme && bEtiket ? [
      { key: 'plan', label: bEtiket.cipPlan, value: i.beslenme.plan ? gunYaz(i.beslenme.plan.gun) : bEtiket.cipPlanYok, href: href('beslenme'), vurgu: false, testId: 'chip-meal-plan' },
      { key: 'gunluk', label: bEtiket.cipGunluk, value: sonGunluk ? gunYaz(sonGunluk.gun) : bEtiket.cipGunlukYok, href: href('beslenme'), vurgu: false, testId: 'chip-food-diary' },
      { key: 'hedef', label: bEtiket.cipHedef, value: i.beslenme.hedefler.length ? String(i.beslenme.hedefler.length) : bEtiket.cipHedefYok, href: href('beslenme'), vurgu: false, testId: 'chip-nutrition-goals' },
    ] : []),
  ]
  const kisayollar: PortalKisayol[] = nav.filter((o) => o.key !== 'ozet').map((o) => ({
    label: o.label, href: href(o.key),
    hint: o.key === 'mesajlar' ? g.ipucuMesajlar : o.key === 'ziyaretler' ? g.ipucuZiyaretler : o.key === 'randevu' ? g.ipucuRandevu : o.key === 'beslenme' ? (bEtiket?.mesajIpucu ?? g.ipucuForm) : o.key === 'gizlilik' ? g.ipucuGizlilik : g.ipucuForm,
  }))
  const aktiviteler: PortalAktivite[] = i.ozetler.slice(0, 5).map((o) => ({ id: o.id, baslik: yerine(s.muayene, gunYaz(o.gun)), tarih: gunYaz(o.gun), href: href('ziyaretler', o.id) }))
  const bolumEk = i.bolum ? {
    baslik: i.bolum.baslik,
    icerik: (
      <div data-alan="portal-bolum" data-bolum={i.bolum.anahtar}>
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, color: 'var(--sg-ink)', lineHeight: 1.55 }}>
          {i.bolum.satirlar.map((satir, idx) => <li key={idx}>{satir}</li>)}
        </ul>
        {i.bolum.tarihler.length ? (
          <div data-alan="portal-bolum-tarihler">
            <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--sg-muted)' }}>{i.bolum.tarihEtiket}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {i.bolum.tarihler.slice(0, 4).map((t) => (
                <li key={t.gun} data-durum={t.durum}>{gunYaz(t.gun)} · {i.bolum!.durumEtiket[t.durum]}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    ),
  } : null

  const hekimAdi = i.hekim.ad
  let icerikEkrani: ReactNode
  if (sekme === 'mesajlar' && mesajVar) {
    const yz = mesajlar.g?.yazismalar ?? []
    const konular: PortalMesajKonusuG[] = yz.map((y) => {
      const son = y.mesajlar[y.mesajlar.length - 1]
      return {
        id: y.id, klasor: y.kapandi ? 'arsiv' : 'gelen', konu: hekimAdi, gonderen: tarihYaz(y.olusturuldu, tz), ozet: (son?.metin ?? '').replace(/\s+/g, ' ').slice(0, 90),
        tarih: son ? `${tarihYaz(son.an, tz)} ${saatYaz(son.an, tz)}` : '', okundu: !y.mesajlar.some((m) => m.gonderen === 'hekim' && !m.okundu),
        mesajlar: y.mesajlar.map((m) => ({ id: m.id, kimden: m.gonderen === 'hekim' ? `${x.hekim}` : x.siz, metin: m.metin, tarih: `${tarihYaz(m.an, tz)} ${saatYaz(m.an, tz)}`, taraf: m.gonderen === 'hekim' ? 'doktor' as const : 'hasta' as const })),
        yanitlayabilir: !y.kapandi && Boolean(mesajlar.g?.yazabilir),
        yanitYokNotu: x.kapali,
      }
    })
    const gonder = async (gv: { metin: string }): Promise<PortalMesajSonucu> => {
      const temiz = mesajMetniAl(gv.metin)
      if (!temiz) return x.bosMesaj
      if (temiz.length > MESAJ_AZAMI) return yerine(x.cokUzun, MESAJ_AZAMI)
      try {
        const rr = await iste('/mesaj', { metin: temiz })
        if (rr.status === 200) { await mesajlar.yukle(); return null }
        if (rr.status === 401) { yenile(); return null }
        if (rr.j.code === 'KAPALI') { await mesajlar.yukle(); return x.kapali }
        return rr.j.code === 'BOS' ? x.bosMesaj : rr.j.code === 'UZUN' ? yerine(x.cokUzun, MESAJ_AZAMI) : rr.j.code === 'LIMIT' ? x.limit : x.gonderilemedi
      } catch { return x.gonderilemedi }
    }
    icerikEkrani = (
      <section data-alan="portal-mesajlar" data-okunmamis={mesajlar.g ? okunmamis : undefined} data-yazabilir={mesajlar.g ? (mesajlar.g.yazabilir ? 'evet' : 'hayir') : undefined}>
        <PortalMesajlarGorunumu
          s={{
            baslik: x.baslik, altBaslik: x.aciklama, yeniMesaj: x.yeniMesaj, konuYer: '', mesajYer: x.mesajYer, dosyaEkle: '', ekBilgi: '', kaldir: '', uyari: x.yanitSuresi,
            gonder: x.gonder, gonderiliyor: x.gonderiliyor, vazgec: x.vazgec, bosBaslik: g.mesajBosBaslik, bosGovdeYazilabilir: x.bos, bosGovdeSalt: x.kapali,
            klasorler: [{ key: 'gelen', label: g.mesajKlasorAcik }, { key: 'arsiv', label: g.mesajKlasorKapali }], klasorBos: g.mesajKlasorBos,
            geri: g.mesajGeri, yanitYer: x.yaz, yanitla: x.gonder, sec: g.mesajSec, yanitYokNotu: x.kapali, ac: '',
          }}
          ust={(
            <>
              <p className="uza-uyari-kutu" role="note" data-alan="mesaj-acil" data-acil-numara={acilNumara ?? undefined} style={{ margin: '0 0 12px', padding: '12px 14px', borderRadius: 14, background: '#fff6e8', border: '1px solid #f0d9ae', color: R.ink, fontSize: 14, lineHeight: 1.5 }}>{x.acil}{acilNumara ? ` ${yerine(x.acilNumara, acilNumara)}` : ''}</p>
              {!mesajlar.g && mesajlar.yuklenemedi ? <p role="alert" style={{ color: 'var(--sg-danger)' }}>{x.yuklenemedi}</p> : null}
            </>
          )}
          mesajlar={konular}
          yanitlayabilir={Boolean(mesajlar.g?.yazabilir)}
          yeniMesajAcik={Boolean(mesajlar.g?.yazabilir)}
          ekler={false}
          onOku={(id) => mesajlar.oku(id)}
          onGonder={gonder}
        />
      </section>
    )
  } else if (sekme === 'ziyaretler') {
    const o = ziyaret ? i.ozetler.find((e) => e.id === ziyaret) ?? null : null
    icerikEkrani = ziyaret ? (
      o ? (
        <PortalZiyaretDetayGorunumu geriHref={href('ziyaretler')} geriEtiket={g.geriZiyaretler} baslik={g.ziyaretDetay} altBaslik={`${gunYaz(o.gun)} · ${hekimAdi}`}
          vitaller={null} bloklar={[{ label: g.ozetBlok, text: o.metin }]} ilac={null} git={git} />
      ) : (
        <PortalZiyaretYokGorunumu baslik={{ ust: g.ziyaretDetay, bos: g.ziyaretBosBaslik }} govde={g.ziyaretYokGovde} geriHref={href('ziyaretler')} geriEtiket={g.geriZiyaretler} git={git} />
      )
    ) : (
      <PortalZiyaretListesiGorunumu baslik={g.ziyaretBaslik} altBaslik={g.ziyaretAlt} bos={{ baslik: g.ziyaretBosBaslik, govde: g.ziyaretBosGovde }} git={git}
        satirlar={i.ozetler.map((o) => ({ id: o.id, href: href('ziyaretler', o.id), meta: gunYaz(o.gun), baslik: `${yerine(s.muayene, gunYaz(o.gun))} · ${hekimAdi}`, detay: o.metin.replace(/\s+/g, ' ').slice(0, 110), rozet: <span style={{ color: 'var(--sg-accent)', fontWeight: 700 }}>{g.ozetRozet}</span> }))} />
    )
  } else if (sekme === 'randevu' && randevuVar && r) {
    const kabul = istekSon?.durum === 'kabul' && istekSon.randevu && (i.randevular ?? []).some((e) => e.gun === istekSon.randevu?.gun && e.saat === istekSon.randevu?.saat) ? istekSon.randevu : null
    const hataMetni = istekHatasi === 'gun' ? s.istekGunGerekli : istekHatasi === 'cok' ? yerine(s.istekCokGun, ISTEK_GUN_AZAMI) : istekHatasi === 'baglanti' ? p.giris.baglanti : istekHatasi === 'gonderilemedi' ? s.istekGonderilemedi : null
    const bilgi = istekSon?.durum === 'bekliyor' ? s.istekBekliyor : kabul ? yerine(s.istekKabul, gunYaz(kabul.gun), saatGoster(kabul.saat)) : istekSon?.durum === 'red' ? s.istekRed : null
    icerikEkrani = (
      <div className="sg-fade" data-alan="portal-randevular">
        <PortalRandevuBasligi baslik={g.randevuBaslik} altBaslik={g.randevuAlt} bilgi={bilgi} hata={hataMetni} />
        {i.istek && istekSon?.durum !== 'bekliyor' ? (
          <form onSubmit={istekGonder} noValidate data-alan="portal-istek" data-istek-durumu={istekSon?.durum ?? 'yok'}>
            <SoftPanel style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', color: 'var(--sg-muted)' }}>{yerine(s.istekAciklama, ISTEK_GUN_AZAMI)}</p>
              <PortalSecimSirasi etiket={g.randevuGun} secili={form.gunler} kapali={istekBekliyor}
                secenekler={i.istek.gunler.map((d) => ({ key: d, label: gunYaz(d) }))}
                onSec={(d) => setForm({ ...form, gunler: form.gunler.includes(d) ? form.gunler.filter((e) => e !== d) : [...form.gunler, d].sort() })} />
              <label htmlFor="uzp-neden" style={{ display: 'block', margin: '6px 0', fontSize: 13, color: 'var(--sg-muted)' }}>{s.istekNeden}</label>
              <input id="uzp-neden" name="neden" className="sg-field" maxLength={ISTEK_NEDEN_AZAMI} value={form.neden} onChange={(e) => setForm({ ...form, neden: e.target.value })} />
              <button type="submit" className="sg-chip-btn is-active" style={{ marginTop: 12 }} disabled={istekBekliyor} data-eylem="portal-istek">{istekBekliyor ? s.istekGonderiliyor : s.istekGonder}</button>
            </SoftPanel>
          </form>
        ) : istekSon?.durum === 'bekliyor' ? (
          <SoftPanel style={{ marginBottom: 16 }}><p style={{ margin: 0, color: 'var(--sg-muted)' }}>{yerine(s.istekGunler, istekSon.gunler.map((d) => gunYaz(d)).join('; '))}</p></SoftPanel>
        ) : null}
        <h2 className="sg-display" style={{ fontSize: 20, margin: '8px 0 10px' }}>{s.randevular}</h2>
        {!(i.randevular ?? []).length ? <p style={{ color: 'var(--sg-muted)' }}>{s.randevuYok}</p> : (i.randevular ?? []).map((e) => (
          <div key={`${e.gun} ${e.saat}`} data-randevu-gun={e.gun}>
            <PortalRandevuKarti zaman={`${gunYaz(e.gun)} · ${saatGoster(e.saat)}`} etiket={`${e.sureDk} ${r.form.dakika}`} />
          </div>
        ))}
        {i.saatDilimi && s.saatDilimi ? <p style={{ color: 'var(--sg-muted)', fontSize: 13 }}>{yerine(s.saatDilimi, i.saatDilimi.replace(/_/g, ' '))}</p> : null}
      </div>
    )
  } else if (sekme === 'beslenme' && i.beslenme) {
    icerikEkrani = (
      <Eski dil={dil}>
        <PortalBeslenmeKarti
          beslenme={i.beslenme}
          mesajaGit={mesajVar ? () => git(href('mesajlar')) : undefined}
          kaydet={async (girdi) => {
            try {
              const rr = await iste('/beslenme', girdi)
              if (rr.status === 200) { yenile(); return true }
              if (rr.status === 401) { yenile(); return false }
              return false
            } catch { return false }
          }}
        />
      </Eski>
    )
  } else if (sekme === 'gizlilik' && gizlilikVar) {
    icerikEkrani = <Eski dil={dil}><PortalGizlilikKarti iste={iste} oturumBitti={yenile} /></Eski>
  } else if (sekme === 'form' && i.form) {
    icerikEkrani = <Eski dil={dil}>{formAcik
      ? <PortalFormu dil={dil} iste={iste} kapat={() => { setFormAcik(false); yenile() }} oturumBitti={yenile} />
      : <PortalFormKarti f={formMetni(dil)} ozet={i.form} ac={() => setFormAcik(true)} />}</Eski>
  } else {
    icerikEkrani = (
      <PortalOzetGorunumu
        s={{
          karsilamaAria: g.urun, markaAria: g.urun, marka: marka(), urun: g.urun, hastaEtiketi: g.hastaEtiketi, lede: g.lede, ctaEtiket: g.mesajaGit,
          hekimEtiketi: s.hekim, hekimAria: s.hekim, hekimBos: g.hekimBos, kisayolBaslik: g.kisayolBaslik, aktiviteBaslik: g.aktiviteBaslik, aktiviteBos: g.aktiviteBos, aktiviteAc: g.ac,
        }}
        hastaAdi={i.hasta.ad}
        ctaHref={href(mesajVar ? 'mesajlar' : 'ziyaretler')}
        kutucuk={{ baslik: g.koruyucu, href: null }}
        hekim={{ ad: hekimAdi, altSatir: i.hekim.rol, adres: null, telefon: null, telefonHref: null, avatarUrl: null, harfler: doktorBasHarfleri(hekimAdi) }}
        uyari={yaklasan ? { baslik: g.uyariBaslik, metin: yerine(g.uyariMetin, `${gunYaz(yaklasan.gun)} ${saatGoster(yaklasan.saat)}`), href: href('randevu'), cta: g.ayrinti } : null}
        cipler={cipler} ekBolum={bolumEk} kisayollar={kisayollar} aktiviteler={aktiviteler} git={git}
      />
    )
  }

  return (
    <PortalKabukGorunumu marka={marka()} urun={g.urun} anaHref={href('ozet')} hastaAdi={i.hasta.ad} hastaAlani={g.hastaAlani} navEtiketi={g.navEtiketi}
      nav={nav.map((o) => ({ key: o.key, label: o.label, href: href(o.key), aktif: o.key === sekme }))} altBilgi={altBilgi} git={git}>
      <div data-alan="portal-sayfasi-icerik" data-sekme={sekme}>{icerikEkrani}</div>
    </PortalKabukGorunumu>
  )
}
