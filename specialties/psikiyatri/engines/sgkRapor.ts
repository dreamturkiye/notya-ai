/**
 * PSIK-EXCEPTIONAL-01 — Psikotrop ilaç raporu taslağı + renkli reçete kontrol listesi. SAF fonksiyon.
 *
 * KURALLAR (dahiliye sgkRapor deseni):
 *  - Etken madde YALNIZ hasta_ilaclar satırlarından gelir; Notya ilaç veya DOZ uydurmaz (doz alanı yoktur).
 *  - T.C. kimlik numarası hiçbir taslağa yazılmaz.
 *  - Tanı / ICD-10 satırını hekim seçer; motor yalnız şablonun hangi alanları istediğini söyler.
 *  - SUT ve reçete mevzuatı koşulları KONTROL LİSTESİDİR; güncel madde metnini hekim doğrular.
 *  - Rapor hekim kilitleyene kadar TASLAKTIR; Medula girişi ve e-imza hekimin (canlı gönderim yok).
 *
 * RENKLİ REÇETE NOTU: Türkiye'de kontrole tabi ilaçlar için yürürlükteki renkler KIRMIZI (uyuşturucu
 * madde) ve YEŞİL (psikotrop madde) reçetedir; her ikisi de Renkli Reçete Sistemi (RRS) üzerinden
 * düzenlenir. Bu motor renk sınıflamasını kendi listesiyle ÇOĞALTMAZ — paylaşılan omurga motoru
 * `lib/doktor/receteRengi.ts` (TİTCK kontrole tabi ilaçlar) kullanılır. Ayrı bir "turuncu reçete"
 * kategorisi uydurulmamıştır; güncel liste TİTCK duyurularından hekim tarafından teyit edilir.
 */
import type { Dipnot } from './psikiyatri'
import { receteRengi, belirsizKontrol, RENK_ETIKET, type ReceteRengi } from '@/lib/doktor/receteRengi'

export type PsikRaporSablon = 'antidepresan' | 'antipsikotik' | 'duygudurum_dengeleyici' | 'dikkat_eksikligi' | 'demans'

export const PSIK_RAPOR_SABLONLARI: Array<{ id: PsikRaporSablon; ad: string }> = [
  { id: 'antidepresan', ad: 'Antidepresan ilaç raporu' },
  { id: 'antipsikotik', ad: 'Antipsikotik ilaç raporu' },
  { id: 'duygudurum_dengeleyici', ad: 'Duygudurum dengeleyici ilaç raporu' },
  { id: 'dikkat_eksikligi', ad: 'Dikkat eksikliği / hiperaktivite ilaç raporu' },
  { id: 'demans', ad: 'Demans (kolinesteraz inhibitörü / memantin) ilaç raporu' },
]

/** Şablonun aradığı ilaç SINIFI — marka adı listesi değil, etken madde deseni. */
const SINIF_RE: Record<PsikRaporSablon, RegExp> = {
  antidepresan: /sertralin|essitalopram|escitalopram|sitalopram|citalopram|fluoksetin|paroksetin|fluvoksamin|venlafaksin|duloksetin|desvenlafaksin|vortioksetin|mirtazapin|bupropion|agomelatin|tianeptin|klomipramin|amitriptilin|imipramin|trazodon/i,
  antipsikotik: /olanzapin|ketiapin|quetiapin|risperidon|paliperidon|aripiprazol|amisulpirid|ziprasidon|klozapin|lurasidon|haloperidol|zuklopentiksol|flufenazin|sertindol|sülpirid|sulpirid/i,
  duygudurum_dengeleyici: /lityum|lithium|valproat|valproik|lamotrijin|karbamazepin|okskarbazepin/i,
  dikkat_eksikligi: /metilfenidat|atomoksetin|lisdeksamfetamin|modafinil/i,
  demans: /donepezil|rivastigmin|galantamin|memantin/i,
}

/** Şablon başına SUT / mevzuat kontrol listesi — "tamam" kararı hekimin (null = hekim işaretlemedi). */
const KONTROL_LISTESI: Record<PsikRaporSablon, readonly string[]> = {
  antidepresan: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Raporu düzenleyen hekimin uzmanlık alanı SUT koşuluna uygun',
    'Rapor süresi ve ilaç sınıfı SUT’ta belirtilen sınırlar içinde (güncel metin teyit edildi)',
    'Kullanılan etken madde hasta ilaç listesinde kayıtlı',
    'İlk üç ay yanıt değerlendirmesi ve izlem planı yazıldı',
  ],
  antipsikotik: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Uzman hekim raporu koşulu karşılandı',
    'Metabolik izlem planı (kilo/bel, glukoz veya HbA1c, lipid) rapora işlendi',
    'Klozapin kullanılıyorsa zorunlu hemogram izlem protokolü ayrıca belirtildi',
    'Depo / uzun etkili form kullanılıyorsa uygulama aralığı hekim tarafından yazıldı',
  ],
  duygudurum_dengeleyici: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Lityum kullanılıyorsa kan düzeyi ve böbrek/tiroid izlemi rapora işlendi',
    'Valproat kullanılıyorsa karaciğer/hemogram izlemi belirtildi',
    'Gebelik potansiyeli olan hastada teratojenite bilgilendirmesi ve gebelik önleme planı hekim tarafından kaydedildi',
    'Rapor süresi SUT sınırları içinde',
  ],
  dikkat_eksikligi: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'SUT’ta istenen uzman hekim / sağlık kurulu koşulu karşılandı',
    'Kontrole tabi ilaç için doğru renkli reçete türü kullanıldı (RRS)',
    'Kötüye kullanım / yönlendirme riski değerlendirildi ve kaydedildi',
    'İzlem aralığı ve yeniden değerlendirme tarihi yazıldı',
  ],
  demans: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'SUT’ta istenen uzmanlık / kurul koşulu karşılandı',
    'Bilişsel değerlendirme sonucu hekim tarafından rapora işlendi',
    'Etkililik yeniden değerlendirme tarihi belirlendi',
    'Bakım veren bilgilendirmesi yapıldı',
  ],
}

