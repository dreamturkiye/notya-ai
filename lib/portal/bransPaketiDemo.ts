/**
 * BRANS-PAKETI — synthetic demo portals (no PHI, fictional professionals and patients) for diyetisyen, saç ekimi and
 * estetik & plastik cerrahi: /portal/demo-diyetisyen, /portal/demo-sac-ekimi, /portal/demo-estetik-cerrahi.
 * The package is resolved through the SAME resolver and payload builder the live route uses (all templates accepted
 * as-is), so what Kaan sees in the demo is what a patient sees after the professional accepts the templates.
 */
import type { PortalBundle } from './types'
import { SAGLIGIM_DEMO } from './demoData'
import { BRANS_PAKETLERI, PAKET_ADI, hastaPaketiCoz, type HastaAyarKaydi, type PaketBransi, type SablonKaydi } from './bransPaketi'
import { SPECIALTY_MAP } from '@/lib/doktor/specialties'
import { hastaYukuKur, type HastaPaketi } from './bransPaketiYuk'
import { KLINIK_PORTAL_MODUL, KLINIK_PORTAL_NAV } from '@/lib/klinik/klinikPortal'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

const BUGUN = '2026-11-27'
const gunOnce = (n: number) => new Date(Date.parse(`${BUGUN}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)

type DemoGirdi = { ayar: Record<string, HastaAyarKaydi>; tanilar?: string[]; icd?: string[]; ilaclar?: string[]; yas?: number; gebelikSat?: string | null; kayitlar?: Array<{ modul: string; gun: string; veri: Record<string, unknown>; seviye?: string | null }>; fotolar?: Array<{ modul: string; etiket: string | null; yorum: string | null; gun: string }> }

function demoPaket(brans: PaketBransi, o: DemoGirdi): HastaPaketi {
  const sablonlar: Record<string, SablonKaydi> = {}
  for (const m of BRANS_PAKETLERI[brans] || []) sablonlar[m.kod] = { icerik: null, kabulAt: `${BUGUN}T08:00:00Z` }
  const cozum = hastaPaketiCoz({ doktorBransi: brans, sablonlar, hastaAyar: o.ayar, tanilar: o.tanilar || [], icdKodlari: o.icd || [], ilaclar: o.ilaclar || [], hastaYasYil: o.yas ?? 34, gebelikSat: o.gebelikSat ?? null, bugun: BUGUN })
  return hastaYukuKur({
    brans, cozum, sablonlar, hastaAyar: o.ayar,
    kayitlar: (o.kayitlar || []).map((k, i) => ({ id: `demo-k-${i}`, modul: k.modul, gun: k.gun, veri: k.veri, seviye: k.seviye ?? null, created_at: `${k.gun}T09:00:00Z` })),
    fotolar: (o.fotolar || []).map((f, i) => ({ id: `demo-f-${i}`, modul: f.modul, etiket: f.etiket, uzman_yorum: f.yorum, yorum_at: f.yorum ? `${f.gun}T18:00:00Z` : null, created_at: `${f.gun}T13:00:00Z` })),
    paylasimOnayi: true, lab: [], ilaclar: o.ilaclar || [],
  }, BUGUN)
}

const ayar = (a: Record<string, unknown> = {}, baslangic: string | null = null, acik: boolean | null = null): HastaAyarKaydi => ({ acik, baslangic, ayar: a })

const DIYET_PLANI = [
  'Her gün | Kahvaltı | haşlanmış yumurta, beyaz peynir, domates, salatalık, 5 adet zeytin, tam buğday ekmeği',
  'Her gün | Ara öğün | 1 porsiyon meyve, 10 adet badem',
  'Pazartesi | Öğle | mercimek çorbası, yeşil salata, yoğurt',
  'Pazartesi | Akşam | ızgara tavuk, bulgur pilavı, mevsim salata',
  'Salı | Öğle | nohut yemeği, bulgur pilavı, cacık',
  'Salı | Akşam | fırında somon, haşlanmış brokoli, yoğurt',
  'Çarşamba | Öğle | zeytinyağlı taze fasulye, tam buğday ekmeği, ayran',
  'Çarşamba | Akşam | etli kabak dolması, yoğurt',
  'Perşembe | Öğle | kuru fasulye, bulgur pilavı, turşu yerine salata',
  'Perşembe | Akşam | köfte, közlenmiş biber ve patlıcan, yeşil salata',
  'Cuma | Öğle | ton balıklı salata, tam buğday ekmeği',
  'Cuma | Akşam | sebzeli hindi sote, esmer pirinç, yoğurt',
  'Cumartesi | Öğle | menemen, tam buğday ekmeği, salatalık',
  'Cumartesi | Akşam | ızgara köfte, piyaz, mevsim salata',
  'Pazar | Öğle | zeytinyağlı enginar, yoğurt, tam buğday ekmeği',
  'Pazar | Akşam | fırında levrek, roka salatası',
].join('\n')

export const PAKET_DEMO_DIYETISYEN: HastaPaketi = demoPaket('diyetisyen', {
  tanilar: ['Hipotiroidi (hekim tanısı)', 'İnsülin direnci (hekim tanısı)'],
  ilaclar: ['Euthyrox 50 mcg', 'Ozempic'],
  ayar: {
    'diyet-plan': ayar({ plan: DIYET_PLANI }),
    'diyet-tiroid': ayar({ ilacSaati: '07:00' }),
    'diyet-ir': ayar({ ogunSaatleri: '08:00 · 13:00 · 19:00' }),
    'diyet-glp1': ayar({ proteinHedefG: 90 }),
  },
  kayitlar: [
    { modul: 'diyet-glp1', gun: gunOnce(1), veri: { protein: 82, su: 8, bulanti: 3, kabizlik: false } },
    { modul: 'diyet-ir', gun: gunOnce(1), veri: { kahvalti: '08:10', ogle: '13:05', aksam: '19:20', yuruyus: true } },
    { modul: 'diyet-vucut', gun: gunOnce(6), veri: { yag: 33.5, kas: 24.1, kalca: 108 } },
  ],
  fotolar: [
    { modul: 'diyet-tabak', etiket: null, gun: gunOnce(1), yorum: 'Tabak dengesi çok iyi: yarısı sebze, protein yerinde. Ekmeği bir dilime indirebilirsiniz.' },
    { modul: 'diyet-tabak', etiket: null, gun: gunOnce(0), yorum: null },
  ],
})

export const PAKET_DEMO_SAC_EKIMI: HastaPaketi = demoPaket('sac-ekimi', {
  ayar: {
    'sac-zaman': ayar({}, gunOnce(9)),
    'sac-ilac': ayar({ satirlar: ['Ekim alanına losyon: 1. aydan itibaren, hekiminizin tarif ettiği şekilde', 'Nemlendirici sprey: ilk 10 gün, yıkamadan sonra', 'Kontrol ve fotoğraf: 3. ayda kliniğe gelin'] }),
  },
  kayitlar: [
    { modul: 'sac-gunluk', gun: gunOnce(1), veri: { kasinti: 4, sislik: 1, akinti: false, ates: false } },
    { modul: 'sac-gunluk', gun: gunOnce(3), veri: { kasinti: 2, sislik: 3, akinti: false, ates: false } },
  ],
  fotolar: [{ modul: 'sac-foto', etiket: 'Ön', gun: gunOnce(9), yorum: 'İşlem günü referans fotoğrafı.' }],
})

export const PAKET_DEMO_ESTETIK_CERRAHI: HastaPaketi = demoPaket('estetik-cerrahi', {
  ayar: {
    'cer-zaman': ayar({}, gunOnce(5)),
    'cer-gunluk': ayar({ drenVar: true, korseSaat: 23 }),
    'cer-hazirlik': ayar({ satirlar: ['Ameliyat sabahı vücut losyonu ve makyaj kullanmayın.'] }),
  },
  kayitlar: [
    { modul: 'cer-hazirlik', gun: gunOnce(8), veri: { madde: 0, tamam: true } },
    { modul: 'cer-hazirlik', gun: gunOnce(8), veri: { madde: 1, tamam: true } },
    { modul: 'cer-hazirlik', gun: gunOnce(7), veri: { madde: 2, tamam: true } },
    { modul: 'cer-gunluk', gun: gunOnce(1), veri: { agri: 3, sislik: 5, dren: 40, korse: 22, ates: false, yara: false } },
  ],
})

function demoBundle(brans: KlinikYeniSlug, hekim: { ad: string; brans: string; klinik: string }, hasta: string): PortalBundle {
  const modul = KLINIK_PORTAL_MODUL[brans]
  return {
    ...SAGLIGIM_DEMO,
    hekim: { ...SAGLIGIM_DEMO.hekim, ...hekim, adres: 'Örnek Mah. Demo Sok. No:1 İstanbul', telefon: null, telefonHref: null, avatarUrl: null },
    hasta: { adSoyad: hasta },
    portal: { moduller: [modul], nav: [KLINIK_PORTAL_NAV[modul]] },
    buyume: null, gebelik: null, jinekoloji: null, hedefBoy: null, goz: null, deri: null,
    ozelPlan: { satirlar: [{ ad: 'Kontrol · 2026-12-04', durum: 'yaklasiyor' }], acil: null },
  }
}

export const SAGLIGIM_DEMO_DIYETISYEN = demoBundle('diyetisyen', { ad: 'Dyt. Elif Demir', brans: 'Diyetisyen', klinik: 'Demir Beslenme Danışmanlığı' }, 'Demo Hasta')
export const SAGLIGIM_DEMO_SAC_EKIMI = demoBundle('sac-ekimi', { ad: 'Dr. Mert Aksoy', brans: 'Saç Ekimi', klinik: 'Aksoy Saç Kliniği' }, 'Demo Hasta')
export const SAGLIGIM_DEMO_ESTETIK_CERRAHI = demoBundle('estetik-cerrahi', { ad: 'Op. Dr. Selin Kaya', brans: 'Estetik, Plastik ve Rekonstrüktif Cerrahi', klinik: 'Kaya Estetik Cerrahi' }, 'Demo Hasta')

// ─── BRANS-PAKETI Phase 2 — medical branş demos (/portal/demo-paket/[brans]) ─────────────────────────────────────────

/** Hand-written fixtures for the first market + the requested demos; every other branş gets the generic fixture. */
const TIBBI_DEMO: Partial<Record<PaketBransi, () => HastaPaketi>> = {
  pediatri: () => demoPaket('pediatri', {
    yas: 1.5,
    ayar: {},
    kayitlar: [
      { modul: 'ped-gelisim-1-3', gun: gunOnce(20), veri: { madde: 0, tamam: true } },
      { modul: 'ped-gelisim-1-3', gun: gunOnce(20), veri: { madde: 1, tamam: true } },
      { modul: 'ped-gelisim-1-3', gun: gunOnce(6), veri: { madde: 2, tamam: true } },
      { modul: 'ped-bebek-gunu', gun: gunOnce(1), veri: { beslenme: 5, islakBez: 6, uyku: 13 } },
      { modul: 'ped-hasta-gun', gun: gunOnce(2), veri: { ates: true, sivi: false, kusma: false } },
      { modul: 'ped-asi-sonrasi', gun: gunOnce(12), veri: { ates: true, sislik: true }, seviye: 'dikkat' },
    ],
  }),
  'kadin-hastaliklari-dogum': () => demoPaket('kadin-hastaliklari-dogum', {
    gebelikSat: gunOnce(30 * 7 + 2),
    ayar: {},
    kayitlar: [
      { modul: 'kd-hareket', gun: gunOnce(1), veri: { normal: true } },
      { modul: 'kd-gebelik-belirti', gun: gunOnce(1), veri: { bulanti: 1 } },
    ],
  }),
  dermatoloji: () => demoPaket('dermatoloji', {
    tanilar: ['Atopik dermatit'],
    ilaclar: ['Zoretanin 20 mg kapsül'],
    ayar: { 'dmt-ben': ayar({}, null, true) },
    kayitlar: [
      { modul: 'dmt-gunluk', gun: gunOnce(1), veri: { durum: 4, kasinti: 5, uyku: true, uyguladim: true, nemlendirici: true } },
      { modul: 'dmt-gunluk', gun: gunOnce(3), veri: { durum: 6, kasinti: 7, uyku: true, uyguladim: true } },
      { modul: 'dmt-bakim', gun: BUGUN, veri: { madde: 0, tamam: true } },
      { modul: 'dmt-bakim', gun: BUGUN, veri: { madde: 1, tamam: true } },
    ],
    fotolar: [{ modul: 'dmt-foto', etiket: 'Sağ dirsek içi (Yakın)', gun: gunOnce(14), yorum: 'Kızarıklık geçen kontrole göre azalmış.' }],
  }),
  kardiyoloji: () => demoPaket('kardiyoloji', {
    yas: 64,
    tanilar: ['Kalp yetmezliği', 'Koroner arter hastalığı'],
    ilaclar: ['Xarelto 20 mg'],
    ayar: { 'kar-rehab': ayar({ satirlar: ['Isınma: 5 dakika yavaş yürüyüş', 'Konuşabileceğiniz tempoda 20 dakika yürüyüş', 'Soğuma: 5 dakika yavaş yürüyüş ve esneme'] }, null, true) },
    kayitlar: [
      { modul: 'kar-ky', gun: gunOnce(1), veri: { nefes: 3, sislik: false, yastik: false } },
      { modul: 'kar-ky', gun: gunOnce(2), veri: { nefes: 4, sislik: true }, seviye: 'hekime_bildir' },
      { modul: 'kar-antikoag', gun: gunOnce(1), veri: { aldim: true } },
      { modul: 'kar-rehab', gun: BUGUN, veri: { madde: 0, tamam: true } },
    ],
  }),
  ortopedi: () => demoPaket('ortopedi', {
    yas: 58,
    ayar: {
      'ort-zaman': ayar({}, gunOnce(12)),
      'ort-egzersiz': ayar({ satirlar: ['Ayak bileği pompalama — saatte 20 kez', 'Uyluk kasını sıkma — 10 tekrar, günde 3 kez', 'Topuk kaydırma — 10 tekrar, günde 3 kez', 'Düz bacak kaldırma — 10 tekrar, günde 2 kez'] }),
    },
    kayitlar: [
      { modul: 'ort-iyilesme', gun: gunOnce(1), veri: { agri: 4, hareket: 5, ates: false } },
      { modul: 'ort-iyilesme', gun: gunOnce(3), veri: { agri: 6, hareket: 3 } },
      { modul: 'ort-egzersiz', gun: BUGUN, veri: { madde: 0, tamam: true } },
      { modul: 'ort-egzersiz', gun: BUGUN, veri: { madde: 1, tamam: true } },
    ],
  }),
  'cocuk-cerrahisi': () => demoPaket('cocuk-cerrahisi', {
    yas: 6,
    ayar: { 'cc-zaman': ayar({}, gunOnce(3)) },
    kayitlar: [{ modul: 'cc-iyilesme', gun: gunOnce(1), veri: { agri: 3, ates: false } }],
  }),
}

/** Generic fixture: every template accepted as-is, timelines started 9 days ago, condition modules switched on. */
function genelDemo(brans: PaketBransi): HastaPaketi {
  const ayar_: Record<string, HastaAyarKaydi> = {}
  for (const m of BRANS_PAKETLERI[brans] || []) {
    if (m.yas === 'cocuk' || m.yasAy) continue
    if (m.tur === 'zaman' || m.durum || m.varsayilanKapali) ayar_[m.kod] = ayar({}, m.tur === 'zaman' && m.baslangicKaynagi !== 'gebelik' ? gunOnce(9) : null, m.durum || m.varsayilanKapali ? true : null)
  }
  return demoPaket(brans, { ayar: ayar_, yas: 46 })
}

export function tibbiPaketDemosu(brans: PaketBransi): HastaPaketi | null {
  if (!BRANS_PAKETLERI[brans]?.length) return null
  return (TIBBI_DEMO[brans] || (() => genelDemo(brans)))()
}

const DEMO_HEKIM: Partial<Record<PaketBransi, string>> = {
  pediatri: 'Dr. Deniz Arslan', 'kadin-hastaliklari-dogum': 'Op. Dr. Elif Yıldız', dermatoloji: 'Dr. Selin Aksoy', kardiyoloji: 'Dr. Murat Demir', ortopedi: 'Op. Dr. Burak Şen',
}

/** The synthetic portal bundle of a medical branş demo (fictional doctor and patient; package page at /paket). */
export function tibbiDemoBundle(brans: PaketBransi): PortalBundle {
  const etiket = SPECIALTY_MAP[brans]?.label || brans
  const cocuk = brans === 'pediatri' || brans === 'cocuk-cerrahisi'
  return {
    ...SAGLIGIM_DEMO,
    hekim: { ...SAGLIGIM_DEMO.hekim, ad: DEMO_HEKIM[brans] || 'Dr. Demo Hekim', brans: etiket, klinik: `${etiket} Muayenehanesi`, adres: 'Örnek Mah. Demo Sok. No:1 İstanbul', telefon: null, telefonHref: null, avatarUrl: null },
    hasta: { adSoyad: cocuk ? 'Demo Çocuk' : 'Demo Hasta', onSekizAlti: cocuk },
    portal: { moduller: ['asi-karnesi'], nav: [{ key: 'paket', label: PAKET_ADI[brans], path: '/paket' }] },
    buyume: null, gebelik: null, jinekoloji: null, hedefBoy: null, goz: null, deri: null,
  }
}
