/**
 * HASTA-PORTALI-GUNLUK — composes the patient's "Bugün" state (rings, dial, doses, quick-add tiles, trends, streak,
 * badges, karne) from raw rows, and the doctor's Kontrol Öncesi Özet. Pure: the server route, the doctor's preview and
 * the demo all run the same function, so the three can never disagree.
 */
import type { DozKaydi, DozPlani, EvOlcum, EvTercihler, EvUyari, GlukozBaglami, GunlukOlcum, IsaretliOlcum, KayitTutma, DozSecimi, OlcumIsareti, OlcumTipi, SlotDurumu, UyariDuzeyi } from './tipler'
import type { BransGunlukAyari, GunlukKarti } from './bransAyari'
import { hastaModulleri, type KlinikGirdi, type ModulAnahtari } from './moduller'
import type { EsikSeti, HedefProfili, HekimAyarlari } from './hedefler'
import { etkinEsikler, hedefMetni, hedefteMi } from './hedefler'
import { metrikAnahtari, metrikEtiketi, OLCUM_TANIMLARI, onerilenBaglam } from './olcumler'
import { bugunPlani, gerektikceDurumu, gunSlotlari, kayitAcikMi, kayitHaritasi, planUyumlari, slotDurumu, uyum, type UyumSonucu } from './dozPlani'
import { kayitSorusuGosterilsinMi, kayitTercihiUygula } from './dozKaydi'
import { seriHesapla, type SeriSonucu } from './seri'
import { ROZETLER, rozetDurumlari, type RozetDurumu, type RozetId, type RozetTanimi } from './rozetler'
import { karneHesapla, type Karne } from './karne'
import { olcumSeviyesi, pencere } from './kurallar'
import { gunEkle, trDakika, trGun } from './zaman'

export interface HamGunluk {
  simdi: string
  bransAnahtar: string
  ayar: BransGunlukAyari
  hekimAyar: HekimAyarlari | null
  profil: HedefProfili
  olcumler: EvOlcum[]
  /** EV-ACIL-SEKER: HI / LO glucometer flags (never in a numeric computation). */
  isaretliOlcumler?: IsaretliOlcum[]
  toplamOlcum: number
  fotoOlcum: number
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  uyarilar: EvUyari[]
  kazanilanRozetler: Array<{ rozet: string; kazanildiAt: string; hastaGorduAt: string | null }>
  tercihler: EvTercihler
  ldl: { deger: number; tarih: string } | null
  sorular: Array<{ id: string; metin: string; createdAt: string }>
  /** HASTA-MODULLERI: what the patient file says (chronic list, ICD-10 of approved notes, active approved drugs). */
  klinik?: KlinikGirdi | null
}

/** Patient-facing module list (Tercihler). Never carries a diagnosis or drug name — only "your doctor follows this". */
export interface GunlukModulleri {
  aktif: Array<{ anahtar: ModulAnahtari; tur: 'olcum' | 'kart'; hekimTakip: boolean; hastaKapatabilir: boolean; gunlukHedef: number }>
  eklenebilir: OlcumTipi[]
  hastaKapatti: ModulAnahtari[]
}

export interface OlcumKarti {
  tip: OlcumTipi
  ad: string
  birim: string
  /** Latest entry: a number, or (glucose) a HI / LO flag with deger null. `seviye` = its clinical level (colour + word). */
  son: { deger: number | null; deger2: number | null; baglam: GlukozBaglami | null; olcumAt: string; isaret?: OlcumIsareti; seviye: Exclude<UyariDuzeyi, 'bilgi'> | null } | null
  onDeger: number
  onDeger2: number | null
  onBaglam: GlukozBaglami | null
  bugunSayi: number
  gunlukHedef: number
  hedef: string | null
}

export interface Egilim {
  anahtar: string
  etiket: string
  birim: string
  hafta: { ort: number | null; ort2: number | null; n: number }
  onceki: { ort: number | null; ort2: number | null; n: number }
  /** isaret: a HI / LO flag that day (glucose) — drawn as an off-scale marker, never as a number. */
  gunluk: Array<{ gun: string; ort: number | null; ort2: number | null; isaret?: OlcumIsareti }>
  hedefMetni: string | null
  hedefMin: number | null
  hedefMax: number | null
  yon: 'yukari' | 'asagi' | 'sabit' | null
}

