/**
 * NOTYA-AYSE-STANDART-01 — Türkçe klinik eşanlam grupları ("Daha önce aynı şikayetle geldi mi?").
 *
 * Dr. Gökhan: kulak ağrısı ≈ otitis media ≈ AOM ≈ otalji ≈ kulak çekiştirme ≈ TM hiperemisi / bombeleşmesi ≈ orta kulak
 * enfeksiyonu. Hekim bir kelime aramaz, bir klinik tabloyu arar; aynı atak farklı vizitlerde farklı yazılır.
 *
 * Terimler KATLANMIŞ biçimdedir (lib/utils/turkceArama trAramaNormalize: ı/i tek harf, aksan yok, küçük harf) ve
 * sözcük BAŞINDAN eşlenir ("otit" → otitis, otiti; "ishal" → ishali). Bu sürümde arama metin üzerindedir (ILIKE eşdeğeri,
 * yüklenmiş onaylı notlarda); anlamsal (pgvector) arama ertelendi — docs/OPEN-COMMITMENTS.md.
 *
 * Gruplar teşhis koymaz; yalnız "bu kayıtlar aynı tabloyu anıyor olabilir" der. Hekim yorumlar.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export interface EsanlamGrubu {
  id: string
  /** Hekime gösterilen grup adı. */
  ad: string
  /** Katlanmış terimler / kökler. */
  terimler: string[]
  /** Tekrarlayan patern eşiği için enfeksiyon mu (tekrarlayan enfeksiyon gözetimi, Soru 10). */
  enfeksiyon?: boolean
}

