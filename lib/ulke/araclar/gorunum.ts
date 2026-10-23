/**
 * NOTYA-ULKE-GORUNUM-01 (Kaan, 2026-10-23): a tool tile in a country build looks EXACTLY like Türkiye's tile
 * (lib/doktor/doktorAraclari.ts): a coloured side stripe, a coloured round badge carrying a short code, the same
 * colour for the same kind of tool. Country-neutral: colours and codes only, no word a doctor reads.
 *
 * Each kit tool borrows the badge of the Türkiye tile that does the same job (`ESLENIK`); a tool Türkiye has no
 * tile for (country-only or Özel Branşlar tools, link-outs) gets a stable badge derived from its key, so the same
 * tool shows the same badge in every country. lib/ulke/araclar/gorunum.test.ts pins the table to the Türkiye catalog.
 */
export type AracRozeti = { renk: string; simge: string }

/** Türkiye's badges by Türkiye route name (copied from doktorAraclari.ts; the test keeps them equal). */
export const TR_ROZETLERI: Readonly<Record<string, AracRozeti>> = {
  'hasta-portali': { renk: '#0284C7', simge: 'HP' },
  sablonlarim: { renk: '#F59E0B', simge: 'SK' },
  konsultasyonlar: { renk: '#0891B2', simge: 'KS' },
  'hedef-boy': { renk: '#A16207', simge: 'HB' },
  'pedi-buyume': { renk: '#0D9488', simge: 'BP' },
  'pedi-doz': { renk: '#F97316', simge: 'DH' },
  'dahiliye-score2': { renk: '#0D9488', simge: 'S2' },
  'dahiliye-ckd': { renk: '#2563EB', simge: 'CK' },
  'goz-va': { renk: '#0D9488', simge: 'VA' },
  'derm-pasi': { renk: '#DB2777', simge: 'PE' },
  'derm-yama': { renk: '#C026D3', simge: 'YT' },
  'kd-gebelik-takvim': { renk: '#DB2777', simge: 'GT' },
  'psik-phq-gad': { renk: '#6366F1', simge: 'PG' },
  'psik-risk': { renk: '#DC2626', simge: 'GR' },
  'kbb-otoskopi': { renk: '#4F46E5', simge: 'OT' },
  'kbb-odyometri': { renk: '#0D9488', simge: 'OD' },
  'kbb-vertigo': { renk: '#DC2626', simge: 'VT' },
  'kardio-score2': { renk: '#DC2626', simge: 'S2' },
  'kardio-ht-kky': { renk: '#EA580C', simge: 'HT' },
  'gogus-inhaler': { renk: '#0284C7', simge: 'İN' },
  'noro-inme': { renk: '#DC2626', simge: 'İN' },
  'noro-migren': { renk: '#7C3AED', simge: 'MG' },
  'uro-ipss': { renk: '#0D9488', simge: 'IP' },
  'uro-psa': { renk: '#059669', simge: 'PS' },
  'orto-kirik-alci': { renk: '#D97706', simge: 'KA' },
  'orto-vas': { renk: '#F59E0B', simge: 'VS' },
  'orto-op-protokol': { renk: '#B45309', simge: 'OP' },
  'ftr-seans': { renk: '#16A34A', simge: 'SP' },
  'ftr-vas-odi': { renk: '#22C55E', simge: 'VO' },
  'aile-kronik': { renk: '#16A34A', simge: 'KR' },
  'aile-sevk': { renk: '#DC2626', simge: 'SV' },
  'spor-rtp': { renk: '#CA8A04', simge: 'RT' },
  'spor-sakatlik': { renk: '#A16207', simge: 'SG' },
  'endo-lab-izlem': { renk: '#A855F7', simge: 'Hb' },
  'endo-dxa': { renk: '#9333EA', simge: 'DX' },
  'endo-rejim': { renk: '#7E22CE', simge: 'RJ' },
  'gastro-ibd-ibs': { renk: '#F43F5E', simge: 'IB' },
  'gastro-endoskopi': { renk: '#E11D48', simge: 'EN' },
  'gastro-hepatit': { renk: '#BE123C', simge: 'HV' },
  'nef-egfr-kdigo': { renk: '#0E7490', simge: 'eG' },
  'nef-diyaliz': { renk: '#0891B2', simge: 'DY' },
  'nef-anemi': { renk: '#0E7490', simge: 'AN' },
  'enfeksiyon-atb-sure': { renk: '#0D9488', simge: 'AT' },
  'enfeksiyon-viral-izlem': { renk: '#0F766E', simge: 'HV' },
  'onko-kur': { renk: '#DC2626', simge: 'Kür' },
  'onko-toksisite': { renk: '#B91C1C', simge: 'Tx' },
  'gc-preop': { renk: '#EF4444', simge: 'PO' },
  'gc-yara-dren': { renk: '#DC2626', simge: 'YD' },
  'plastik-yara': { renk: '#DB2777', simge: 'YG' },
  'acil-esi': { renk: '#F97316', simge: 'ESI' },
  'acil-kritik-yol': { renk: '#EA580C', simge: 'KY' },
  'bc-postop': { renk: '#7C3AED', simge: 'PO' },
  'bc-bilinc': { renk: '#5B21B6', simge: 'NB' },
  'anestezi-asa': { renk: '#8B5CF6', simge: 'ASA' },
  'anestezi-hava-yolu': { renk: '#7C3AED', simge: 'HY' },
  'anestezi-agri': { renk: '#6D28D9', simge: 'Ağ' },
  'radyo-kuyruk': { renk: '#0D9488', simge: 'TK' },
  'radyo-rapor': { renk: '#0F766E', simge: 'BR' },
  'gogus-cerrahi-preop': { renk: '#B91C1C', simge: 'PO' },
  'gogus-cerrahi-tup-yara': { renk: '#991B1B', simge: 'TY' },
  'kdc-preop': { renk: '#9F1239', simge: 'PO' },
  'kdc-greft-yara': { renk: '#BE123C', simge: 'GY' },
  'kdc-antikoag': { renk: '#E11D48', simge: 'AK' },
  'roma-das28-basdai': { renk: '#D97706', simge: 'D28' },
  'roma-lab-izlem': { renk: '#F59E0B', simge: 'EH' },
  'cc-prepost-op': { renk: '#0891B2', simge: 'PP' },
  'tetkik': { renk: '#EA580C', simge: 'TX' },
}

