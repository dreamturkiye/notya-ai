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
import { aiCagir } from '@/lib/ai/cagir'
import fs from 'fs'
import path from 'path'
import { normalize } from '@/lib/ilac/ilacArama'
import { SPECIALTIES } from '@/lib/doktor/specialties'
import { dahiliyeKilidi, dahiliyeMi } from '@/specialties/dahiliye/prompts'
import { soapDozKilidi, soapDozUydurmaKilidi } from '@/lib/doktor/dozKilidi'
import { soapKaynakKilidi } from '@/lib/doktor/kaynakKilidi'
import { kdDogrulanmisKaynaklar } from '@/specialties/kadin-dogum/protocols/dogrulanmis-kaynaklar'
import { notMetinleriniTemizle } from '@/lib/doktor/klinikMetin'
import { soapNumaraliAlanlariDuzenle } from '@/lib/doktor/satirBasiNumarala'
import { kadinDogumKilidi, kadinDogumMi } from '@/specialties/kadin-dogum/prompts'
import { dermatolojiKilidi, dermatolojiMi } from '@/specialties/dermatoloji/prompts'
import { gozKilidi, gozMi } from '@/specialties/goz-hastaliklari/prompts'
import { bransKapsami, pediatrikBaglamMi, veliDiliMi, vitalleriKapsamaGoreSuz } from '@/lib/specialties/kapsam'
import { vitalOlcumleriniNormallestir } from '@/lib/clinical/olcumCoz'

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
  'goz-hastaliklari': { unvan: 'göz hastalıkları profesörü', kaynaklar: 'Türk Oftalmoloji Derneği (TOD) önerileri, Sağlık Bakanlığı protokolleri, SGK SUT 4.2.33 göz ilaç kuralları; ikincil derinlik: Kanski, AAO BCSC' },
  genel: { unvan: 'klinik tıp profesörü', kaynaklar: 'Sağlık Bakanlığı tanı-tedavi rehberleri; Harrison 22e, Oxford Handbook' },
}

export function aysePersona(specialty: string): string {
  // NOTYA-BRANS-01: 30 branşın tamamı uzman sınıfı — lib/doktor/specialties'teki zengin TR
  // kaynak setleri (dernek kılavuzları + SB protokolleri + SGK kuralları) doğrudan personaya
  // akar. SPECIALTY_KAYNAK yalnız listede olmayan/eski anahtarlar için yedektir.
  const s = SPECIALTIES.find((x) => x.key === specialty)
  if (s) {
    return `Sen Ayşe Kaya — Türkiye'de yetişmiş, Türkçe tıbbi kayıt geleneğini çok iyi bilen bir ${s.label} profesörü ve Notya'nın klinik not uzmanısın. Klinik akıl yürütmen şu Türk kaynaklarına dayanır: ${s.references.join('; ')}. İlaç önerilerinde Türkiye'de ruhsatlı ilaçları, Türk reçete pratiğini ve SGK kurallarını esas alırsın${specialty === 'pediatri' || specialty === 'cocuk-cerrahisi' ? ', pediatride kilogram başına dozlama yaparsın' : ''}.`
  }
  const k = SPECIALTY_KAYNAK[specialty] || SPECIALTY_KAYNAK.genel
  return `Sen Ayşe Kaya — Türkiye'de yetişmiş, Türkçe tıbbi kayıt geleneğini çok iyi bilen bir ${k.unvan} ve Notya'nın klinik not uzmanısın. Klinik akıl yürütmen şu kaynaklara dayanır: ${k.kaynaklar}. İlaç önerilerinde Türkiye'de ruhsatlı ilaçları, Türk reçete pratiğini${pediatrikKapsam(specialty) ? ' ve pediatride kilogram başına dozlamayı' : ''} esas alırsın.`
}

