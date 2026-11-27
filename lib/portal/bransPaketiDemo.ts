/**
 * BRANS-PAKETI — synthetic demo portals (no PHI, fictional professionals and patients) for diyetisyen, saç ekimi and
 * estetik & plastik cerrahi: /portal/demo-diyetisyen, /portal/demo-sac-ekimi, /portal/demo-estetik-cerrahi.
 * The package is resolved through the SAME resolver and payload builder the live route uses (all templates accepted
 * as-is), so what Kaan sees in the demo is what a patient sees after the professional accepts the templates.
 */
import type { PortalBundle } from './types'
import { SAGLIGIM_DEMO } from './demoData'
import { BRANS_PAKETLERI, hastaPaketiCoz, type HastaAyarKaydi, type SablonKaydi } from './bransPaketi'
import { hastaYukuKur, type HastaPaketi } from './bransPaketiYuk'
import { KLINIK_PORTAL_MODUL, KLINIK_PORTAL_NAV } from '@/lib/klinik/klinikPortal'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

const BUGUN = '2026-11-27'
const gunOnce = (n: number) => new Date(Date.parse(`${BUGUN}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)

function demoPaket(brans: KlinikYeniSlug, o: { ayar: Record<string, HastaAyarKaydi>; tanilar?: string[]; ilaclar?: string[]; kayitlar?: Array<{ modul: string; gun: string; veri: Record<string, unknown>; seviye?: string | null }>; fotolar?: Array<{ modul: string; etiket: string | null; yorum: string | null; gun: string }> }): HastaPaketi {
  const sablonlar: Record<string, SablonKaydi> = {}
  for (const m of BRANS_PAKETLERI[brans]) sablonlar[m.kod] = { icerik: null, kabulAt: `${BUGUN}T08:00:00Z` }
  const cozum = hastaPaketiCoz({ doktorBransi: brans, sablonlar, hastaAyar: o.ayar, tanilar: o.tanilar || [], icdKodlari: [], ilaclar: o.ilaclar || [], hastaYasYil: 34 })
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
