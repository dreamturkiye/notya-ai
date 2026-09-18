/**
 * DERM-CHAPTER — Acil kırmızı bayrak kapısı (göz `engines/acil.ts` deseni). Pure, deterministik:
 * şikâyet / anamnez metni + intake kutuları + hekim işaretinden eşleşir. Çıktı "gecikme yok" bandıdır.
 * Tanı koymaz, doz yazmaz, ilaç adı vermez — eylem sırası ve sevk yolu.
 *
 * Kapsam (Boss listesi): SJS/TEN, eritrodermi, anjioödem + hava yolu, nekrotizan fasiit şüphesi,
 * yaygın bül, yaygın döküntü + ateş (ağır ilaç reaksiyonu şüphesi).
 * Kaynaklar rol olarak anılır (metin kopyalanmaz): Bolognia 5 (gold) — ağır kutanöz ilaç reaksiyonları,
 * eritroderma, büllü hastalıklar; Temel Dermatoloji (ulusal TR) — poliklinik dili; klinik eşikler ve
 * tedavi hekimin. TR sevk/yatış kararı hekimin.
 */
import type { Dipnot } from '../protocols/sources'

export type DermAcilKod =
  | 'sjs_ten'
  | 'eritrodermi'
  | 'anjiodem_hava_yolu'
  | 'nekrotizan_fasiit'
  | 'yaygin_bul'
  | 'dokuntu_ates'

export type DermAcilOncelik = 'hemen' | 'ayni_gun'

export interface DermAcilBayrak {
  kod: DermAcilKod
  ad: string
  eylem: string
  oncelik: DermAcilOncelik
  dipnot: Dipnot
}

type Kural = DermAcilBayrak & { re: RegExp }

