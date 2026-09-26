/**
 * NOTYA-AYSE-STANDART-01 (Dr. Gökhan standardı, 2026-09-26) — not metnindeki bir cümlenin DURUMU.
 *
 * "Planlandı / önerildi / istendi / reçete edildi / uygulanacak" ile "uygulandı / yapıldı" AYNI DEĞİLDİR. Bu dosya
 * onaylı notun plan / takip / tedavi cümlelerini okur ve her klinik parçayı (aşı, lab, kontrol, konsültasyon, tarama,
 * görüntüleme, ilaç) bir duruma çevirir. LLM'siz, saf — denetim fikstürleri ve canlı dosya aynı fonksiyondan geçer.
 *
 * Türkçe fiil sonda gelir: fiilsiz bir parça ("ferritin ve hemogram istendi" → "ferritin") sonraki parçanın fiilini
 * ödünç alır (lib/doktor/notAsilari.ts uygulananAsiParcalari ile aynı ilke). Olumsuz fiil ("yapılmadı") 'belirsiz'
 * döner: dosyada açıkça yazılmış bir olumsuzluktur ama nedeni/yerine ne yapıldığı ayrı kayıttır.
 *
 * guven her zaman 'metin' — yapılandırılmış satırla (asilar, lab_satirlar…) doğrulanmadıkça kesin sayılmaz.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { kayitSerisi } from '@/specialties/pediatri/engines/asiPlan'
import { KANONIK } from '@/core/lab/kanonik'

export type PlanDurumu = 'planlandi' | 'onerildi' | 'istendi' | 'recete' | 'randevu' | 'uygulandi' | 'sonuclandi' | 'kesildi' | 'belirsiz'
export type PlanKonusu = 'asi' | 'lab' | 'kontrol' | 'konsultasyon' | 'tarama' | 'goruntuleme' | 'ilac'

export interface PlanIfadesi {
  konu: PlanKonusu
  durum: PlanDurumu
  guven: 'metin'
  /** Parçanın geçtiği cümle (ham, kısaltılmış). */
  cumle: string
  /** Aşı serisi (kayitSerisi) — konu 'asi' ise. */
  seri?: string | null
  /** Aşı doz numarası, parçada yazıyorsa. */
  doz?: number | null
  /** Lab kanonik anahtarları — konu 'lab' ise (boş olabilir: "tetkik istendi"). */
  labAnahtarlari?: string[]
  /** Tarama türü — konu 'tarama' ise ('mchat' | 'gidr' | 'denver' | 'isitme' | 'gorme' | 'gelisim'). */
  tarama?: string
}

// Katlanmış (trAramaNormalize) metin üzerinde. Sıra önemlidir: olumsuz → gelecek/plan → geçmiş.
const OLUMSUZ = /\b(yapilmadi|uygulanmadi|verilmedi|vurulmadi|yaptirilmadi|yapilamadi|uygulanamadi|ertelendi|gelmedi|olmadi)\b/
const PLANLANDI = /\b(planlandi|planlanmistir|planlaniyor|yapacagiz|yapariz|yapilacak|yapilacaktir|uygulanacak|uygulanacaktir|vurulacak|vuracagiz|verilecek|verecegiz|yapilmasi (planlandi|uygun)|uygulanacagi|yapilmali|yapilsin)\b/
const ONERILDI = /\b(onerildi|onerilmistir|onerilir|oneriyorum|tavsiye edildi|tavsiye edilir|dusunulebilir)\b/
const ISTENDI = /\b(istendi|istenmistir|istenecek|isteyelim|istiyorum|bakilacak|bakilsin|bakilmasi|gonderildi|tetkik edilecek|tekrarlanacak|tekrar edilecek|kontrol edilecek)\b/
const RANDEVU = /\b(randevu(su)? (verildi|olusturuldu|alindi|planlandi)|kontrole? cagrildi|kontrole? gelecek|kontrole? gelmesi|kontrole? gelsin|(gun|hafta|ay) sonra (kontrol|tekrar)|kontrolu? (planlandi|onerildi))\b/
const RECETE = /\b(recete edildi|receteye yazildi|recetelendi|yazildi|baslandi|baslanmistir|baslanacak|devam edildi|devam edilecek|dozu (artirildi|azaltildi))\b/
const KESILDI = /\b(kesildi|birakildi|durduruldu|sonlandirildi|kesilmesi)\b/
const UYGULANDI = /\b(yapildi|yapilmistir|uygulandi|uygulanmistir|verildi|vuruldu|tamamlandi|gerceklestirildi|olundu)\b/
const SONUCLANDI = /\b(sonuclandi|sonucu (geldi|normal|cikti)|normal (geldi|bulundu|saptandi)|saptandi|bulundu|olarak geldi)\b/