export const SIKAYET_GRUPLARI: EsanlamGrubu[] = [
  { id: 'otit', ad: 'Otit / kulak ağrısı', enfeksiyon: true, terimler: ['kulak agri', 'kulak agrisi', 'otit', 'aom', 'akut otitis', 'otalji', 'kulak cekistir', 'kulagini cekistir', 'kulagini cek', 'tm hiperem', 'tm bombe', 'timpanik membran hiperem', 'timpan zar hiperem', 'kulak zari hiperem', 'kulak zari bombe', 'orta kulak enfeksiyon', 'orta kulak iltihab', 'efuzyonlu otit', 'seroz otit', 'kulak akinti', 'otore'] },
  { id: 'iye', ad: 'İdrar yolu enfeksiyonu', enfeksiyon: true, terimler: ['iye', 'idrar yolu enfeksiyon', 'idrar yolu iltihab', 'sistit', 'piyelonefrit', 'yanmali idrar', 'idrarda yanma', 'dizuri', 'sik idrar', 'pollakiuri', 'idrar kulturu pozitif', 'piyuri', 'bakteriuri'] },
  { id: 'usye', ad: 'Üst solunum yolu enfeksiyonu / boğaz', enfeksiyon: true, terimler: ['usye', 'ust solunum yolu', 'nazofarenjit', 'farenjit', 'tonsillit', 'tonsilofarenjit', 'bogaz agri', 'bogaz enfeksiyon', 'anjin', 'soguk alginligi', 'burun akinti', 'rinore', 'nezle', 'grip benzeri', 'sinuzit', 'strep', 'gabhs', 'kizil'] },
  { id: 'age', ad: 'Gastroenterit / ishal / kusma', enfeksiyon: true, terimler: ['age', 'akut gastroenterit', 'gastroenterit', 'ishal', 'diyare', 'sulu diski', 'kusma', 'emezis', 'bulanti', 'rotavirus', 'dehidratasyon'] },
  { id: 'bronsiolit', ad: 'Bronşiolit / hışıltı', enfeksiyon: true, terimler: ['bronsiolit', 'hisilti', 'hiriltili', 'wheezing', 'wheez', 'ronkus', 'ral', 'bronsit', 'hirilti', 'obstruktif bronsit', 'rsv'] },
  { id: 'pnomoni', ad: 'Pnömoni / alt solunum yolu', enfeksiyon: true, terimler: ['pnomoni', 'zaturre', 'bronkopnomoni', 'alt solunum yolu enfeksiyon', 'asye', 'krepitan ral', 'konsolidasyon'] },
  { id: 'ates', ad: 'Ateş', terimler: ['ates', 'febril', 'yuksek ates', 'subfebril', 'hipertermi', 'ates yuksel'] },
  { id: 'dokuntu', ad: 'Döküntü / ürtiker', terimler: ['dokuntu', 'kizariklik', 'urtiker', 'kurdesen', 'ekzantem', 'makulopapuler', 'pise', 'kasinti', 'pruritus'] },
  { id: 'atopik', ad: 'Egzama / atopik dermatit', terimler: ['egzama', 'ekzema', 'atopik dermatit', 'kuru cilt', 'kserozis', 'seboreik dermatit', 'konak'] },
  { id: 'demir', ad: 'Demir eksikliği / anemi', terimler: ['demir eksikligi', 'demir eksikligi anemisi', 'dea', 'anemi', 'kansizlik', 'dusuk ferritin', 'ferritin dusuk', 'hipokrom', 'mikrositer', 'solukluk', 'demir takviyesi', 'demir profilaksi'] },
  { id: 'kabizlik', ad: 'Kabızlık', terimler: ['kabiz', 'konstipasyon', 'sert diski', 'diski yapamama', 'az diski', 'enkoprezis', 'diski kacirma'] },
  { id: 'reflu', ad: 'Reflü / GÖR', terimler: ['reflu', 'gor', 'gastroozofageal', 'gastro-ozofageal', 'kusma sonrasi', 'geri cikarma', 'regurjitasyon', 'kolik'] },
  { id: 'konjonktivit', ad: 'Konjonktivit', enfeksiyon: true, terimler: ['konjonktivit', 'goz kizarik', 'gozde kizariklik', 'goz akinti', 'capaklanma', 'gozde capak', 'pembe goz'] },
  { id: 'astim', ad: 'Astım / tekrarlayan hışıltı', terimler: ['astim', 'reaktif hava yolu', 'tekrarlayan hisilti', 'bronkospazm', 'inhaler', 'salbutamol', 'ventolin', 'nefes darlig'] },
  { id: 'beslenme', ad: 'Beslenme sorunu / kilo alamama', terimler: ['kilo alamama', 'kilo almiyor', 'beslenme sorun', 'istahsiz', 'yemek yemiyor', 'mama reddi', 'buyume geriligi', 'ftt', 'failure to thrive', 'yetersiz kilo', 'kilo kaybi', 'tarti artisi yetersiz'] },
  { id: 'buyume', ad: 'Büyüme geriliği / boy kısalığı', terimler: ['buyume geriligi', 'boy kisaligi', 'kisa boy', 'buyume yavaslamasi', 'persentil dusus', 'persentil kaybi', 'buyume hizi dusuk'] },
  { id: 'uyku', ad: 'Uyku sorunu', terimler: ['uyku sorun', 'uyumuyor', 'gece uyanma', 'uykusuzluk', 'insomni', 'horlama', 'uyku apnesi'] },
  { id: 'basagrisi', ad: 'Baş ağrısı', terimler: ['bas agri', 'bas agrisi', 'bas donmesi', 'migren', 'sefalji'] },
  { id: 'karinagrisi', ad: 'Karın ağrısı', terimler: ['karin agri', 'karin agrisi', 'kolik', 'abdominal agri', 'mide agri', 'gobek cevresi agri'] },
  { id: 'gelisim', ad: 'Gelişim / konuşma gecikmesi', terimler: ['gelisim gerili', 'gelisimsel gecikme', 'gelisim gecikme', 'konusma gecikme', 'konusamiyor', 'konusmuyor', 'kelime yok', 'yurume gecikme', 'yurumuyor', 'motor gerilik', 'otizm', 'otistik', 'goz temasi yok', 'ismine donmuyor', 'regresyon', 'gerileme', 'becerilerini kaybetti'] },
  { id: 'alerji', ad: 'Alerji', terimler: ['alerji', 'alerjik', 'anafilaksi', 'ilac reaksiyonu', 'besin alerji', 'inek sutu alerji', 'alerjik rinit', 'saman nezlesi'] },
  { id: 'enurezis', ad: 'İdrar kaçırma / enürezis', terimler: ['idrar kacirma', 'enurezis', 'gece islatma', 'yatak islatma', 'altina kacirma', 'inkontinans'] },
  { id: 'ishal-kronik', ad: 'Kronik ishal / emilim', terimler: ['kronik ishal', 'uzamis ishal', 'malabsorbsiyon', 'colyak', 'gluten', 'yagli diski'] },
  { id: 'nobet', ad: 'Nöbet / havale', terimler: ['nobet', 'havale', 'konvulziyon', 'febril konvulziyon', 'ates havalesi', 'kasilma', 'epilepsi', 'bayilma', 'senkop'] },
  { id: 'oksuruk', ad: 'Öksürük', terimler: ['oksuruk', 'kuru oksuruk', 'balgamli oksuruk', 'kronik oksuruk', 'gece oksurugu', 'kruplu', 'krup', 'havlar tarzda'] },
  { id: 'pamukcuk', ad: 'Pamukçuk / oral kandida', enfeksiyon: true, terimler: ['pamukcuk', 'oral kandida', 'moniliazis', 'agizda beyaz plak', 'kandida'] },
  { id: 'bebek-sarilik', ad: 'Yenidoğan sarılığı', terimler: ['sarilik', 'hiperbilirubinemi', 'ikter', 'bilirubin yuksek', 'fototerapi'] },
  { id: 'lenfadenopati', ad: 'Lenf bezi büyümesi', terimler: ['lenfadenopati', 'lap', 'bez buyumesi', 'lenf bezi', 'boyunda sislik'] },
]

