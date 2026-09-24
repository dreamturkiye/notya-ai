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
import { notAsiMetinSatirlari } from '@/lib/doktor/notAsilari'
import { saglamCocukCekMaddeleri, type SaglamCocukKayitlari } from '@/specialties/pediatri/engines/saglamCocukCek'

export type CekGrup = 'anamnez' | 'olcum' | 'fizik' | 'kapanis'

/**
 * NOTYA-CEK-DOGRULA-02: 'vizit' = bu muayenede yazılmalı (fizik bulgu, ölçüm, şikayet…);
 * 'dosya' = bir kez yapılan / süregiden — dosyanın herhangi bir yerinde (önceki onaylı not, kayıt formu,
 * tarama / aşı kaydı, ilaç listesi) varsa karşılanmış sayılır. Belirtilmezse 'vizit'.
 */
export type CekKapsam = 'vizit' | 'dosya'

export interface CekMadde {
  id: string
  etiket: string
  grup: CekGrup
  anahtarlar: string[]
  kapsam?: CekKapsam
}

export interface CekListeGirdi {
  seansBransi?: string | null
  doktorBransi?: string | null
  hastaDogumIso?: string | null
  /** Vizitin tarihi (geçmiş tarihli muayene) — yaş bandı bugüne göre değil o güne göre. */
  referansIso?: string | null
  /** Pediatri: hastanın tarama / M-CHAT / GİDR / seans kayıtları — kayıtlı tarama "tamam" sayılır (sunucu yükler). */
  pediKayitlari?: SaglamCocukKayitlari | null
}

/** hekim = hekim işaretledi · dosyada = bu notta yazılı · onceki = dosyanın başka bir kaydında (yalnız 'dosya' kapsamı) · eksik */
export type CekDurum = 'hekim' | 'dosyada' | 'onceki' | 'eksik'

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
  { id: 'ozgecmis', etiket: 'Özgeçmiş (hastalık, alerji, ilaç)', grup: 'anamnez', anahtarlar: ['ozgecmis', 'alerji', 'surekli ilac', 'kronik hastalik', 'kronikhastalik'], kapsam: 'dosya' },
  { id: 'soygecmis', etiket: 'Soygeçmiş', grup: 'anamnez', anahtarlar: ['soygecmis', 'ailede', 'aile oykusu', 'aileoykusu'], kapsam: 'dosya' },
  { id: 'genel', etiket: 'Genel durum', grup: 'fizik', anahtarlar: ['genel durum', 'hidrasyon', 'bilinc'] },
  { id: 'tani', etiket: 'Tanı (hekim)', grup: 'kapanis', anahtarlar: ['tani', 'teshis'] },
  { id: 'tedavi', etiket: 'Tedavi / plan', grup: 'kapanis', anahtarlar: ['tedavi', 'recete', 'plan'] },
]

