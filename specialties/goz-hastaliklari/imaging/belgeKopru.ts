/**
 * GOZ-EXCEPTIONAL-01 — Belge Tier A (Asistana raporla) → göz dual-sign okuma taslağı. Pure.
 * Kaynak: Belge kasasındaki analiz (belge_analizleri) VEYA Göz › Görüntü'deki hasta_goruntulemeler satırı — ikisi de aynı Tier A yolu.
 * Kurallar: OD/OS zorunlu (sağ / sol; OU fundus fotoğrafı ayrı yüklenmeli), tek alan fundus → güven üst sınırı ≤ %70,
 * taslak her zaman asistan yazımıdır ve uzman onayı bekler; DR evresi / tanı YAZILMAZ — model kodları "olası bulgu" olarak,
 * evre değil diye etiketlenir. Görüntü okunamazsa (hata / düşük kalite) kontrol listesi iskeleti (ayseGoruntu) yedek taslaktır.
 */
import type { BelgeRaporu } from '@/core/belgeler/types'
import { GOZ_GORUNTU_DISCLAIMER, type GozModalite } from './dualSign'

/** Belge ontolojisi modalitesi → göz görüntü modalitesi. Başka modalite köprüden geçmez. */
export function belgeModaliteGoz(m: string | null | undefined): GozModalite | null {
  if (m === 'fundus') return 'fundus'
  if (m === 'oct') return 'oct'
  if (m === 'dis_goz' || m === 'on_segment') return 'on_segment'
  return null
}
/** Göz görüntü modalitesi → Belge ontolojisi (Tier A yazıcısı için). */
export function gozModaliteBelge(m: GozModalite): 'fundus' | 'oct' | 'dis_goz' {
  return m === 'on_segment' ? 'dis_goz' : m
}

export const TEK_ALAN_FUNDUS_UST = 70

export function guvenUst(capPct: number | null | undefined, modalite: GozModalite, tekAlan: boolean): number {
  const cap = Number.isFinite(Number(capPct)) ? Math.max(0, Math.min(100, Number(capPct))) : TEK_ALAN_FUNDUS_UST
  return modalite === 'fundus' && tekAlan ? Math.min(cap, TEK_ALAN_FUNDUS_UST) : cap
}

export function kopruGozDogrula(goz: unknown): { ok: true; goz: 'sag' | 'sol' } | { ok: false; hata: string } {
  if (goz === 'sag' || goz === 'sol') return { ok: true, goz }
  return { ok: false, hata: 'Göz seçin: OD (sağ) veya OS (sol). İki göz için ayrı görüntü yükleyin.' }
}

/** Analiz okunabilir mi? Hata / düşük kalite → köprü reddeder, yedek kontrol listesi önerilir. */
export function analizKopruyeUygun(durum: string | null | undefined, rapor: BelgeRaporu | null | undefined): { ok: true } | { ok: false; hata: string } {
  if (!rapor || durum === 'hata') return { ok: false, hata: 'Asistan analizi yok veya hata ile bitti — Göz › Görüntü’de kontrol listesi taslağı (Ayşe) kullanın.' }
  if (durum === 'kalite_dusuk' || rapor.kalite === 'dusuk') return { ok: false, hata: 'Görüntü kalitesi düşük — bulgu taslağı aktarılmaz; kontrol listesi taslağı (Ayşe) veya yeniden çekim.' }
  return { ok: true }
}

const MOD_AD: Record<GozModalite, string> = { oct: 'OCT', fundus: 'Fundus (göz dibi)', on_segment: 'Ön segment' }

/** Dual-sign taslak metni. Model "tanı" başlıkları "olası bulgu (evre değildir)" olarak, güven üst sınırıyla kırpılarak yazılır. */
export function belgeTaslakMetni(g: { rapor: BelgeRaporu; modalite: GozModalite; goz: 'sag' | 'sol'; guvenUstPct: number; tekAlan: boolean }): string {
  const r = g.rapor
  const gozAd = g.goz === 'sag' ? 'sağ göz (OD)' : 'sol göz (OS)'
  const satir: string[] = [`Asistan taslak (Belge Tier A, ${MOD_AD[g.modalite]}, ${gozAd}) — ${GOZ_GORUNTU_DISCLAIMER}`]
  if (r.ozet) satir.push(`Özet: ${r.ozet}`)
  if (r.bulgular.length) satir.push('Gözlemler:', ...r.bulgular.slice(0, 12).map((b, i) => `${i + 1}. ${b}`))
  if (r.tanilar.length) {
    satir.push(`Olası bulgular (karar desteği; evre değildir — DR evresini hekim DR kartında kilitler; güven ≤%${g.guvenUstPct}):`)
    for (const t of r.tanilar.slice(0, 5)) satir.push(`- ${t.ad} (%${Math.min(t.guven_pct, g.guvenUstPct)})`)
  }
  if (r.acil_bayrak) satir.push('Asistan acil bayrağı kaldırdı — hekim aynı gün değerlendirir.')
  const sinir = [...r.sinirlar]
  if (g.modalite === 'fundus' && g.tekAlan) sinir.push(`Tek alan fundus fotoğrafı — güven en çok %${TEK_ALAN_FUNDUS_UST}; perifer değerlendirilemez.`)
  if (sinir.length) satir.push(`Sınırlar: ${[...new Set(sinir)].join(' · ')}`)
  satir.push('Uzman onayından önce klinik karar verilmez.')
  return satir.join('\n').slice(0, 3000)
}