const KURALLAR: Kural[] = [
  {
    kod: 'anjiodem_hava_yolu',
    re: /nefes darlığı|nefes darligi|soluk alam|boğaz(ım)? şiş|bogaz.*sis|dil şiş|dil sis|hırıltı|hiriltı|ses kısıl.*şiş|yutkunam|anjiy?oödem|anjiodem|anafilak/i,
    ad: 'Anjioödem — hava yolu riski',
    eylem: 'HEMEN: hava yolu değerlendirmesi, hasta oturur pozisyonda yalnız bırakılmaz, 112 / acil. Dil-larinks tutulumu veya stridor varsa muayene beklenmez; tedavi hekimin.',
    oncelik: 'hemen',
    dipnot: { ref: 'BOLOGNIA', not: 'Anjioödemde üst hava yolu tutulumu acil — eşik ve tedavi hekimin (rol atfı; metin kopyalanmaz)' },
  },
  {
    kod: 'nekrotizan_fasiit',
    re: /nekrotizan|fasi{1,2}t|bulgularla uyumsuz (şiddetli )?ağrı|orantısız ağrı|orantisiz agri|krepitasyon|deri.*morar.*hızlı|hızla yayılan (kızarıklık|şişlik)|hizla yayilan/i,
    ad: 'Nekrotizan fasiit şüphesi',
    eylem: 'HEMEN cerrahi konsültasyon + acil; bulgularla orantısız ağrı, hızlı yayılım, krepitasyon, sistemik bozulma. Saat kaydedilir; görüntüleme beklenmeden cerrahi değerlendirme.',
    oncelik: 'hemen',
    dipnot: { ref: 'BOLOGNIA', not: 'Nekrotizan yumuşak doku enfeksiyonu — cerrahi acil; karar ve zamanlama hekimin' },
  },
  {
    kod: 'sjs_ten',
    re: /stevens|johnson|toksik epidermal|sjs|ten şüphe|nikolsky (pozitif|\+)|deri.*eldiven gibi|mukoz.*erozyon.*(göz|ağız)|göz.*ağız.*erozyon|hedef lezyon.*ateş|ilaç.*sonra.*yaygın (döküntü|bül)/i,
    ad: 'SJS / TEN şüphesi',
    eylem: 'HEMEN: şüpheli ilaç kesilir (hekim kararı), yaygın deri tutulumu yüzdesi ve mukoza (ağız, göz, genital) muayenesi kaydedilir; yanık / yoğun bakım kapasitesi olan merkeze acil sevk. Göz konsültasyonu aynı gün.',
    oncelik: 'hemen',
    dipnot: { ref: 'BOLOGNIA', not: 'Ağır kutanöz ilaç reaksiyonu — ilaç kesimi, mukoza muayenesi, ileri merkez; skorlama ve tedavi hekimin' },
  },
  {
    kod: 'eritrodermi',
    re: /eritrodermi|eritroderm|vücudun (tamamı|neredeyse tamamı).*kızar|tüm (vücut|beden).*kızar|yaygın kızarıklık.*(titreme|üşüme|ateş)|kızarıklık.*%?9[0-9].*yüzey/i,
    ad: 'Eritrodermi',
    eylem: 'Aynı gün değerlendirme: vücut yüzey alanı, vital bulgular, ısı kaybı / sıvı dengesi ve enfeksiyon bulguları kaydedilir; yatış ihtiyacı hekim kararı. Yeni ilaç öyküsü sorgulanır.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'BOLOGNIA', not: 'Eritroderma — sıvı/ısı kaybı ve enfeksiyon riski; yatış eşiği hekimin' },
  },
  {
    kod: 'yaygin_bul',
    re: /yaygın (bül|büller|su topla)|vücutta.*bül|büllü.*yaygın|nikolsky|deri soyul|epidermis ayrıl|pemfigus.*alevlen/i,
    ad: 'Yaygın büllü tutulum',
    eylem: 'Aynı gün: tutulan yüzey alanı, mukoza tutulumu ve Nikolsky kaydedilir; biyopsi + DIF planı ve yatış ihtiyacı hekim kararı. SJS/TEN ayırıcı tanısı dışlanmadan taburcu edilmez.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TEMEL_DERM', not: 'Büllü hastalıkta tanı DIF ile kesinleşir; yaygın tutulumda yatış hekim kararı' },
  },
  {
    kod: 'dokuntu_ates',
    re: /(yaygın|tüm vücut).*(döküntü|kızarıklık).*(ateş|39|38)|ateş.*(yaygın )?döküntü|döküntü.*ateş|yüz(de)? (şişlik|ödem).*döküntü.*ilaç|eozinofil/i,
    ad: 'Yaygın döküntü + ateş (ağır ilaç reaksiyonu şüphesi)',
    eylem: 'Aynı gün: yeni başlanan ilaçların tarihleri, yüzde tutulan alan, mukoza, ateş, LAP ve yüz ödemi kaydedilir; organ tutulumu için tetkik ve ilaç kesimi hekim kararı.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'BOLOGNIA', not: 'Ateşli yaygın döküntüde ağır ilaç reaksiyonu ayırıcı tanıda; tetkik ve ilaç kararı hekimin' },
  },
]

/** Metin + hekim işaretlerinden bayrak listesi. `hemen` olanlar önce. */
export function dermAcilTara(
  metinler: Array<string | null | undefined>,
  hekimIsaretleri: DermAcilKod[] = [],
): DermAcilBayrak[] {
  const metin = metinler.filter(Boolean).join(' \n ')
  const bulunan = new Map<DermAcilKod, DermAcilBayrak>()
  for (const k of KURALLAR) {
    if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) {
      bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
    }
  }
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const DERM_ACIL_KODLARI: Array<{ kod: DermAcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

/** Intake kırmızı bayrak kutuları → kod (göz `intakeAcilKodlari` deseni; serbest metin gerekmez). */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: DermAcilKod }> = [
  { etiket: 'Yaygın döküntü ile birlikte ateş', kod: 'dokuntu_ates' },
  { etiket: 'Nefes darlığı / dilde veya boğazda şişlik', kod: 'anjiodem_hava_yolu' },
  { etiket: 'Ağızda ve gözde yara ile birlikte döküntü', kod: 'sjs_ten' },
  { etiket: 'Vücutta yaygın su toplaması (bül)', kod: 'yaygin_bul' },
  { etiket: 'Vücudun tamamına yayılan kızarıklık', kod: 'eritrodermi' },
  { etiket: 'Hızla yayılan, çok ağrılı kızarıklık / şişlik', kod: 'nekrotizan_fasiit' },
]

