/**
 * GOZ-CHAPTER — Acil kırmızı bayrak kapısı. Pure. Şikâyet metni / intake / hekim işaretinden deterministik eşleşme.
 * Çıktı: "gecikme yok" bandı — 112 / acil / aynı gün göz. Portal mesajı ile yönetilmez.
 * Kaynaklar (birincil okundu): TOD hasta bilgilendirme — retina dekolmanı (ışık çakması, uçuşan cisimler, görme alanı kaybı),
 * kimyasal yanık (hemen bol su ile yıkama, göz kapakları açık, sonra acil); TOD Primer Açı Kapanması dokümanı (şiddetli
 * göz ağrısı, görme azalması, baş ağrısı, bulantı-kusma, ışık etrafında renkli halkalar); TEMD 2026 Tablo 13.1 (diyabetlide
 * ani görme kaybı → aynı gün göz).
 */
import type { Dipnot } from '../protocols/sources'

export type AcilKod = 'kimyasal_yanik' | 'ani_gorme_kaybi' | 'retina_dekolmani_suphesi' | 'akut_aci_kapanmasi' | 'penetran_travma' | 'agrili_kirmizi_goz'
export interface AcilBayrak { kod: AcilKod; ad: string; eylem: string; oncelik: 'hemen' | 'ayni_gun'; dipnot: Dipnot }

const KURALLAR: Array<{ kod: AcilKod; re: RegExp; ad: string; eylem: string; oncelik: 'hemen' | 'ayni_gun'; dipnot: Dipnot }> = [
  { kod: 'kimyasal_yanik', re: /kimyasal|çamaşır suyu|camasir suyu|kireç|kirec|asit|alkali|deterjan|lavabo açıcı|yanık.*göz|göz.*yanık/i, ad: 'Kimyasal yanık', eylem: 'HEMEN bol su / serum fizyolojik ile göz kapakları açık yıkama başlatılsın, ardından acil — beklemeden. Muayene yıkamayı geciktirmez.', oncelik: 'hemen', dipnot: { ref: 'TOD', not: 'TOD hasta bilgilendirme: kimyasal yanıkta hemen bol su ile yıkama, sonra acil' } },
  { kod: 'penetran_travma', re: /delici|kesici|metal parça|cam kırığı|batma|penetran|göze.*(girdi|saplandı)/i, ad: 'Delici / penetran göz travması şüphesi', eylem: 'Göze bastırma yok, koruyucu kalkan; aynı gün acil göz değerlendirmesi (112 gerekiyorsa).', oncelik: 'hemen', dipnot: { ref: 'KANSKI', not: 'Travma ilkesi — ders kitabı derinliği; TR protokolü hekim teyit eder' } },
  { kod: 'retina_dekolmani_suphesi', re: /ışık çak|isik cak|flaş|flas|uçuşan|ucusan|perde iniyor|perde gibi|görme alanı(nda)? kayıp|siyah nokta/i, ad: 'Retina dekolmanı şüphesi', eylem: 'Aynı gün dilate fundus muayenesi; dekolman varsa acil vitreoretinal sevk.', oncelik: 'ayni_gun', dipnot: { ref: 'TOD', not: 'TOD hasta bilgilendirme: ışık çakması, uçuşan cisimler, görme kaybı → acil' } },
  { kod: 'akut_aci_kapanmasi', re: /(şiddetli|siddetli|çok).*göz ağrı|göz ağrı.*(bulantı|kusma)|ışık etrafında (renkli )?hale|halka görme|hale görme/i, ad: 'Akut açı kapanması şüphesi', eylem: 'Aynı gün GİB ölçümü + gonyoskopi; ağrı/kusma + görme azalması varsa beklemeden acil göz.', oncelik: 'hemen', dipnot: { ref: 'TOD', not: 'TOD Primer Açı Kapanması: şiddetli ağrı, görme azalması, bulantı-kusma, renkli haleler' } },
  { kod: 'agrili_kirmizi_goz', re: /ağrılı (göz )?kızarıklık|agrili (goz )?kizariklik|kırmızı ve ağrılı göz/i, ad: 'Ağrılı kırmızı göz', eylem: 'Aynı gün biyomikroskopi + GİB; açı kapanması / keratit / üveit ayırıcı tanısı hekimin. Görme azalması veya şiddetli ağrı varsa beklemeden.', oncelik: 'ayni_gun', dipnot: { ref: 'TOD', not: 'Ağrılı kırmızı göz — aynı gün değerlendirme; TOD Kornea / Glokom birimi yaklaşımı hekim teyit eder' } },
  { kod: 'ani_gorme_kaybi', re: /ani (görme|gorme) (kaybı|kaybi|kaybet)|aniden görm(üyor|ediğ)|birden (göremiyorum|görmüyorum)|ani körlük/i, ad: 'Ani görme kaybı', eylem: 'Aynı gün değerlendirme (retinal arter/ven tıkanıklığı, dekolman, vitreus hemorajisi ayırıcı tanısı hekimin); inme bulgusu varsa 112.', oncelik: 'hemen', dipnot: { ref: 'TEMD_DM', not: 'Tablo 13.1: ani görme kaybı → aynı gün göz' } },
]