const PEDIATRI: CekMadde[] = [
  { id: 'beslenme', etiket: 'Beslenme / alışkanlıklar', grup: 'anamnez', anahtarlar: ['beslenme', 'emzirme', 'mama'] },
  { id: 'asi', etiket: 'Aşı durumu', grup: 'anamnez', anahtarlar: ['asi', 'asisi', 'asi karnesi'], kapsam: 'dosya' },
  { id: 'prenatal', etiket: 'Prenatal / natal / postnatal öykü', grup: 'anamnez', anahtarlar: ['prenatal', 'dogum', 'natal', 'gebelik'], kapsam: 'dosya' },
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
  if (ped) {
    liste.push(...PEDIATRI)
    liste.push(...saglamCocukCekMaddeleri(g.hastaDogumIso, g.referansIso || undefined, g.pediKayitlari || undefined))
  }
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

const kacis = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Anahtar metinde bir kelimenin BAŞINDA geçiyor mu ("asi" "hastasi"nın içinde sayılmaz; "kalca" "kalçada"yı bulur). */
export function cekAnahtarVar(normalMetin: string, anahtar: string): boolean {
  const k = trAramaNormalize(anahtar)
  if (!k) return false
  return new RegExp(`(^|[^a-z0-9])${kacis(k)}`).test(normalMetin)
}

function maddeMetindeMi(m: CekMadde, normalMetin: string): boolean {
  return m.anahtarlar.some((a) => cekAnahtarVar(normalMetin, a))
}

/** 'dosya' kapsamındaki maddelerden dosya metninde (önceki onaylı notlar, kayıt formu, kayıtlar) karşılananlar. */
export function cekOncekiKarsilanan(maddeler: CekMadde[], dosyaMetni: string): string[] {
  const ham = trAramaNormalize(dosyaMetni)
  if (!ham) return []
  return maddeler.filter((m) => m.kapsam === 'dosya' && maddeMetindeMi(m, ham)).map((m) => m.id)
}

export function cekListeDogrula(
  maddeler: CekMadde[],
  g: { transcript?: string; soap?: string; isaretler?: Record<string, boolean>; oncekiIdler?: string[] },
): CekDogrulamaSatir[] {
  const ham = trAramaNormalize(`${g.transcript || ''} ${g.soap || ''}`)
  const onceki = new Set(g.oncekiIdler || [])
  return maddeler.map((m) => {
    const satir = { id: m.id, etiket: m.etiket, grup: m.grup }
    if (g.isaretler?.[m.id]) return { ...satir, durum: 'hekim' as const }
    if (maddeMetindeMi(m, ham)) return { ...satir, durum: 'dosyada' as const }
    if (m.kapsam === 'dosya' && onceki.has(m.id)) return { ...satir, durum: 'onceki' as const }
    return { ...satir, durum: 'eksik' as const }
  })
}

const DURUM_METNI: Record<CekDurum, string> = {
  hekim: '✓ hekim işaretledi',
  dosyada: '✓ notta var',
  onceki: '✓ önceki kayıtta var',
  eksik: '✗ eksik',
}

export const CEK_BLOK_BASLIK = 'ÇEK LİSTESİ DOĞRULAMA'

export function cekListeDogrulamaMetni(satirlar: CekDogrulamaSatir[]): string {
  const say = (d: CekDurum) => satirlar.filter((s) => s.durum === d).length
  const hekim = say('hekim'), notta = say('dosyada'), onceki = say('onceki')
  const eksik = satirlar.filter((s) => s.durum === 'eksik')
  return [
    `${CEK_BLOK_BASLIK} (karar desteği — tanı değildir)`,
    `${hekim + notta + onceki}/${satirlar.length} madde karşılandı (${hekim} hekim, ${notta} notta${onceki ? `, ${onceki} önceki kayıtta` : ''}).`,
    ...satirlar.map((s) => `- ${s.etiket}: ${DURUM_METNI[s.durum]}`),
    eksik.length
      ? `Eksik: ${eksik.map((s) => s.etiket).join('; ')}. Not gövdesine uydurulmadı.`
      : 'Çek listesinde boş madde kalmadı.',
  ].join('\n')
}

/** Nottaki alanlar tek metin — çek listesi yalnız notun GÜNCEL içeriğine bakar (transkript / LLM değil). */
export function cekNotMetni(n: {
  basvuruYakinmasi?: string | null
  subjektif?: string | null
  objektif?: string | null
  degerlendirme?: string | null
  plan?: string | null
  anamnez?: string | null
  fizikMuayene?: string | null
  tani?: string | null
  tedavi?: string | null
  vitaller?: Record<string, unknown> | null
  ilaclar?: unknown
  /** NOTYA-ASI-NOT-01: "Bu muayenede uygulanan aşılar" — a vaccine given in this visit satisfies "Aşı durumu". */
  asilar?: unknown
}): string {
  const p: string[] = []
  if (String(n.basvuruYakinmasi || '').trim()) p.push(`Başvuru yakınması: ${n.basvuruYakinmasi}`)
  for (const x of [n.subjektif, n.objektif, n.degerlendirme, n.anamnez, n.fizikMuayene, n.tedavi]) {
    if (String(x || '').trim()) p.push(String(x))
  }
  // Dolu plan bölümü planın kendisidir ("Tedavi / plan" maddesi başlık kelimesini aramasın).
  if (String(n.plan || '').trim()) p.push(`Plan: ${n.plan}`)
  if (String(n.tani || '').trim()) p.push(`Tanı: ${n.tani}`)
  const v = n.vitaller && typeof n.vitaller === 'object' ? Object.entries(n.vitaller).filter(([, d]) => String(d ?? '').trim()) : []
  if (v.length) p.push(v.map(([k, d]) => `${k}: ${d}`).join(' · '))
  if (Array.isArray(n.ilaclar)) {
    for (const i of n.ilaclar) {
      const o = (i || {}) as Record<string, unknown>
      const s = [o.ad, o.doz, o.kullanim, o.sure].filter(Boolean).join(' ')
      if (s.trim()) p.push(`İlaç: ${s}`)
    }
  }
  p.push(...notAsiMetinSatirlari(n.asilar))
  return p.join('\n')
}

const BLOK_SATIRI = [/^\d+\/\d+ madde karşılandı/, /^- .+: [✓✗✕×]/]
const BLOK_SONU = /^(Eksik: .*|Çek listesinde boş madde kalmadı\.?)$/

/** ai_degerlendirme içindeki ÇEK LİSTESİ bloğunun [başlangıç, bitiş) satır aralığı; yoksa null. */
function blokAraligi(satirlar: string[]): [number, number] | null {
  const bas = satirlar.findIndex((s) => s.trim().startsWith(CEK_BLOK_BASLIK))
  if (bas < 0) return null
  let i = bas + 1
  while (i < satirlar.length) {
    const s = satirlar[i].trim()
    if (BLOK_SONU.test(s)) { i++; break }
    if (!BLOK_SATIRI.some((r) => r.test(s))) break
    i++
  }
  return [bas, i]
}

export function cekBlokVarMi(aiDegerlendirme: string | null | undefined): boolean {
  return !!blokAraligi(String(aiDegerlendirme || '').split('\n'))
}

/** Hekimin işaretlediği maddeler — kayıtlı bloğun "✓ hekim işaretledi" satırlarından geri okunur. */
export function cekHekimIsaretleri(aiDegerlendirme: string | null | undefined, maddeler: CekMadde[]): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  const satirlar = String(aiDegerlendirme || '').split('\n')
  const ar = blokAraligi(satirlar)
  if (!ar) return out
  for (const s of satirlar.slice(ar[0], ar[1])) {
    const e = s.trim().match(/^- (.+?): ✓ hekim işaretledi$/)
    const m = e ? maddeler.find((x) => x.etiket === e[1].trim()) : undefined
    if (m) out[m.id] = true
  }
  return out
}