/** DAH-PROMPTS-FU + BRANS-ALAN-SIZMASI: growth-percentile (Neyzi), baş çevresi and other pediatric CLINICAL lines belong
 * to pediatric notes only. (Veli wording is NOT this gate — VELI-YASAL-ONAM: every minor patient in every branch gets it,
 * see kapsam.ts → veliDiliMi.) Thin wrapper over the single gate lib/specialties/kapsam.ts → pediatrikBaglamMi(): pediatri / çocuk
 * cerrahisi always; aile hekimliği and a branch-less ("genel") doctor only when the patient is a KNOWN minor; every
 * other branch never. (The old regex version let `genel-cerrahi` match /^genel/, let a stale 'pediatri' in either
 * argument win over a KD doctor, and treated "no branch at all" as pediatric.) */
export function pediatrikKapsam(seansBransi?: string | null, doktorBransi?: string | null, hastaDogumIso?: string | null): boolean {
  return pediatrikBaglamMi({ seansBransi, doktorBransi, hastaDogumIso })
}

/** `pediatrik` = klinik/ölçüm satırları (pediatrikKapsam: baş çevresi, Neyzi, prenatal öykü, mg/kg). `veli` = hitap
 * satırları (VELI-YASAL-ONAM: kapsam.ts → veliDiliMi — reşit olmayan hasta HER branşta veli dilini alır). Verilmezse
 * `pediatrik` ile aynı (pediatri / çocuk cerrahisi promptu bayt bayt değişmedi). */
