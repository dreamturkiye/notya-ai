/**
 * NOTYA-SOAP-02 — Dünya standardı Türkçe SOAP üretici ("Ayşe Kaya" uzman personası).
 *
 * Tasarım (Kaan direktifi, 2026-09-02 — "make or break" modül):
 * 1. PERSONA: her branş için Türk tıbbının diliyle konuşan profesör personası; Türk tanı-tedavi
 *    rehberleri + branşın altın standart kaynakları birlikte referans alınır.
 * 2. GÜRÜLTÜ FİLTRESİ: transkriptteki havadan sudan sohbet, trafik, tekrarlanan şikayetler
 *    elenir; yalnız klinik değeri olan bilgi işlenir. Not, kayıttan DAHA KISA ve DAHA NET olur.
 * 3. REÇETE ÖNERİSİ: Türk ilaç pratiğine göre (ticari örnek + etken madde + pediatride kg/doz);
 *    her öneri SGK EK-4/A listesine karşı sunucuda doğrulanır ve işaretlenir. HER ZAMAN öneridir —
 *    reçeteyi doktor yazar.
 * 4. STİL ÖĞRENMESİ: doktorun daha önce ONAYLADIĞI notlardan üslup örnekleri few-shot verilir;
 *    düzenleme farkları not_duzenlemeleri tablosunda birikir (v2'de prompt'a damıtılacak).
 * 5. KVKK: modele hastanın kimliği (TC, ad) ASLA gitmez — yalnız yaş/cinsiyet/klinik bağlam.
 *    Kimlik başlığı ekranda sunucu tarafında hasta kaydından birleştirilir.
 */
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { normalize } from '@/lib/ilac/ilacArama'

export interface ReceteOnerisi {
  etkenMadde?: string
  ticariOrnek?: string
  doz?: string
  kullanim?: string
  sure?: string
  not?: string
  sgkListesinde?: boolean
}

const SPECIALTY_KAYNAK: Record<string, { unvan: string; kaynaklar: string }> = {
  pediatri: { unvan: 'çocuk sağlığı ve hastalıkları profesörü', kaynaklar: 'Türkiye Ulusal Aşı Takvimi, Sağlık Bakanlığı çocukluk çağı tanı-tedavi rehberleri, Türk Neonatoloji Derneği rehberleri; Nelson Textbook of Pediatrics 22e, Harriet Lane Handbook 23e' },
  kardiyoloji: { unvan: 'kardiyoloji profesörü', kaynaklar: 'Türk Kardiyoloji Derneği kılavuzları; ESC Guidelines, Braunwald 12e' },
  noroloji: { unvan: 'nöroloji profesörü', kaynaklar: 'Türk Nöroloji Derneği rehberleri; Adams & Victor 12e' },
  psikiyatri: { unvan: 'psikiyatri profesörü', kaynaklar: 'Türkiye Psikiyatri Derneği kılavuzları; DSM-5-TR, Stahl' },
  dahiliye: { unvan: 'iç hastalıkları profesörü', kaynaklar: 'Sağlık Bakanlığı birinci basamak tanı-tedavi rehberleri; Harrison 22e' },
  dermatoloji: { unvan: 'dermatoloji profesörü', kaynaklar: 'Türk Dermatoloji Derneği rehberleri; Fitzpatrick' },
  genel: { unvan: 'klinik tıp profesörü', kaynaklar: 'Sağlık Bakanlığı tanı-tedavi rehberleri; Harrison 22e, Oxford Handbook' },
}

export function aysePersona(specialty: string): string {
  const k = SPECIALTY_KAYNAK[specialty] || SPECIALTY_KAYNAK.genel
  return `Sen Ayşe Kaya — Türkiye'de yetişmiş, Türkçe tıbbi kayıt geleneğini çok iyi bilen bir ${k.unvan} ve Notya'nın klinik not uzmanısın. Klinik akıl yürütmen şu kaynaklara dayanır: ${k.kaynaklar}. İlaç önerilerinde Türkiye'de ruhsatlı ilaçları, Türk reçete pratiğini ve pediatride kilogram başına dozlamayı esas alırsın.`
}