function kokEslesir(metin: string, terim: string): boolean {
  const i = metin.indexOf(terim)
  if (i < 0) return false
  // Sözcük başı: "otit" "kotit"i eşlemesin; kısa kısaltmalar (age, gor, lap, iye, dea, ral) tam sözcük olmalı.
  const once = i === 0 ? ' ' : metin[i - 1]
  if (/[a-z0-9]/.test(once)) return kokEslesir(metin.slice(i + 1), terim)
  if (KISALTMA.has(terim)) {
    const sonra = metin[i + terim.length] ?? ' '
    // Kısaltma + Türkçe ek kesme işaretiyle gelir ("AOM'u", "İYE'si") — harf bitişikse başka sözcüktür ("gorme").
    if (/[a-z0-9]/.test(sonra)) return kokEslesir(metin.slice(i + 1), terim)
  }
  return true
}

/** Tam sözcük olarak eşlenmesi gereken kısaltmalar ("gor" ≠ "görme", "age" ≠ "agenezi"). */
const KISALTMA = new Set(['age', 'gor', 'lap', 'iye', 'dea', 'ral', 'aom', 'usye', 'asye', 'ftt', 'rsv', 'eko', 'gabhs'])

/** Metnin andığı eşanlam grupları. */
export function esanlamGruplariBul(metin: string | null | undefined): EsanlamGrubu[] {
  const n = trAramaNormalize(metin)
  if (!n) return []
  return SIKAYET_GRUPLARI.filter((g) => g.terimler.some((t) => kokEslesir(n, t)))
}

/** Brief: `esanlamGenislet(sikayet)` → aranacak terimler (şikayetin kendisi + eşleşen grupların tüm terimleri). */
export function esanlamGenislet(sikayet: string | null | undefined): string[] {
  const n = trAramaNormalize(sikayet)
  const out = new Set<string>()
  if (n) out.add(n)
  for (const g of esanlamGruplariBul(n)) g.terimler.forEach((t) => out.add(t))
  return [...out]
}

/** Metin, genişletilmiş terimlerden birini anıyor mu (katlanmış, sözcük başı). */
export function terimlerdenBiriGeciyor(metin: string | null | undefined, terimler: string[]): string | null {
  const n = trAramaNormalize(metin)
  for (const t of terimler) if (t && kokEslesir(n, t)) return t
  return null
}
