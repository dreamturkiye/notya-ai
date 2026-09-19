/**
 * NOROLOJI-EXCEPTIONAL-01 — İnme / TIA kırmızı bayrak triyaj kapısı. SAF fonksiyon.
 * BE-FAST tarzı belirtiler → "gecikme yok" bandı. Portal mesajı ile yönetilmez.
 * Tanı dili yoktur; yalnız eylem yönlendirmesi vardır. Karar hekimindir (noro_risk.hekim_onay).
 */
import type { Dipnot } from './noroloji'

export type AcilKod =
  | 'yuz_kaymasi'
  | 'konusma_bozuk'
  | 'guc_kaybi'
  | 'gorme_kaybi'
  | 'ani_siddetli_bas'
  | 'bilinc_degisikligi'

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
    kod: 'yuz_kaymasi',
    re: /y[üu]z[üu]?m?\s*(kaym|kayd|d[üu][şs]|asimetr)|a[ğg]z[ıi]m kayd[ıi]|tek taraf[^.]{0,20}y[üu]z|g[üu]l[üu]nce[^.]{0,20}kay/i,
    ad: 'Ani yüz kayması / asimetri',
    eylem: 'Hemen 112’yi arayın. Yüz kayması inme belirtilerinden biridir; ayaktan randevu beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TBDHD', not: 'BE-FAST yüz — acil değerlendirme; zaman penceresi hekim/acil kararı' },
  },
  {
    kod: 'konusma_bozuk',
    re: /konu[şs]ma[mıms]?\s*(bozuk|bozul)|kelime bulam[ıi]|afazi|dili dola[şs]|aniden konu[şs]amam|peltek[^.]{0,20}ani/i,
    ad: 'Ani konuşma bozukluğu / kelime bulamama',
    eylem: 'Hemen 112’yi arayın. Ani konuşma bozukluğu acil nörolojik değerlendirme gerektirir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TBDHD', not: 'BE-FAST konuşma — acil; ayaktan izlem yeterli değildir' },
  },
  {
    kod: 'guc_kaybi',
    re: /(kol|bacak|el|ayak)[^.]{0,30}(g[üu][çc]s[üu]z|kuvvetsiz|tutmuy|kalkm[ıi]yor|fel[çc])|tek taraf[^.]{0,30}(g[üu][çc]|kuvvet)|hemiparezi|hemipleji/i,
    ad: 'Ani kol / bacak güç kaybı',
    eylem: 'Hemen 112’yi arayın. Tek taraflı güç kaybı inme / TIA şüphesidir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TBDHD', not: 'BE-FAST kol — acil; zaman kritik' },
  },
  {
    kod: 'gorme_kaybi',
    re: /ani[^.]{0,30}(g[öo]rme kayb|g[öo]rmeme|k[öo]rl[üu]k)|bir g[öo]z[^.]{0,20}g[öo]rm[üu]yor|çift g[öo]rme[^.]{0,20}ani|hemianop/i,
    ad: 'Ani görme kaybı / çift görme',
    eylem: 'Hemen 112’yi arayın veya en yakın acile başvurun. Ani görme kaybı acil değerlendirilir.',
    oncelik: 'hemen',
    dipnot: { ref: 'TBDHD', not: 'BE-FAST göz — ani görme kaybı acil' },
  },
  {
    kod: 'ani_siddetli_bas',
    re: /hayat[ıi]m[ıi]n en [şs]iddetli|ani[^.]{0,20}[şs]iddetli ba[şs] a[ğg]r|g[öo]k g[üu]r[üu]lt[üu]s[üu] ba[şs]|thunderclap|ani ba[şs] a[ğg]r[ıi]s[ıi].{0,20}kusma/i,
    ad: 'Ani şiddetli baş ağrısı (hayatının en şiddetlisi)',
    eylem: 'Hemen 112’yi arayın. Ani başlayan en şiddetli baş ağrısı ayaktan beklenmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'TND', not: 'Thunderclap baş ağrısı — acil görüntüleme kararı hekimin / acilin' },
  },
  {
    kod: 'bilinc_degisikligi',
    re: /bilin[çc] (kayb|bulan|de[ğg]i[şs])|bay[ıi]ld[ıi]|uyanm[ıi]yor|konf[üu]ze|ani sersemlik[^.]{0,20}uyanam/i,
    ad: 'Bilinç değişikliği / bayılma',
    eylem: 'Hemen 112’yi arayın. Bilinç değişikliği portal mesajı ile yönetilmez.',
    oncelik: 'hemen',
    dipnot: { ref: 'SB_NORO', not: 'Bilinç değişikliği — acil; ayaktan randevu yeterli değildir' },
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
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

export const HASTA_ACIL_METNI =
  'Yüzünüz kaydıysa, konuşmanız bozulduysa, kol veya bacağınızda ani güç kaybı olduysa, aniden göremez olduysanız, hayatınızın en şiddetli baş ağrısı başladıysa veya bilinciniz bulanıksa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/** Intake kutucuk etiketleri — lib/intake/bransSorulari.ts acilBelirtilerNoro ile BİREBİR aynı olmalı. */
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ani yüz kayması veya asimetri', kod: 'yuz_kaymasi' },
  { etiket: 'Ani konuşma bozukluğu veya kelime bulamama', kod: 'konusma_bozuk' },
  { etiket: 'Ani kol veya bacak güç kaybı', kod: 'guc_kaybi' },
  { etiket: 'Ani görme kaybı veya çift görme', kod: 'gorme_kaybi' },
  { etiket: 'Hayatınızın en şiddetli baş ağrısı (aniden)', kod: 'ani_siddetli_bas' },
  { etiket: 'Bilinç değişikliği veya bayılma', kod: 'bilinc_degisikligi' },
]

export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

export const ACIL_KONTROL_LISTESI: readonly string[] = [
  'Belirtilerin başlangıç saati kaydedildi (zaman penceresi)',
  'Yüz / konuşma / kol-bacak / görme ayrıştırıldı',
  'Önceki inme / TIA / AF / antikoagülan öyküsü sorgulandı',
  'Kan şekeri ve bilinç düzeyi değerlendirildi (mümkünse)',
  'Hastaya / yakına 112 yolu anlatıldı',
  'Ayaktan randevu yerine acil yönlendirme kararı hekim tarafından kilitlemdi',
]

export function hekimOnayiGerekliMi(bayraklar: AcilBayrak[]): boolean {
  return bayraklar.some((b) => b.oncelik === 'hemen')
}
