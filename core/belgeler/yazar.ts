/**
 * NOTYA-BELGE-01 — Tier A: Claude vision writer.
 * Claude receives the de-identified image (or PDF, or an audio spectrogram + metrics), the doctor's persona,
 * the fused engine JSON (may be empty in V1) and returns the locked JSON schema in Turkish colleague prose.
 * Claude is the WRITER and a describe-tier engine; it is never the authority on confidence or acil —
 * fusion.ts caps and rules override it.
 */
import type Anthropic from '@anthropic-ai/sdk'
import { aiCagir } from '@/lib/ai/cagir'
import { BULGU_KODLARI, MODALITE_TR, bulguTr, type Modalite } from './ontoloji'
import { SES_MODALITELERI } from './router'
import type { AnalizGirdi, BelgeRaporu, FusionSonuc, MotorCiktisi } from './types'

export const UYARI_SERIDI = 'Yapay zekâ taslak rapor üretir. Tanı ve tedavi kararı hekime aittir.'

const PERSONALAR: Record<string, string> = {
  ayse: 'Sen Ayşe — deneyimli bir çocuk sağlığı ve hastalıkları uzmanısın. Yaşa göre normal değerleri ve pediatrik ayırıcı tanıyı ön planda tutarsın; erişkin verisiyle eğitilmiş motor çıktılarına çocuk hastada temkinli yaklaşırsın.',
  mehmet: 'Sen Mehmet — deneyimli bir kardiyoloji uzmanısın. EKG, ekokardiyografi ve kalp seslerinde ritim, iskemi ve yapısal bulguları sistematik okursun; telefon kaydından kapak derecelendirmesi yapmazsın.',
  elif: 'Sen Elif — deneyimli bir nöroloji ve iç hastalıkları uzmanısın. Akut kanama/iskemi, papilödem ve çoklu sistem bulgularını kırmızı bayrak önceliğiyle değerlendirirsin.',
  genel: 'Sen deneyimli bir hekim meslektaşsın; branşa uygun tıbbi dille, sistematik ve ölçülü yazarsın.',
}

export function personaMetni(persona: string): string { return PERSONALAR[persona] || PERSONALAR.genel }

export function sistemPromptu(persona: string): string {
  return `${personaMetni(persona)}

GÖREV: Bir meslektaşına, verilen tıbbi görüntü / kayıt / rapor için TÜRKÇE taslak değerlendirme yazıyorsun. Yalnızca JSON döndür; başka hiçbir şey yazma.

KURALLAR
- Bu bir TASLAKTIR. Tanı ve tedavi kararı hekime aittir; ifadelerin "…ile uyumlu", "…düşündürür", "…açısından değerlendirilmeli" şeklinde olsun.
- Kalite düşükse (bulanık, kırpık, yanlış pencere, kısa/gürültülü kayıt) "kalite":"dusuk" yaz ve "tanilar" listesini BOŞ bırak.
- Görüntünün modalitesi doktorun seçtiğiyle uyuşmuyorsa "modalite" alanına gördüğünü yaz; uydurma.
- Motor çıktıları (fused) verilmişse onları kaynak olarak kullan, "destek"/"karsi" alanlarında motor adlarını an. Motorların bulmadığı bir tanıyı %70'in üstünde önerme.
- guven_pct 0–95 arası tam sayı. Sistem üst sınırları ayrıca uygular; sen dürüst tahmin yaz.
- acil_bayrak: hayatı tehdit eden bulgu (pnömotoraks, intrakraniyal kanama, STEMI, stridor, papilödem, melanom şüphesi yüksek) varsa true.
- "sinirlar": bu değerlendirmenin sınırlarını 1–4 madde ile yaz (tek görüntü, klinik bilgi yok, motor yok, çocuk hasta vb.).
- Hasta adı, TC, tarih gibi kimlik bilgisi görsen bile ASLA yazma.
- Hiçbir motorun veya modelin uzmandan üstün olduğunu ima etme.
- Ses kayıtlarında: yalnız "üfürüm var / yok / değerlendirilemedi", "ral / wheezing / stridor var-yok" düzeyinde kal; kapak derecesi, spesifik hastalık adı verme.

ÇIKTI ŞEMASI (JSON)
{
  "modalite": string,               // gördüğün modalite (Türkçe kısa ad)
  "kalite": "iyi"|"orta"|"dusuk",
  "ozet": string,                   // 2–5 cümle, meslektaşa hitaben
  "bulgular": string[],             // madde madde, sistematik
  "tanilar": [{"ad": string, "icd10": string|null, "guven_pct": number, "guven_bant": "yüksek"|"orta"|"düşük", "destek": string[], "karsi": string[]}],
  "acil_bayrak": boolean,
  "oneri": string,                  // ek tetkik / sevk / takip önerisi, kısa
  "sinirlar": string[],
  "hekim_tanisi": [],
  "engines_used": string[],
  "bulgu_kodlari": [{"kod": string, "p": number}]   // aşağıdaki ontoloji kodlarından; görmediğin kodu yazma
}
ONTOLOJİ KODLARI: ${BULGU_KODLARI.map((k) => `${k}=${bulguTr(k)}`).join('; ')}`
}