export function soapKurallari(): string {
  return `GÖREV: Aşağıdaki muayene transkriptinden DÜNYA STANDARDINDA bir Türkçe SOAP notu üret.

GÜRÜLTÜ FİLTRESİ (kritik):
- Günlük sohbet, hal hatır, trafik, hava durumu gibi tıbbi değeri OLMAYAN her şeyi ELE.
- Hasta/veli aynı şikayeti kaç kez tekrarlarsa tekrarlasın BİR KEZ, en net haliyle yaz.
- Transkriptte OLMAYAN hiçbir bulguyu üretme; muayene edilmemiş sistemler için "değerlendirilmedi" deme, hiç yazma.
- Not, kayıttan kısa, yoğun ve klinik olarak eksiksiz olmalı.

BİÇİM KURALLARI:
- basvuruYakinmasi: hastanın/velinin kendi ifadesiyle tek cümle başvuru yakınması (tırnak içinde vermeye uygun sadelikte).
- subjektif: yakınma + öykü (süre, seyir, eşlik edenler, etkilenen işlevler) + ilgili özgeçmiş/alerji, veli beyanı olduğu belirtilerek.
- objektif: YALNIZ muayenede saptanan/dikte edilen bulgular ve vitaller.
- vitaller: transkriptte GEÇEN değerleri çıkar (kilo kg, boy cm, ateş °C, nabız, SpO2, tansiyon); geçmeyeni null bırak.
- degerlendirme: numaralı problem listesi; her problem için kısa klinik gerekçe.
- icd10_codes: değerlendirmedeki problemlere karşılık ICD-10 önerileri (Türkçe açıklamayla, birincil işaretli). Bunlar ÖNERİDİR — doktor onaylar.
- plan: numaralı; tedavi, öneriler/eğitim, kontrol zamanı.
- receteOnerisi: önerdiğin her ilaç için etkenMadde + Türkiye'den ticariOrnek + doz (pediatride mg/kg hesabıyla, kilo transkriptte varsa hesapla) + kullanim + sure + gerekirse not. Bu bir ÖNERİDİR; reçeteyi doktor yazar. Hastanın bilinen alerjisi/sürekli ilacıyla çelişen öneri YAPMA, gerekirse not alanında uyar.
- alarmBulgulari: veliye/hastaya anlatılacak "şu olursa hemen gelin" maddeleri.
- kritik_bulgular: doktorun gözünden kaçmaması gereken kırmızı bayraklar (yoksa boş).
- hasta_ozeti: veliye/hastaya SADE DİLDE 3-5 cümle — ne bulundu, ne yapılacak, ilaç nasıl kullanılacak, ne zaman geri gelinmeli.

SADECE geçerli JSON döndür:
{
  "basvuruYakinmasi": "",
  "soap": { "subjektif": "", "objektif": "", "degerlendirme": "", "plan": "" },
  "vitaller": { "kilo": null, "boy": null, "ates": null, "nabiz": null, "spo2": null, "tansiyon": null },
  "anamnez": "",
  "fizik_muayene": "",
  "tani": "",
  "tedavi": "",
  "ilaclar": [{"ad": "", "doz": "", "kullanim": "", "sure": ""}],
  "receteOnerisi": [{"etkenMadde": "", "ticariOrnek": "", "doz": "", "kullanim": "", "sure": "", "not": ""}],
  "icd10_codes": [{"code": "", "description": "", "description_tr": "", "is_primary": true}],
  "kritik_bulgular": [],
  "alarmBulgulari": [],
  "takip_suresi": "",
  "hasta_ozeti": "",
  "ai_confidence": 0.9
}`
}

/** SGK EK-4/A doğrulaması — önerilen ticari adın listede olup olmadığını işaretler.
 * Liste büyük (8.6k); modül yüklemesinde bir kez okunur, normalize ad seti tutulur. */