export function acilTara(metinler: Array<string | null | undefined>, hekimIsaretleri: AcilKod[] = []): AcilBayrak[] {
  const metin = metinler.filter(Boolean).join(' \n ')
  const bulunan = new Map<AcilKod, AcilBayrak>()
  for (const k of KURALLAR) if (k.re.test(metin) || hekimIsaretleri.includes(k.kod)) bulunan.set(k.kod, { kod: k.kod, ad: k.ad, eylem: k.eylem, oncelik: k.oncelik, dipnot: k.dipnot })
  return [...bulunan.values()].sort((a, b) => (a.oncelik === b.oncelik ? 0 : a.oncelik === 'hemen' ? -1 : 1))
}

export const ACIL_KODLARI: Array<{ kod: AcilKod; ad: string }> = KURALLAR.map((k) => ({ kod: k.kod, ad: k.ad }))

/** Hasta yüzü (portal / hatırlatma) — tanı dili yok, yalnız yönlendirme. */
export const HASTA_ACIL_METNI = 'Gözünüzde ani görme kaybı, şiddetli ağrı, ışık çakması / perde inmesi veya kimyasal madde teması olursa portal mesajı beklemeyin: 112\'yi arayın veya en yakın acile / muayenehaneye başvurun. Kimyasal temasta gözünüzü hemen bol temiz suyla yıkayın.'

// ---------- GOZ-EXCEPTIONAL-01: intake kırmızı bayrak kutuları → acilTara (serbest metin gerekmez) ----------
export const INTAKE_ACIL_SECENEKLERI: Array<{ etiket: string; kod: AcilKod }> = [
  { etiket: 'Ani görme kaybı', kod: 'ani_gorme_kaybi' },
  { etiket: 'Işık çakması', kod: 'retina_dekolmani_suphesi' },
  { etiket: 'Perde / gölge inmesi', kod: 'retina_dekolmani_suphesi' },
  { etiket: 'Kimyasal madde teması', kod: 'kimyasal_yanik' },
  { etiket: 'Ağrılı kızarıklık', kod: 'agrili_kirmizi_goz' },
]
export function intakeAcilKodlari(isaretli: unknown): AcilKod[] {
  const liste = Array.isArray(isaretli) ? isaretli.map(String) : []
  return [...new Set(INTAKE_ACIL_SECENEKLERI.filter((s) => liste.includes(s.etiket)).map((s) => s.kod))]
}

// ---------- Acil şablon: yıkama zamanlayıcısı + yazdırılabilir eylem listesi ----------
/** Başlangıç–bitiş arası dakika (0,1 hassasiyet). Bitiş yoksa `simdi` ile canlı süre. */
export function yikamaDakika(baslangicIso: string | null, bitisIso: string | null, simdiMs = Date.now()): number | null {
  if (!baslangicIso) return null
  const a = Date.parse(baslangicIso), b = bitisIso ? Date.parse(bitisIso) : simdiMs
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return Math.round(((b - a) / 60000) * 10) / 10
}

/** Bayrak başına eylem listesi — sıra ve ifade TR acil pratiği; doz / ilaç / süre hedefi yazılmaz (hekim / kurum protokolü). */
export const ACIL_EYLEM_LISTESI: Record<AcilKod, string[]> = {
  kimyasal_yanik: ['Yıkama HEMEN başladı — saat kaydedildi (muayeneyi beklemez)', 'Kapaklar açık tutuldu; forniksler kontrol edildi, partikül temizlendi', 'Yıkama bitiş saati ve toplam süre kaydedildi', 'pH (imkân varsa) yıkama öncesi / sonrası kaydedildi', 'VA saatli kaydedildi (OD / OS)', 'Aynı gün göz değerlendirmesi / acil sevk — 112 gerekiyorsa beklemeden'],
  penetran_travma: ['Göze bası yok — koruyucu kalkan takıldı', 'VA saatli kaydedildi (OD / OS)', 'Tetanoz bağışıklığı sorgulandı (hekim)', 'Aynı gün acil göz değerlendirmesi / 112'],
  akut_aci_kapanmasi: ['GİB ölçüldü — saat kaydedildi', 'VA saatli kaydedildi', 'Gonyoskopi planlandı (aynı gün)', 'Ağrı / kusma + görme azalması → beklemeden acil göz'],
  retina_dekolmani_suphesi: ['Semptom başlangıç zamanı kaydedildi', 'VA saatli kaydedildi', 'Aynı gün dilate fundus muayenesi planlandı', 'Dekolman varsa acil vitreoretinal sevk yolu hazır'],
  ani_gorme_kaybi: ['Başlangıç saati kaydedildi', 'İnme bulgusu sorgulandı — varsa 112', 'VA saatli kaydedildi', 'Aynı gün değerlendirme (fundus / GİB)'],
  agrili_kirmizi_goz: ['VA saatli kaydedildi', 'Kontakt lens kullanımı sorgulandı', 'Aynı gün biyomikroskopi + GİB', 'Görme azalması / şiddetli ağrı → beklemeden'],
}
