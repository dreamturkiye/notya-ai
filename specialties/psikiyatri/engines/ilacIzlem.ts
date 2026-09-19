/**
 * PSIK-EXCEPTIONAL-01 — Psikotrop ilaç izlem takvimi. SAF fonksiyon; aynı desen:
 * specialties/dahiliye/engines/ilacIzlem.ts.
 *
 * KURAL: SINIF düzeyi izlem görevleri üretir (hangi laboratuvar / ölçüm, ne zaman). DOZ YAZMAZ,
 * ilaç başlatmaz, kesme kararı vermez. mg / titrasyon / kesme kararı hekimindir (doz kilidi).
 * Kaynak: ürün kısa ürün bilgileri (KÜB / TİTCK) ve yerleşik klinik izlem uygulaması; güncel
 * aralıkları hekim teyit eder ve her görevi susturabilir.
 */
import type { Dipnot, Ref } from './psikiyatri'
import { ayEkle, gunEkle } from './psikiyatri'

export interface IzlemIlac { ad: string; etken?: string | null; baslangic?: string | null; aktif: boolean }

export interface PsikIzlemKural {
  kod: string
  ad: string
  /** ilaç adı / etken madde üzerinde arama — sınıf düzeyi */
  re: RegExp
  /** izlenecek laboratuvar / ölçüm anahtarları (lab_satirlar canonical_key ile uyumlu) */
  labs: string[]
  /** yeni başlangıçta ilk kontrol (gün) */
  baslangicGun?: number
  /** stabil izlemde periyot (ay) */
  periyotAy: number
  dipnot: string
  ref: Ref
}

export const PSIK_IZLEM_KURALLARI: PsikIzlemKural[] = [
  {
    kod: 'psik_izlem_lityum',
    ad: 'Lityum: kan düzeyi + kreatinin/eGFR + TSH + kalsiyum',
    re: /lityum|lithium|lithuril/i,
    labs: ['Li', 'Kre', 'eGFR', 'TSH', 'Ca'],
    baslangicGun: 7,
    periyotAy: 3,
    dipnot: 'Lityum dar terapötik aralıklı: başlangıç/doz değişimi sonrası düzey, sonra düzenli düzey + böbrek/tiroid izlemi. Düzey görülmeden idame kararı verilmez; hedef aralık ve doz hekimin.',
    ref: 'TITCK',
  },
  {
    kod: 'psik_izlem_valproat',
    ad: 'Valproat: kan düzeyi + karaciğer enzimleri + hemogram',
    re: /valproat|valproik|depakin|convulex|vpa\b/i,
    labs: ['ALT', 'AST', 'Plt', 'Hb'],
    baslangicGun: 14,
    periyotAy: 6,
    dipnot: 'Valproat: karaciğer enzimleri ve trombosit izlemi; gebelik potansiyeli olan hastada teratojenite ve gebelik önleme programı hekim tarafından ayrıca değerlendirilir.',
    ref: 'TITCK',
  },
  {
    kod: 'psik_izlem_atipik_ap',
    ad: 'Atipik antipsikotik: metabolik panel (kilo/bel · açlık glukoz veya HbA1c · lipid) + kan basıncı',
    re: /olanzapin|ketiapin|quetiapin|risperidon|paliperidon|aripiprazol|amisulpirid|ziprasidon|klozapin|lurasidon|sertindol|zuklopentiksol/i,
    labs: ['Glu', 'HbA1c', 'LDL', 'TG'],
    baslangicGun: 90,
    periyotAy: 12,
    dipnot: 'Atipik antipsikotiklerde kilo/bel çevresi, açlık glukoz veya HbA1c ve lipid izlemi; başlangıçtan ~3 ay sonra, sonra yıllık. Kilo artışı ve metabolik risk yönetimi hekim kararı.',
    ref: 'TPD',
  },
  {
    kod: 'psik_izlem_klozapin',
    ad: 'Klozapin: mutlak nötrofil / hemogram takibi (zorunlu izlem protokolü)',
    re: /klozapin|clozapine|leponex/i,
    labs: ['WBC', 'Neu'],
    baslangicGun: 7,
    periyotAy: 1,
    dipnot: 'Klozapin ruhsatlı izlem protokolüne bağlıdır: düzenli hemogram/nötrofil takibi. Protokol sıklığı ve devam kararı hekimin; Notya protokolü yerine geçmez.',
    ref: 'TITCK',
  },
  {
    kod: 'psik_izlem_ssri',
    ad: 'SSRI/SNRI: erken yanıt ve tolerabilite kontrolü (1–2 hafta) + sodyum riski olan hastada Na',
    re: /sertralin|essitalopram|escitalopram|sitalopram|citalopram|fluoksetin|paroksetin|fluvoksamin|venlafaksin|duloksetin|desvenlafaksin|vortioksetin/i,
    labs: ['Na'],
    baslangicGun: 14,
    periyotAy: 12,
    dipnot: 'SSRI/SNRI başlangıcında 1–2 hafta içinde yan etki ve erken kötüleşme / ajitasyon kontrolü; yaşlı veya diüretik kullanan hastada hiponatremi açısından Na. Doz ve süre hekimin.',
    ref: 'TPD',
  },
  {
    kod: 'psik_izlem_lamotrijin',
    ad: 'Lamotrijin: döküntü uyarısı ve yavaş titrasyon kontrolü (hekim planı)',
    re: /lamotrijin|lamictal|lamotrigine/i,
    labs: [],
    baslangicGun: 21,
    periyotAy: 12,
    dipnot: 'Lamotrijinde ciddi döküntü riski nedeniyle yavaş titrasyon ve döküntüde acil başvuru talimatı; titrasyon şeması ve doz yalnız hekimden.',
    ref: 'TITCK',
  },
]


