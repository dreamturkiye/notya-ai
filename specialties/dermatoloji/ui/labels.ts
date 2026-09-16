/**
 * Doctor-facing Turkish labels for dermatology enums shown on the hasta dosyası.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const DERM_PHOTO_KIND: Record<string, string> = {
  klinik_genel: 'Klinik genel fotoğraf',
  klinik_yakin: 'Klinik yakın fotoğraf',
  dermoskopi_polarize: 'Polarize dermoskopi',
  dermoskopi_immersion: 'İmmersiyon dermoskopi',
  dijital_harita: 'Dijital vücut haritası',
  islem_oncesi: 'İşlem öncesi',
  islem_sonrasi: 'İşlem sonrası',
  tedavi_hafta_n: 'Tedavi izlem fotoğrafı',
  yama_d2: 'Yama D2 okuma',
  yama_d4: 'Yama D4 okuma',
  wood: 'Wood ışığı',
  trichoscopy: 'Trikoskopi',
  patoloji_makro: 'Patoloji makro',
}

export const DERM_VISION_STATUS: Record<string, string> = {
  draft: 'Taslak',
  onayli: 'Onaylı',
  duzeltilmis: 'Düzeltilmiş',
  reddedildi: 'Reddedildi',
}

export const DERM_VISION_TASK: Record<string, string> = {
  morfoloji: 'Morfoloji',
  abcde_gozlem: 'ABCDE gözlemi',
  degisim: 'Değişim',
  dermoskopi_ipucu: 'Dermoskopi ipucu',
  yama_okuma: 'Yama okuma',
}

export const DERM_ACTOR: Record<string, string> = {
  asistan: 'Asistan',
  uzman: 'Uzman',
}

export const DERM_TBM_DEVICE: Record<string, string> = {
  molemax: 'MoleMax',
  fotofinder: 'FotoFinder',
  manual: 'Elle işaretli',
}

export const DERM_PATCH_STATUS: Record<string, string> = {
  not_yet: 'Henüz değil',
  open_d2: 'D2 okuma zamanı',
  open_d4: 'D4 okuma zamanı',
  done: 'Tamamlandı',
  overdue_d2: 'D2 gecikmiş',
  overdue_d4: 'D4 gecikmiş',
}

export const DERM_MORPHOLOGY: Record<string, string> = {
  unspecified: 'Belirtilmedi',
  plaque: 'Plak',
  patch: 'Yama',
  papule: 'Papül',
  nodule: 'Nodül',
  vesicle: 'Vezikül',
  bulla: 'Bül',
  pustule: 'Püstül',
  macule: 'Makül',
}

export const DERM_UNIT: Record<string, string> = {
  genel: 'Genel poliklinik',
  psoriasis: 'Psoriasis ünitesi',
  fototerapi: 'Fototerapi',
  pediatrik: 'Pediatrik dermatoloji',
  sac: 'Saç ünitesi',
  'kontakt-yama': 'Kontakt / yama',
  urtiker: 'Ürtiker',
  'behcet-bagdokusu': 'Behçet / bağ dokusu',
  bullu: 'Büllü hastalıklar',
  cerrahi: 'Dermatoşirürji',
  kozmetik: 'Kozmetik',
  'nevus-tumor': 'Nevüs / tümör',
  psikoderm: 'Psikodermatoloji',
}

export const DERM_PHOTO_DEVICE: Record<string, string> = {
  'nb-uvb-311': 'NB-UVB 311 nm',
  'bb-uvb': 'BB-UVB',
  'puva-oral': 'Oral PUVA',
  'puva-bath': 'Banyo PUVA',
  'local-puva': 'Lokal PUVA',
  'excimer-308': 'Eksimer 308 nm',
  uva1: 'UVA1',
}

export const DERM_FITZ: Record<string, string> = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
  V: 'V',
  VI: 'VI',
}

export const DERM_CONSENT: Record<string, string> = {
  genital: 'Genital bölge onamı',
  pediatric: '18 yaş altı onamı',
  education: 'Eğitim için anonim paylaşım',
  share: 'Hasta ile paylaşım',
}

export function looksLikeRecordId(value: string): boolean {
  return UUID_RE.test(value) || /^[0-9a-f]{32}$/i.test(value)
}

export function dermLabel(map: Record<string, string>, value: string | null | undefined, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (map[value]) return map[value]
  if (looksLikeRecordId(value)) return fallback
  return value
}

export function bolgeEtiketi(region: string | null | undefined): string {
  if (!region || region === 'unspecified') return 'Bölge belirtilmedi'
  return region
}