/** Kit tool key → the Türkiye tile (route name) that does the same job. */
export const ESLENIK: Readonly<Record<string, string>> = {
  'hasta-portali': 'hasta-portali', sablonlarim: 'sablonlarim', konsultasyonlar: 'konsultasyonlar',
  'esi-triyaj': 'acil-esi', 'kritik-yol': 'acil-kritik-yol', 'asa-preop': 'anestezi-asa', 'hava-yolu-notu': 'anestezi-hava-yolu',
  'postop-agri': 'anestezi-agri', 'noro-postop': 'bc-postop', 'nobet-bilinc': 'bc-bilinc', 'cocuk-prepost-op': 'cc-prepost-op',
  'yara-dren-izlem': 'gc-yara-dren', 'kdigo-evre': 'dahiliye-ckd', pasi: 'derm-pasi', easi: 'derm-pasi', scorad: 'derm-pasi',
  'yama-okuma': 'derm-yama', 'lab-izlem': 'endo-lab-izlem', 'dxa-tekrar': 'endo-dxa', 'rejim-karti': 'endo-rejim',
  'antibiyotik-sure': 'enfeksiyon-atb-sure', 'viral-izlem': 'enfeksiyon-viral-izlem', 'ibd-skor': 'gastro-ibd-ibs',
  'hepatit-izlem': 'gastro-hepatit', 'genel-preop': 'gc-preop', 'toraks-preop': 'gogus-cerrahi-preop',
  'toraks-tup-yara': 'gogus-cerrahi-tup-yara', 'inhaler-teknik': 'gogus-inhaler', 'gorme-keskinligi': 'goz-va',
  'kalp-damar-preop': 'kdc-preop', 'greft-yara-izlem': 'kdc-greft-yara', 'antikoagulan-vadeleri': 'kdc-antikoag',
  'kardiyo-izlem': 'kardio-ht-kky', 'kardiyo-not': 'kardio-score2', 'odyometri-pta': 'kbb-odyometri', 'otoskopi-notu': 'kbb-otoskopi',
  'vertigo-notu': 'kbb-vertigo', 'kdigo-serit': 'nef-egfr-kdigo', 'kbh-risk-kategorisi': 'nef-egfr-kdigo', 'diyaliz-seans': 'nef-diyaliz',
  'anemi-izlem': 'nef-anemi', 'kur-sayaci': 'onko-kur', 'toksisite-listesi': 'onko-toksisite', 'kirik-alci-takip': 'orto-kirik-alci',
  'ortopedi-op-protokol': 'orto-op-protokol', 'vas-fonksiyon': 'orto-vas', 'vas-agri': 'orto-vas', 'hedef-boy': 'hedef-boy',
  'doz-hesabi': 'pedi-doz', 'buyume-persentili': 'pedi-buyume', 'plastik-yara-greft': 'plastik-yara', 'tetkik-kuyrugu': 'radyo-kuyruk',
  'rapor-taslagi': 'radyo-rapor', das28: 'roma-das28-basdai', 'eklem-28': 'roma-lab-izlem', 'iltihap-lab-izlem': 'roma-lab-izlem',
  'rtp-basamak': 'spor-rtp', 'sakatlik-gunlugu': 'spor-sakatlik', 'psa-hizi': 'uro-psa', ipss: 'uro-ipss',
  'endoskopi-kaydi': 'gastro-endoskopi', 'kronik-izlem-kaydi': 'aile-kronik', 'birinci-acil-bayrak': 'aile-sevk',
  'gebelik-gun': 'kd-gebelik-takvim', 'inme-bayraklari': 'noro-inme', 'psikiyatri-guvenlik': 'psik-risk', 'seans-plani': 'ftr-seans',
  'icf-ozet': 'ftr-vas-odi', phq9: 'psik-phq-gad', gad7: 'psik-phq-gad', midas: 'noro-migren', odi: 'ftr-vas-odi',
}