/** Fundus / OCT: Türk göz hekimi okuma sırası — Tier A yazara sistematik madde listesi. */
function gozGoruntuRehberi(modalite: Modalite): string | null {
  if (modalite === 'fundus') {
    return `FUNDUS (göz dibi) — "bulgular" dizisini şu sırayla yaz (TR poliklinik):
1) Kalite / alan (tek alan mı, dilate izlenimi, artefakt)
2) Optik disk — renk, kenar, C/D izlenimi (3C); glokom tanısı koyma
3) Damarlar — kalibre, AV çaprazlaşma, neovaskülarizasyon şüphesi
4) Makula — refle, kanama, eksuda (ICDR evresi yazma; "…ile uyumlu" de)
5) Perifer — görünen alan; tek alan fotoğrafta perifer güvenilir değil
OD/OS klinik notta yazılmışsa yalnız o gözü anlat. Tanı listesinde FUN.* kodlarını kullan; kesin DR evresi yazma.`
  }
  if (modalite === 'oct') {
    return `OCT — "bulgular" dizisini şu sırayla yaz:
1) Kalite / sinyal / artefakt
2) Makula / fovea konturu
3) İntra/subretinal sıvı izlenimi (evre yok)
4) RNFL / GCL asimetri notu (hekim teyit eder)
Tanı kesinliği yok; "…düşündürür" dili.`
  }
  if (modalite === 'dis_goz') {
    return `Dış göz fotoğrafı — kapak, konjonktiva, kornea yüzey, kızarıklık dağılımı; fundus yorumu yapma.`
  }
  return null
}

export function kullaniciPromptu(g: AnalizGirdi, f: FusionSonuc | null, motorlar: MotorCiktisi[], sesMetrikleri?: Record<string, number | string> | null): string {
  const parcalar: string[] = []
  parcalar.push(`Branş: ${g.brans}. Doktorun seçtiği modalite: ${MODALITE_TR[g.modality_final] || g.modality_final}.`)
  if (typeof g.yasAy === 'number') parcalar.push(`Hasta yaşı: ${g.yasAy < 24 ? `${g.yasAy} ay` : `${Math.floor(g.yasAy / 12)} yaş`}${g.cinsiyet ? `, cinsiyet ${g.cinsiyet}` : ''}.`)
  if (g.klinikNot) parcalar.push(`Klinik not: ${g.klinikNot.slice(0, 400)}`)
  const gozRehber = gozGoruntuRehberi(g.modality_final)
  if (gozRehber) parcalar.push(gozRehber)
  if (SES_MODALITELERI.includes(g.modality_final)) {
    parcalar.push('Girdi bir SES kaydıdır; ekte kaydın spektrogramı var. Spektrogram ve metrikler üzerinden yalnız kalite ve kaba patern değerlendirmesi yap; özgül tanı verme.')
    if (sesMetrikleri) parcalar.push(`Ses metrikleri: ${JSON.stringify(sesMetrikleri)}`)
  }
  const calisan = motorlar.filter((m) => m.motor !== 'claude-vision' && !m.hata)
  if (f && calisan.length) {
    parcalar.push(`Motor çıktıları (fused): ${JSON.stringify(f.fused.map((x) => ({ kod: x.kod, ad: x.label_tr, p: x.p, destek: x.sources, karsi: x.karsi })))}`)
    parcalar.push(`Çalışan motorlar: ${calisan.map((m) => `${m.motor}${m.dogrulanmis ? ' (doğrulanmış)' : ''}`).join(', ')}. Bu analizde güven üst sınırı %${f.capPct}.`)
  } else {
    parcalar.push('Özel motor çalışmadı; yalnız senin görsel değerlendirmen var. Güven üst sınırı %70 (serbest görüntüde %55).')
  }
  parcalar.push('Yalnızca JSON döndür.')
  return parcalar.join('\n')
}