export function soapKurallari(pediatrik: boolean, veli: boolean = pediatrik): string {
  const ped = (pediatrikMetin: string, yetiskinMetin: string) => (pediatrik ? pediatrikMetin : yetiskinMetin)
  const hitap = (veliMetin: string, hastaMetin: string) => (veli ? veliMetin : hastaMetin)
  return `GÖREV: Aşağıdaki muayene transkriptinden DÜNYA STANDARDINDA bir Türkçe SOAP notu üret.

GÜRÜLTÜ FİLTRESİ (kritik):
- Günlük sohbet, hal hatır, trafik, hava durumu gibi tıbbi değeri OLMAYAN her şeyi ELE.
- ${hitap('Hasta/veli', 'Hasta')} aynı şikayeti kaç kez tekrarlarsa tekrarlasın BİR KEZ, en net haliyle yaz.
- Transkriptte OLMAYAN hiçbir bulguyu üretme; muayene edilmemiş sistemler için "değerlendirilmedi" deme, hiç yazma.
- Not, kayıttan kısa, yoğun ve klinik olarak eksiksiz olmalı.

╔══ EN ÖNEMLİ KURAL — NOT GÖVDESİ vs AI ÖNERİSİ (hukuki) ══╗
Notun GÖVDESİ (basvuruYakinmasi, subjektif, objektif, degerlendirme, plan, anamnez,
fizik_muayene, tani, tedavi, vitaller) YALNIZ doktorun/${hitap('velinin', 'hastanın')} DEDİĞİNİ içerir. Bu
alanlar hastanın kendi portalinde GÖRÜNÜR ve resmî kayıttır.
- degerlendirme: doktorun söylediği/koyduğu tanıları yaz. Doktorun AĞZINDAN ÇIKMAYAN
  ayırıcı tanı, dışlanan tanı, "olasılık", "düşünülmeli" gibi KENDİ ÇIKARIMINI EKLEME.
- plan: doktorun söylediği tedavi/tetkik/kontrolü yaz. Doktorun söylemediği öneri/eğitim/
  ilaç EKLEME.
- Doktorun söylemediği HER TÜRLÜ kendi klinik yorumun, önerin, ayırıcı tanın, ek tetkik
  fikrin YALNIZ şu ayrı alanlara gider (bunlar hastaya GÖRÜNMEZ, yalnız doktora):
  aiDegerlendirme, receteOnerisi, alarmBulgulari, kritik_bulgular, icd10_codes.
- İlke: not gövdesini bir sekreter gibi yaz (ne söylendiyse o); öneriyi bir danışman gibi
  AYRI ver. İkisini ASLA karıştırma. Şüphedeysen gövdeye DEĞİL öneri alanına koy.
╚════════════════════════════════════════════════════╝

BİÇİM KURALLARI — Türk tıp geleneği (Dr. Gökhan referansları, 2026-09-03):
Not, Türk tıp fakültesi anamnez geleneğine ve klinik akışa sadık yazılır:
ANAMNEZ (şikayet → hikaye → özgeçmiş → soygeçmiş → alışkanlıklar → sistem sorgusu) → FİZİK MUAYENE → LABORATUVAR/GÖRÜNTÜLEME → TANI → TEDAVİ.
- basvuruYakinmasi: ${hitap('hastanın/velinin', 'hastanın')} kendi ifadesiyle tek cümle başvuru yakınması.
- subjektif: Türk anamnez düzeninde ETIKETLI alt bölümlerle yaz (yalnız içeriği olanları):
  "Şikayet: ..." (ana yakınma ve süresi)
  "Şikayetin Hikayesi: ..." (yakınmanın öyküsü: başlangıç, seyir, eşlik edenler, denenmiş tedaviler)
  "Özgeçmiş: ..." (${ped('pediatride prenatal/natal/postnatal öykü, ', '')}geçirilmiş hastalıklar/ameliyatlar, alerji, sürekli ilaçlar, aşı durumu)
  "Soygeçmiş: ..." (ailede benzer/önemli hastalıklar, akrabalık)
  "Alışkanlıklar: ..." (${ped('beslenme; erişkinde sigara/alkol', 'beslenme, sigara/alkol')})
  ${hitap('Veli beyanı olduğu belirtilerek; transkriptte', 'Transkriptte')} olmayan alt bölümü HİÇ yazma.
- objektif: FİZİK MUAYENE sistematiğinde yaz: "Genel durum: ..." ile başla (bilinç/koopere-oryante, distres, cilt-mukoza: solukluk/ikter/siyanoz, hidrasyon). Sonra YALNIZ muayene edilen sistemler, klasik düzen ve terminolojiyle — solunum (dinlemekle ral/ronküs/wheezing, eşit katılım), kardiyovasküler (S1-S2, üfürüm, periferik nabızlar, ödem), batın (inspeksiyon→oskültasyon→perküsyon→palpasyon sırasına saygılı: bağırsak sesleri, hassasiyet, defans/rebound, organomegali), KBB/baş-boyun, cilt, nörolojik (bilinç/GKS, kranyal sinirler, motor-duyu, DTR/Babinski, serebellar), kas-iskelet (ROM, şişlik/ısı artışı), GÜS (KVAH). Dikte edilen bulguyu uygun sistem başlığı altına, uygun terimle yerleştir; muayene edilmeyen sistemi HİÇ yazma. Varsa laboratuvar ve görüntüleme sonuçlarını "Laboratuvar: / Görüntüleme: ..." satırlarıyla en sona ekle.${ped(' BÜYÜME/VKİ PERSENTİLİ KENDİN HESAPLAMA, WHO referansı verme, "X. persentil" gibi bir sayı uydurma — bu hesap uygulamada ayrı, doğrulanmış bir bölümde (Neyzi standartları) otomatik gösteriliyor; sen yalnız ölçülen ham değerleri (kilo/boy/baş çevresi) yaz.', ' VKİ sınıfı veya persentil hesaplayıp sayı uydurma; yalnız ölçülen ham değerleri yaz.')}
- vitaller: transkriptte GEÇEN değerleri çıkar (kilo kg, boy cm, ${ped('baş çevresi cm — pediatri sağlam çocuk muayenesinde, ', '')}ateş °C, nabız, solunum sayısı /dk, SpO2, tansiyon); geçmeyeni null bırak. Kilo HER ZAMAN kilogram: gram görürsen (3180 g / 3180 gr) kg'a çevir (3.18). Değerin yanına birim YAZMA — form zaten kg/cm gösterir (kilo: 3.18, boy: 50.5${ped(', basCevresi: 34.7', '')}).
- degerlendirme: doktorun söylediği/koyduğu TANILARI yaz (numaralı problem listesi). YALNIZ
  doktorun ifade ettiği tanılar — kendi ayırıcı tanını, dışladığın tanıları, olasılık
  yorumunu BURAYA YAZMA (onlar aiDegerlendirme'ye gider). Doktor açıkça söylemediyse ${ped('VKİ/büyüme persentiline', 'VKİ\'ye')} dayalı bir tanı (ör. "obezite") YAZMA.
  NUMARALAMA: her madde YENİ SATIRDA ("1. ...\\n2. ..."). "1. 3 günlük ... 2. Sarılık" tek satır YASAK. Ondalık (3.18) ve ICD (Z00.110) kırılmaz.
- icd10_codes: değerlendirmedeki problemlere karşılık ICD-10 önerileri (Türkçe açıklamayla, birincil işaretli). Bunlar ÖNERİDİR — doktor onaylar.
- plan: doktorun SÖYLEDİĞİ tedavi/tetkik/kontrolü numaralı yaz (TEDAVİ başta): 1) doktorun
  söylediği tedavi/ilaç, 2) doktorun istediği tetkik/görüntüleme, 3) kontrol zamanı. Doktorun
  söylemediği öneri/eğitim/ilaç EKLEME (onlar aiDegerlendirme/receteOnerisi'ne gider).
  NUMARALAMA: 1) / a) maddeleri de YENİ SATIRDA; "1. TEDAVİ: a) ... b) ... 2. TAKİP" tek satır YASAK.
- ilaclar: plan'daki TEDAVİ satırlarının (ilaç/takviye kalemleri) YAPILANDIRILMIŞ hâlidir — AYRI BİR KAYNAK DEĞİL. Her kalem için ad/doz/kullanım/süre plan'da yazdığınla BİREBİR AYNI ürün adı ve dozu taşımalı (ör. plan'da "Wellcare D vitamini damlası 1000ü/damla haftada 5 damla" yazdıysan, ilaclar'da da aynı ürün adı ve aynı doz olmalı — farklı bir marka/doz uydurma). Reçete doğrudan bu alandan üretilir; tutarsızlık yanlış ilaç yazılmasına yol açar.
- asilar: YALNIZ BU MUAYENEDE UYGULANDIĞI söylenen aşılar ("yapıldı", "uygulandı", "vuruldu", "verildi", "bugün yapıldı"). Planlanan, önerilen, sonraki kontrolde yapılacak ya da daha önce / başka yerde yapılmış aşıları bu listeye KOYMA — onlar yalnız plan / özgeçmiş metninde kalır. Her öğe: asi_adi (Ulusal Aşı Takvimi adıyla — "Hepatit B", "DaBT-İPA-Hib", "KPA", "KKK", "Suçiçeği", "Hepatit A", "BCG", "OPA", "Td", "Grip"…), doz_no (YALNIZ söylendiyse sayı, söylenmediyse null — tahmin ETME), lot_no ve uygulama_yeri (yalnız söylendiyse, yoksa boş), notlar. Tarih YAZMA — uygulama muayene tarihini kendisi koyar. Bu muayenede aşı yapılmadıysa boş dizi [].
- aiDegerlendirme: SENİN klinik yorumun — hastaya GÖRÜNMEZ, yalnız doktora. Ayırıcı tanı
  düşünüşü, dışlanan tanılar, doktorun atlamış olabileceği noktalar, ek tetkik/tedavi önerisi.
  "Öneri (doktor onayına tabi):" diye başla. Doktorun kesin dediğini burada tekrar etme.${ped('\n  BÜYÜME/VKİ PERSENTİLİ KENDİN HESAPLAMA, sayı uydurma, WHO referansı kullanma: uygulama Neyzi sonucunu senin çıktından SONRA aiDegerlendirme\'ye ekler. Kendi "X. persentil" sayını yazma. Büyüme persentiline bakınız demek yeter; resmi tanıya persentilden tanı (obezite, malnütrisyon) doktor söylemedikçe koyma.', '')}
- receteOnerisi: önerdiğin her ilaç için etkenMadde + Türkiye'den ticariOrnek + doz${ped(' (pediatride mg/kg hesabıyla, kilo transkriptte varsa hesapla)', '')} + kullanim + sure + gerekirse not. Bu bir ÖNERİDİR; reçeteyi doktor yazar. Hastanın bilinen alerjisi/sürekli ilacıyla çelişen öneri YAPMA, gerekirse not alanında uyar.
- alarmBulgulari: "Evde dikkat edilmesi gerekenler" — ${hitap('veliye/hastaya', 'hastaya')} sakin dille anlatılacak izlem maddeleri. Üslup ASLA alarmcı olmasın ("hemen gelin", "derhal başvurun" YAZMA). Kalıp: önce izlenecek durumları listele, sonra tek yönlendirme cümlesi: "Şu durumlarda doktorunuz ile temas kurun: ..." ve en sonda "Acil bir durumda acil servise başvurun."
- anamnez: tam anamnez metni — şikayet→hikaye→özgeçmiş→soygeçmiş→alışkanlıklar akışını tek parça düzyazı olarak da doldur (epikriz ve resmî kayıt için).
- PLAN SÜREKLİLİĞİ: bağlamda ÖNCEKİ VİZİT PLANI verilmişse, değerlendirmede önceki plan maddelerinin akıbetine kısaca değin (yapıldı/yapılmadı/etkisi ne oldu) ve yeni planı bunun üzerine kur — her vizit bir öncekinin devamıdır, izole not yazma.
- kritik_bulgular: doktorun gözünden kaçmaması gereken kırmızı bayraklar (yoksa boş).
- hasta_ozeti: ${hitap('veliye/hastaya', 'hastaya')} SADE DİLDE 3-5 cümle — ne bulundu, ne yapılacak, ilaç nasıl kullanılacak, ne zaman geri gelinmeli. Kesin sonuç vaadi/garanti dili KULLANMA ("kesin iyileşir", "sorun yok" YAZMA); "saptandı / önerildi / değerlendirildi" gibi tespit dili kullan ve gerektiğinde "belirtiler değişirse hekiminize danışınız" yönlendirmesiyle bitir.

SADECE geçerli JSON döndür:
{
  "basvuruYakinmasi": "",
  "soap": { "subjektif": "", "objektif": "", "degerlendirme": "", "plan": "" },
  "aiDegerlendirme": "",
  "vitaller": { "kilo": null, "boy": null, ${ped('"basCevresi": null, ', '')}"ates": null, "nabiz": null, "solunum": null, "spo2": null, "tansiyon": null },
  "anamnez": "",
  "fizik_muayene": "",
  "tani": "",
  "tedavi": "",
  "ilaclar": [{"ad": "", "doz": "", "kullanim": "", "sure": ""}],
  "asilar": [{"asi_adi": "", "doz_no": null, "lot_no": "", "uygulama_yeri": "", "notlar": ""}],
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
  aiDegerlendirme?: string
  vitaller?: Record<string, unknown>
  anamnez?: string
  fizik_muayene?: string
  tani?: string
  tedavi?: string
  ilaclar?: unknown[]
  /** NOTYA-ASI-NOT-01: raw model list — routes pass it through muayeneAsilariniHazirla before saving. */
  asilar?: unknown[]
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
  stilProfili?: string // NOTYA-OGRENME-02: düzeltme geçmişinden damıtılmış doktor tercihleri
  doktorAdi?: string // Kaan 2026-09-10: veli özetinde "Doktorunuz" yerine "Dr. Ad Soyad"
  doktorBransi?: string | null // DAH-PROMPTS-LOCK: users.specialty — seans bağlamı branş göndermese de kilit uygulanır
  hastaDogumIso?: string | null // BRANS-ALAN-SIZMASI: aile/genel pediatrik bağlam + VELI-YASAL-ONAM (<18 → veli dili, her branş)
  doctorId?: string | null // NOTYA-MALIYET-01: yalnız ai_token_kullanim ölçümü (prompta girmez)
  cekListeBlogu?: string // hekim çek listesi — gövdeye uydurma yasağı
}

/** AUDIT-2026-09-03 (canlı olay, 16:27): uzun muayenelerde model çıktısı token tavanında
 * DİZİ ORTASINDA kesilebiliyor — düz parse da köşeli-dilim de patlıyordu. Bu onarıcı:
 * (1) düz dener, (2) ilk '{'dan gövdeyi alıp dener, (3) kesik çıktıyı son tam öğede kırkıp
 * açık string'i ve parantez YĨĞININI doğru sırayla kapatarak dener. Başarısızsa açık hata. */
function jsonKurtar(metin: string): SoapNotu {
  const dene = (s: string): SoapNotu | null => { try { return JSON.parse(s) as SoapNotu } catch { return null } }
  let v = dene(metin)
  if (v) return v
  const bas = metin.indexOf('{')
  if (bas === -1) throw new Error('SOAP çıktısı ayrıştırılamadı (JSON yok)')
  const govde = metin.slice(bas)
  v = dene(govde)
  if (v) return v
  const adaylar = [govde]
  for (const kesici of ['},', '],', '",', '}']) {
    const i = govde.lastIndexOf(kesici)
    if (i > 0) adaylar.push(govde.slice(0, i + 1))
  }
  for (const parca of adaylar) {
    let str = false, esc = false
    const yigin: string[] = []
    for (const ch of parca) {
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === '"') { str = !str; continue }
      if (str) continue
      if (ch === '{') yigin.push('}')
      else if (ch === '[') yigin.push(']')
      else if (ch === '}' || ch === ']') yigin.pop()
    }
    let aday = parca
    if (str) aday += '"'
    aday = aday.replace(/,\s*$/, '') + yigin.reverse().join('')
    v = dene(aday)
    if (v) return v
  }
  throw new Error('SOAP çıktısı ayrıştırılamadı (onarılamadı)')
}

/** Persona key: the session branch when it is a known specialty; otherwise users.specialty (KD-PROMPTS-LOCK: a KD doctor's
 * profile value 'kadin-dogum' is not a SPECIALTIES key, so their notes were written by the "genel" persona). */
export function soapPersonaAnahtari(girdi: Pick<SoapGirdi, 'specialty' | 'doktorBransi'>): string {
  if (SPECIALTIES.some((x) => x.key === girdi.specialty)) return girdi.specialty
  if (kadinDogumMi(girdi.doktorBransi)) return 'kadin-hastaliklari-dogum'
  if (dermatolojiMi(girdi.doktorBransi)) return 'dermatoloji'
  if (gozMi(girdi.doktorBransi)) return 'goz-hastaliklari'
  if (girdi.doktorBransi && SPECIALTIES.some((x) => x.key === girdi.doktorBransi)) return girdi.doktorBransi
  return girdi.specialty
}

/** Branches whose prompts/ lock says "Doz yazma" (dahiliye, kadın doğum, dermatoloji, göz) — they get the FULL dose lock.
 * Not a gate on the invention backstop: soapDozUydurmaKilidi / the chat cleaner run for every branch (CROSS-SPECIALTY-PARITY). */
export function dozKilitliBrans(...branslar: (string | null | undefined)[]): boolean {
  return dahiliyeMi(...branslar) || kadinDogumMi(...branslar) || dermatolojiMi(...branslar) || gozMi(...branslar)
}

/** System prompt for SOAP generation. Dahiliye / kadın doğum / dermatoloji / göz doctors get their prompts/ lock appended. */
export function soapSistemPromptu(girdi: SoapGirdi): string {
  const personaAnahtari = soapPersonaAnahtari(girdi)
  return [
    aysePersona(personaAnahtari),
    soapKurallari(pediatrikKapsam(girdi.specialty, girdi.doktorBransi, girdi.hastaDogumIso), veliDiliMi({ seansBransi: girdi.specialty, doktorBransi: girdi.doktorBransi, hastaDogumIso: girdi.hastaDogumIso })),
    girdi.klinikBaglam ? `\nHASTANIN BİLİNEN KLİNİK BAĞLAMI (kimliksiz — alerji ve sürekli ilaçlara reçete önerirken MUTLAKA dikkat et):\n${girdi.klinikBaglam}` : '',
    girdi.stilOrnekleri ? `\nDOKTORUN ONAYLADIĞI ÖNCEKİ NOTLARDAN ÜSLUP ÖRNEKLERİ (içeriği değil, ÜSLUBU ve ayrıntı düzeyini taklit et):\n${girdi.stilOrnekleri}` : '',
    girdi.stilProfili ? `\nDOKTORUN ÖĞRENİLMİŞ TERCİHLERİ (kendi düzeltmelerinden damıtıldı — bu kurallara MUTLAKA uy):\n${girdi.stilProfili}` : '',,
    girdi.doktorAdi ? `\nHEKİM ADI: ${girdi.doktorAdi}. hasta_ozeti ve alarmBulgulari metinlerinde "doktorunuz" / "hekiminiz" yerine bu adı kullan (örn. "${girdi.doktorAdi} antibiyotik başladı", "şu durumlarda ${girdi.doktorAdi} ile temas kurun").` : '',
    dahiliyeMi(girdi.specialty, girdi.doktorBransi) ? dahiliyeKilidi('soap') : kadinDogumMi(girdi.specialty, girdi.doktorBransi) ? kadinDogumKilidi('soap') : dermatolojiMi(girdi.specialty, girdi.doktorBransi) ? dermatolojiKilidi('soap') : gozMi(girdi.specialty, girdi.doktorBransi) ? gozKilidi('soap') : '',
    ...(girdi.cekListeBlogu ? [girdi.cekListeBlogu] : []),
  ].join('\n')
}

export async function soapNotuUret(anthropic: Anthropic, girdi: SoapGirdi): Promise<SoapNotu> {
  const sistem = soapSistemPromptu(girdi)

  // NOTYA-MALIYET-01: muayene/SOAP notu — GÜÇLÜ
  const yanit = await aiCagir({
    istemci: anthropic,
    gorev: 'soap',
    maxTokens: 8000,
    doctorId: girdi.doctorId ?? null,
    system: sistem,
    messages: [{ role: 'user', content: `Muayene transkripti:\n\n${girdi.transcript}` }],
  })
  const ham = yanit.content[0].type === 'text' ? yanit.content[0].text : ''
  const temiz = ham.replace(/```json\n?|\n?```/g, '').trim()
  const veri = jsonKurtar(temiz)
  if (Array.isArray(veri.receteOnerisi)) veri.receteOnerisi = sgkDogrula(veri.receteOnerisi as ReceteOnerisi[])
  // BRANS-ALAN-SIZMASI: a non-pediatric note never keeps a pediatric-only vital the model filled (fetal "baş çevresi"
  // dictated during an obstetric USG is not the mother's vital sign).
  veri.vitaller = vitalOlcumleriniNormallestir(vitalleriKapsamaGoreSuz(veri.vitaller, bransKapsami({ seansBransi: girdi.specialty, doktorBransi: girdi.doktorBransi, hastaDogumIso: girdi.hastaDogumIso })))
  // KD-DERM-SAFETY-FINDINGS F1: prompt-locked branches never keep a model-written dose the hekim did not give.
  // KD-DERM-SAFETY-FINDINGS F4 (every branch): no internal field names, no invented consent form number in doctor-facing text.
  // KD-KAYNAK-KILIDI: kadın doğum notes never keep a guideline number / year that is not in the verified list.
  // CROSS-SPECIALTY-PARITY: the prompt-locked chapters get the full lock (dose-free receteOnerisi too); every other
  // branch in lib/doktor/specialties still gets the invention backstop — a dose the hekim never said never ships.
  const dozlu = dozKilitliBrans(girdi.specialty, girdi.doktorBransi) ? soapDozKilidi(veri, girdi.transcript, girdi.klinikBaglam) : soapDozUydurmaKilidi(veri, girdi.transcript, girdi.klinikBaglam)
  return notMetinleriniTemizle(soapNumaraliAlanlariDuzenle(kadinDogumMi(girdi.specialty, girdi.doktorBransi) ? soapKaynakKilidi(dozlu, kdDogrulanmisKaynaklar()) : dozlu))
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

/** NOTYA-OGRENME-02 — düzeltme farklarını kompakt doktor stil profiline damıtır (Haiku, ucuz).
 * Onay rotası, düzeltme içeren her onayda çağırır; profil sonraki TÜM not üretimlerine gider.
 * Veri çarkı (flywheel): doktor düzelttıkçe Ayşe o doktora özgü keskinleşir — birikim,
 * kopyalanamayan doktor-başına rekabet avantajıdır. */
export async function stilProfiliDamit(
  anthropic: Anthropic,
  mevcutProfil: string,
  duzeltmeler: { alan?: string | null; onceki?: string | null; sonraki?: string | null }[],
  doktorBransi?: string | null
): Promise<string> {
  const ornekler = duzeltmeler.slice(0, 20).map((d, i) =>
    `${i + 1}. [${d.alan || '?'}]\nÖNCE: ${String(d.onceki || '').slice(0, 400)}\nSONRA: ${String(d.sonraki || '').slice(0, 400)}`
  ).join('\n\n')
  if (!ornekler) return mevcutProfil
  // NOTYA-MALIYET-01: doktorun kendi düzeltmelerinden tercih çıkarımı — dar HIZLI listesinde (hasta verisi yorumlamaz)
  const yanit = await aiCagir({
    istemci: anthropic,
    gorev: 'cikarim',
    maxTokens: 800,
    system: `Bir doktorun yapay zekâ taslak notlarına yaptığı düzeltmelerden, gelecekteki not üretimine rehber olacak KOMPAKT bir tercih profili çıkar. En fazla 12 madde.

ÇOK ÖNEMLİ — GÜVEN EŞİĞİ (Kaan/Gökhan, 2026-09-09): bu profil "MUTLAKA uy" talimatıyla her yeni nota enjekte edilir, yani buraya giren HER madde bir sonraki hastada otomatik uygulanır. İki tercih türünü AYRI EŞİKLE değerlendir:
- ÜSLÜP tercihleri (terminoloji, format, uzunluk/ayrıntı düzeyi, yapı, hangi öğe türlerini siler/ekler): DÜŞÜK RİSK, tek örnekten bile kural çıkarabilirsin.
- KLİNİK tercihler (belirli bir ilaç seçimi, doz şeması, tedavi planı değişikliği): YÜKSEK RİSK — hastaya özgü bir sebep olabilir (başka ilaç kullanımı, alerji, tolerans). SADECE aynı veya açıkça benzer değişikliğin aşağıdaki YENİ DÜZELTMELER listesinde EN AZ 2 FARKLI ÖRNEKTE tekrarlandığını gördüğünde bir klinik kural olarak yaz. Tek örnekte gördüğün bir ilaç/doz değişikliğini profile YAZMA (ne mevcut listeye ekle ne yeni madde aç) — profil "MUTLAKA uy" olduğu için tek vakadan genelleme riskli; o vakada başka bir klinik sebep olabilir. Liste son 20 düzeltmeyi içerir, yani aynı tercih birden fazla vizitte tekrarlanmışsa hepsi burada görünür — sayıp karar ver.

Hastaya özgü klinik içerikten (o hastanın adı, o vizidin detayları) kural üretme — yalnız GENELLENEBİLİR kalıplar. Mevcut profil varsa güncelleyip birleştir, çelişenlerde yeni düzeltmeyi esas al. SADECE madde listesini döndür.${dahiliyeMi(doktorBransi) ? dahiliyeKilidi('ogrenme') : kadinDogumMi(doktorBransi) ? kadinDogumKilidi('ogrenme') : dermatolojiMi(doktorBransi) ? dermatolojiKilidi('ogrenme') : gozMi(doktorBransi) ? gozKilidi('ogrenme') : ''}`,
    messages: [{ role: 'user', content: `MEVCUT PROFİL:\n${mevcutProfil || '(yok)'}\n\nYENİ DÜZELTMELER:\n${ornekler}` }],
  })
  const metin = yanit.content[0]?.type === 'text' ? yanit.content[0].text.trim() : ''
  return metin || mevcutProfil
}
