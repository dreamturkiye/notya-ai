/**
 * KBB-EXCEPTIONAL-01 — Kırmızı bayrak / acil triyaj kapısı (ayaktan KBB). SAF fonksiyon.
 * Aynı desen: specialties/psikiyatri/engines/acil.ts ve dahiliye / göz acil kapıları.
 *
 * Ani işitme kaybı, durdurulamayan burun kanaması, hava yolu tehdidi, nörolojik bulgu eşlik eden baş dönmesi,
 * baş-boyun travması ve yabancı cisim / kostik → "gecikme yok" bandı. Bu akış PORTAL MESAJI ile yönetilmez.
 * Tanı dili yoktur; yalnız eylem yönlendirmesi vardır. Karar ve kayıt hekimindir (kbb_risk.hekim_onay).
 */
import type { Dipnot } from './kbb'

export type AcilKod =
  | 'ani_isitme_kaybi'
  | 'tek_tarafli_ani_kayip'
  | 'epistaksis_kontrolsuz'
  | 'hava_yolu'
  | 'vertigo_noro'
  | 'travma'

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
    kod: 'ani_isitme_kaybi',
    re: /ani i[şs]itme kayb|aniden duymuyorum|bir anda duymamaya|kula[ğg][ıi]m aniden|sabah kalkt[ıi][ğg][ıi]mda duymuyor/i,
    ad: 'Ani işitme kaybı',
    eylem: 'Beklemeyin: aynı gün KBB değerlendirmesi gerekir; ulaşamıyorsanız en yakın acile başvurun. İlk günlerde başlayan tedavi sonucu değiştirebilir; karar hekimindir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Ani işitme kaybı — saatler/günler içinde odyolojik değerlendirme; ayaktan randevu sırası beklenmez' },
  },
  {
    kod: 'tek_tarafli_ani_kayip',
    re: /tek (taraf|kula[ğg])[^.]{0,40}(i[şs]itme|duyma)|tek kula[ğg][ıi]mda (ani|birden)|tek tarafl[ıi] ç[ıi]nlama ile duyma kayb/i,
    ad: 'Tek taraflı ani işitme kaybı / tek taraflı çınlama',
    eylem: 'Aynı gün KBB’ye başvurun; ulaşamıyorsanız acile gidin. Tek tarafta başlayan kayıp ayrı değerlendirme gerektirir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Tek taraflı ani kayıp — acil odyolojik değerlendirme; ileri görüntüleme kararı hekimin' },
  },
  {
    kod: 'epistaksis_kontrolsuz',
    // "kanamam / kanamamız / kanaması" gibi iyelik ekleri ve araya giren süre ifadesi ("yarım saattir") kaçmasın.
    re: /burun kanama\w*[^.]{0,60}(durm|kesilm|duramad|geçm)|kanama duram[ıi]yor|durdurulamayan burun kanamas|yar[ıi]m saat.{0,20}kanama/i,
    ad: 'Kontrol altına alınamayan burun kanaması',
    eylem: 'Burun kanadını 15 dakika aralıksız sıkın, öne eğilin. Kanama durmuyorsa veya çok miktarda ise 112’yi arayın ya da en yakın acile gidin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Dirençli epistaksis — bası ile durmuyorsa acil; tampon / koterizasyon kararı hekimin' },
  },
  {
    kod: 'hava_yolu',
    re: /nefes darl[ıi][ğg][ıi][^.]{0,40}(bo[ğg]az|[şs]i[şs]|yutma)|bo[ğg]az[ıi]m [şs]i[şs]|yutamayacak kadar|sesim tamamen gitti.{0,30}nefes|salyam ak[ıi]yor|a[ğg]z[ıi]m[ıi] açam[ıi]yorum/i,
    ad: 'Nefes darlığı ile birlikte boğaz şişliği / yutamama',
    eylem: 'Hemen 112’yi arayın. Nefes yolu daralması beklenmez; yatmayın, oturur pozisyonda kalın.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Üst hava yolu tehdidi — hava yolu güvenliği önce; ayaktan muayene beklenmez' },
  },
  {
    kod: 'vertigo_noro',
    re: /ba[şs] d[öo]nmesi[^.]{0,60}(çift g[öo]rme|konu[şs]ma bozuk|uyu[şs]ma|g[üu][çc] kayb|yüz kay|felç|y[üu]r[üu]yemiyor)|d[öo]nme ile birlikte çift g[öo]rme/i,
    ad: 'Baş dönmesi ile birlikte nörolojik bulgu',
    eylem: 'Hemen 112’yi arayın. Çift görme, konuşma bozukluğu, yüzde kayma, uyuşma veya güç kaybı eşlik eden baş dönmesi ayaktan değerlendirilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Santral vertigo şüphesi — nörolojik bulgu varlığında acil; manevra uygulanmaz' },
  },
  {
    kod: 'travma',
    re: /(ba[şs]|boyun|y[üu]z|burun|kulak)[^.]{0,30}(travma|darbe|çarp|k[ıi]r[ıi]k)|kulaktan kan|kulaktan berrak s[ıi]v[ıi]|burnumdan berrak s[ıi]v[ıi]/i,
    ad: 'Baş-boyun travması / kulaktan kan veya berrak sıvı',
    eylem: 'En yakın acile başvurun; bilinç değişikliği veya kusma varsa 112. Kulağa pamuk dışında hiçbir şey koymayın, burnunuzu sümkürmeyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TKBBD', not: 'Travma — kafa tabanı / temporal kemik değerlendirmesi acil serviste; ayaktan izlem yeterli değildir' },
  },
]

