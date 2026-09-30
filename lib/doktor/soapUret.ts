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
import { aiCagir, yanitKademesi, type SistemBlogu } from '@/lib/ai/cagir'
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
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
Notun GÖVDESİ (basvuruYakinmasi, subjektif, objektif, degerlendirme, plan, vitaller) YALNIZ doktorun/${hitap('velinin', 'hastanın')} DEDİĞİNİ içerir. Bu
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
- anamnez / fizik muayene / tanı / tedavi metnini AYRICA YAZMA: uygulama bunları subjektif / objektif / degerlendirme / plan'dan kendisi türetir (epikriz ve resmî kayıt için).
- PLAN SÜREKLİLİĞİ: bağlamda ÖNCEKİ VİZİT PLANI verilmişse, değerlendirmede önceki plan maddelerinin akıbetine kısaca değin (yapıldı/yapılmadı/etkisi ne oldu) ve yeni planı bunun üzerine kur — her vizit bir öncekinin devamıdır, izole not yazma.
- kritik_bulgular: doktorun gözünden kaçmaması gereken kırmızı bayraklar (yoksa boş).
- hasta_ozeti: ${hitap('veliye/hastaya', 'hastaya')} SADE DİLDE 3-5 cümle — ne bulundu, ne yapılacak, ilaç nasıl kullanılacak, ne zaman geri gelinmeli. Kesin sonuç vaadi/garanti dili KULLANMA ("kesin iyileşir", "sorun yok" YAZMA); "saptandı / önerildi / değerlendirildi" gibi tespit dili kullan ve gerektiğinde "belirtiler değişirse hekiminize danışınız" yönlendirmesiyle bitir.

ÇIKTI iki ayrı JSON'dur; her çağrı YALNIZ mesajın sonundaki ÇAĞRI satırında istenen JSON'u döndürür.
(A) NOT GÖVDESİ — SADECE geçerli JSON döndür:
{
  "basvuruYakinmasi": "",
  "soap": { "subjektif": "", "objektif": "", "degerlendirme": "", "plan": "" },
  "vitaller": { "kilo": null, "boy": null, ${ped('"basCevresi": null, ', '')}"ates": null, "nabiz": null, "solunum": null, "spo2": null, "tansiyon": null },
  "ilaclar": [{"ad": "", "doz": "", "kullanim": "", "sure": ""}],
  "asilar": [{"asi_adi": "", "doz_no": null, "lot_no": "", "uygulama_yeri": "", "notlar": ""}],
  "icd10_codes": [{"code": "", "description": "", "description_tr": "", "is_primary": true}],
  "takip_suresi": "",
  "ai_confidence": 0.9,
  "uygulananKurallar": []
}
(B) AI ÖNERİSİ — SADECE geçerli JSON döndür:
{
  "aiDegerlendirme": "",
  "receteOnerisi": [{"etkenMadde": "", "ticariOrnek": "", "doz": "", "kullanim": "", "sure": "", "not": ""}],
  "kritik_bulgular": [],
  "alarmBulgulari": [],
  "hasta_ozeti": ""
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
  /** NOTYA-NOT-HIZ-01: modelden gelmez — turkceBolumleriTuret ile soap'tan türetilir (routes content_* sütunlarına yazar). */
  anamnez?: string | null
  fizik_muayene?: string | null
  tani?: string | null
  tedavi?: string | null
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
  /** NOTYA-MESLEKTAS-V2: bu notta uygulanan kural slugs (sunulan listeden). */
  uygulananKurallar?: string[]
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
  /** UYGULANIR kurallar — değişken (önbelleksiz) blok. En fazla 12. */
  doktorKurallari?: { slug: string; satir: string }[]
}

/** AUDIT-2026-09-03 (canlı olay, 16:27): uzun muayenelerde model çıktısı token tavanında
 * DİZİ ORTASINDA kesilebiliyor — düz parse da köşeli-dilim de patlıyordu. Bu onarıcı:
 * (1) düz dener, (2) ilk '{'dan gövdeyi alıp dener, (3) kesik çıktıyı son tam öğede kırkıp
 * açık string'i ve parantez YĨĞININI doğru sırayla kapatarak dener. Başarısızsa açık hata. */