export type GunlukRozet = RozetTanimi & RozetDurumu & { kazanildiAt: string | null; yeni: boolean }

export interface GunlukDurum {
  simdi: string
  bugun: string
  brans: string
  vurgu: 'olcum' | 'uyum'
  kartlar: GunlukKarti[]
  olcumKartlari: OlcumKarti[]
  bugunDozlar: ReturnType<typeof bugunPlani>
  gerektikce: ReturnType<typeof gerektikceDurumu>
  planlar: DozPlani[]
  halkalar: { ilac: { yapilan: number; toplam: number }; olcum: { yapilan: number; toplam: number }; hedef: { yuzde: number | null; n: number } }
  /** Dial markers: minute of day + what it is. */
  kadran: Array<{ dakika: number; tur: 'doz' | 'olcum'; durum: 'tamam' | 'bekliyor' | 'kacti'; etiket: string }>
  seri: SeriSonucu
  son14: Array<{ gun: string; aktif: boolean; kalkan: boolean }>
  egilimler: Egilim[]
  /** kural → colour family (UYARI-RENKLERI: adherence vs clinical); sekerAcil / keton → the acil glucose symptom check. */
  uyarilar: Array<Pick<EvUyari, 'id' | 'duzey' | 'metrik' | 'hastaMetni' | 'olusturmaAt' | 'hastaGorduAt'> & { kural?: string; sekerAcil?: 'yuksek' | 'dusuk'; keton?: boolean }>
  rozetler: GunlukRozet[]
  /** Badges whose condition is met but are not stored yet (the server stores them). */
  yeniKazanilan: RozetId[]
  karne: { hafta: Karne; ay: Karne }
  uyum7: UyumSonucu
  uyum30: UyumSonucu
  tercihler: EvTercihler
  ldl: { deger: number; tarih: string; hedef: number | null } | null
  moduller: GunlukModulleri
  sorular: HamGunluk['sorular']
  /** kayitPlanIds: the medicines of this group the patient logs (the "Aldım" button marks only these; none → reminder
   *  only, no button). */
  siradaki: { tur: 'doz'; saat: string; at: string; planIds: string[]; adlar: string[]; kayitPlanIds: string[] } | null
  /** DOZ-KAYDI-ISTEGE-BAGLI: the one-time answer, whether to ask it now, how many scheduled medicines are logged. */
  kayit: { tercih: KayitTutma | null; secim: DozSecimi | null; hatirlatmaAcik: boolean; soruGoster: boolean; kayitliIlac: number; planliIlac: number }
  esikler: Record<string, EsikSeti>
  /** Latest readings, newest first (Günlük list) — numeric readings and HI / LO flags. */
  sonOlcumler: GunlukOlcum[]
  /** EV-ACIL-SEKER: HI / LO flags of the last 90 days. */
  isaretliOlcumler: IsaretliOlcum[]
  /** Last 7 days × active scheduled plan: each slot's state (Doz Takvimi week grid). */
  hafta: { gunler: string[]; planlar: Array<{ planId: string; ad: string; gunler: SlotDurumu[][] }> }
}

/** Days with any log: a reading (a HI / LO flag included), or a dose taken. */
export function aktifGunler(olcumler: Array<Pick<GunlukOlcum, 'olcumAt'>>, kayitlar: DozKaydi[]): Set<string> {
  const s = new Set<string>()
  for (const o of olcumler) s.add(trGun(o.olcumAt))
  for (const k of kayitlar) if (k.durum === 'alindi') s.add(trGun(k.kayitAt))
  return s
}

/** EV-ACIL-SEKER: a HI / LO flag of this metric key on this day (HI wins when both — the more urgent off-scale end). */
export function gunIsareti(isaretli: IsaretliOlcum[], anahtar: string, gun: string): { isaret?: OlcumIsareti } {
  const o = isaretli.filter((x) => metrikAnahtari(x) === anahtar && trGun(x.olcumAt) === gun)
  if (!o.length) return {}
  return { isaret: o.some((x) => x.isaret === 'hi') ? 'hi' : 'lo' }
}