export interface PsikIzlemGorev {
  kod: string
  ad: string
  due: string
  labs: string[]
  ilac: string
  kaynak: string
  dipnot: Dipnot
}

/**
 * sonLab: canonical_key → son onaylı numune tarihi.
 * Yeni başlangıç (son 45 gün) → başlangıç kontrolü; aksi halde en eski ilgili lab + periyot.
 * Hepsi periyot içinde tazeyse görev üretilmez. Sonuç TASLAK görev listesidir; hekim onaylar/susturur.
 */
export function psikIlacIzlemGorevleri(
  ilaclar: IzlemIlac[],
  sonLab: Record<string, string | null>,
  bugun: string,
): PsikIzlemGorev[] {
  const out: PsikIzlemGorev[] = []
  const gorulen = new Set<string>()
  for (const i of ilaclar.filter((x) => x.aktif)) {
    const metin = `${i.ad} ${i.etken || ''}`
    for (const k of PSIK_IZLEM_KURALLARI) {
      if (!k.re.test(metin) || gorulen.has(k.kod)) continue
      gorulen.add(k.kod)
      const yeniBaslangic = !!i.baslangic && i.baslangic >= gunEkle(bugun, -45)
      let due: string
      if (yeniBaslangic && k.baslangicGun) due = gunEkle(i.baslangic!, k.baslangicGun)
      else if (!k.labs.length) due = ayEkle(bugun, k.periyotAy)
      else {
        const enEski = k.labs
          .map((l) => sonLab[l] || null)
          .reduce<string | null>((acc, t) => (t == null ? acc : acc == null ? t : t < acc ? t : acc), null)
        due = enEski ? ayEkle(enEski, k.periyotAy) : bugun
      }
      const hepsiTaze =
        !yeniBaslangic && k.labs.length > 0 && k.labs.every((l) => sonLab[l] && sonLab[l]! > ayEkle(bugun, -k.periyotAy))
      if (hepsiTaze) continue
      out.push({ kod: k.kod, ad: k.ad, due, labs: k.labs, ilac: i.ad, kaynak: k.dipnot, dipnot: { ref: k.ref, not: k.dipnot } })
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due))
}

/** Şerit için: lityum / valproat düzey görevinin en yakın vadesi (yoksa null). */
export function duzeyVadesi(gorevler: PsikIzlemGorev[]): { ad: string; due: string } | null {
  const aday = gorevler
    .filter((g) => g.kod === 'psik_izlem_lityum' || g.kod === 'psik_izlem_valproat')
    .sort((a, b) => a.due.localeCompare(b.due))[0]
  if (!aday) return null
  return { ad: aday.kod === 'psik_izlem_lityum' ? 'Li düzeyi' : 'VPA düzeyi', due: aday.due }
}
