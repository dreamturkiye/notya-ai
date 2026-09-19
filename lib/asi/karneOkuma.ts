/**
 * ASI-KARNESI-01 — aşı karnesi fotoğrafından/PDF'inden okuma (Tier A taslak → hekim onayı). Saf + istemci-güvenli.
 *
 * Kaynak: Dr. Gökhan Mamur (pediatri, beta hekim) — "hasta doktora 2 yaşındayken ilk kez geldi… doktoru aşı karnesinin
 * resmini çekip yüklesin, AI aşı karnesini okuyup tüm aşıları aşı kayıtlarına geçsin."
 * Kaan'ın kararı (2026-09-19): TOPLU ONAY + satır düzeltme; karneden gelenler klinikte uygulananlardan görsel olarak ayrı.
 *
 * Bu dosyanın taşıdığı güvenceler (testler: lib/asi/karneOkuma.test.ts):
 *  - OKUYAMADIĞINI UYDURMA: model "emin değilim" dediği ya da okunamayan alan bildirdiği satırda tarih/doz null olur,
 *    satır `okunamadi` işaretlenir. Eksik tarih (yalnız ay/yıl), takvim dışı tarih, gelecekteki ya da doğumdan önceki
 *    tarih de tahminle doldurulmaz — null + "okunamadı".
 *  - Eşleştirme SB Ulusal Aşı Takvimi'ne pediatri aşı motorunun seri eşleştirmesiyle (kayitSerisi) yapılır; takvim
 *    KOPYALANMAZ (lib/asi/ulusalAsiTakvimi.ts tek kaynak).
 *  - Onay: sunucu okunamadı satırı hekim düzeltmeden, aşı adı boş satırı ve geçersiz tarihi kabul etmez.
 */
import { kayitSerisi, SERI_AD, type OzelKod, type SeriKod } from '@/specialties/pediatri/engines/asiPlan'
import { OZEL_ASILAR } from '@/lib/asi/ulusalAsiTakvimi'

/** Kasa'da (medical_documents.category) karnenin görünen türü. */
export const KARNE_BELGE_KATEGORISI = 'Aşı karnesi'
/** Karneden aktarılan satırın rozeti — hekim listesi ve Sağlığım aynı metni kullanır. */
export const KARNE_ROZETI = 'Karneden aktarıldı · hekim onaylı'
/** asilar.notlar kanıt izi (belge_id kolonu yoksa da okunur). */
export const KARNE_NOT_ONEKI = 'Aşı karnesinden aktarıldı (hekim onaylı)'
export const OKUNAMADI_ETIKETI = 'Okunamadı — elle girin'
export const AZAMI_SATIR = 80
const AZAMI_AD = 120

export type KarneAlan = 'asi_adi' | 'doz_no' | 'uygulama_tarihi'

export interface KarneSatiri {
  /** İstemci anahtarı (satır düzenleme / çıkarma). */
  anahtar: string
  asiAdi: string
  dozNo: number | null
  /** YYYY-MM-DD; okunamadıysa ya da karnede yoksa null — ASLA tahmin edilmez. */
  uygulamaTarihi: string | null
  okunamadi: boolean
  /** Hekime gösterilen kısa neden ("tarih okunamadı", "gelecekte bir tarih" …). */
  okunamadiNedeni: string | null
  /** Karnede yazan hâli (hekim fotoğrafla karşılaştırsın). */
  hamMetin: string | null
}

export type Okunabilirlik = 'iyi' | 'kismi' | 'dusuk'

export interface KarneOkumaSonucu {
  satirlar: KarneSatiri[]
  okunabilirlik: Okunabilirlik
  /** Karnede basılı/yazılı doğum tarihi (kimlik kontrolü için; kaydedilmez). */
  karneDogumTarihi: string | null
  /** Belge aşı karnesi değilse false. */
  asiKarnesiMi: boolean
  not: string | null
}

export class KarneOkumaHatasi extends Error {
  constructor(message = 'Karne okunamadı.') {
    super(message)
    this.name = 'KarneOkumaHatasi'
  }
}

