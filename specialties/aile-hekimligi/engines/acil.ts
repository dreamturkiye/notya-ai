/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Birinci basamak sevk / acil triyaj. SAF fonksiyon.
 * Kırmızı bayrak → "hemen" bandı. Portal mesajı ile yönetilmez.
 * Tanı dili yoktur; yalnız eylem yönlendirmesi vardır. Karar hekimindir (aile_risk.hekim_onay).
 */
import type { Dipnot } from './aile'

export type AcilKod =
  | 'gogus_agrisi'
  | 'ani_nefes'
  | 'bilinc'
  | 'siddetli_kanama'
  | 'inme_bayrak'
  | 'anafilaksi'
  | 'akut_karin'

export interface AcilBayrak {
  kod: AcilKod
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun' | 'sevk'
  dipnot: Dipnot
}

const KURALLAR: Array<{
  kod: AcilKod
  re: RegExp
  ad: string
  eylem: string
  oncelik: 'hemen' | 'ayni_gun' | 'sevk'
  dipnot: Dipnot
}> = [
  {
    kod: 'gogus_agrisi',
    re: /g[öo][ğg][üu]s\s*(a[ğg]r|bask|s[ıi]k)|g[öo][ğg][üu]s[üu]m\s*(a[ğg]r[ıi]|s[ıi]k|bask)|kalp\s*kriz|angina/i,
    ad: 'Göğüs ağrısı / baskı',
    eylem: 'Hemen 112’yi arayın. Göğüs ağrısı ayaktan randevu ile beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'Birinci basamak AKS şüphesi — acil; tanı hekim/acil' },
  },
  {
    kod: 'ani_nefes',
    re: /ani[^.]{0,20}nefes\s*dar|nefes\s*alam[ıi]|[şs]iddetli\s*nefes|hipoksi|morarma/i,
    ad: 'Ani / şiddetli nefes darlığı',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'Akut solunum sıkıntısı — acil' },
  },
  {
    kod: 'bilinc',
    re: /bilin[çc]\s*(kayb|bulan|de[ğg]i[şs])|bay[ıi]ld[ıi]|uyanm[ıi]yor|konf[üu]ze/i,
    ad: 'Bilinç değişikliği / bayılma',
    eylem: 'Hemen 112’yi arayın. Bilinç değişikliği portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'Bilinç değişikliği — acil' },
  },
  {
    kod: 'siddetli_kanama',
    re: /[şs]iddetli\s*kanama|durmayan\s*kanama|bol\s*kanama|hematemez|melena[^.]{0,20}bol/i,
    ad: 'Şiddetli / durmayan kanama',
    eylem: 'Hemen 112’yi arayın. Aktif ağır kanama ayaktan beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'Hemorajik acil — 112' },
  },
  {
    kod: 'inme_bayrak',
    re: /y[üu]z[üu]?m?\s*(kaym|kayd)|konu[şs]ma\s*bozuk|ani[^.]{0,20}g[üu][çc]\s*kayb|tek\s*taraf[^.]{0,20}(g[üu][çc]|fel[çc])/i,
    ad: 'Ani yüz kayması / konuşma bozukluğu / güç kaybı',
    eylem: 'Hemen 112’yi arayın. İnme / TIA belirtileri birinci basamakta bekletilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'BE-FAST tarzı belirtiler — acil sevk' },
  },
  {
    kod: 'anafilaksi',
    re: /anafilaksi|bo[ğg]ulma\s*hissi|allerji[^.]{0,30}(nefes|bay[ıi]l|[şs]i[şs]me)|epipen/i,
    ad: 'Anafilaksi / ağır alerjik reaksiyon',
    eylem: 'Hemen 112’yi arayın. Ağır alerjik reaksiyon acildir.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_AH', not: 'Anafilaksi — acil; adrenalin dozu Notya yazmaz' },
  },
  {
    kod: 'akut_karin',
    re: /ani[^.]{0,20}kar[ıi]n\s*a[ğg]r|[şs]iddetli\s*kar[ıi]n|kar[ıi]n[^.]{0,20}(sert|defans)|akut\s*bat[ıi]n/i,
    ad: 'Ani şiddetli karın ağrısı',
    eylem: 'Aynı gün acil değerlendirme veya 112. Ayaktan bekletmeyin.',
    oncelik: 'ayni_gun',
    dipnot: { ref: 'SB_AH', not: 'Akut batın şüphesi — acil/sevk; tanı hekimde' },
  },
]

function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR')
}

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = trKucuk(metinler.filter(Boolean).join(' \n '))
  const bulunan = new Map<AcilKod, AcilBayrak>()
  for (const k of KURALLAR) {
    if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) {
      bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
    }
  }
  const sira = { hemen: 0, ayni_gun: 1, sevk: 2 }
  return [...bulunan.values()].sort((a, b) => sira[a.oncelik] - sira[b.oncelik])
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

export const HASTA_ACIL_METNI =
  'Göğüs ağrınız veya baskı varsa, aniden nefessiz kaldıysanız, bilinciniz bulanıksa, şiddetli kanamanız varsa, yüzünüz kaydıysa veya ani güç kaybı olduysa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerAile ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Göğüs ağrısı veya baskı', kod: 'gogus_agrisi' },
  { etiket: 'Ani / şiddetli nefes darlığı', kod: 'ani_nefes' },
  { etiket: 'Bilinç değişikliği veya bayılma', kod: 'bilinc' },
  { etiket: 'Şiddetli veya durmayan kanama', kod: 'siddetli_kanama' },
  { etiket: 'Ani yüz kayması, konuşma bozukluğu veya güç kaybı', kod: 'inme_bayrak' },
  { etiket: 'Ağır alerjik reaksiyon (nefes / şişme)', kod: 'anafilaksi' },
  { etiket: 'Ani şiddetli karın ağrısı', kod: 'akut_karin' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi',
  'Hayati bulgular değerlendirildi (mümkünse)',
  '112 / acil yönlendirme kararı hekim tarafından verildi',
  'Sevk edilen branş / kurum not edildi (varsa)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil / sevk kararı kilitlemdi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen' || b.oncelik === 'ayni_gun')
}