/**
 * Türkçe büyük harf kapısı: JS `/i` bayrağı "İ" ile "i"yi eşlemez, bu yüzden cümle başındaki
 * "İşitme", "İki gündür" gibi ifadeler taramadan kaçardı. Önce tr-TR küçük harfe indirilir.
 */
function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

/** Metinlerde (intake, şikâyet, portal mesajı) ve hekimin işaretlediği kodlarda kırmızı bayrak taraması. */
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

/** Hasta yüzü metni — tanı dili yok, 112 var. */
export const HASTA_ACIL_METNI =
  'Aniden duymamaya başladıysanız, burun kanamanız durmuyorsa, nefes almakta zorlanıyor ya da yutamıyorsanız, baş dönmenize çift görme veya konuşma bozukluğu eşlik ediyorsa veya başınıza darbe aldıysanız portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerKbb` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Aniden başlayan işitme kaybı', kod: 'ani_isitme_kaybi' },
  { etiket: 'Tek kulakta aniden başlayan işitme kaybı veya çınlama', kod: 'tek_tarafli_ani_kayip' },
  { etiket: 'Durdurulamayan burun kanaması', kod: 'epistaksis_kontrolsuz' },
  { etiket: 'Nefes darlığı ile birlikte boğazda şişlik veya yutamama', kod: 'hava_yolu' },
  { etiket: 'Baş dönmesi ile birlikte çift görme, konuşma bozukluğu veya güç kaybı', kod: 'vertigo_noro' },
  { etiket: 'Baş, yüz veya boyun bölgesine darbe / travma', kod: 'travma' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

/**
 * Hekim yüzü kırmızı bayrak kontrol listesi — hekim işaretler, `kbb_risk` satırına yazılır.
 * Notya hiçbir maddeyi kendiliğinden "kapandı" saymaz: kapanış hekim onayıdır.
 */
export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Şikâyetin başlangıç zamanı ve ani mi sinsi mi olduğu kaydedildi',
  'Tek taraflı mı iki taraflı mı olduğu ayrıştırıldı',
  'Eşlik eden nörolojik bulgu sorgulandı (çift görme, konuşma, yüz asimetrisi, güç kaybı)',
  'Hava yolu ve yutma güvenliği değerlendirildi',
  'Antikoagülan / antiagregan kullanımı ve kanama öyküsü sorgulandı',
  'Travma, yabancı cisim ve kostik madde teması sorgulandı',
  'Hastaya 112 / acil başvuru yolu anlatıldı ve kontrol aralığı riske göre kısaltıldı',
]

/** Bayraklar varken hekim onayı olmadan vizit kapatılamaz — route 409 döner. */
export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