export function intakeAcilKodlari(isaretli: unknown): DermAcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

/** Bayrak başına eylem listesi — yazdırılabilir; doz / ilaç / süre hedefi yazılmaz (hekim / kurum protokolü). */
export const DERM_ACIL_EYLEM_LISTESI: Record<DermAcilKod, string[]> = {
  anjiodem_hava_yolu: [
    'Hava yolu değerlendirildi — saat kaydedildi (muayeneyi beklemez)',
    'Stridor / ses değişikliği / dil-larinks tutulumu soruldu ve kaydedildi',
    'Vital bulgular (SpO₂ dahil) alındı',
    'Yeni ilaç / gıda / arı sokması öyküsü kaydedildi',
    '112 / acil yolu açıldı — tedavi hekim kararı',
  ],
  nekrotizan_fasiit: [
    'Bulgularla orantısız ağrı sorgulandı ve kaydedildi',
    'Yayılım sınırı kalemle işaretlendi — saat yazıldı',
    'Vital bulgular + sistemik bozulma kaydedildi',
    'Cerrahi konsültasyon istendi — saat kaydedildi',
    'Acil sevk / yatış hekim kararıyla başlatıldı',
  ],
  sjs_ten: [
    'Şüpheli ilaçlar ve başlangıç tarihleri listelendi (hekim kesim kararı verir)',
    'Tutulan vücut yüzey alanı yüzdesi kaydedildi',
    'Mukoza muayenesi yapıldı: ağız, göz, genital',
    'Nikolsky bulgusu kaydedildi',
    'Aynı gün göz konsültasyonu istendi',
    'Yanık / yoğun bakım kapasiteli merkeze sevk başlatıldı',
  ],
  eritrodermi: [
    'Vücut yüzey alanı ve vital bulgular kaydedildi',
    'Isı kaybı / sıvı dengesi ve enfeksiyon bulguları kaydedildi',
    'Yeni ilaç öyküsü ve önceki dermatoz (psoriasis / atopi) sorgulandı',
    'Yatış ihtiyacı hekim tarafından değerlendirildi',
  ],
  yaygin_bul: [
    'Tutulan yüzey alanı ve mukoza tutulumu kaydedildi',
    'Nikolsky bulgusu kaydedildi',
    'Biyopsi + DIF planı yazıldı (tanı DIF olmadan kilitlenmez)',
    'SJS/TEN ayırıcı tanısı hekim tarafından değerlendirildi',
  ],
  dokuntu_ates: [
    'Son 8 haftada başlanan ilaçlar tarihleriyle listelendi',
    'Ateş, LAP, yüz ödemi ve tutulan alan yüzdesi kaydedildi',
    'Mukoza muayenesi yapıldı',
    'Organ tutulumu tetkikleri hekim tarafından istendi',
  ],
}

/** Hasta yüzü (portal / intake yardım metni) — tanı dili yok, yalnız yönlendirme. */
export const HASTA_ACIL_METNI =
  'Döküntünüzle birlikte ateş, ağızda-gözde yara, vücuda yayılan su toplaması, nefes darlığı ya da dilde/boğazda şişlik olursa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Sticky band metni — bayrak yoksa boş dizi (band gösterilmez). */
export function acilBandMetni(bayraklar: DermAcilBayrak[]): string[] {
  return bayraklar.map((b) => `${b.oncelik === 'hemen' ? 'HEMEN' : 'AYNI GÜN'} · ${b.ad}`)
}
