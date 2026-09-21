/**
 * Bu muayenede yapılması önerilenler — evrensel kutu, branşa özel maddeler.
 *
 * Kaynak (Dr. Gökhan Mamur, 2026-09-03, NOTYA-BASLIK-01): Türk anamnez geleneği
 * şikayet → hikaye → özgeçmiş → soygeçmiş → FM → tanı → tedavi.
 * Pediatri maddeleri (baş çevresi, aşı, büyüme, prenatal) yalnız pediatrik bağlamda.
 * Karar desteği: hekim işaretler; Asistan notta uydurmaz, doğrular.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type CekGrup = 'anamnez' | 'olcum' | 'fizik' | 'kapanis'

export interface CekMadde {
  id: string
  etiket: string
  grup: CekGrup
  anahtarlar: string[]
}

export interface CekListeGirdi {
  seansBransi?: string | null
  doktorBransi?: string | null
  hastaDogumIso?: string | null
}

export type CekDurum = 'hekim' | 'dosyada' | 'eksik'

export interface CekDogrulamaSatir {
  id: string
  etiket: string
  grup: CekGrup
  durum: CekDurum
}

export const CEK_LISTE_SORU = 'Bu muayenede yapılması önerilenler'
export const CEK_LISTE_BASLIK = 'Bu muayenede yapılması önerilenler'

const GRUP_ETIKET: Record<CekGrup, string> = {
  anamnez: 'Anamnez',
  olcum: 'Ölçüm',
  fizik: 'Fizik muayene',
  kapanis: 'Kapanış',
}

export function cekGrupEtiket(g: CekGrup): string {
  return GRUP_ETIKET[g]
}

const ORTAK: CekMadde[] = [
  { id: 'sikayet', etiket: 'Başvuru yakınması / şikayet', grup: 'anamnez', anahtarlar: ['sikayet', 'yakinma', 'basvuru'] },
  { id: 'hikaye', etiket: 'Şikayetin hikayesi', grup: 'anamnez', anahtarlar: ['hikaye', 'baslangic', 'ne zamandir'] },
  { id: 'ozgecmis', etiket: 'Özgeçmiş (hastalık, alerji, ilaç)', grup: 'anamnez', anahtarlar: ['ozgecmis', 'alerji', 'surekli ilac'] },
  { id: 'soygecmis', etiket: 'Soygeçmiş', grup: 'anamnez', anahtarlar: ['soygecmis', 'ailede'] },
  { id: 'genel', etiket: 'Genel durum', grup: 'fizik', anahtarlar: ['genel durum', 'hidrasyon', 'bilinc'] },
  { id: 'tani', etiket: 'Tanı (hekim)', grup: 'kapanis', anahtarlar: ['tani', 'teshis'] },
  { id: 'tedavi', etiket: 'Tedavi / plan', grup: 'kapanis', anahtarlar: ['tedavi', 'recete', 'plan'] },
]

const PEDIATRI: CekMadde[] = [
  { id: 'beslenme', etiket: 'Beslenme / alışkanlıklar', grup: 'anamnez', anahtarlar: ['beslenme', 'emzirme', 'mama'] },
  { id: 'asi', etiket: 'Aşı durumu', grup: 'anamnez', anahtarlar: ['asi', 'asisi', 'asi karnesi'] },
  { id: 'prenatal', etiket: 'Prenatal / natal / postnatal öykü', grup: 'anamnez', anahtarlar: ['prenatal', 'dogum', 'natal'] },
  { id: 'ates', etiket: 'Ateş', grup: 'olcum', anahtarlar: ['ates', 'derece', '38'] },
  { id: 'kilo', etiket: 'Kilo', grup: 'olcum', anahtarlar: ['kilo', 'kg'] },
  { id: 'boy', etiket: 'Boy', grup: 'olcum', anahtarlar: ['boy', 'cm'] },
  { id: 'basCevresi', etiket: 'Baş çevresi', grup: 'olcum', anahtarlar: ['bas cevresi', 'bascevre'] },
  { id: 'solunum', etiket: 'Solunum (dinleme)', grup: 'fizik', anahtarlar: ['akciger', 'ral', 'ronkus', 'wheez', 'solunum'] },
  { id: 'kvs', etiket: 'Kardiyovasküler', grup: 'fizik', anahtarlar: ['kalp', 'ufurum', 's1', 's2'] },
  { id: 'batin', etiket: 'Batın', grup: 'fizik', anahtarlar: ['batin', 'karin', 'hassasiyet'] },
  { id: 'kbb', etiket: 'KBB / boğaz', grup: 'fizik', anahtarlar: ['bogaz', 'tonsil', 'kulak', 'otoskop'] },
  { id: 'cilt', etiket: 'Cilt', grup: 'fizik', anahtarlar: ['cilt', 'dokuntu', 'dokunt'] },
  { id: 'kontrol', etiket: 'Kontrol zamanı', grup: 'kapanis', anahtarlar: ['kontrol', 'tekrar gel'] },
]

const BRANS_EK: Partial<Record<SpecialtyKey, CekMadde[]>> = {
  kardiyoloji: [
    { id: 'kb', etiket: 'Kan basıncı', grup: 'olcum', anahtarlar: ['tansiyon', 'kan basinci', 'mmhg'] },
    { id: 'nabiz', etiket: 'Nabız', grup: 'olcum', anahtarlar: ['nabiz'] },
    { id: 'oskultasyon', etiket: 'Kalp oskültasyonu', grup: 'fizik', anahtarlar: ['ufurum', 's1', 's2', 'oskult'] },
    { id: 'odem', etiket: 'Ödem / periferik nabız', grup: 'fizik', anahtarlar: ['odem', 'periferik'] },
    { id: 'ekg', etiket: 'EKG (endikeyse)', grup: 'fizik', anahtarlar: ['ekg', 'elektrokardiyo'] },
  ],
  'kadin-hastaliklari-dogum': [
    { id: 'sat', etiket: 'SAT / gebelik haftası (endikeyse)', grup: 'anamnez', anahtarlar: ['sat', 'son adet', 'gebelik haft'] },
    { id: 'jine', etiket: 'Jinekolojik muayene (endikeyse)', grup: 'fizik', anahtarlar: ['spekulum', 'jinekolog', 'vajinal'] },
    { id: 'fundus', etiket: 'Fundus / obstetrik muayene (endikeyse)', grup: 'fizik', anahtarlar: ['fundus', 'sfh', 'fetal'] },
    { id: 'batin_kd', etiket: 'Batın', grup: 'fizik', anahtarlar: ['batin', 'karin'] },
  ],
  'goz-hastaliklari': [
    { id: 'va', etiket: 'Görme keskinliği', grup: 'olcum', anahtarlar: ['gorme', 'keskinlik', 'logmar', 'snellen'] },
    { id: 'gib', etiket: 'Göz içi basıncı', grup: 'olcum', anahtarlar: ['gib', 'goz ici', 'tonometri'] },
    { id: 'biyo', etiket: 'Biyomikroskopi', grup: 'fizik', anahtarlar: ['biyomikroskop', 'on segment', 'kornea'] },
    { id: 'fundus_goz', etiket: 'Fundus', grup: 'fizik', anahtarlar: ['fundus', 'retina'] },
  ],
  dermatoloji: [
    { id: 'lezyon', etiket: 'Lezyon yeri / yayılım', grup: 'fizik', anahtarlar: ['lezyon', 'yerlesim', 'yayilim'] },
    { id: 'dermoskopi', etiket: 'Dermoskopi (endikeyse)', grup: 'fizik', anahtarlar: ['dermoskopi', 'dermatoskopi'] },
    { id: 'fitz', etiket: 'Fitzpatrick (endikeyse)', grup: 'olcum', anahtarlar: ['fitzpatrick'] },
  ],
  dahiliye: [
    { id: 'kb_dah', etiket: 'Kan basıncı', grup: 'olcum', anahtarlar: ['tansiyon', 'kan basinci'] },
    { id: 'ates_dah', etiket: 'Ateş', grup: 'olcum', anahtarlar: ['ates'] },
    { id: 'sistem', etiket: 'Sistem muayenesi (ilgili)', grup: 'fizik', anahtarlar: ['akciger', 'kalp', 'batin'] },
    { id: 'ilac_uyum', etiket: 'Sürekli ilaç uyumu', grup: 'anamnez', anahtarlar: ['ilac', 'uyum', 'kullaniyor'] },
  ],
  'kulak-burun-bogaz': [
    { id: 'otoskop', etiket: 'Otoskopi', grup: 'fizik', anahtarlar: ['otoskop', 'kulak zari', 'timpan'] },
    { id: 'burun', etiket: 'Burun / orofarenks', grup: 'fizik', anahtarlar: ['burun', 'orofarenks', 'tonsil'] },
    { id: 'boyun', etiket: 'Boyun / lenf', grup: 'fizik', anahtarlar: ['boyun', 'lenf'] },
  ],
}

export function muayeneCekListesi(g: CekListeGirdi): CekMadde[] {
  const brans = bransAnahtari(g.seansBransi) ?? bransAnahtari(g.doktorBransi)
  const ped = pediatrikBaglamMi({
    seansBransi: g.seansBransi,
    doktorBransi: g.doktorBransi,
    hastaDogumIso: g.hastaDogumIso,
  })
  const liste = [...ORTAK]
  if (ped) liste.push(...PEDIATRI)
  if (brans && BRANS_EK[brans]) liste.push(...BRANS_EK[brans]!)
  const gorulen = new Set<string>()
  return liste.filter((m) => {
    if (gorulen.has(m.id)) return false
    gorulen.add(m.id)
    return true
  })
}

export function cekListeSorulduMu(soru: string): boolean {
  const n = trAramaNormalize(soru)
  return /bu muayenede yapil|yapilmasi onerilen|cek listesi|muayene cek|onerilenler/.test(n)
}

export function cekListeAsistanCevabi(maddeler: CekMadde[]): string {
  if (!maddeler.length) {
    return 'Bu branş için henüz önerilen bir muayene listesi yok Hocam. Klasik anamnez ve fizik muayene ile devam edebilirsiniz.'
  }
  const gruplar = (['anamnez', 'olcum', 'fizik', 'kapanis'] as CekGrup[])
    .map((g) => {
      const alt = maddeler.filter((m) => m.grup === g)
      if (!alt.length) return ''
      return `${GRUP_ETIKET[g]}:\n${alt.map((m) => `• ${m.etiket}`).join('\n')}`
    })
    .filter(Boolean)
  return `Bu muayenede yapılması önerilenler (çek listesi). İşaretledikleriniz seansın sağında durur; notu üretirken doğrularım, eksik maddeyi not gövdesine uydurmam.\n\n${gruplar.join('\n\n')}`
}

export function cekListeDogrula(
  maddeler: CekMadde[],
  g: { transcript?: string; soap?: string; isaretler?: Record<string, boolean> },
): CekDogrulamaSatir[] {
  const ham = trAramaNormalize(`${g.transcript || ''} ${g.soap || ''}`)
  return maddeler.map((m) => {
    if (g.isaretler?.[m.id]) return { id: m.id, etiket: m.etiket, grup: m.grup, durum: 'hekim' as const }
    const dosyada = m.anahtarlar.some((a) => ham.includes(trAramaNormalize(a)))
    return { id: m.id, etiket: m.etiket, grup: m.grup, durum: dosyada ? 'dosyada' : 'eksik' }
  })
}

export function cekListeDogrulamaMetni(satirlar: CekDogrulamaSatir[]): string {
  const hekim = satirlar.filter((s) => s.durum === 'hekim').length
  const dosya = satirlar.filter((s) => s.durum === 'dosyada').length
  const eksik = satirlar.filter((s) => s.durum === 'eksik')
  const satir = satirlar.map((s) => {
    const im = s.durum === 'hekim' ? '✓ hekim işaretledi' : s.durum === 'dosyada' ? '✓ dosyada var' : '✗ eksik'
    return `- ${s.etiket}: ${im}`
  })
  return [
    'ÇEK LİSTESİ DOĞRULAMA (karar desteği — tanı değildir)',
    `${hekim + dosya}/${satirlar.length} madde karşılandı (${hekim} hekim, ${dosya} dosyada).`,
    ...satir,
    eksik.length
      ? `Eksik: ${eksik.map((s) => s.etiket).join('; ')}. Not gövdesine uydurulmadı.`
      : 'Çek listesinde boş madde kalmadı.',
  ].join('\n')
}

export function cekListePromptBlogu(maddeler: CekMadde[], isaretler: Record<string, boolean>): string {
  if (!maddeler.length) return ''
  const satir = maddeler.map((m) => `- ${m.etiket}: ${isaretler[m.id] ? 'hekim işaretledi' : 'işaretlenmedi'}`).join('\n')
  return `\nÇEK LİSTESİ (hekim işaretleri — not gövdesine uydurma YASAK):\n${satir}\nEksik maddeleri YALNIZ aiDegerlendirme'de "çek listesinde bakılmayan:" diye söyle. Transkriptte olmayan bulguyu objektif/değerlendirme/plan'a YAZMA.`
}

const DEPO_ON = 'notya.muayeneCek.'

export function cekListeDepoAnahtari(patientId: string): string {
  return `${DEPO_ON}${patientId}`
}

export function cekListeOku(patientId: string | null | undefined): Record<string, boolean> {
  if (!patientId || typeof localStorage === 'undefined') return {}
  try {
    const ham = localStorage.getItem(cekListeDepoAnahtari(patientId))
    const o = ham ? JSON.parse(ham) as Record<string, boolean> : {}
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

export function cekListeYaz(patientId: string | null | undefined, isaretler: Record<string, boolean>): void {
  if (!patientId || typeof localStorage === 'undefined') return
  try { localStorage.setItem(cekListeDepoAnahtari(patientId), JSON.stringify(isaretler)) } catch { /* yok */ }
}