export type ClaudeGorselGirdi =
  | { tip: 'image'; mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'; base64: string }
  | { tip: 'pdf'; base64: string }

export async function claudeIleYaz(
  anthropic: Anthropic,
  persona: string,
  girdi: AnalizGirdi,
  gorsel: ClaudeGorselGirdi | null,
  fusion: FusionSonuc | null,
  motorlar: MotorCiktisi[],
  sesMetrikleri?: Record<string, number | string> | null,
  doctorId?: string | null
): Promise<{ rapor: BelgeRaporu; bulguKodlari: { kod: string; p: number }[]; ham: string }> {
  const icerik: Anthropic.Messages.MessageParam['content'] extends string | (infer U)[] ? U[] : never = []
  if (gorsel?.tip === 'image') icerik.push({ type: 'image', source: { type: 'base64', media_type: gorsel.mime, data: gorsel.base64 } })
  if (gorsel?.tip === 'pdf') icerik.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: gorsel.base64 } } as unknown as (typeof icerik)[number])
  icerik.push({ type: 'text', text: kullaniciPromptu(girdi, fusion, motorlar, sesMetrikleri) })
  // NOTYA-MALIYET-01: görüntü/belge yorumu — istisnasız GÜÇLÜ (goruntu-inceleme); model adı politikadan
  const yanit = await aiCagir({ istemci: anthropic, gorev: 'goruntu-inceleme', maxTokens: 3000, temperature: 0.2, doctorId, system: sistemPromptu(persona), messages: [{ role: 'user', content: icerik }] })
  const ham = yanit.content.filter((c) => c.type === 'text').map((c) => (c as { text: string }).text).join('\n')
  const temiz = ham.replace(/```json|```/g, '').trim()
  const j = JSON.parse(temiz.slice(temiz.indexOf('{'), temiz.lastIndexOf('}') + 1)) as BelgeRaporu & { bulgu_kodlari?: { kod: string; p: number }[] }
  const bulguKodlari = Array.isArray(j.bulgu_kodlari) ? j.bulgu_kodlari.filter((x) => x && typeof x.kod === 'string' && typeof x.p === 'number') : []
  delete (j as { bulgu_kodlari?: unknown }).bulgu_kodlari
  const rapor: BelgeRaporu = {
    modalite: String(j.modalite || girdi.modality_final),
    kalite: j.kalite === 'dusuk' || j.kalite === 'orta' ? j.kalite : 'iyi',
    ozet: String(j.ozet || ''),
    bulgular: Array.isArray(j.bulgular) ? j.bulgular.map(String) : [],
    tanilar: Array.isArray(j.tanilar) ? j.tanilar.map((t) => ({ ad: String(t.ad || ''), icd10: t.icd10 ? String(t.icd10) : null, guven_pct: Number(t.guven_pct) || 0, guven_bant: 'düşük' as const, destek: Array.isArray(t.destek) ? t.destek.map(String) : [], karsi: Array.isArray(t.karsi) ? t.karsi.map(String) : [] })).filter((t) => t.ad) : [],
    acil_bayrak: Boolean(j.acil_bayrak),
    oneri: String(j.oneri || ''),
    sinirlar: Array.isArray(j.sinirlar) ? j.sinirlar.map(String) : [],
    hekim_tanisi: [],
    engines_used: Array.from(new Set(['claude-vision', ...motorlar.filter((m) => !m.hata).map((m) => m.motor)])),
  }
  return { rapor, bulguKodlari, ham }
}

/** Claude's own findings as an engine output so fusion treats it like any other (unvalidated, tier A). */
export function claudeMotorCiktisi(bulguKodlari: { kod: string; p: number }[], kalite: BelgeRaporu['kalite'], modalite: Modalite | null): MotorCiktisi {
  return { motor: 'claude-vision', surum: 'sonnet-4.6', tier: 'A', dogrulanmis: false, labels: bulguKodlari.map((b) => ({ kod: b.kod, p: b.p })), kalite, modaliteTahmini: modalite }
}