// ─── Model talimatı (sabit — prompt caching'e uygun; hasta verisi içermez) ─────────────────────────────
export const KARNE_SISTEM = `Sen bir aşı karnesi (Türkiye — T.C. Sağlık Bakanlığı / aile sağlığı merkezi aşı kartı, özel hastane aşı kartı, yurt dışı aşı kartı) okuyucususun. Görevin YALNIZ belgede yazanı aktarmak; klinik yorum, öneri, eksik aşı çıkarımı YAPMAZSIN.

KESİN KURALLAR:
1. Uydurma yok. Bir alanı net okuyamıyorsan o alanı null yaz ve "okunamayan_alanlar" listesine ekle. Satırdan emin değilsen "emin": false yaz.
2. Tarihi takvimden, sıradan, komşu satırlardan veya çocuğun yaşından TAHMİN ETME. Gün, ay ve yıl üçü de okunmuyorsa tarih null.
3. Doz numarasını yalnız karnede yazıyorsa (satırda ya da açıkça sütun başlığında "1. doz", "2. doz", "rapel" gibi) ver; yoksa null (bu "okunamadı" değildir, yalnız belirtilmemiştir). Rapel/pekiştirme için doz_no null, ham_metin'de "rapel" kalsın.
4. Yalnız YAPILMIŞ aşıları listele: tarihi, kaşesi, imzası ya da etiketi (barkod/lot) olan hücreler. Boş hücreleri, takvimin basılı ama doldurulmamış satırlarını listeleme.
5. Aşı adını karnede yazdığı gibi, kısaltmayı açmadan ver (ör. "KPA", "DaBT-İPA-Hib", "Hexaxim", "KKK"). Ticari ad yazıyorsa ticari adı ver.
6. Tarih biçimi: YYYY-MM-DD. Türkiye karnelerinde tarih gün.ay.yıl yazılır (05.03.2021 = 2021-03-05).
7. Kişi adı, T.C. kimlik no, adres, telefon AKTARMA. Yalnız doğum tarihi (kimlik kontrolü için) "dogum_tarihi" alanına.
8. Belge aşı karnesi değilse "asi_karnesi": false ve boş "satirlar".

YALNIZ şu JSON'u döndür, başka metin yok:
{"asi_karnesi": true, "okunabilirlik": "iyi" | "kismi" | "dusuk", "dogum_tarihi": "YYYY-MM-DD" | null, "satirlar": [{"asi_adi": string | null, "doz_no": number | null, "uygulama_tarihi": "YYYY-MM-DD" | null, "ham_metin": string, "emin": boolean, "okunamayan_alanlar": ["asi_adi" | "doz_no" | "uygulama_tarihi"]}], "not": string | null}`

export const KARNE_KULLANICI_METNI = 'Bu aşı karnesindeki yapılmış tüm aşıları kurallara göre çıkar. Okuyamadığın alanı null bırak. Yalnızca JSON.'

// ─── Tarih ───────────────────────────────────────────────────────────────────────────────────────────
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

function takvimGunuMu(iso: string): boolean {
  const m = ISO.exec(iso)
  if (!m) return false
  const [y, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(y, a - 1, g))
  return d.getUTCFullYear() === y && d.getUTCMonth() === a - 1 && d.getUTCDate() === g
}

/**
 * Tarih kabul kuralı — hem okumada hem onayda aynı. Tahmin yok: geçersizse null + neden.
 * `dogumIso` bilinmiyorsa alt sınır 1900.
 */
export function asiTarihiDogrula(ham: unknown, bugunIso: string, dogumIso: string | null): { tarih: string | null; neden: string | null } {
  if (ham == null || ham === '') return { tarih: null, neden: null }
  const s = String(ham).trim().slice(0, 10)
  if (!takvimGunuMu(s)) return { tarih: null, neden: 'tarih tam okunamadı' }
  if (s > bugunIso) return { tarih: null, neden: 'gelecekte bir tarih' }
  if (s < '1900-01-01') return { tarih: null, neden: 'geçersiz tarih' }
  if (dogumIso && ISO.test(dogumIso) && s < dogumIso) return { tarih: null, neden: 'doğum tarihinden önce' }
  return { tarih: s, neden: null }
}

function dozCoz(ham: unknown): { doz: number | null; gecersiz: boolean } {
  if (ham == null || ham === '') return { doz: null, gecersiz: false }
  const n = typeof ham === 'number' ? ham : Number(String(ham).trim())
  if (Number.isInteger(n) && n >= 1 && n <= 10) return { doz: n, gecersiz: false }
  return { doz: null, gecersiz: true }
}

const adTemizle = (ham: unknown): string => (typeof ham === 'string' ? ham.replace(/\s+/g, ' ').trim().slice(0, AZAMI_AD) : '')

// ─── Model yanıtı → satırlar ───────────────────────────────────────────────────────────────────────────
/** Yanıttan JSON nesnesini çıkarır; kesik/bozuk yanıtta KarneOkumaHatasi (hekime ham JSON gösterilmez — F3). */
export function karneJsonuAyikla(ham: string): Record<string, unknown> {
  const temiz = String(ham || '').replace(/```json|```/g, '')
  const bas = temiz.indexOf('{'), son = temiz.lastIndexOf('}')
  if (bas === -1 || son <= bas) throw new KarneOkumaHatasi()
  try {
    const j = JSON.parse(temiz.slice(bas, son + 1))
    if (!j || typeof j !== 'object' || Array.isArray(j)) throw new KarneOkumaHatasi()
    return j as Record<string, unknown>
  } catch {
    throw new KarneOkumaHatasi()
  }
}