export interface PsikRaporIlac { ad: string; etken?: string | null; aktif: boolean }

/** Taslak alanları — DOZ ve T.C. ALANI YOKTUR. */
export interface PsikRaporDraft {
  sablon: PsikRaporSablon
  sablonAd: string
  /** hasta adı rapor çıktısında hekim tarafından doldurulur; kimlik numarası hiç taşınmaz */
  hastaAdi: string
  tcSon4: ''
  /** hekim seçer — motor tanı önermez */
  tani: { icd10: string; aciklama: string } | null
  /** yalnız hasta_ilaclar'dan eşleşen etken maddeler (doz yok) */
  etkenMaddeler: string[]
  sureAy: number
  hekimDegerlendirmesi: string
  izlemPlani: string[]
  duzenlemeTarihi: string
}

export interface PsikRaporSonuc {
  draft: PsikRaporDraft
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  /** her ilaç için reçete rengi (paylaşılan omurga motorundan) */
  receteNotlari: Array<{ ilac: string; renk: ReceteRengi; etiket: string; dogrulanmali: string | null }>
  dipnotlar: Dipnot[]
}

export interface PsikRaporGirdi {
  sablon: PsikRaporSablon
  hastaAdi: string
  ilaclar: PsikRaporIlac[]
  /** hekimin seçtiği ICD-10 (motor üretmez) */
  tani?: { icd10: string; aciklama: string } | null
  sureAy?: number
  hekimDegerlendirmesi?: string
  izlemPlani?: string[]
  /** hekimin işaretlediği kontrol maddeleri (index → true/false) */
  isaretli?: Record<number, boolean>
  bugun: string
}

export function psikRaporTaslagi(g: PsikRaporGirdi): PsikRaporSonuc {
  const sablonAd = PSIK_RAPOR_SABLONLARI.find((s) => s.id === g.sablon)?.ad || 'İlaç raporu'
  const re = SINIF_RE[g.sablon]
  const aktif = g.ilaclar.filter((i) => i.aktif)
  const eslesen = aktif.filter((i) => re.test(`${i.ad} ${i.etken || ''}`))
  const etkenMaddeler = [...new Set(eslesen.map((i) => (i.etken || i.ad).trim()).filter(Boolean))]
  const sureAy = g.sureAy && g.sureAy > 0 ? Math.min(Math.round(g.sureAy), 24) : 12

  const kontrolListesi = KONTROL_LISTESI[g.sablon].map((madde, i) => ({
    madde,
    tamam: g.isaretli && i in g.isaretli ? !!g.isaretli[i] : null,
  }))

  const eksikler: string[] = []
  if (!g.tani) eksikler.push('TANI / ICD-10 hekim tarafından seçilmedi — rapor kilitlenemez')
  if (!etkenMaddeler.length) eksikler.push('Bu şablonla eşleşen aktif ilaç yok — ilaç listesini güncelleyin (Notya ilaç eklemez)')
  if (!String(g.hekimDegerlendirmesi || '').trim()) eksikler.push('Hekim değerlendirmesi boş')
  for (const k of kontrolListesi) if (k.tamam !== true) eksikler.push(`Kontrol maddesi işaretlenmedi: ${k.madde}`)

  const receteNotlari = eslesen.map((i) => {
    const renk = receteRengi(i.etken || '', i.ad)
    const belirsiz = belirsizKontrol(i.etken || '', i.ad)
    return {
      ilac: i.ad,
      renk,
      etiket: RENK_ETIKET[renk],
      dogrulanmali: belirsiz ? `"${belirsiz}" kontrole tabi olabilir — reçete türünü TİTCK listesinden doğrulayın` : null,
    }
  })
  if (receteNotlari.some((r) => r.renk !== 'normal')) {
    eksikler.push('Kontrole tabi ilaç var: reçete Renkli Reçete Sistemi (RRS) üzerinden düzenlenir, normal kâğıt reçeteye yazılamaz')
  }

  return {
    draft: {
      sablon: g.sablon,
      sablonAd,
      hastaAdi: g.hastaAdi || '',
      tcSon4: '',
      tani: g.tani || null,
      etkenMaddeler,
      sureAy,
      hekimDegerlendirmesi: String(g.hekimDegerlendirmesi || '').slice(0, 3000),
      izlemPlani: (g.izlemPlani || []).map((x) => String(x).slice(0, 300)).slice(0, 10),
      duzenlemeTarihi: g.bugun,
    },
    kontrolListesi,
    eksikler,
    receteNotlari,
    dipnotlar: [
      { ref: 'SGK_SUT', not: 'Rapor koşulları SUT’tan kontrol listesi olarak alınmıştır; güncel madde metnini hekim doğrular.' },
      { ref: 'RECETE_YONETMELIK', not: 'Kontrole tabi ilaçlarda kırmızı (uyuşturucu) / yeşil (psikotrop) reçete RRS üzerinden düzenlenir.' },
      { ref: 'TITCK', not: 'Etken madde ve kontrole tabi olma durumu TİTCK kaynağından; doz Notya tarafından üretilmez.' },
    ],
  }
}

/** Rapor kilidi: eksik varsa hekim kilitleyemez (route 409). */
export function kilitlenebilirMi(sonuc: PsikRaporSonuc): boolean {
  return sonuc.eksikler.length === 0
}
