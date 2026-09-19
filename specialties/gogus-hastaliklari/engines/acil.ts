/**
 * GOGUS-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj kapısı (ayaktan göğüs). SAF fonksiyon.
 * Masif hemoptizi, hipoksi + solunum sıkıntısı, pnömotoraks şüphesi, stridor, anafilaksi → "gecikme yok".
 * Portal mesajı ile yönetilmez. Tanı dili yoktur. gogus-cerrahisi OR akışı buraya girmez.
 */
import type { Dipnot } from './gogus'

export type AcilKod =
  | 'masif_hemoptizi'
  | 'hipoksi_solunum'
  | 'pnomotoraks_suphe'
  | 'stridor_ust_yol'
  | 'anafilaksi'
  | 'gogus_agrisi_nefes'

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
    kod: 'masif_hemoptizi',
    re: /masif hemoptizi|bol (miktarda )?kanl[ıi] balgam|a[ğg][ıi]zdan (bol )?kan|hemoptizi[^.]{0,30}(bol|yo[ğg]un|durm)/i,
    ad: 'Masif / bol kanlı balgam (hemoptizi)',
    eylem: 'Hemen 112’yi arayın. Oturur pozisyonda kalın; bol kanlı balgam ayaktan randevu ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTD', not: 'Masif hemoptizi — hava yolu ve hemodinami acil; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'hipoksi_solunum',
    re: /oksijen(.{0,20})(d[üu][şs][üu]k|d[üu][şs][üu]yor)|spo2.{0,10}(8[0-9]|7[0-9])|nefes alam[ıi]yorum|solunum s[ıi]k[ıi]nt[ıi]|morar(d[ıi]|ma)|dudaklar[ıi]m mor/i,
    ad: 'Belirgin nefes darlığı / düşük oksijen / morarma',
    eylem: 'Hemen 112’yi arayın veya en yakın acile gidin. Portal mesajı beklemeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTD', not: 'Akut solunum yetmezliği şüphesi — oksijen ve acil değerlendirme; ayaktan sıra beklenmez' },
  },
  {
    kod: 'pnomotoraks_suphe',
    re: /ani (tek taraf|g[öo][ğg][üu]s)[^.]{0,40}(a[ğg]r[ıi]|nefes)|g[öo][ğg][üu]s a[ğg]r[ıi]s[ıi].{0,30}aniden|nefes darl[ıi][ğg][ıi].{0,30}tek taraf/i,
    ad: 'Ani tek taraflı göğüs ağrısı + nefes darlığı',
    eylem: 'En yakın acile başvurun; ağır nefes darlığı varsa 112. Pnömotoraks şüphesi ayaktan beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTD', not: 'Pnömotoraks şüphesi — acil görüntüleme; toraks tüpü kararı acil/cerrahi ekibinde (bu ürün OR planlamaz)' },
  },
  {
    kod: 'stridor_ust_yol',
    re: /stridor|nefes.{0,20}[ıi]sl[ıi]k|bo[ğg]uluyorum|sesim tamamen gitti.{0,20}nefes|nefes borusu t[ıi]kan/i,
    ad: 'Stridor / üst hava yolu tehdidi',
    eylem: 'Hemen 112’yi arayın. Yatmayın; oturur pozisyonda kalın.',
    oncelik: 'hemen',
    dipnot: { ref: 'TTD', not: 'Üst hava yolu tehdidi — hava yolu güvenliği önce' },
  },
  {
    kod: 'anafilaksi',
    re: /anafilaksi|allerjik [şs]ok|yutma g[üu][çc]l[üu][ğg][üu].{0,30}(d[öo]k[üu]nt[üu]|[şs]i[şs])|t[üu]m v[üu]cut ka[şs][ıi]nt[ıi].{0,20}nefes/i,
    ad: 'Anafilaksi / şiddetli alerjik reaksiyon',
    eylem: 'Hemen 112’yi arayın. Bilinen adrenalin otoenjektörünüz varsa hekiminizin tarif ettiği şekilde kullanın (doz Notya’da yoktur).',
    oncelik: 'hemen',
    dipnot: { ref: 'TTD', not: 'Anafilaksi — acil adrenalin; doz ve uygulama hekim / KÜB' },
  },
  {
    kod: 'gogus_agrisi_nefes',
    re: /g[öo][ğg][üu]s a[ğg]r[ıi]s[ıi].{0,40}(nefes|bask[ıi]|terleme)|bask[ıi] hissi.{0,30}g[öo][ğg][üu]s/i,
    ad: 'Göğüs ağrısı + nefes darlığı / baskı (kardiyak ayırıcı)',
    eylem: 'Aynı gün acil değerlendirme gerekir; ağır baskı veya terleme varsa 112. Göğüs hastalıkları ayaktan sırası beklenmez.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TTD', not: 'Göğüs ağrısı — kardiyak acil ayırımı; gerekirse acil / kardiyoloji' },
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
  'Bol kanlı balgam, belirgin nefes darlığı veya morarma, ani tek taraflı göğüs ağrısı ile nefes darlığı, nefes borusunda tıkanma hissi veya şiddetli alerjik reaksiyon varsa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerGogus` ile BİREBİR aynı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Bol miktarda kanlı balgam', kod: 'masif_hemoptizi' },
  { etiket: 'Belirgin nefes darlığı, morarma veya düşük oksijen', kod: 'hipoksi_solunum' },
  { etiket: 'Ani tek taraflı göğüs ağrısı ile nefes darlığı', kod: 'pnomotoraks_suphe' },
  { etiket: 'Nefes borusunda tıkanma / stridor hissi', kod: 'stridor_ust_yol' },
  { etiket: 'Şiddetli alerjik reaksiyon (şişlik, nefes darlığı)', kod: 'anafilaksi' },
  { etiket: 'Göğüs ağrısı ile nefes darlığı veya baskı hissi', kod: 'gogus_agrisi_nefes' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Şikâyetin başlangıç zamanı ve ani mi sinsi mi olduğu kaydedildi',
  'Hemoptizi miktarı ve süre sorgulandı',
  'SpO₂ / solunum sayısı ölçüldü veya acile sevk gerekçesi yazıldı',
  'Tek taraflı göğüs ağrısı ve travma / pnömotoraks riski sorgulandı',
  'Üst hava yolu ve yutma güvenliği değerlendirildi',
  'Kardiyak göğüs ağrısı ayırıcı belirtileri sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
