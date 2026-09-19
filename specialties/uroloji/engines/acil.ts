/**
 * UROLOJI-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj (ayaktan üroloji). SAF fonksiyon.
 *
 * Makroskopik hematüri, anüri/retansiyon, flank+ateş (taş/pyelo), torsiyon, priapizm, üretra travması
 * → "gecikme yok". PORTAL MESAJI ile yönetilmez. Tanı dili yok; yalnız eylem. Karar hekimindir
 * (uro_risk.hekim_onay).
 */
import type { Dipnot } from './uroloji'

export type AcilKod =
  | 'hematuri_makroskopik'
  | 'anuri_retansiyon'
  | 'flank_ates'
  | 'torsiyon_suphesi'
  | 'priapizm'
  | 'travma_uretra'

export interface AcilBayrak {
  kod: AcilKod
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}

const KURALLAR: Array<{
  kod: AcilKod
  re: RegExp
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun'
  dipnot: Dipnot
}> = [
  {
    kod: 'hematuri_makroskopik',
    re: /idrarda kan|kanl[ıi] idrar|makroskopik hemat[üu]ri|idrar[ıi]m k[ıi]rm[ıi]z[ıi]|gözle g[öo]r[üu]l[üu]r.*kan/i,
    ad: 'Gözle görülür idrar kanaması (makroskopik hematüri)',
    eylem: 'Aynı gün üroloji değerlendirmesi gerekir; ulaşamıyorsanız en yakın acile başvurun. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TUD', not: 'Makroskopik hematüri — ayaktan randevu sırası beklenmez; acil değerlendirme' },
  },
  {
    kod: 'anuri_retansiyon',
    re: /idrar yapam[ıi]yor|idrar tutuk|retansiyon|an[üu]ri|mesane dolu.*bo[şs]alam|kateter.*acil/i,
    ad: 'İdrar yapamama / akut üriner retansiyon',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Mesane boşaltılamıyorsa beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_URO', not: 'Akut retansiyon / anüri — acil boşaltım; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'flank_ates',
    re: /yan a[ğg]r[ıi].{0,40}ate[şs]|ate[şs].{0,40}yan a[ğg]r|b[öo]brek a[ğg]r[ıi].{0,30}ate[şs]|flank.{0,30}fever|ta[şs].{0,40}ate[şs]/i,
    ad: 'Yan / bel ağrısı ile ateş (taş / piyelonefrit şüphesi)',
    eylem: 'Ateşli yan ağrısında aynı gün acil başvuru gerekir; 112 veya en yakın acil. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TUD', not: 'Flank + ateş — obstrüksiyon / enfeksiyon acil ayrımı hekimde; ayaktan beklenmez' },
  },
  {
    kod: 'torsiyon_suphesi',
    re: /testis.{0,30}(ani|şiddetli|d[öo]nme)|skrotum.{0,20}ani|torsiyon|yumurta.{0,20}ani a[ğg]r/i,
    ad: 'Testis torsiyonu şüphesi',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Saatler içinde değerlendirme gerekir; beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TUD', not: 'Torsiyon şüphesi — zaman kritik; ayaktan randevu uygun değildir' },
  },
  {
    kod: 'priapizm',
    re: /priapizm|ereksiyon.{0,30}(ge[çc]m|saatler|4 saat|ağrılı)|ağrılı ereksiyon/i,
    ad: 'Priapizm (uzamış / ağrılı ereksiyon)',
    eylem: '4 saati aşan veya ağrılı ereksiyonda hemen acile başvurun; 112. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TUD', not: 'Priapizm — acil müdahale penceresi; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'travma_uretra',
    re: /[üu]retra.{0,30}travma|pelvis.{0,20}k[ıi]r[ıi]k|idrarda kan.{0,30}travma|kateter.{0,20}zorla|perine.{0,20}darbe/i,
    ad: 'Üretra / pelvik travma şüphesi',
    eylem: 'En yakın acile başvurun; bilinç değişikliği varsa 112. Körlemesine kateter denemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_URO', not: 'Üretra travması — acil değerlendirme; kör kateterizasyon yapılmaz' },
  },
]

function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = trKucuk(metinler.filter(Boolean).join(' \n '))
  const bulunan = new Map<AcilKod, AcilBayrak>()
  for (const k of KURALLAR) {
    if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) {
      bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
    }
  }
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

export const HASTA_ACIL_METNI =
  'İdrarınızda gözle görülür kan varsa, idrar yapamıyorsanız, yan ağrınızla birlikte ateşiniz varsa, testislerde ani şiddetli ağrı, uzamış ağrılı ereksiyon veya üretra/pelvis travması yaşadıysanız portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerUroloji` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Gözle görülür idrar kanaması', kod: 'hematuri_makroskopik' },
  { etiket: 'İdrar yapamama / mesaneyi boşaltamama', kod: 'anuri_retansiyon' },
  { etiket: 'Yan veya bel ağrısı ile ateş', kod: 'flank_ates' },
  { etiket: 'Testiste ani şiddetli ağrı (torsiyon şüphesi)', kod: 'torsiyon_suphesi' },
  { etiket: 'Uzamış veya ağrılı ereksiyon (priapizm)', kod: 'priapizm' },
  { etiket: 'Üretra veya pelvis bölgesine darbe / travma', kod: 'travma_uretra' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Şikâyetin başlangıç zamanı ve ani mi sinsi mi olduğu kaydedildi',
  'Makroskopik hematüri / pıhtı sorgulandı',
  'İdrar yapabilme / retansiyon durumu değerlendirildi',
  'Ateş ve yan / bel ağrısı birlikte sorgulandı',
  'Testis / skrotum ani ağrı ve torsiyon şüphesi değerlendirildi',
  'Priapizm süresi ve travma öyküsü sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
