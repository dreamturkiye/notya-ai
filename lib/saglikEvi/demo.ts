/**
 * HASTA-PORTALI-GUNLUK — synthetic demo data for the daily health home (internal /portal/demo*, the doctor's own preview
 * /portal/onizleme and screenshots). No real patient. Deterministic (seeded) so screenshots are reproducible.
 * Default persona = Kaan's design target: diabetes + hypertension + high cholesterol, 5 daily medicines, fasting and
 * after-lunch glucose twice a day, with the after-lunch average drifting from ~120 to ~160 in the last week (the
 * Eğilim Bekçisi example).
 * HASTA-MODULLERI: the dahiliye persona carries its patient file (Hipertansiyon + Diyabet + Hiperlipidemi on the chronic
 * list, I10 / E11.9 on approved notes, the five drugs) so its modules are resolved per patient like a real one (BP +
 * glucose + LDL from the file, weight added by the patient). Scenario 'ht' (/portal/demo?durum=ht, /portal/demo-hekim?
 * durum=ht) is a hypertension-only patient: Ramipril + Amlodipin, no glucose anywhere.
 */
import type { DozKaydi, DozPlani, EvOlcum, EvUyari, OlcumTipi } from './tipler'
import { bransGunlukAyari, hedefProfili } from './bransAyari'
import { hastaModulleri, type HastaModulTercihi, type IlacGirdisi, type KlinikGirdi } from './moduller'
import type { HamGunluk } from './ozet'
import type { EvVerisiGirdisi } from './evVerisi'
import { gunEkle, trGun, trSaatAni } from './zaman'
import { egilimKurallari } from './kurallar'
import { etkinEsikler } from './hedefler'