/** A country build shows no Turkish letter (the leak scan holds it): the same code, in plain letters (İN → IN, Ağ → Ag). */
export const duzHarf = (t: string): string => t.replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ü/g, 'u').replace(/Ü/g, 'U').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ç/g, 'c').replace(/Ç/g, 'C')

const YEDEK_RENKLER = ['#0891B2', '#9333EA', '#16A34A', '#2563EB', '#DB2777', '#D97706', '#0D9488', '#6366F1'] as const

/** The badge of a tool's tile: Türkiye's own when Türkiye has the tile, else one derived from the key (stable, same in every country). */
export function aracRozeti(anahtar: string): AracRozeti {
  const tr = ESLENIK[anahtar]
  const hazir = tr ? TR_ROZETLERI[tr] : undefined
  if (hazir) return { renk: hazir.renk, simge: duzHarf(hazir.simge) }
  let h = 0
  for (const c of anahtar) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const parcalar = anahtar.split(/[^a-z0-9]+/i).filter(Boolean)
  const simge = (parcalar.length > 1 ? parcalar[0][0] + parcalar[1][0] : (parcalar[0] ?? '??').slice(0, 2)).toLocaleUpperCase('en')
  return { renk: YEDEK_RENKLER[h % YEDEK_RENKLER.length], simge }
}