export function gunlukOzeti(h: HamGunluk): GunlukDurum {
  const simdi = h.simdi
  const bugun = trGun(simdi)
  const esikler = etkinEsikler(h.profil, h.hekimAyar)
  // HASTA-MODULLERI: the active modules are resolved PER PATIENT; everything below follows them. Readings of a kind the
  // patient is not followed for stay stored (Günlük list, streak, total count) but are not prompted, goal-counted,
  // trended or graded.
  const mod = hastaModulleri({ bransAnahtar: h.bransAnahtar, ayar: h.ayar, hekim: h.hekimAyar, klinik: h.klinik, hasta: h.tercihler.moduller })
  const tipler = mod.olcumler
  const gunlukHedef = mod.gunlukHedef
  const takipSet = new Set(tipler)
  const takipOlcumleri = h.olcumler.filter((o) => takipSet.has(o.tip))
  // DOZ-KAYDI-ISTEGE-BAGLI: every plan carries its effective "patient logs it" from here on.
  const planlarK = kayitTercihiUygula(h.planlar, h.tercihler.dozKaydi)
  const aktifPlanlar = planlarK.filter((p) => p.aktif)

  const isaretli = [...(h.isaretliOlcumler || [])].sort((a, b) => b.olcumAt.localeCompare(a.olcumAt))
  const sirali = [...h.olcumler].sort((a, b) => b.olcumAt.localeCompare(a.olcumAt))
  const hepsi: GunlukOlcum[] = [...sirali, ...isaretli].sort((a, b) => b.olcumAt.localeCompare(a.olcumAt))
  const olcumKartlari: OlcumKarti[] = tipler.map((t) => {
    const def = OLCUM_TANIMLARI[t]
    const baglam = t === 'glukoz' ? onerilenBaglam(h.olcumler, simdi) : null
    // Prefill: the last value of the same context (glucose), else the last value of the kind, else the catalog start.
    // A HI / LO flag never prefills the stepper (it has no number) but is shown as the latest entry.
    const sonSayi = sirali.find((o) => o.tip === t) || null
    const sonHepsi = hepsi.find((o) => o.tip === t) || null
    const ayni = t === 'glukoz' ? sirali.find((o) => o.tip === t && o.baglam === baglam) || sonSayi : sonSayi
    const anahtar = t === 'glukoz' ? `glukoz:${baglam}` : t
    const son: OlcumKarti['son'] = !sonHepsi ? null
      : 'isaret' in sonHepsi ? { deger: null, deger2: null, baglam: sonHepsi.baglam, olcumAt: sonHepsi.olcumAt, isaret: sonHepsi.isaret, seviye: 'acil' }
      : { deger: sonHepsi.deger, deger2: sonHepsi.deger2, baglam: sonHepsi.baglam, olcumAt: sonHepsi.olcumAt, seviye: olcumSeviyesi(sonHepsi, esikler) }
    return {
      tip: t, ad: def.ad, birim: def.birim,
      son,
      onDeger: t === 'su' ? 1 : ayni?.deger ?? def.ilkDeger,
      onDeger2: t === 'kb' ? ayni?.deger2 ?? def.ilkDeger2 ?? null : null,
      onBaglam: baglam,
      bugunSayi: h.olcumler.filter((o) => o.tip === t && trGun(o.olcumAt) === bugun).reduce((a, o) => a + (t === 'su' ? o.deger : 1), 0) + isaretli.filter((o) => o.tip === t && trGun(o.olcumAt) === bugun).length,
      gunlukHedef: gunlukHedef[t] ?? 0,
      hedef: hedefMetni(anahtar, esikler[anahtar]),
    }
  })

  const bugunDozlar = bugunPlani(aktifPlanlar, h.kayitlar, simdi)
  const gerektikce = gerektikceDurumu(planlarK, h.kayitlar, simdi)
  // Only logged medicines fill the İlaç ring (a reminder-only patient gets no ring that can never fill).
  const kayitDozlar = bugunDozlar.filter((s) => s.kayitAcik)
  const olcumToplam = olcumKartlari.reduce((a, k) => a + k.gunlukHedef, 0)
  const olcumYapilan = olcumKartlari.reduce((a, k) => a + Math.min(k.bugunSayi, k.gunlukHedef), 0)
  const son7 = takipOlcumleri.filter((o) => trGun(o.olcumAt) >= gunEkle(bugun, -6))
  const hedefDeg = son7.map((o) => hedefteMi(esikler[metrikAnahtari(o)], o.deger, o.deger2)).filter((x): x is boolean => x != null)

  const kadran: GunlukDurum['kadran'] = [
    ...bugunDozlar.map((s) => ({ dakika: trDakika(s.at), tur: 'doz' as const, durum: (s.durum === 'alindi' ? 'tamam' : s.durum === 'atlandi' || (s.durum === 'kayit_yok' && s.kayitAcik) ? 'kacti' : 'bekliyor') as 'tamam' | 'bekliyor' | 'kacti', etiket: `${s.saat} ${s.ad}` })),
    ...hepsi.filter((o) => trGun(o.olcumAt) === bugun).map((o) => ({ dakika: trDakika(o.olcumAt), tur: 'olcum' as const, durum: 'tamam' as const, etiket: OLCUM_TANIMLARI[o.tip].kisaAd })),
  ]

  const aktif = aktifGunler(hepsi, h.kayitlar)
  const seri = seriHesapla(aktif, bugun)
  const kalkanSet = new Set(seri.kalkanGunleri)
  const son14 = Array.from({ length: 14 }, (_, i) => { const g = gunEkle(bugun, -13 + i); return { gun: g, aktif: aktif.has(g), kalkan: kalkanSet.has(g) } })

  const anahtarlar = [...new Set(takipOlcumleri.map(metrikAnahtari))].filter((a) => !a.startsWith('su'))
  const egilimler: Egilim[] = anahtarlar.map((a): Egilim => {
    const p = pencere(takipOlcumleri, a, simdi, 14)
    const e = esikler[a]
    const fark = p.hafta.ort != null && p.onceki.ort != null ? p.hafta.ort - p.onceki.ort : null
    const esik = a === 'kb' ? 3 : a.startsWith('glukoz') ? 8 : a === 'kilo' ? 0.5 : 2
    return {
      anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[a.split(':')[0] as OlcumTipi].birim,
      hafta: p.hafta, onceki: p.onceki, gunluk: p.gunluk.map((x) => ({ gun: x.gun, ort: x.ort, ort2: x.ort2, ...gunIsareti(isaretli, a, x.gun) })),
      hedefMetni: hedefMetni(a, e), hedefMin: e?.hedefMin ?? null, hedefMax: e?.hedefMax ?? null,
      yon: fark == null ? null : fark > esik ? 'yukari' : fark < -esik ? 'asagi' : 'sabit',
    }
  }).sort((x, y) => y.hafta.n - x.hafta.n)

  const ilkGun = [...aktif].sort()[0] ?? null
  const karneGirdi = { olcumler: takipOlcumleri, planlar: aktifPlanlar, kayitlar: h.kayitlar, esikler, olcumTipleri: tipler, gunlukHedef, aktifGunler: aktif, ilkGun, simdi }
  const durumlar = rozetDurumlari({ olcumler: takipOlcumleri, toplamOlcum: h.toplamOlcum, fotoOlcum: h.fotoOlcum, planlar: aktifPlanlar, kayitlar: h.kayitlar, esikler, olcumTipleri: tipler, gunlukHedef, seri, aktifGunSayisi: aktif.size, simdi })
  const kayitli = new Map(h.kazanilanRozetler.map((r) => [r.rozet, r]))
  const rozetler: GunlukRozet[] = durumlar.map((d) => {
    const t = ROZETLER.find((r) => r.id === d.id) as RozetTanimi
    const k = kayitli.get(d.id)
    // A stored badge stays earned even when the 90-day window no longer shows it.
    return { ...t, ...d, kazanildi: d.kazanildi || !!k, deger: k ? d.hedef : d.deger, kazanildiAt: k?.kazanildiAt ?? null, yeni: (!!k && !k.hastaGorduAt) || (!k && d.kazanildi) }
  })
  const yeniKazanilan = durumlar.filter((d) => d.kazanildi && !kayitli.has(d.id)).map((d) => d.id)

  // A reminder-only dose stays "next" until 30 min after its time (nothing to mark, so it moves on by itself).
  const simdiMs = Date.parse(simdi)
  const bekleyen = bugunDozlar.filter((s) => (s.durum === 'zamani' || s.durum === 'bekliyor' || s.durum === 'ertelendi') && (s.kayitAcik || Date.parse(s.at) >= simdiMs - 30 * 60_000))
  const ilk = bekleyen[0]
  const grup = ilk ? bekleyen.filter((s) => s.at === ilk.at) : []
  const siradaki = ilk ? { tur: 'doz' as const, saat: ilk.saat, at: ilk.at, planIds: grup.map((s) => s.planId), adlar: grup.map((s) => s.ad), kayitPlanIds: grup.filter((s) => s.kayitAcik).map((s) => s.planId) } : null

  const ldlHedef = h.hekimAyar?.ldlHedef ?? null
  const haftaGunleri = Array.from({ length: 7 }, (_, i) => gunEkle(bugun, -6 + i))
  const harita = kayitHaritasi(h.kayitlar)
  const hafta = { gunler: haftaGunleri, planlar: aktifPlanlar.filter((p) => !p.gerektikce && kayitAcikMi(p)).map((p) => ({ planId: p.id, ad: p.ad, gunler: haftaGunleri.map((g) => gunSlotlari(p, g).map((sl) => slotDurumu(p.id, sl, harita, simdi))) })) }
  return {
    simdi, bugun, brans: h.bransAnahtar, vurgu: h.ayar.vurgu, kartlar: mod.kartlar,
    olcumKartlari, bugunDozlar, gerektikce, planlar: planlarK,
    halkalar: {
      ilac: { yapilan: kayitDozlar.filter((s) => s.durum === 'alindi').length, toplam: kayitDozlar.length },
      olcum: { yapilan: olcumYapilan, toplam: olcumToplam },
      hedef: { yuzde: hedefDeg.length >= 3 ? Math.round((hedefDeg.filter(Boolean).length / hedefDeg.length) * 100) : null, n: hedefDeg.length },
    },
    kadran, seri, son14, egilimler,
    uyarilar: h.uyarilar.map((u) => ({ id: u.id, duzey: u.duzey, metrik: u.metrik, hastaMetni: u.hastaMetni, olusturmaAt: u.olusturmaAt, hastaGorduAt: u.hastaGorduAt, kural: u.kural, ...(u.veri?.sekerAcil === 'yuksek' || u.veri?.sekerAcil === 'dusuk' ? { sekerAcil: u.veri.sekerAcil as 'yuksek' | 'dusuk', keton: u.veri.keton === true } : {}) })),
    rozetler, yeniKazanilan,
    karne: { hafta: karneHesapla(karneGirdi, 'hafta'), ay: karneHesapla(karneGirdi, 'ay') },
    uyum7: uyum(aktifPlanlar, h.kayitlar, gunEkle(bugun, -6), bugun, simdi),
    uyum30: uyum(aktifPlanlar, h.kayitlar, gunEkle(bugun, -29), bugun, simdi),
    tercihler: h.tercihler,
    ldl: h.ldl && mod.kartlar.includes('ldl') ? { ...h.ldl, hedef: ldlHedef } : null,
    moduller: {
      aktif: mod.aktif.map((m) => ({ anahtar: m.anahtar, tur: m.tur, hekimTakip: m.kaynak === 'hekim' || m.kaynak === 'tani' || m.kaynak === 'ilac', hastaKapatabilir: m.hastaKapatabilir, gunlukHedef: m.gunlukHedef })),
      eklenebilir: mod.eklenebilir,
      hastaKapatti: mod.hastaKapatti,
    },
    sorular: h.sorular,
    siradaki,
    esikler,
    sonOlcumler: hepsi.slice(0, 40),
    isaretliOlcumler: isaretli,
    hafta,
    kayit: { tercih: h.tercihler.dozKaydi ?? null, secim: h.tercihler.dozSecimi ?? null, hatirlatmaAcik: h.tercihler.hatirlatmaAcik !== false, soruGoster: kayitSorusuGosterilsinMi(planlarK, h.tercihler), kayitliIlac: aktifPlanlar.filter((p) => !p.gerektikce && kayitAcikMi(p)).length, planliIlac: aktifPlanlar.filter((p) => !p.gerektikce).length },
  }
}