const ASI_SOZU = /\basi|\bdoz|\brapel|\bvaksin/
const LAB_SEROLOJI = /seroloji|hbsag|anti-?hbs|titre|antikor/
const TARAMA = /\b(m-?chat|gidr|denver|asq|gelisim(sel)? (tarama|degerlendirme|izlem)|otizm taramasi|isitme taramasi|gorme taramasi|kirmizi refle|tarama testi)/
const KONSULT = /\b(konsult|konsultasyon|sevk|yonlendir|poliklinigine|degerlendirmesi icin|gorusu alinsin|gorusu istendi)/
const LAB_GENEL = /\b(tahlil|tetkik|hemogram|tam kan|kan sayimi|idrar (tahlili|kulturu|analizi)|biyokimya|lab|kan testi|demir paneli|serum demir)\b/
const GORUNTU = /\b(usg|ultrason|ultrasonografi|grafi|grafisi|rontgen|mr|mri|bt|tomografi|ekokardiyografi|eko)\b/
const KONTROL = /\b(kontrol|kontrole|kontrolu|tekrar gel|tekrar gorelim|vizit|izlem)\b/
const ILAC = /\b(surup|tablet|damla|kapsul|sase|ampul|mg|ml|antibiyotik|tedavi(si)?)\b/

// Lab anahtarları: KANONIK takma adlarından (≥ 4 harf ya da bilinen kısaltma) + panel sözcükleri.
const PANEL: [RegExp, string[]][] = [
  [/\b(hemogram|tam kan|kan sayimi)\b/, ['Hb', 'Hct', 'MCV', 'RDW', 'WBC', 'Plt']],
  [/\bdemir paneli\b/, ['Fe', 'TIBC', 'Ferritin']],
  [/\btdbk\b/, ['TIBC']],
]
const KISA_ANAHTAR = new Set(['hb', 'hgb', 'hct', 'mcv', 'mch', 'mchc', 'rdw', 'crp', 'tsh', 'b12', 'alt', 'ast', 'ggt', 'alp', 'ldh', 'wbc', 'plt'])
let ALIAS_LISTESI: { re: RegExp; anahtar: string }[] | null = null
function aliasListesi(): { re: RegExp; anahtar: string }[] {
  if (ALIAS_LISTESI) return ALIAS_LISTESI
  const out: { re: RegExp; anahtar: string }[] = []
  for (const [anahtar, tanim] of Object.entries(KANONIK as Record<string, { aliases?: string[] }>)) {
    if (anahtar.startsWith('ntp_') || anahtar.startsWith('UA_')) continue
    for (const al of tanim.aliases || []) {
      const n = trAramaNormalize(al)
      if (n.length < 4 && !KISA_ANAHTAR.has(n)) continue
      out.push({ re: new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`), anahtar })
    }
  }
  ALIAS_LISTESI = out
  return out
}

/** Metnin andığı lab kanonik anahtarları (tekrarsız). */
export function labAnahtarlariBul(metin: string): string[] {
  const n = trAramaNormalize(metin)
  const out = new Set<string>()
  for (const [re, anahtarlar] of PANEL) if (re.test(n)) anahtarlar.forEach((a) => out.add(a))
  for (const { re, anahtar } of aliasListesi()) if (re.test(n)) out.add(anahtar)
  return [...out]
}

const SIRA_KELIME: Record<string, number> = { birinci: 1, ilk: 1, ikinci: 2, ucuncu: 3, dorduncu: 4, besinci: 5 }
function dozBul(n: string): number | null {
  const m = n.match(/(?:^|\D)(\d{1,2})\s*\.?\s*(?:doz|dozu|dozunu)\b/)
  if (m) return Number(m[1]) || null
  const s = n.match(/\b(birinci|ilk|ikinci|ucuncu|dorduncu|besinci)\s+doz/)
  return s ? SIRA_KELIME[s[1]] : null
}

function taramaTuru(n: string): string {
  if (/m-?chat/.test(n)) return 'mchat'
  if (/gidr/.test(n)) return 'gidr'
  if (/denver/.test(n)) return 'denver'
  if (/isitme/.test(n)) return 'isitme'
  if (/gorme|kirmizi refle/.test(n)) return 'gorme'
  return 'gelisim'
}

/** Tek bir cümlenin/parçanın durumu (konu bakılmaksızın). null → durum fiili yok. */
export function durumSinifla(parca: string): PlanDurumu | null {
  const n = trAramaNormalize(parca)
  if (!n) return null
  if (OLUMSUZ.test(n)) return 'belirsiz'
  if (KESILDI.test(n)) return 'kesildi'
  if (RANDEVU.test(n)) return 'randevu'
  if (PLANLANDI.test(n)) return 'planlandi'
  if (ISTENDI.test(n)) return 'istendi'
  if (ONERILDI.test(n)) return 'onerildi'
  if (RECETE.test(n)) return 'recete'
  if (SONUCLANDI.test(n)) return 'sonuclandi'
  if (UYGULANDI.test(n)) return 'uygulandi'
  return null
}

function konuBul(n: string): Pick<PlanIfadesi, 'konu' | 'seri' | 'doz' | 'labAnahtarlari' | 'tarama'> | null {
  if (TARAMA.test(n)) return { konu: 'tarama', tarama: taramaTuru(n) }
  const seri = ASI_SOZU.test(n) && !LAB_SEROLOJI.test(n) ? kayitSerisi(n) : null
  if (seri || (/\basi/.test(n) && !LAB_SEROLOJI.test(n))) return { konu: 'asi', seri, doz: dozBul(n) }
  if (KONSULT.test(n)) return { konu: 'konsultasyon' }
  const lab = labAnahtarlariBul(n)
  if (lab.length || LAB_GENEL.test(n) || LAB_SEROLOJI.test(n)) return { konu: 'lab', labAnahtarlari: lab }
  if (GORUNTU.test(n)) return { konu: 'goruntuleme' }
  if (KONTROL.test(n)) return { konu: 'kontrol' }
  if (ILAC.test(n)) return { konu: 'ilac' }
  return null
}

/**
 * Bir cümlenin durumu — tek parça için kısa yol (brief: `planIfadesiSinifla(cumle)`).
 * Konu bulunamazsa ya da fiil yoksa null.
 */
export function planIfadesiSinifla(cumle: string): PlanIfadesi | null {
  return planIfadeleriniCikar(cumle)[0] ?? null
}

/**
 * Metindeki tüm klinik plan / uygulama ifadeleri. Cümleler ; . ! ? ve satır sonuyla ("2. doz" bölünmez), parçalar
 * "," / "ve" / "ile" / "+" ile ayrılır; fiilsiz parça sonraki parçanın fiilini alır.
 */
export function planIfadeleriniCikar(metin: string | null | undefined): PlanIfadesi[] {
  const out: PlanIfadesi[] = []
  const cumleler = String(metin || '').replace(/\n(?=\s*\d{1,2}\.\s*doz)/g, ' ').split(/[;\n]+|(?<!\d)[.!?]+(?:\s+|$)/)
  for (const cumleHam of cumleler) {
    const cumle = cumleHam.replace(/^\s*(?:[-•*]+|\d{1,2}[.)])\s+/, '').trim()
    if (!cumle) continue
    const parcalar = cumle.split(/\s*,\s*|\s+ve\s+|\s+ile\s+|\s*\+\s*/i).filter(Boolean)
    const katli = parcalar.map((p) => trAramaNormalize(p))
    // "1 hafta sonra kontrol" — fiil yok ama kendisi bir randevu planı.
    for (let i = 0; i < katli.length; i++) {
      let durum = durumSinifla(katli[i])
      // "Amoksisilin başlandı" — ilaç adı sözlükte değil ama fiil reçete / kesme fiili: konu ilaç.
      const konu = konuBul(katli[i]) ?? (durum === 'recete' || durum === 'kesildi' ? { konu: 'ilac' as const } : null)
      if (!konu) continue
      for (let j = i + 1; !durum && j < katli.length; j++) {
        // Sonraki parça kendi konusunu taşıyorsa ve fiili varsa o fiil bu parçaya da uygulanır (Türkçe fiil sonda).
        durum = durumSinifla(katli[j])
      }
      if (!durum && konu.konu === 'kontrol' && /\b(\d{1,3}|bir|iki|uc|dort|alti) (gun|hafta|ay) sonra\b/.test(katli[i])) durum = 'randevu'
      if (!durum) continue
      out.push({ ...konu, durum, guven: 'metin', cumle: cumle.slice(0, 220) })
    }
  }
  return out
}

/** "Aşıları tam / eksiksiz / yaşına uygun" gibi bir BEYAN — aşı tablosuyla karşılaştırılır (çelişki denetimi). */
export function asiTamBeyaniMi(metin: string | null | undefined): boolean {
  const n = trAramaNormalize(metin)
  return /\basi(lari|si)? (takvimi )?(tam|tamam|eksiksiz|yasina uygun|guncel)\b|\basilari (tamdir|tamamlanmis|eksiksizdir)\b/.test(n)
}