export function karneYanitiniCoz(ham: string, bag: { bugunIso: string; dogumIso: string | null }): KarneOkumaSonucu {
  const j = karneJsonuAyikla(ham)
  const hamSatirlar = Array.isArray(j.satirlar) ? (j.satirlar as unknown[]).slice(0, AZAMI_SATIR) : []
  const satirlar: KarneSatiri[] = []
  hamSatirlar.forEach((x, i) => {
    if (!x || typeof x !== 'object') return
    const r = x as Record<string, unknown>
    const okunamayan = new Set((Array.isArray(r.okunamayan_alanlar) ? r.okunamayan_alanlar : []).map(String))
    const emin = r.emin !== false
    const nedenler: string[] = []

    const asiAdi = okunamayan.has('asi_adi') ? '' : adTemizle(r.asi_adi)
    if (!asiAdi) nedenler.push('aşı adı okunamadı')

    let dozNo: number | null = null
    let uygulamaTarihi: string | null = null
    if (!emin) {
      // Model satırdan emin değil: verdiği tarih/doz tahmin olabilir → hiçbiri aktarılmaz.
      nedenler.push('okuma belirsiz')
    } else {
      if (okunamayan.has('doz_no')) nedenler.push('doz okunamadı')
      else { const d = dozCoz(r.doz_no); dozNo = d.doz; if (d.gecersiz) nedenler.push('doz okunamadı') }
      if (okunamayan.has('uygulama_tarihi')) nedenler.push('tarih okunamadı')
      else { const t = asiTarihiDogrula(r.uygulama_tarihi, bag.bugunIso, bag.dogumIso); uygulamaTarihi = t.tarih; if (t.neden) nedenler.push(t.neden) }
    }

    const hamMetin = typeof r.ham_metin === 'string' && r.ham_metin.trim() ? r.ham_metin.trim().slice(0, 200) : null
    if (!asiAdi && !uygulamaTarihi && !hamMetin) return
    satirlar.push({
      anahtar: `k${i + 1}`,
      asiAdi,
      dozNo,
      uygulamaTarihi,
      okunamadi: nedenler.length > 0,
      okunamadiNedeni: nedenler.length ? Array.from(new Set(nedenler)).join(', ') : null,
      hamMetin,
    })
  })
  const okunabilirlik: Okunabilirlik = j.okunabilirlik === 'iyi' || j.okunabilirlik === 'kismi' ? j.okunabilirlik : 'dusuk'
  const karneDogum = asiTarihiDogrula(j.dogum_tarihi, bag.bugunIso, null).tarih
  return {
    satirlar,
    okunabilirlik: satirlar.length === 0 ? 'dusuk' : okunabilirlik,
    karneDogumTarihi: karneDogum,
    asiKarnesiMi: j.asi_karnesi !== false,
    not: typeof j.not === 'string' && j.not.trim() ? j.not.trim().slice(0, 300) : null,
  }
}

/** Karnedeki doğum tarihi hastanınkiyle çelişiyorsa hekime uyarı (yanlış çocuğun karnesi). Kaydedilmez. */
export function karneKimlikUyarisi(karneDogumIso: string | null, hastaDogumIso: string | null): string | null {
  if (!karneDogumIso || !hastaDogumIso || !ISO.test(hastaDogumIso.slice(0, 10))) return null
  return karneDogumIso === hastaDogumIso.slice(0, 10)
    ? null
    : `Karnedeki doğum tarihi (${trTarih(karneDogumIso)}) bu hastanın kayıtlı doğum tarihiyle eşleşmiyor. Doğru hastanın karnesi olduğunu kontrol edin.`
}

// ─── SB Ulusal Aşı Takvimi eşleştirmesi ───────────────────────────────────────────────────────────────
export type KarneEslesme =
  | { grup: 'takvim'; seri: SeriKod; etiket: string }
  | { grup: 'ozel'; kod: OzelKod; etiket: string }
  | { grup: 'takvim_disi'; etiket: string }

const OZEL_ETIKET: Record<OzelKod, RegExp> = { rota: /rota/i, menacwy: /acwy/i, menb: /meningokok b/i, grip: /influenza|grip/i, hpv: /hpv/i }

/** Pediatri aşı motorunun seri eşleştirmesi (kayitSerisi) — takvim ve özel aşı listesi tek kaynaktan. */
export function takvimEslestir(asiAdi: string): KarneEslesme {
  const k = asiAdi.trim() ? kayitSerisi(asiAdi) : null
  if (!k) return { grup: 'takvim_disi', etiket: 'Takvim dışı aşı' }
  if (k in SERI_AD) return { grup: 'takvim', seri: k as SeriKod, etiket: `SB takvimi · ${SERI_AD[k as SeriKod]}` }
  const ozel = OZEL_ASILAR.find((o) => OZEL_ETIKET[k as OzelKod].test(o.ad))
  return { grup: 'ozel', kod: k as OzelKod, etiket: `Özel aşı · ${ozel?.ad || k}` }
}