/** Bloğu metinden çıkarır — LLM (not-konsult) bu bloğu asla yazamaz / taşıyamaz. */
export function cekBlokSil(aiDegerlendirme: string | null | undefined): string {
  let satirlar = String(aiDegerlendirme || '').split('\n')
  for (let ar = blokAraligi(satirlar); ar; ar = blokAraligi(satirlar)) {
    satirlar = [...satirlar.slice(0, ar[0]), ...satirlar.slice(ar[1])]
  }
  return satirlar.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Bloğu güncel deterministik metinle değiştirir (bloğun eski yeri korunur; yoksa başa eklenir). */
export function cekBlokDegistir(aiDegerlendirme: string | null | undefined, yeniBlok: string): string {
  const satirlar = String(aiDegerlendirme || '').split('\n')
  const ar = blokAraligi(satirlar)
  if (!ar) {
    const govde = String(aiDegerlendirme || '').trim()
    return govde ? `${yeniBlok}\n\n${govde}` : yeniBlok
  }
  const once = satirlar.slice(0, ar[0]).join('\n').trim()
  const sonra = cekBlokSil(satirlar.slice(ar[1]).join('\n'))
  return [once, yeniBlok, sonra].filter(Boolean).join('\n\n')
}

export function cekListePromptBlogu(maddeler: CekMadde[], isaretler: Record<string, boolean>): string {
  if (!maddeler.length) return ''
  const satir = maddeler.map((m) => `- ${m.etiket}: ${isaretler[m.id] ? 'hekim işaretledi' : 'işaretlenmedi'}`).join('\n')
  return `\nÇEK LİSTESİ (hekim işaretleri — not gövdesine uydurma YASAK):\n${satir}\naiDegerlendirme'de de eksik madde listesi YAZMA: çek listesi sistem tarafından hesaplanıp ayrıca gösteriliyor (NOTYA-CEK-DOGRULA-03). Transkriptte olmayan bulguyu objektif/değerlendirme/plan'a YAZMA.`
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

/** Yeni seans / yeni muayene — önceki vizitin işaretleri hatırlatmayı körleştirmesin. */
export function cekListeSifirla(patientId: string | null | undefined): void {
  if (!patientId || typeof localStorage === 'undefined') return
  try { localStorage.removeItem(cekListeDepoAnahtari(patientId)) } catch { /* yok */ }
}