// ─── Kontrol Öncesi Özet (doctor) ─────────────────────────────────────────────────────────────────────────────────

export interface KontrolOzeti {
  donemBas: string
  donemBit: string
  randevuAt: string | null
  metrikler: Array<{ anahtar: string; etiket: string; birim: string; n: number; ort: string | null; min: string | null; max: string | null; hedefteYuzde: number | null; ilkHafta: string | null; sonHafta: string | null }>
  uyum: { genel: UyumSonucu; ilaclar: ReturnType<typeof planUyumlari> }
  /** kural → colour family on the doctor's screen (UYARI-RENKLERI). */
  uyarilar: Array<{ duzey: string; metin: string; tarih: string; kural?: string }>
  sorular: Array<{ metin: string; tarih: string }>
  /** EV-ACIL-SEKER: glucometer HI / LO entries in the period (never averaged into the metrics above). */
  isaretler?: { hi: number; lo: number; son: string | null }
  aktifGun: number
  metin: string
}

const f = (x: number | null, o = 0) => (x == null ? null : (Math.round(x * 10 ** o) / 10 ** o).toLocaleString('tr-TR', { maximumFractionDigits: o }))

/** Last 4 weeks of home data, adherence, alerts and the patient's questions — one printable page for the doctor. */
export function kontrolOncesiOzet(g: { olcumler: EvOlcum[]; isaretliOlcumler?: IsaretliOlcum[]; planlar: DozPlani[]; kayitVarsayilan?: KayitTutma | null; kayitlar: DozKaydi[]; uyarilar: EvUyari[]; sorular: Array<{ metin: string; createdAt: string }>; esikler: Record<string, EsikSeti>; simdi: string; randevuAt: string | null; takipTipleri?: OlcumTipi[] | null }): KontrolOzeti {
  const bit = trGun(g.simdi)
  const bas = gunEkle(bit, -27)
  const donemde = g.olcumler.filter((o) => { const d = trGun(o.olcumAt); return d >= bas && d <= bit })
  // HASTA-MODULLERI: the summary follows the patient's active modules; readings of other kinds are named in one line.
  const takip = g.takipTipleri ? new Set(g.takipTipleri) : null
  const ol = takip ? donemde.filter((o) => takip.has(o.tip)) : donemde
  const disi = takip ? donemde.filter((o) => !takip.has(o.tip)) : []
  const anahtarlar = [...new Set(ol.map(metrikAnahtari))]
  const metrikler = anahtarlar.map((a) => {
    const s = ol.filter((o) => metrikAnahtari(o) === a)
    const tip = a.split(':')[0] as OlcumTipi
    const o = OLCUM_TANIMLARI[tip].ondalik
    const ort = s.reduce((x, y) => x + y.deger, 0) / s.length
    const ort2 = s.some((y) => y.deger2 != null) ? s.reduce((x, y) => x + (y.deger2 ?? 0), 0) / s.length : null
    const metin = (v: number, v2: number | null) => (tip === 'kb' ? `${f(v)}/${f(v2)}` : (f(v, o) as string))
    const enB = s.reduce((x, y) => (y.deger > x.deger ? y : x)), enK = s.reduce((x, y) => (y.deger < x.deger ? y : x))
    const hedef = s.map((y) => hedefteMi(g.esikler[a], y.deger, y.deger2)).filter((x): x is boolean => x != null)
    const hafta = (b: string, e: string) => { const w = s.filter((y) => { const d = trGun(y.olcumAt); return d >= b && d <= e }); if (!w.length) return null; const m = w.reduce((x, y) => x + y.deger, 0) / w.length; const m2 = tip === 'kb' ? w.reduce((x, y) => x + (y.deger2 ?? 0), 0) / w.length : null; return metin(m, m2) }
    return {
      anahtar: a, etiket: metrikEtiketi(a), birim: OLCUM_TANIMLARI[tip].birim, n: s.length,
      ort: metin(ort, ort2), min: metin(enK.deger, enK.deger2), max: metin(enB.deger, enB.deger2),
      hedefteYuzde: hedef.length ? Math.round((hedef.filter(Boolean).length / hedef.length) * 100) : null,
      ilkHafta: hafta(bas, gunEkle(bas, 6)), sonHafta: hafta(gunEkle(bit, -6), bit),
    }
  })
  const aktifP = kayitTercihiUygula(g.planlar.filter((p) => p.aktif), g.kayitVarsayilan)
  const genel = uyum(aktifP, g.kayitlar, bas, bit, g.simdi)
  const ilaclar = planUyumlari(aktifP, g.kayitlar, bas, bit, g.simdi)
  const uyarilar = g.uyarilar.filter((u) => trGun(u.olusturmaAt) >= bas).map((u) => ({ duzey: u.duzey, metin: u.hekimMetni, tarih: u.olusturmaAt, kural: u.kural }))
  const sorular = g.sorular.map((s) => ({ metin: s.metin, tarih: s.createdAt }))
  const isaretDonem = (g.isaretliOlcumler || []).filter((o) => { const d = trGun(o.olcumAt); return d >= bas && d <= bit })
  const isaretler = isaretDonem.length ? { hi: isaretDonem.filter((o) => o.isaret === 'hi').length, lo: isaretDonem.filter((o) => o.isaret === 'lo').length, son: isaretDonem.map((o) => o.olcumAt).sort().pop() ?? null } : undefined
  const aktifGun = aktifGunler([...donemde, ...isaretDonem], g.kayitlar.filter((k) => trGun(k.kayitAt) >= bas)).size

  const satirlar: string[] = [`Kontrol öncesi ev verisi özeti — ${bas} / ${bit} (son 4 hafta, ${aktifGun} gün kayıt)`]
  if (metrikler.length) {
    satirlar.push('', 'Ölçümler:')
    for (const m of metrikler) satirlar.push(`- ${m.etiket}: ort ${m.ort} ${m.birim} (n=${m.n}; en düşük ${m.min}, en yüksek ${m.max}${m.hedefteYuzde != null ? `; hedefte %${m.hedefteYuzde}` : ''}${m.ilkHafta && m.sonHafta ? `; ilk hafta ${m.ilkHafta} → son hafta ${m.sonHafta}` : ''})`)
  } else satirlar.push('', 'Bu dönemde ev ölçümü yok.')
  if (isaretler) satirlar.push(`- Kan şekeri cihaz ekranı ölçüm aralığı dışında: ${[isaretler.hi ? `HI ${isaretler.hi} kez` : '', isaretler.lo ? `LO ${isaretler.lo} kez` : ''].filter(Boolean).join(', ')} (ortalamaya katılmadı; son ${isaretler.son ? trGun(isaretler.son) : '—'})`)
  if (disi.length) {
    const say = new Map<OlcumTipi, number>()
    for (const o of disi) say.set(o.tip, (say.get(o.tip) || 0) + 1)
    satirlar.push(`Takip dışı girilen ölçümler: ${[...say].map(([t, n]) => `${OLCUM_TANIMLARI[t].ad} (n=${n})`).join(', ')}`)
  }
  if (ilaclar.length) {
    // DOZ-KAYDI-ISTEGE-BAGLI: a % only where the patient logs; otherwise "doz kaydı tutmuyor" / "kayıt yok" — never 0 %.
    const kayitli = ilaclar.filter((i) => i.kayitAcik)
    const genelMetin = !kayitli.length ? 'Hasta doz kaydı tutmuyor (yalnız hatırlatma alıyor)' : genel.yuzde == null ? 'Kayıt yok' : `%${genel.yuzde} (${genel.alinan}/${genel.beklenen} işaretli doz; ${genel.beklenen - genel.alinan} "Atladım")`
    satirlar.push('', `İlaç uyumu: ${genelMetin}`)
    for (const i of ilaclar) satirlar.push(`- ${i.ad}${i.kritik ? ' (kritik)' : ''}${i.kaynak === 'hasta' ? ' (hastanın eklediği)' : ''}: ${!i.kayitAcik ? 'yalnız hatırlatma' : i.yuzde == null ? 'kayıt yok' : `%${i.yuzde} (${i.alinan}/${i.beklenen})`}`)
  }
  if (uyarilar.length) { satirlar.push('', 'Uyarılar:'); for (const u of uyarilar) satirlar.push(`- [${u.kural === 'kritik_ilac' ? 'uyum' : u.duzey}] ${trGun(u.tarih)} — ${u.metin}`) }
  if (sorular.length) { satirlar.push('', 'Hastanın soruları:'); for (const s of sorular) satirlar.push(`- ${s.metin}`) }
  satirlar.push('', 'Ev ölçümleri hastanın kendi cihazıyla girilmiştir; değerlendirme hekime aittir.')
  return { donemBas: bas, donemBit: bit, randevuAt: g.randevuAt, metrikler, uyum: { genel, ilaclar }, uyarilar, sorular, ...(isaretler ? { isaretler } : {}), aktifGun, metin: satirlar.join('\n') }
}