function rastgele(tohum: number) {
  let s = tohum >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

const PLANLAR_DAHILIYE: Array<Omit<DozPlani, 'id'>> = [
  { ilacId: 'demo-i1', ad: 'Metformin', doz: '1000 mg · 2x1, yemekle', saatler: ['08:00', '20:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-i2', ad: 'Ramipril', doz: '5 mg · sabah 1x1', saatler: ['08:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: true, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-i3', ad: 'Empagliflozin', doz: '10 mg · sabah 1x1', saatler: ['08:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-i4', ad: 'Amlodipin', doz: '5 mg · akşam 1x1', saatler: ['20:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-i5', ad: 'Atorvastatin', doz: '20 mg · gece 1x1', saatler: ['22:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
]
const PLANLAR_PEDIATRI: Array<Omit<DozPlani, 'id'>> = [
  { ilacId: 'demo-p1', ad: 'Parasetamol şurup', doz: 'Doktorunuzun yazdığı doz · gerektiğinde', saatler: [], gerektikce: true, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: 6, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-p2', ad: 'Amoksisilin süspansiyon', doz: '2x1 · 7 gün', saatler: ['08:00', '20:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
]
const PLANLAR_UYUM: Array<Omit<DozPlani, 'id'>> = [
  { ilacId: 'demo-u1', ad: 'Tedavi kremi', doz: 'Akşam ince tabaka', saatler: ['21:00'], gerektikce: false, haftaGunu: null, kaynak: 'hekim', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
  { ilacId: 'demo-u2', ad: 'Nemlendirici', doz: 'Sabah–akşam', saatler: ['08:00', '21:00'], gerektikce: false, haftaGunu: null, kaynak: 'hasta', kritik: false, minAralikSaat: null, aktif: true, baslangic: null, bitis: null },
]

/**
 * Class labels of the demo drugs exactly as the server's drug-table bridge (lib/saglikEvi/ilacSinifi.ts) resolves them —
 * written out here because the demo runs in the browser, which never loads the drug table. A test pins the two together.
 */
export const DEMO_ILAC_SINIFLARI: Record<string, IlacGirdisi> = {
  Metformin: { ad: 'Metformin', anahtar: 'metformin', siniflar: ['Antidiyabetik', 'Biguanid', 'Oral antidiyabetik'] },
  Ramipril: { ad: 'Ramipril', anahtar: 'ramipril', siniflar: ['Antihipertansif', 'RAAS blokeri', 'ACE inhibitörü', 'ADE inhibitörü'] },
  Empagliflozin: { ad: 'Empagliflozin', anahtar: 'empagliflozin', siniflar: ['Antidiyabetik', 'SGLT2 inhibitörü', 'Oral antidiyabetik'] },
  Amlodipin: { ad: 'Amlodipin', anahtar: 'amlodipin', siniflar: ['Kalsiyum kanal blokörü', 'Dihidropiridin', 'Antihipertansif', 'Antianjinal'] },
  Atorvastatin: { ad: 'Atorvastatin', anahtar: 'atorvastatin', siniflar: ['Statin', 'HMG-CoA redüktaz inhibitörü', 'Lipid düşürücü'] },
}

export type DemoSenaryosu = 'dm-ht' | 'ht'

export function gunlukDemoHam(simdiIso: string, doktorBransi: string | null = 'dahiliye', senaryo: DemoSenaryosu = 'dm-ht'): HamGunluk {
  const r = rastgele(20261124)
  const b = bransGunlukAyari(doktorBransi)
  const bugun = trGun(simdiIso)
  const simdi = Date.parse(simdiIso)
  const bransTipleri = new Set<OlcumTipi>(b.ayar.olcumler)
  const sablon = b.ayar.kartlar.includes('ates_ilac') ? PLANLAR_PEDIATRI : b.ayar.vurgu === 'uyum' && !bransTipleri.has('kb') ? PLANLAR_UYUM : PLANLAR_DAHILIYE
  const kardiyometabolik = sablon === PLANLAR_DAHILIYE
  const ht = kardiyometabolik && senaryo === 'ht'
  const planSablonu = ht ? sablon.filter((p) => p.ad === 'Ramipril' || p.ad === 'Amlodipin') : sablon
  const planlar: DozPlani[] = planSablonu.map((p, i) => ({ ...p, id: `demo-plan-${sablon.indexOf(p) + 1}` }))
  // The patient file of the persona (cardiometabolic templates only; other branşlar keep their branş default).
  const klinik: KlinikGirdi | null = !kardiyometabolik ? null : ht
    ? { tanilar: ['Hipertansiyon'], icdKodlari: ['I10'], ilaclar: planlar.map((p) => DEMO_ILAC_SINIFLARI[p.ad]).filter(Boolean) }
    : { tanilar: ['Hipertansiyon', 'Diyabet', 'Hiperlipidemi'], icdKodlari: ['I10', 'E11.9'], ilaclar: planlar.map((p) => DEMO_ILAC_SINIFLARI[p.ad]).filter(Boolean) }
  const hastaModul: HastaModulTercihi = { eklenen: kardiyometabolik ? ['kilo'] : [], cikarilan: [] }
  const hekimAyar = kardiyometabolik && !ht ? { ldlHedef: 70 } : null
  const tipler = new Set<OlcumTipi>(hastaModulleri({ bransAnahtar: b.anahtar, ayar: b.ayar, hekim: hekimAyar, klinik, hasta: hastaModul }).olcumler)
  const olcumler: EvOlcum[] = []
  const kayitlar: DozKaydi[] = []
  let n = 0
  const ekle = (tip: OlcumTipi, gun: string, saat: string, deger: number, deger2: number | null = null, baglam: EvOlcum['baglam'] = null) => {
    const at = trSaatAni(gun, saat)
    if (Date.parse(at) > simdi) return
    olcumler.push({ id: `demo-o${++n}`, tip, deger, deger2, baglam, olcumAt: at, kaynak: n % 17 === 0 ? 'portal_foto' : 'portal' })
  }
  for (let i = 34; i >= 0; i--) {
    const gun = gunEkle(bugun, -i)
    if (i === 12 || i === 13 || i === 22) continue // missed days: two are covered by streak kalkans, the third restarts the streak
    const son7 = i <= 6
    if (tipler.has('kb')) { ekle('kb', gun, '07:40', Math.round(124 + r() * 12), Math.round(76 + r() * 8)); if (r() > 0.25) ekle('kb', gun, '21:10', Math.round(121 + r() * 12), Math.round(74 + r() * 8)) }
    if (tipler.has('glukoz')) {
      ekle('glukoz', gun, '07:30', Math.round(108 + r() * 18), null, 'aclik')
      ekle('glukoz', gun, '14:35', Math.round(son7 ? 150 + r() * 22 : 112 + r() * 18), null, 'tokluk2')
    }
    if (tipler.has('kilo') && i % 3 === 0) ekle('kilo', gun, '07:20', Math.round((86.4 - (34 - i) * 0.04 + r() * 0.4) * 10) / 10)
    if (tipler.has('nabiz') && i % 2 === 0) ekle('nabiz', gun, '07:41', Math.round(68 + r() * 10))
    if (tipler.has('ates') && i <= 2) ekle('ates', gun, '09:00', Math.round((37.6 + r() * 1.2) * 10) / 10)
    if (tipler.has('spo2')) ekle('spo2', gun, '08:00', Math.round(95 + r() * 3))
    if (tipler.has('bel') && i % 7 === 0) ekle('bel', gun, '08:00', Math.round((96 - (34 - i) * 0.08) * 10) / 10)
    if (tipler.has('su')) for (let k = 0; k < 4 + Math.floor(r() * 4); k++) ekle('su', gun, `${String(9 + k * 2).padStart(2, '0')}:00`, 1)
    for (const p of planlar) {
      if (p.gerektikce) {
        if (i <= 1) kayitlar.push({ id: `demo-k${kayitlar.length}`, planId: p.id, planlananAt: trSaatAni(gun, i === 0 ? '07:15' : '19:30'), durum: 'alindi', kayitAt: trSaatAni(gun, '07:15'), erteleUntil: null })
        continue
      }
      for (const s of p.saatler) {
        const at = trSaatAni(gun, s)
        if (Date.parse(at) > simdi - 30 * 60_000) continue
        // A few fixed gaps so the demo shows a realistic week (skipped / not marked), whatever the random draw.
        // BUGUN-V2: today's 08:00 Empagliflozin left unmarked — the Bugün home shows the one-tap fix for a missed dose.
        const bosluk = (i === 3 && p.id === 'demo-plan-4') || (i === 5 && s === '20:00' && p.id === 'demo-plan-1') || (i === 2 && p.id === 'demo-plan-5') || (i === 0 && p.id === 'demo-plan-3')
        const x = bosluk ? (i === 3 ? 0.9 : 0.99) : r()
        if (x < 0.88) {
          const dk = Math.round(-10 + r() * 35)
          kayitlar.push({ id: `demo-k${kayitlar.length}`, planId: p.id, planlananAt: at, durum: 'alindi', kayitAt: new Date(Date.parse(at) + dk * 60_000).toISOString(), erteleUntil: null })
        } else if (x < 0.93) kayitlar.push({ id: `demo-k${kayitlar.length}`, planId: p.id, planlananAt: at, durum: 'atlandi', kayitAt: at, erteleUntil: null })
      }
    }
  }
  const profil = hedefProfili(b.anahtar, false)
  const esikler = etkinEsikler(profil, null)
  const uyarilar: EvUyari[] = egilimKurallari(olcumler, esikler, simdi, { yasAy: null, kiloHekimeBildir: b.ayar.kiloHekimeBildir }).map((k, i) => ({
    id: `demo-u${i}`, kural: k.kural, anahtar: k.anahtar, duzey: k.duzey, metrik: k.metrik, hastaMetni: k.hastaMetni, hekimMetni: k.hekimMetni, olusturmaAt: new Date(simdi - 3 * 3600_000).toISOString(), hastaGorduAt: null, hekimGorduAt: null,
  }))
  return {
    simdi: simdiIso, bransAnahtar: b.anahtar, ayar: b.ayar, hekimAyar, profil, klinik,
    olcumler, toplamOlcum: olcumler.length, fotoOlcum: olcumler.filter((o) => o.kaynak === 'portal_foto').length,
    planlar, kayitlar, uyarilar,
    // Earned on different days; 'hizli-goz' is left out so the demo shows the unlock moment once.
    kazanilanRozetler: (([['ilk-adim', 60], ['seri-7', 27], ['olcum-25', 40], ['olcum-100', 6], ['sabah-duzeni', 9], ['seker-ustasi', 12], ['tansiyon-takipcisi', 25], ['uyum-haftasi', 18], ['tam-gun', 30], ['seri-kalkani', 20]] as const).filter(([rozet]) => tipler.has('glukoz') || rozet !== 'seker-ustasi')).map(([rozet, gun]) => ({ rozet, kazanildiAt: new Date(simdi - gun * 86_400_000).toISOString(), hastaGorduAt: new Date(simdi - gun * 86_400_000).toISOString() })),
    tercihler: { paylasimOnayi: true, onayAt: new Date(simdi - 40 * 86_400_000).toISOString(), sessizBas: '23:00', sessizBit: '07:00', hatirlatmaAcik: true, moduller: hastaModul },
    ldl: kardiyometabolik && !ht ? { deger: 92, tarih: gunEkle(bugun, -41) } : null,
    sorular: !kardiyometabolik ? [] : ht
      ? [{ id: 'demo-s1', metin: 'Akşam ölçtüğüm tansiyon sabahkinden yüksek çıkıyor, bu normal mi?', createdAt: new Date(simdi - 26 * 3600_000).toISOString() }]
      : [{ id: 'demo-s1', metin: 'Öğleden sonra şekerim yükseliyor, Metformin saatini değiştirmeli miyim?', createdAt: new Date(simdi - 26 * 3600_000).toISOString() }],
  }
}

/** BUGUN-V2 — internal demo previews of the designed states (/portal/demo?durum=…): first day, few readings, no
 * medicines, no consent, everything done. Pure transforms of the default demo patient; synthetic data only. */
export type DemoDurumu = 'ilk' | 'az' | 'ilacsiz' | 'onaysiz' | 'tamam' | 'ht'
export function demoDurumuUygula(h: HamGunluk, durum: string | null | undefined): HamGunluk {
  const simdi = Date.parse(h.simdi)
  const bugun = trGun(h.simdi)
  // HASTA-MODULLERI: a hypertension-only patient (no glucose anywhere).
  if (durum === 'ht') return gunlukDemoHam(h.simdi, h.bransAnahtar, 'ht')
  if (durum === 'ilk') return { ...h, olcumler: [], toplamOlcum: 0, fotoOlcum: 0, kayitlar: [], uyarilar: [], kazanilanRozetler: [], sorular: [], ldl: null, tercihler: { ...h.tercihler, paylasimOnayi: false, onayAt: null } }
  if (durum === 'az') {
    const sinir = gunEkle(bugun, -2)
    const olcumler = h.olcumler.filter((o) => trGun(o.olcumAt) >= sinir)
    return { ...h, olcumler, toplamOlcum: olcumler.length, fotoOlcum: 0, kayitlar: h.kayitlar.filter((k) => trGun(k.planlananAt) >= sinir), uyarilar: [], kazanilanRozetler: h.kazanilanRozetler.filter((r) => r.rozet === 'ilk-adim').map((r) => ({ ...r, kazanildiAt: new Date(simdi - 2 * 86_400_000).toISOString() })), sorular: [] }
  }
  if (durum === 'ilacsiz') return { ...h, planlar: [], kayitlar: [] }
  if (durum === 'onaysiz') return { ...h, tercihler: { ...h.tercihler, paylasimOnayi: false, onayAt: null } }
  if (durum === 'tamam') {
    // every slot of today taken, every reading of today entered, alerts read
    const kayitlar = [...h.kayitlar]
    for (const p of h.planlar) for (const s of p.saatler) {
      const at = trSaatAni(bugun, s)
      if (!kayitlar.some((k) => k.planId === p.id && k.planlananAt === at)) kayitlar.push({ id: `demo-t-${p.id}-${s}`, planId: p.id, planlananAt: at, durum: 'alindi', kayitAt: h.simdi, erteleUntil: null })
    }
    const olcumler = [...h.olcumler]
    const mod = hastaModulleri({ bransAnahtar: h.bransAnahtar, ayar: h.ayar, hekim: h.hekimAyar, klinik: h.klinik, hasta: h.tercihler.moduller })
    for (const t of mod.olcumler) {
      const hedef = mod.gunlukHedef[t] ?? 0
      const var_ = olcumler.filter((o) => o.tip === t && trGun(o.olcumAt) === bugun).length
      for (let i = var_; i < hedef; i++) olcumler.push({ id: `demo-t-${t}-${i}`, tip: t, deger: t === 'kb' ? 124 : t === 'glukoz' ? 118 : 72, deger2: t === 'kb' ? 78 : null, baglam: t === 'glukoz' ? 'tokluk2' : null, olcumAt: new Date(simdi - (i + 1) * 60_000).toISOString(), kaynak: 'portal' })
    }
    return { ...h, kayitlar, olcumler, toplamOlcum: olcumler.length, uyarilar: h.uyarilar.map((u) => ({ ...u, hastaGorduAt: h.simdi })) }
  }
  return h
}

/** The same demo patient as the doctor sees it on the Ev verisi card. */
export function evVerisiDemoGirdisi(simdiIso: string, doktorBransi: string | null = 'dahiliye', senaryo: DemoSenaryosu = 'dm-ht'): EvVerisiGirdisi {
  const h = gunlukDemoHam(simdiIso, doktorBransi, senaryo)
  return {
    simdiMs: Date.parse(simdiIso), brans: doktorBransi, gebelikAktif: false, tercih: h.tercihler, hekimAyarHam: h.hekimAyar,
    olcumler: h.olcumler, planlar: h.planlar, kayitlar: h.kayitlar, uyarilar: h.uyarilar, kontrolOzeti: null,
    sorular: h.sorular.map((s) => ({ metin: s.metin, tarih: s.createdAt })), klinik: h.klinik,
  }
}