// ─── Onay (sunucu) ───────────────────────────────────────────────────────────────────────────────────
export interface OnayliSatir { asiAdi: string; dozNo: number | null; uygulamaTarihi: string | null }

/**
 * Toplu onay gövdesi. Hekimin düzelttiği değer AYNEN kaydedilir; kural ihlalinde tüm istek reddedilir (yarım kayıt yok).
 *  - aşı adı zorunlu
 *  - `okunamadi` satır ancak hekim düzelttiyse/kontrol ettiyse (`hekimDuzeltti`)
 *  - tarih: takvim günü, gelecekte değil, doğumdan önce değil; doz 1–10 tamsayı
 */
export function onaySatirlariniDogrula(girdi: unknown, bag: { bugunIso: string; dogumIso: string | null }): { satirlar: OnayliSatir[] } | { hata: string } {
  if (!Array.isArray(girdi) || girdi.length === 0) return { hata: 'Onaylanacak satır yok.' }
  if (girdi.length > AZAMI_SATIR) return { hata: `En fazla ${AZAMI_SATIR} satır onaylanabilir.` }
  const out: OnayliSatir[] = []
  for (let i = 0; i < girdi.length; i++) {
    const n = i + 1
    const r = (girdi[i] && typeof girdi[i] === 'object' ? girdi[i] : {}) as Record<string, unknown>
    if (r.okunamadi === true && r.hekimDuzeltti !== true) return { hata: `${n}. satır "okunamadı" olarak işaretli — düzeltin ya da çıkarın.` }
    const asiAdi = adTemizle(r.asiAdi)
    if (!asiAdi) return { hata: `${n}. satırda aşı adı boş.` }
    const d = dozCoz(r.dozNo)
    if (d.gecersiz) return { hata: `${n}. satırda doz numarası geçersiz (1–10).` }
    const t = asiTarihiDogrula(r.uygulamaTarihi, bag.bugunIso, bag.dogumIso)
    if (t.neden) return { hata: `${n}. satırda tarih kabul edilmedi: ${t.neden}.` }
    out.push({ asiAdi, dozNo: d.doz, uygulamaTarihi: t.tarih })
  }
  return { satirlar: out }
}

/** Uygulandığı yaşa göre (yoksa bugünkü yaşa göre) kategori; doğum bilinmiyorsa takvim eşleşmesine göre. */
export function karneKategorisi(dogumIso: string | null, uygulamaIso: string | null, bugunIso: string, asiAdi: string): 'pediatrik' | 'yetiskin' {
  const dogum = dogumIso && ISO.test(dogumIso.slice(0, 10)) ? dogumIso.slice(0, 10) : null
  if (dogum) {
    const an = uygulamaIso || bugunIso
    const on8 = `${Number(dogum.slice(0, 4)) + 18}${dogum.slice(4)}`
    return an < on8 ? 'pediatrik' : 'yetiskin'
  }
  const e = takvimEslestir(asiAdi)
  return e.grup === 'takvim' && e.seri !== 'td' ? 'pediatrik' : 'yetiskin'
}

// ─── Görsel ayrım (Kaan'ın kararı) ───────────────────────────────────────────────────────────────────
export type AsiKaynakTuru = 'karne' | 'beyan' | 'klinik'

/** Karneden aktarılan = kaynak 'beyan' + kanıt izi (belge_id ya da not öneki). */
export function asiKaynakTuru(a: { kaynak?: string | null; belge_id?: string | null; notlar?: string | null }): AsiKaynakTuru {
  if (a.kaynak !== 'beyan') return 'klinik'
  return a.belge_id || String(a.notlar || '').startsWith(KARNE_NOT_ONEKI) ? 'karne' : 'beyan'
}

/** Hekim listesi rozeti (Rozet tonu lib/doktor/aracUi). `beyanEtiketi` hitap kuralından (hasta / veli yaşa göre). */
export function asiKaynakRozeti(tur: AsiKaynakTuru, beyanEtiketi: string): { metin: string; ton: 'bilgi' | 'notr' | 'iyi' } {
  if (tur === 'karne') return { metin: KARNE_ROZETI, ton: 'bilgi' }
  if (tur === 'beyan') return { metin: beyanEtiketi, ton: 'notr' }
  return { metin: 'Bu klinikte uygulandı', ton: 'iyi' }
}

export function trTarih(iso: string): string {
  const m = ISO.exec(iso.slice(0, 10))
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}
