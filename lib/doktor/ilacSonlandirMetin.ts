/**
 * NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25) — muayene notu bir ilacı kestiğinde
 * ("Klacid süspansiyon ve Calpol şurubu keselim", "iptal edildi", "artık vermiyoruz") o ilaç hastanın
 * İlaçlar listesinde de sonlandırılır. Bu dosya SAF ve istemci-güvenli: Türkçe cümle okuması, ön
 * kontrol, model yanıtının doğrulanması, bildirim metni. Sunucu tarafı (veritabanı + model) →
 * lib/doktor/ilacSonlandir.ts.
 *
 * Güvenlik ilkesi: şüphede DURDURMA. Model bir ilacı "kesildi" dese bile, alıntıladığı cümlede o ilacın
 * adı ve olumlu bir kesme fiili geçmeli; olumsuzluk (kesmeyelim, devam etsin) veya koşul/erteleme
 * (ateş düşerse, 3 gün sonra) varsa satıra dokunulmaz.
 */
import { anlamliKelimeler } from './receteAktarim'

/** Sonlandırılan satırın notlar alanının başına yazılan gerekçe öneki (Geri al bunu tanır). */
export const SONLANDIRMA_ONEKI = 'Muayene notunda sonlandırıldı'

/** Türkçe küçük harf + ASCII katlama. Kesme işareti boşluk olur ("Klacid'i" → "klacid i"). */
export function katla(s: string): string {
  return String(s || '')
    .replace(/[’'`´]/g, ' ')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u')
    .replace(/̇/g, '')
}

const S = '(?<![a-z0-9])'
const B = '(?![a-z0-9])'
const r = (govde: string) => new RegExp(S + govde, 'u')

/** Olumlu kesme ifadeleri (katlanmış metin üzerinde). */
const KESME: RegExp[] = [
  r(`kes(elim|iyoruz|iyorum|tik|tim|ti|tiler|ildi|ilmis\\w*|ilsin|ilmeli|ilmesi|ilecek|ilir|meli|iniz|sin|ecegiz)${B}`),
  r('iptal'),
  r('sonlandir(?!may|miy|mam|maz|ma(?![a-z]))\\w*'),
  r(`birak(sin|ilsin|ildi|ilmis\\w*|ti|tik|tilar|iyoruz|alim|mali|ilmali|ilacak|acak)${B}`),
  r('durdur(?!may|miy|mam|maz|ma(?![a-z]))\\w*'),
  r(`ver(miyoruz|meyelim|meyin|mesin|ilmesin|ilmeyecek|meyecegiz|ilmiyor|miyorlar)${B}`),
  r(`kullan(masin|mayacak|mayalim|mayin|ilmasin|ilmayacak|miyor|mayi\\s+birak)\\w*`),
  r(`devam\\s+(etmesin|edilmesin|etmeyelim|etmeyecek|edilmeyecek|etmiyoruz|etmeyin)${B}`),
  r(`(listeden|tedaviden)\\s+cikar\\w*`),
  r(`yerine${B}`),
  r(`(bitti|bitirildi|bitirelim|tamamlandi)${B}`),
  r(`stop${B}`),
]

const YERINE = r(`yerine${B}`)

/** Olumsuz / devam ifadeleri — varsa kesme sayılmaz. ("kesmeli/bırakmalı" olumludur, burada yakalanmaz.) */
const DEVAM: RegExp[] = [
  r('kes(mey|miy|mem|mez)\\w*'), r(`kesme${B}`), r(`kesilmesin${B}`), r('kesil(mey|miy|mem|mez)\\w*'),
  r('sonlandir(may|miy|mam|maz)\\w*'), r(`sonlandirma${B}`),
  r('birak(may|miy|mam|maz)\\w*'), r(`birak(ma|masin|ilmasin)${B}`),
  r('durdur(may|miy|mam|maz)\\w*'), r(`durdurma${B}`),
  r('iptal\\s+et(mey|miy|mem|mez)\\w*'), r(`iptal\\s+etme${B}`),
  r('degistir(mey|miy|mem|mez)\\w*'),
  r('surdur\\w*'),
  r('devamli'),
  r(`devam${B}(?!\\s+(etmesin|edilmesin|etmeyelim|etmeyecek|edilmeyecek|etmiyoruz|etmeyin)${B})`),
]

/** Koşul / erteleme / belirsizlik — otomatik kesme YOK. */
const KOSUL: RegExp[] = [
  r(`\\w+(rsa|rse|msa|mse|ysa|yse|zsa|zse|ksa|kse|ssa|sse|nsa|nse|lsa|lse)${B}`),
  r(`(ise|eger|gerekirse|durumunda|halinde|takdirde)${B}`),
  r(`\\d+\\s*(gun|hafta|ay)\\s*(sonra|icinde)${B}`),
  r(`(sonra|kadar|yarin|haftaya|kontrolde|ileride)${B}`),
  r('(dusunul|planlan|degerlendiril)\\w*'),
  r(`\\w*(ebilir|abilir|ebiliriz|abiliriz|ilebilir|ulabilir)\\w*`),
  r(`(belki|muhtemelen|olasi)${B}`),
]

const eslesir = (liste: RegExp[], metin: string) => liste.some((x) => x.test(metin))

export type CumleTuru = 'dur' | 'devam' | 'kosullu' | 'belirsiz' | null

/**
 * Tek bir yan cümleyi (katlanmamış) sınıflar:
 *  - 'kosullu'  : koşul/erteleme/olasılık var → dokunma
 *  - 'belirsiz' : aynı yan cümlede hem kesme hem devam ifadesi → dokunma
 *  - 'devam'    : yalnız olumsuz/devam ifadesi
 *  - 'dur'      : yalnız olumlu kesme ifadesi
 *  - null       : ikisi de yok
 */
export function cumleSiniflandir(cumle: string, kelimeler?: string[]): CumleTuru {
  const k = katla(cumle)
  let dur = eslesir(KESME, k)
  // "Klacid yerine Augmentin başlandı": yalnız "yerine"den ÖNCE geçen ilaç kesilir.
  if (dur && kelimeler?.length && KESME.filter((x) => x.test(k)).length === 1 && YERINE.test(k)) {
    const once = k.slice(0, k.search(YERINE))
    if (!kelimeGeciyor(once, kelimeler)) dur = false
  }
  const devam = eslesir(DEVAM, k)
  if (!dur && !devam) return null
  if (eslesir(KOSUL, k)) return 'kosullu'
  if (dur && devam) return 'belirsiz'
  return dur ? 'dur' : 'devam'
}

/**
 * Metni cümlelere, her cümleyi yan cümlelere böler (virgül, noktalı virgül, "ama/fakat/ancak").
 * Ondalık nokta ("2.5 ml") cümle sonu sayılmaz.
 */
export function cumleler(metin: string): string[][] {
  return String(metin || '')
    .split(/[.!?](?=\s|$)|[\n\r]+/u)
    .map((c) => c.split(/[;,]|\s+(?:ama|fakat|ancak|lakin)\s+/iu).map((x) => x.trim()).filter(Boolean))
    .filter((c) => c.length > 0)
}

/** Düz yan cümle listesi (cümle sınırları kaybolur). */
export function yanCumleler(metin: string): string[] {
  return cumleler(metin).flat()
}

/**
 * Bir cümlede i. yan cümlede geçen ilacın hükmü: yan cümlede fiil yoksa ("Klacid, Calpol ve Ventolin
 * kesildi") aynı cümlenin sonraki yan cümlelerinden gelir — cümle sınırını ASLA aşmaz.
 */
function yanCumleHukmu(cumle: string[], i: number, kelimeler?: string[]): CumleTuru {
  for (let j = i; j < cumle.length; j++) {
    const h = cumleSiniflandir(cumle[j], kelimeler)
    if (h) return h
  }
  return null
}

/** Bir ilaç adının (ve varsa etken maddesinin) anlamlı kelimeleri, katlanmış. */
export function adKelimeleri(...adlar: (string | null | undefined)[]): string[] {
  const out = new Set<string>()
  for (const ad of adlar) for (const k of anlamliKelimeler(String(ad || ''))) out.add(katla(k))
  return [...out].filter((k) => k.length >= 4)
}

/** Yan cümlede bu kelimelerden biri (Türkçe ek alabilir: "calpolu", "klacid i") geçiyor mu? */
export function kelimeGeciyor(cumle: string, kelimeler: string[]): boolean {
  if (!kelimeler.length) return false
  const tokenlar = katla(cumle).split(/[^a-z0-9]+/).filter(Boolean)
  return tokenlar.some((t) => kelimeler.some((k) => t.startsWith(k)))
}

/**
 * Metinde bu ilacı (kelimeleri) içeren yan cümlenin hükmü. Adın geçtiği yan cümlede fiil yoksa
 * ("Klacid, Calpol ve Ventolin kesildi") hüküm sonraki yan cümlelerden gelir. Birden çok geçiş
 * varsa: herhangi biri devam/koşul/belirsiz ise sonuç o (şüphede durdurma); yalnız 'dur' → 'dur'.
 */
export function ilacHukmu(metin: string, kelimeler: string[]): CumleTuru {
  const hukumler: CumleTuru[] = []
  for (const cumle of cumleler(metin)) {
    for (let i = 0; i < cumle.length; i++) {
      if (kelimeGeciyor(cumle[i], kelimeler)) hukumler.push(yanCumleHukmu(cumle, i, kelimeler))
    }
  }
  const anlamli = hukumler.filter((h): h is Exclude<CumleTuru, null> => h !== null)
  if (!anlamli.length) return null
  if (anlamli.some((h) => h !== 'dur')) return anlamli.find((h) => h !== 'dur')!
  return 'dur'
}

/** Katlanmış marka ilk kelimesi bilinen bir ilaç mı? (sunucu SGK listesinden verir; yoksa her zaman false) */
export type MarkaSorgu = (kelime: string) => boolean

/**
 * Ucuz ön kontrol — modele gitmeye değer mi? Metinde olumlu bir kesme hükmü taşıyan ve bir ilaç adı
 * (aktif listedeki ad/etken madde ya da bilinen bir marka) geçen yan cümle varsa evet.
 */
export function durdurmaOnKontrol(
  metin: string,
  aktifler: { ilac_adi: string | null; etken_madde?: string | null }[],
  markaMi: MarkaSorgu = () => false,
): boolean {
  if (!aktifler.length || !String(metin || '').trim()) return false
  const kelimeler = adKelimeleri(...aktifler.flatMap((a) => [a.ilac_adi, a.etken_madde]))
  for (const cumle of cumleler(metin)) {
    for (let i = 0; i < cumle.length; i++) {
      const ilacVar = kelimeGeciyor(cumle[i], kelimeler) ||
        katla(cumle[i]).split(/[^a-z0-9]+/).some((t) => t.length >= 4 && markaMi(t))
      if (ilacVar && yanCumleHukmu(cumle, i) === 'dur') return true
    }
  }
  return false
}

const bosluk = (s: string) => katla(s).replace(/\s+/g, ' ').trim()

/** Alıntı notta birebir (boşluk/büyük-küçük harf farkı yok sayılarak) geçiyor mu? */
export function alintiNottaMi(alinti: string, notMetni: string): boolean {
  const a = bosluk(alinti)
  return a.length >= 6 && bosluk(notMetni).includes(a)
}

/** Modelin tek bir önerisini doğrular: alıntı notta, ad alıntıda, alıntıda o ilacın hükmü 'dur'. */
export function oneriGecerliMi(
  o: { alinti: string; notAdi: string },
  ilac: { ilac_adi: string | null; etken_madde?: string | null },
  notMetni: string,
): boolean {
  if (!alintiNottaMi(o.alinti, notMetni)) return false
  const kelimeler = [...new Set([...adKelimeleri(o.notAdi), ...adKelimeleri(ilac.ilac_adi, ilac.etken_madde)])]
  if (!kelimeGeciyor(o.alinti, kelimeler)) return false
  return ilacHukmu(o.alinti, kelimeler) === 'dur'
}

/** Alıntıyı gerekçeye sığdırır: tek satır, en çok 160 karakter, tırnak içinde tırnak yok. */
export function alintiKisalt(alinti: string): string {
  const t = String(alinti || '').replace(/[“”"]/g, "'").replace(/\s+/g, ' ').trim()
  return t.length > 160 ? t.slice(0, 157).trimEnd() + '…' : t
}

/** Satırın notlar alanına yazılan gerekçe: Muayene notunda sonlandırıldı: “<alıntı>” · <eski not>. */
export function sonlandirmaGerekcesi(alinti: string, eskiNot: string | null | undefined): string {
  const g = `${SONLANDIRMA_ONEKI}: “${alintiKisalt(alinti)}”`
  const eski = String(eskiNot || '').trim()
  return eski ? `${g} · ${eski}` : g
}

/** Geri al: gerekçe önekini kaldırıp eski notu döndürür; önek yoksa null (bu satır bizim değil). */
export function gerekceyiKaldir(notlar: string | null | undefined): string | null {
  const m = String(notlar || '').match(new RegExp(`^${SONLANDIRMA_ONEKI}: “[^”]*”(?: · ([\\s\\S]*))?$`))
  if (!m) return null
  return m[1] ? m[1] : ''
}

/** "A", "A ve B", "A, B ve C". */
export function adlariBirlestir(adlar: string[]): string {
  const a = adlar.map((x) => x.trim()).filter(Boolean)
  if (a.length <= 1) return a[0] || ''
  return `${a.slice(0, -1).join(', ')} ve ${a[a.length - 1]}`
}

/** Onay sonrası tek sakin satır. */
export function sonlandirmaMesaji(adlar: string[]): string {
  const a = adlariBirlestir(adlar)
  return a ? `${a} ilaç listesinden sonlandırıldı.` : ''
}

/**
 * İlaç uyum kartı (IlacUyumKarti) ile tutarlılık: Plan'a göre çıkarılan listede, aynı Plan metninin
 * açıkça kestiği bir ilaç varsa öneriden düşülür — kart notun kestiği ilacı listeye geri eklemesin.
 */
export function notunKestigiIlaclariCikar<T extends { ad: string }>(oneri: T[], planMetni: string): T[] {
  return oneri.filter((i) => ilacHukmu(planMetni, adKelimeleri(i.ad)) !== 'dur')
}