/** NOTYA-BETA-0925: ayrıştırılamayan model çıktısı — geçici sayılır, seans bitişinde bir kez daha denenir
 * (lib/doktor/soapYeniden.ts). Mesajı sabit metindir; model çıktısı taşımaz. */
export class SoapCiktiHatasi extends Error {
  constructor(mesaj: string) { super(mesaj); this.name = 'SoapCiktiHatasi' }
}

function jsonKurtar(metin: string): SoapNotu {
  // F3 onarıcı lib/ai/jsonOnar.ts'te — cagir.ts G2 (d) aynı algoritmayla "kurtarılabilir mi" ölçer (LUNAPRO-01).
  const r = jsonOnarDetay(metin)
  if (r.neden === 'json_yok') throw new SoapCiktiHatasi('SOAP çıktısı ayrıştırılamadı (JSON yok)')
  if (r.neden !== 'ok' || !r.deger || typeof r.deger !== 'object') throw new SoapCiktiHatasi('SOAP çıktısı ayrıştırılamadı (onarılamadı)')
  return r.deger as SoapNotu
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

export function doktorKurallariBlogu(kurallar: { slug: string; satir: string }[] | undefined): string {
  const liste = (kurallar || []).filter((k) => k.slug && k.satir).slice(0, 12)
  if (!liste.length) return ''
  const satirlar = liste.map((k) => `- [${k.slug}] ${k.satir}`).join('\n')
  return `\nDOKTORUN KURALLARI (düzeltmelerinden — UYGULA, sorma; klinik güvenlik uyarısını gevşetme):\n${satirlar}\nuygulananKurallar dizisine bu notta gerçekten uyguladığın slug'ları yaz. Listede olmayan slug uydurma.`
}

export function uygulananKurallariSuz(
  donen: unknown,
  sunulan: { slug: string }[] | undefined,
): string[] {
  const izin = new Set((sunulan || []).map((k) => k.slug).filter(Boolean))
  if (!izin.size) return []
  const ham = Array.isArray(donen) ? donen : []
  return [...new Set(ham.map((x) => String(x || '').trim()).filter((s) => izin.has(s)))]
}

/** NOTYA-NOT-HIZ-01: system prompt as two blocks. The first (persona + rules + the branch's prompts/ lock) depends only on
 * branch + pediatrik/veli axes, never on the patient → cached (`onbellek`), shared by both note calls and by every note of
 * the same branch. Patient context, style examples, hafıza profile, hekim adı and çek listesi stay in the second, uncached block. */
export function soapSistemBloklari(girdi: SoapGirdi): SistemBlogu[] {
  const personaAnahtari = soapPersonaAnahtari(girdi)
  const sabit = [
    aysePersona(personaAnahtari),
    soapKurallari(pediatrikKapsam(girdi.specialty, girdi.doktorBransi, girdi.hastaDogumIso), veliDiliMi({ seansBransi: girdi.specialty, doktorBransi: girdi.doktorBransi, hastaDogumIso: girdi.hastaDogumIso })),
    dahiliyeMi(girdi.specialty, girdi.doktorBransi) ? dahiliyeKilidi('soap') : kadinDogumMi(girdi.specialty, girdi.doktorBransi) ? kadinDogumKilidi('soap') : dermatolojiMi(girdi.specialty, girdi.doktorBransi) ? dermatolojiKilidi('soap') : gozMi(girdi.specialty, girdi.doktorBransi) ? gozKilidi('soap') : '',
  ]
  const degisken = [
    girdi.klinikBaglam ? `\nHASTANIN BİLİNEN KLİNİK BAĞLAMI (kimliksiz — alerji ve sürekli ilaçlara reçete önerirken MUTLAKA dikkat et):\n${girdi.klinikBaglam}` : '',
    girdi.stilOrnekleri ? `\nDOKTORUN ONAYLADIĞI ÖNCEKİ NOTLARDAN ÜSLUP ÖRNEKLERİ (içeriği değil, ÜSLUBU ve ayrıntı düzeyini taklit et):\n${girdi.stilOrnekleri}` : '',
    girdi.stilProfili ? `\nDOKTORUN ÖĞRENİLMİŞ TERCİHLERİ (kendi düzeltmelerinden damıtıldı — bu kurallara MUTLAKA uy):\n${girdi.stilProfili}` : '',
    doktorKurallariBlogu(girdi.doktorKurallari),
    girdi.doktorAdi ? `\nHEKİM ADI: ${girdi.doktorAdi}. hasta_ozeti ve alarmBulgulari metinlerinde "doktorunuz" / "hekiminiz" yerine bu adı kullan (örn. "${girdi.doktorAdi} antibiyotik başladı", "şu durumlarda ${girdi.doktorAdi} ile temas kurun").` : '',
    ...(girdi.cekListeBlogu ? [girdi.cekListeBlogu] : []),
  ]
  return [
    { metin: sabit.filter(Boolean).join('\n'), onbellek: true },
    { metin: degisken.filter(Boolean).join('\n') },
  ]
}

/** System prompt for SOAP generation as one string. Dahiliye / kadın doğum / dermatoloji / göz doctors get their prompts/ lock. */
export function soapSistemPromptu(girdi: SoapGirdi): string {
  return soapSistemBloklari(girdi).map((b) => b.metin).filter(Boolean).join('\n')
}

/** NOTYA-NOT-HIZ-01: the Turkish-tradition prose columns are the SOAP sections themselves (labels kept — Dr. Gökhan's
 * 2026-09-03 headers); the model no longer writes the same content twice. Empty section → null. */
export function turkceBolumleriTuret(soap: SoapNotu['soap'] | null): Pick<SoapNotu, 'anamnez' | 'fizik_muayene' | 'tani' | 'tedavi'> {
  const al = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  return { anamnez: al(soap?.subjektif), fizik_muayene: al(soap?.objektif), tani: al(soap?.degerlendirme), tedavi: al(soap?.plan) }
}

/** Advisory fields — produced only by the second (öneri) call. */
const ONERI_ALANLARI = ['aiDegerlendirme', 'receteOnerisi', 'kritik_bulgular', 'alarmBulgulari', 'hasta_ozeti'] as const

/** NOTYA-NOT-HIZ-03: the advisory (B) result, already locked the same way as the note body — ready to write to the note row. */
export type SoapOnerisi = Pick<SoapNotu, (typeof ONERI_ALANLARI)[number]>

// NOTYA-NOT-HIZ-03 canlı ölçüm (2026-09-27 08:39 UTC, QA, 4 dk AOM): gövde (A) 4.081 token / ~45 sn — model ayrıntıyı
// kendiliğinden şişiriyor. Uzunluk kuralı: gövde transkriptle orantılı, dolgu yok; alan ve Türk geleneği başlıkları aynen.
const GOVDE_CAGRISI = `ÇAĞRI: YALNIZ (A) NOT GÖVDESİ JSON'unu döndür. Öneri alanları (aiDegerlendirme, receteOnerisi, kritik_bulgular, alarmBulgulari, hasta_ozeti) bu çağrıda ÜRETİLMEZ — ayrı bir çağrıda üretilir; bu yüzden kendi yorumunu/önerini gövdeye KOYMA.
UZUNLUK KURALI (kesin): her SOAP bölümü YALNIZ transkriptte söyleneni içerir. Bölümler arasında TEKRAR YOK — bir bilgi tek bölümde, bir kez yazılır. Transkriptin desteklemediği alt bölümü (ör. Soygeçmiş, Alışkanlıklar, bir sistem başlığı) HİÇ açma. objektif YALNIZ muayene edilen sistemleri listeler. plan numaralıdır, her madde TEK satır. Gövdenin toplam uzunluğu transkriptle orantılıdır: 3-5 dakikalık bir muayene için yaklaşık 1.200-1.800 token; asla dolgu yapma. JSON'daki hiçbir alanı atlama (içeriği yoksa boş bırak); Türk tıp geleneği başlıkları (Şikayet, Şikayetin Hikayesi, Özgeçmiş…, Genel durum) aynen kalır.`
// NOTYA-NOT-HIZ-01 canlı ölçüm (2026-09-27 02:00 UTC, QA): gövde (A) 2.630 token / ~31 sn; öneri (B) 4.000 token TAVANA
// çarptı ve not B için 20 sn bekledi → 55 sn. Öneri metni gövdenin iki katıydı. Uzunluk sınırı konulmuştur: öneri
// doktorun 15 saniyede okuyacağı kadardır; ayrıntı isterse Ayşe'ye sorar.
const ONERI_CAGRISI = `ÇAĞRI: YALNIZ (B) AI ÖNERİSİ JSON'unu döndür. Not gövdesini (basvuruYakinmasi, soap, vitaller, ilaclar, asilar, icd10_codes) bu çağrıda YAZMA — ayrı bir çağrıda yazılır. hasta_ozeti ve alarmBulgulari yalnız doktorun söylediği tanı/tedaviyi anlatır.
UZUNLUK SINIRI (kesin): aiDegerlendirme en fazla 6 kısa madde, toplam 120 kelime — gerekçe yazma, sonucu yaz. receteOnerisi en fazla 4 kalem, her kalemde not alanı en fazla 1 cümle. kritik_bulgular en fazla 3 madde (yoksa boş dizi). alarmBulgulari 3-5 kısa madde. hasta_ozeti 3-5 cümle. Toplam çıktı 1.200 tokeni geçmesin; ayrıntı isteyen doktor Ayşe'ye sorar.`

type AiYanit = Awaited<ReturnType<typeof aiCagir>>

function yanitJsonu(yanit: AiYanit): SoapNotu {
  // Boş içerik (content: []) eskiden TypeError'dı; artık ayrıştırılamayan çıktı olarak geçici hata sayılır.
  const ham = yanit?.content?.[0]?.type === 'text' ? yanit.content[0].text : ''
  return jsonKurtar(ham.replace(/```json\n?|\n?```/g, '').trim())
}

/** Log line for a dropped advisory call — error class / status only, never model output or transcript. */
function oneriHataKodu(e: unknown): string {
  const h = (e && typeof e === 'object' ? e : {}) as { name?: unknown; durum?: unknown; status?: unknown }
  const durum = typeof h.durum === 'number' ? h.durum : typeof h.status === 'number' ? h.status : null
  return [typeof h.name === 'string' ? h.name : 'Hata', durum].filter((x) => x != null).join(' ')
}

/** KD-DERM-SAFETY-FINDINGS F1 / F4 + KD-KAYNAK-KILIDI + CROSS-SPECIALTY-PARITY — the same locks for the body (A) and,
 * separately, for the advisory (B): the prompt-locked chapters get the full dose lock (dose-free receteOnerisi too);
 * every other branch still gets the invention backstop — a dose the hekim never said never ships; kadın doğum never
 * keeps a guideline number / year that is not in the verified list. Each lock appends its review line to aiDegerlendirme. */
function kilitle<T extends object>(veri: T, girdi: SoapGirdi): T & { aiDegerlendirme?: string } {
  const dozlu = dozKilitliBrans(girdi.specialty, girdi.doktorBransi) ? soapDozKilidi(veri, girdi.transcript, girdi.klinikBaglam) : soapDozUydurmaKilidi(veri, girdi.transcript, girdi.klinikBaglam)
  return kadinDogumMi(girdi.specialty, girdi.doktorBransi) ? soapKaynakKilidi(dozlu, kdDogrulanmisKaynaklar()) : dozlu
}

/** NOTYA-NOT-HIZ-03: B's raw JSON → the advisory fields only, SGK-checked, locked and F4-cleaned. */
function oneriyiHazirla(ham: SoapNotu, girdi: SoapGirdi): SoapOnerisi {
  const oneri: SoapOnerisi = {}
  for (const k of ONERI_ALANLARI) (oneri as Record<string, unknown>)[k] = ham[k]
  if (Array.isArray(oneri.receteOnerisi)) oneri.receteOnerisi = sgkDogrula(oneri.receteOnerisi)
  return notMetinleriniTemizle(kilitle(oneri, girdi))
}

/** Note (A) + advisory (B): advisory fields from B; B's aiDegerlendirme first, then the body's own lock lines (if any). */
export function oneriyiBirlestir(not: SoapNotu, oneri: SoapOnerisi | null): SoapNotu {
  if (!oneri) return not
  const aiDegerlendirme = [oneri.aiDegerlendirme, not.aiDegerlendirme].filter((x) => typeof x === 'string' && x.trim()).join('\n\n') || undefined
  return { ...not, ...oneri, aiDegerlendirme }
}

/** NOTYA-MODEL-LUNAPRO-01 G2 (f): birincilin gövdesi bu güvenin altındaysa gövde (A) Sonnet 5'te yeniden yazılır. */
export const SOAP_GUVEN_ESIGI = 0.6

/** ai_confidence sayı ya da sayısal metin; yoksa/bozuksa null (yeniden yazma tetiklenmez). */
function soapGuveni(v: SoapNotu): number | null {
  const g = typeof v.ai_confidence === 'string' ? Number(v.ai_confidence) : v.ai_confidence
  return typeof g === 'number' && Number.isFinite(g) ? g : null
}

/**
 * Gövde (A) JSON'u. G2 (f): birincil model gövdeyi ai_confidence < 0.6 ile döndürdüyse — yalnız bu, birincil AÇIKÇA
 * başaramadığında; uzun cevap tek başına tetiklemez — gövde bir kez Sonnet 5'te yeniden yazılır (not zamanlaması:
 * yalnız bu durumda bir çağrı süresi eklenir). Gövde zaten koruyucudan geldiyse (G1–G4) yeniden yazılmaz (istek başına
 * tek düşüş). Koruyucu da düşerse birincilin notu kullanılır — hekim boş not görmez.
 */
async function govdeyiAl(cagri: Parameters<typeof aiCagir>[0], yanit: AiYanit): Promise<SoapNotu> {
  const veri: SoapNotu = { ...yanitJsonu(yanit) }
  const guven = soapGuveni(veri)
  if (guven === null || guven >= SOAP_GUVEN_ESIGI || yanitKademesi(yanit)?.kademe === 'guclu') return veri
  try {
    return { ...yanitJsonu(await aiCagir({ ...cagri, koruyucuyaZorla: { neden: 'low_conf', altKod: 'soap_guven' } })) }
  } catch (e) {
    console.warn(`[soap] düşük güvenli gövde koruyucuda yeniden yazılamadı, birincilin notu kullanılır: ${oneriHataKodu(e)}`)
    return veri
  }
}

export interface SoapSecenek {
  /**
   * NOTYA-NOT-HIZ-03: given → soapNotuUret returns as soon as the body (A) is parsed and locked; the advisory (B) arrives
   * through this promise (never rejects; null when B failed or was unparseable). The caller keeps it alive
   * (waitUntil) and writes it to the saved note. Not given → B is awaited and merged (scripts / smoke tests).
   */
  oneriAyri?: (oneriSozu: Promise<SoapOnerisi | null>) => void
  /** Yalnız test sahtesi — üretim OpenRouter'dan geçer. */
  istemci?: import('@/lib/ai/cagir').AiIstemci
}

/**
 * NOTYA-NOT-HIZ-01: two PARALLEL calls on the same cached system prefix — (A) note body, (B) advisory fields.
 * NOTYA-NOT-HIZ-03: B is off the critical path — with `oneriAyri` the note is returned at A time and B is delivered
 * separately; if B fails or returns unparseable JSON (F3), the advisory stays empty. A failure keeps the old error path
 * (thrown → soapUretYeniden / route).
 */
export async function soapNotuUret(girdi: SoapGirdi, secenek: SoapSecenek = {}): Promise<SoapNotu> {
  const system = soapSistemBloklari(girdi)
  const bas = Date.now()
  const transkript = `Muayene transkripti:\n\n${girdi.transcript}`

  // NOTYA-MALIYET-01: muayene/SOAP notu. LUNAPRO-01: birincil Luna-Pro; klinik bağlam (alerji, sürekli ilaç) system'de —
  // transkriptle birlikte güvenlik taramasına girer. 'soap' yapılandırılmış görevdir (G2 d: bozuk/kesik JSON → Sonnet 5).
  const govdeCagrisi: Parameters<typeof aiCagir>[0] = {
    istemci: secenek.istemci,
    gorev: 'soap',
    maxTokens: 8000,
    doctorId: girdi.doctorId ?? null,
    system,
    guvenlikBaglami: girdi.klinikBaglam,
    messages: [{ role: 'user', content: `${transkript}\n\n${GOVDE_CAGRISI}` }],
  }
  const govdeSozu = aiCagir(govdeCagrisi)
  // Klinik öneri (ayırıcı tanı, reçete önerisi, kırmızı bayrak, hasta özeti) — klinik-analiz, JSON (G2 d), kendi politika satırıyla.
  const hamOneriSozu: Promise<SoapNotu | null> = aiCagir({
    istemci: secenek.istemci,
    gorev: 'klinik-analiz',
    kademe: 'derin', // NOTYA-KADEME-01: SOAP önerisi arka planda DERİN model
    maxTokens: 2000,
    doctorId: girdi.doctorId ?? null,
    system,
    guvenlikBaglami: girdi.klinikBaglam,
    jsonBekleniyor: true,
    messages: [{ role: 'user', content: `${transkript}\n\n${ONERI_CAGRISI}` }],
  }).then(yanitJsonu).catch((e) => {
    console.warn(`[soap] öneri çağrısı düştü, not öneri alanları boş kalır: ${oneriHataKodu(e)}`)
    return null
  })
  const oneriSozu: Promise<SoapOnerisi | null> = hamOneriSozu.then((ham) => (ham ? oneriyiHazirla(ham, girdi) : null)).catch((e) => {
    console.warn(`[soap] öneri hazırlanamadı, not öneri alanları boş kalır: ${oneriHataKodu(e)}`)
    return null
  })
  if (secenek.oneriAyri) secenek.oneriAyri(oneriSozu)

  const veri: SoapNotu = await govdeyiAl(govdeCagrisi, await govdeSozu)
  veri.uygulananKurallar = uygulananKurallariSuz(veri.uygulananKurallar, girdi.doktorKurallari)
  for (const k of ONERI_ALANLARI) delete (veri as Record<string, unknown>)[k]
  // BRANS-ALAN-SIZMASI: a non-pediatric note never keeps a pediatric-only vital the model filled (fetal "baş çevresi"
  // dictated during an obstetric USG is not the mother's vital sign).
  veri.vitaller = vitalOlcumleriniNormallestir(vitalleriKapsamaGoreSuz(veri.vitaller, bransKapsami({ seansBransi: girdi.specialty, doktorBransi: girdi.doktorBransi, hastaDogumIso: girdi.hastaDogumIso })))
  const numarali = soapNumaraliAlanlariDuzenle(kilitle(veri, girdi))
  // NOTYA-NOT-HIZ-01: prose columns derived from the already locked / numbered SOAP sections (dose lock runs once, not
  // twice on the same text); the F4 cleaner then runs over both — they stay identical.
  const not = notMetinleriniTemizle({ ...numarali, ...turkceBolumleriTuret(numarali.soap), uygulananKurallar: veri.uygulananKurallar })
  void import('@/lib/doktor/ogrenme/hizOlc').then((m) => m.hizYazSessiz({
    doctorId: girdi.doctorId, gorev: 'soap', sureMs: Date.now() - bas, onbellekli: Boolean(girdi.doktorKurallari?.length),
  })).catch(() => { /* ölçüm */ })
  if (secenek.oneriAyri) return not
  return oneriyiBirlestir(not, await oneriSozu)
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

/** NOTYA-OGRENME-02 — düzeltme farklarını kompakt doktor stil profiline damıtır (ucuz cikarim).
 * Onay rotası, düzeltme içeren her onayda çağırır; profil sonraki TÜM not üretimlerine gider.
 * Veri çarkı (flywheel): doktor düzelttıkçe Ayşe o doktora özgü keskinleşir — birikim,
 * kopyalanamayan doktor-başına rekabet avantajıdır. */
export async function stilProfiliDamit(
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
