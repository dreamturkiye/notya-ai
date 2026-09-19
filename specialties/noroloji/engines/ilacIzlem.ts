/**
 * NOROLOJI-EXCEPTIONAL-01 — Antiepileptik (AED) ve migren önleyici izlem takvimi. SAF fonksiyon.
 * SINIF düzeyi lab / klinik kontrol görevleri. DOZ YAZMAZ, ilaç başlatmaz, kesme kararı vermez.
 */
import type { Dipnot, Ref } from './noroloji'
import { ayEkle, gunEkle } from './noroloji'

export interface IzlemIlac { ad: string; etken?: string | null; baslangic?: string | null; aktif: boolean }

export interface NoroIzlemKural {
  kod: string
  ad: string
  re: RegExp
  labs: string[]
  baslangicGun?: number
  periyotAy: number
  dipnot: string
  ref: Ref
}

export const NORO_IZLEM_KURALLARI: NoroIzlemKural[] = [
  {
    kod: 'noro_izlem_valproat',
    ad: 'Valproat: kan düzeyi + karaciğer enzimleri + hemogram',
    re: /valproat|valproik|depakin|convulex|vpa\b/i,
    labs: ['ALT', 'AST', 'Plt', 'Hb'],
    baslangicGun: 14,
    periyotAy: 6,
    dipnot: 'Valproat: KCFT ve trombosit izlemi; gebelik potansiyeli olan hastada teratojenite ayrıca hekim değerlendirmesidir. Doz hekimin.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_karbamazepin',
    ad: 'Karbamazepin: kan düzeyi + KCFT + sodyum + hemogram',
    re: /karbamazepin|carbamazepine|tegretol|karberol/i,
    labs: ['Na', 'ALT', 'AST', 'WBC'],
    baslangicGun: 14,
    periyotAy: 6,
    dipnot: 'Karbamazepin: hiponatremi ve hematolojik izlem; etkileşim ve doz hekimin.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_fenitoin',
    ad: 'Fenitoin: kan düzeyi + albumin + KCFT',
    re: /fenitoin|phenytoin|epitoin|dilantin/i,
    labs: ['ALT', 'AST'],
    baslangicGun: 14,
    periyotAy: 6,
    dipnot: 'Fenitoin dar terapötik aralıklı; düzey ve doz hekimin. Notya hedef aralık yazmaz.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_lamotrijin',
    ad: 'Lamotrijin: döküntü uyarısı ve yavaş titrasyon kontrolü (hekim planı)',
    re: /lamotrijin|lamictal|lamotrigine/i,
    labs: [],
    baslangicGun: 21,
    periyotAy: 12,
    dipnot: 'Lamotrijinde ciddi döküntü riski; titrasyon şeması ve doz yalnız hekimden.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_levetirasetam',
    ad: 'Levetirasetam: böbrek fonksiyonu + ruhsal / davranış yan etki kontrolü',
    re: /levetirasetam|keppra|levetiracetam/i,
    labs: ['Kre', 'eGFR'],
    baslangicGun: 30,
    periyotAy: 12,
    dipnot: 'Levetirasetam: böbrek fonksiyonuna göre doz ayarı hekimin; ruhsal yan etki sorgusu klinik.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_topiramat',
    ad: 'Topiramat: kilo / bilişsel yan etki + bikarbonat (hekim kararı)',
    re: /topiramat|topamax|topiramate/i,
    labs: [],
    baslangicGun: 30,
    periyotAy: 6,
    dipnot: 'Topiramat: kilo kaybı, bilişsel yan etki ve metabolik asidoz riski hekim izleminde; doz hekimin.',
    ref: 'TITCK',
  },
  {
    kod: 'noro_izlem_okskarbazepin',
    ad: 'Okskarbazepin: sodyum izlemi',
    re: /okskarbazepin|oxcarbazepine|trileptal/i,
    labs: ['Na'],
    baslangicGun: 14,
    periyotAy: 6,
    dipnot: 'Okskarbazepin hiponatremi riski; doz hekimin.',
    ref: 'TITCK',
  },
]

export interface NoroIzlemGorev {
  kod: string
  ad: string
  due: string
  labs: string[]
  ilac: string
  kaynak: string
  dipnot: Dipnot
}

export function noroIlacIzlemGorevleri(
  ilaclar: IzlemIlac[],
  sonLab: Record<string, string | null>,
  bugun: string,
): NoroIzlemGorev[] {
  const out: NoroIzlemGorev[] = []
  const gorulen = new Set<string>()
  for (const i of ilaclar.filter((x) => x.aktif)) {
    const metin = `${i.ad} ${i.etken || ''}`
    for (const k of NORO_IZLEM_KURALLARI) {
      if (!k.re.test(metin) || gorulen.has(k.kod)) continue
      gorulen.add(k.kod)
      let due: string
      const yeni = i.baslangic && gunFarkiGuvenli(i.baslangic, bugun) <= 45
      if (yeni && k.baslangicGun != null) {
        due = gunEkle(i.baslangic || bugun, k.baslangicGun)
      } else if (k.labs.length) {
        const tarihler = k.labs.map((l) => sonLab[l]).filter(Boolean) as string[]
        const enEski = tarihler.sort()[0]
        due = enEski ? ayEkle(enEski, k.periyotAy) : ayEkle(bugun, k.periyotAy)
        if (due > bugun && tarihler.every((t) => gunFarkiGuvenli(t, bugun) < k.periyotAy * 30)) continue
      } else {
        due = ayEkle(bugun, k.periyotAy)
      }
      if (due < bugun) due = bugun
      out.push({
        kod: k.kod,
        ad: k.ad,
        due,
        labs: k.labs,
        ilac: i.ad,
        kaynak: 'ilac_izlem',
        dipnot: { ref: k.ref, not: k.dipnot },
      })
    }
  }
  return out
}

function gunFarkiGuvenli(a: string, b: string): number {
  const x = Date.parse(a.slice(0, 10) + 'T12:00:00Z')
  const y = Date.parse(b.slice(0, 10) + 'T12:00:00Z')
  if (!Number.isFinite(x) || !Number.isFinite(y)) return 999
  return Math.round((y - x) / 86400000)
}