let sgkAdSeti: Set<string> | null = null
function sgkSetiYukle(): Set<string> {
  if (sgkAdSeti) return sgkAdSeti
  try {
    const ham = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8'))
    const set = new Set<string>()
    for (const i of ham.ilaclar || []) {
      const ad = normalize(String(i.ad || ''))
      if (ad) set.add(ad.split(' ').slice(0, 2).join(' ')) // ilk iki kelime yeterli ayırt edicilik
    }
    sgkAdSeti = set
  } catch { sgkAdSeti = new Set() }
  return sgkAdSeti
}

export function sgkDogrula(oneriler: ReceteOnerisi[]): ReceteOnerisi[] {
  const set = sgkSetiYukle()
  return oneriler.map((o) => {
    const ad = normalize(String(o.ticariOrnek || ''))
    const anahtar = ad.split(' ').slice(0, 2).join(' ')
    return { ...o, sgkListesinde: anahtar.length > 2 && set.has(anahtar) }
  })
}

export interface SoapNotu {
  basvuruYakinmasi?: string
  soap?: { subjektif?: string; objektif?: string; degerlendirme?: string; plan?: string }
  vitaller?: Record<string, unknown>
  anamnez?: string
  fizik_muayene?: string
  tani?: string
  tedavi?: string
  ilaclar?: unknown[]
  receteOnerisi?: ReceteOnerisi[]
  icd10_codes?: unknown[]
  kritik_bulgular?: unknown[]
  alarmBulgulari?: unknown[]
  takip_suresi?: string
  hasta_ozeti?: string
  ai_confidence?: number
}

export interface SoapGirdi {
  transcript: string
  specialty: string
  klinikBaglam?: string // yaş/cinsiyet/alerji/sürekli ilaç — KİMLİKSİZ
  stilOrnekleri?: string // doktorun onayladığı önceki notlardan üslup örnekleri
}

export async function soapNotuUret(anthropic: Anthropic, girdi: SoapGirdi): Promise<SoapNotu> {
  const sistem = [
    aysePersona(girdi.specialty),
    soapKurallari(),
    girdi.klinikBaglam ? `\nHASTANIN BİLİNEN KLİNİK BAĞLAMI (kimliksiz — alerji ve sürekli ilaçlara reçete önerirken MUTLAKA dikkat et):\n${girdi.klinikBaglam}` : '',
    girdi.stilOrnekleri ? `\nDOKTORUN ONAYLADIĞI ÖNCEKİ NOTLARDAN ÜSLUP ÖRNEKLERİ (içeriği değil, ÜSLUBU ve ayrıntı düzeyini taklit et):\n${girdi.stilOrnekleri}` : '',
  ].join('\n')

  const yanit = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: sistem,
    messages: [{ role: 'user', content: `Muayene transkripti:\n\n${girdi.transcript}` }],
  })
  const ham = yanit.content[0].type === 'text' ? yanit.content[0].text : ''
  const temiz = ham.replace(/```json\n?|\n?```/g, '').trim()
  const veri = JSON.parse(temiz) as SoapNotu
  if (Array.isArray(veri.receteOnerisi)) {
    veri.receteOnerisi = sgkDogrula(veri.receteOnerisi as ReceteOnerisi[])
  }
  return veri
}

/** Doktorun onayladığı son notlardan kısa üslup örnekleri derler (few-shot stil öğrenmesi).
 * 10. seansta Ayşe'nin "keskinleşmesinin" v1 mekanizması: doktor neyi nasıl yazıyorsa onu görür. */
export function stilOrnekleriDerle(notlar: { content_subjektif?: string | null; content_plan?: string | null }[]): string {
  const parcalar: string[] = []
  for (const n of notlar.slice(0, 2)) {
    const s = String(n.content_subjektif || '').slice(0, 400)
    const p = String(n.content_plan || '').slice(0, 400)
    if (s || p) parcalar.push(`--- Onaylı not örneği ---\nS: ${s}\nP: ${p}`)
  }
  return parcalar.join('\n')
}
