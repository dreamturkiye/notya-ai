/**
 * PSIK-EXCEPTIONAL-01 — Güvenlik / acil triyaj kapısı (ayaktan psikiyatri). SAF fonksiyon.
 * Aynı desen: specialties/dahiliye/engines/acil.ts ve göz acil kapısı.
 *
 * Özkıyım düşüncesi / planı, kendine zarar, başkasına yönelik şiddet riski, akut psikotik ajitasyon ve
 * ilacı kendi kararıyla bırakma → "gecikme yok" bandı. Bu akış PORTAL MESAJI ile yönetilmez.
 * Tanı dili yoktur; yalnız eylem yönlendirmesi vardır. Karar ve kayıt hekimindir (psik_risk.hekim_onay).
 */
import type { Dipnot } from './psikiyatri'

export type AcilKod =
  | 'intihar_dusunce'
  | 'kendine_zarar'
  | 'siddet_riski'
  | 'psikoz_acil'
  | 'yok_sayma'

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
    kod: 'intihar_dusunce',
    re: /intihar|özkıyım|ozkiyim|kendimi öldür|kendini öldür|yaşamı(mı|nı) sonlandır|yasami sonlandir|ölmek ist|olmek ist|ölsem daha iyi|olsem daha iyi|hayatıma son/i,
    ad: 'Özkıyım düşüncesi / planı',
    eylem: 'Beklemeden 112’yi arayın veya en yakın acile başvurun. Portal mesajı beklemeyin; yanınızda birinin kalmasını isteyin.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPD', not: 'Özkıyım riski — ayaktan randevu beklenmez; aynı gün acil değerlendirme' },
  },
  {
    kod: 'kendine_zarar',
    re: /kendime zarar|kendine zarar|kesici.*kol|kendimi kes|self.?harm|yaralad[ıi]m kendimi|ilaç içtim|ilac ictim|aşırı doz|asiri doz/i,
    ad: 'Kendine zarar verme / aşırı doz',
    eylem: 'İlaç aldıysanız veya yaralanma varsa hemen 112. Değerlendirme aynı gün yapılmalıdır.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPD', not: 'Kendine zarar / intoksikasyon şüphesi — acil tıbbi değerlendirme önce gelir' },
  },
  {
    kod: 'siddet_riski',
    re: /birine zarar|öldürece[ğg]im|oldurecegim|şiddet uygula|siddet uygula|kavga.*silah|silah al|tehdit ediyorum|zarar verece[ğg]im/i,
    ad: 'Başkasına yönelik şiddet riski',
    eylem: 'Güvenliğiniz veya başkasının güvenliği riskteyse 112’yi arayın. Bu durum ayaktan randevu ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPD', not: 'Başkasına yönelik risk — acil değerlendirme; bildirim yükümlülüğü hekim değerlendirmesinde' },
  },
  {
    kod: 'psikoz_acil',
    re: /sesler duy|hayal görü|hayal goru|takip edildi[ğg]im|zehirlen(iyorum|diğimi)|birileri pe[sş]imde|kontrolden ç[ıi]kt[ıi]m|çok ajite|cok ajite|uyumuyorum günlerdir/i,
    ad: 'Akut psikotik belirti / ağır ajitasyon',
    eylem: 'Kendinizi veya çevrenizi güvende tutamıyorsanız 112 veya en yakın acil psikiyatri. Aksi halde aynı gün muayenehaneyi arayın.',
    oncelik: 'hemen',
    dipnot: { ref: 'TPD', not: 'Akut psikoz / ajitasyon — ayaktan izlem yeterliliği hekim kararı; güvenlik önce' },
  },
  {
    kod: 'yok_sayma',
    re: /ilac[ıi]m[ıi] b[ıi]rakt[ıi]m|ilaçlar[ıi]m[ıi] kestim|ilaci kestim|kendi kendime kestim|kullanmay[ıi] b[ıi]rakt[ıi]m/i,
    ad: 'İlacı kendi kararıyla bırakma',
    eylem: 'Aynı gün muayenehanenizi arayın. Bazı ilaçlar aniden kesildiğinde belirtiler geri gelebilir; nasıl devam edileceğini doktorunuz söyler.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'TPD', not: 'Ani kesilme / uyum kaybı — plan ve gerekiyorsa kademeli azaltma hekim kararı (doz Notya tarafından yazılmaz)' },
  },
]


/**
 * Türkçe büyük harf kapısı: JS `/i` bayrağı "İ" ile "i"yi eşlemez, bu yüzden cümle başındaki
 * "İntihar", "İlaçlarımı" gibi ifadeler taramadan kaçardı. Önce tr-TR küçük harfe indirilir.
 */
function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

/** Metinlerde (intake, şikâyet, portal mesajı) ve hekimin işaretlediği kodlarda güvenlik taraması. */
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
  'Kendinize zarar verme veya yaşamınızı sonlandırma düşünceniz varsa, başkasına zarar verme korkusu yaşıyorsanız ya da kendinizi güvende tutamıyorsanız portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts `acilBelirtilerPsik` ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Yaşamımı sonlandırma düşüncesi', kod: 'intihar_dusunce' },
  { etiket: 'Kendime zarar verme düşüncesi veya davranışı', kod: 'kendine_zarar' },
  { etiket: 'Başkasına zarar verme korkusu veya düşüncesi', kod: 'siddet_riski' },
  { etiket: 'Olmayan sesler duyma, aşırı huzursuzluk veya kontrolü kaybetme hissi', kod: 'psikoz_acil' },
  { etiket: 'İlacımı kendi kararımla bıraktım', kod: 'yok_sayma' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

/**
 * Hekim yüzü güvenlik kontrol listesi — hekim işaretler, `psik_risk` satırına yazılır.
 * Notya hiçbir maddeyi kendiliğinden "kapandı" saymaz: kapanış hekim onayıdır.
 */
export const GUVENLIK_KONTROL_LISTESI: readonly string[] = [
  'Özkıyım düşüncesi sorgulandı (düşünce · niyet · plan · yöntem erişimi)',
  'Daha önceki girişim öyküsü sorgulandı',
  'Evde ateşli silah / biriktirilmiş ilaç erişimi konuşuldu',
  'Alkol / madde kullanımı sorgulandı',
  'Destek sistemi ve yanında kalacak kişi belirlendi',
  'Kriz planı ve 112 / acil başvuru yolu hastaya anlatıldı',
  'Randevu aralığı riske göre kısaltıldı',
]

/** Bayraklar varken hekim onayı olmadan vizit kapatılamaz — route 409 döner. */
export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
