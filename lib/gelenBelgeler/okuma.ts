/**
 * NOTYA-GELEN-BELGELER — Notya reads an incoming document: what kind it is, a one-line summary for the inbox
 * ("Hemogram — Hb düşük"), and whose it is (name, birth date, TC as printed). Server-only.
 *
 * AI policy (.cursor/skills/ai-model-politikasi): reading a document / photo is GÜÇLÜ ('goruntu-inceleme'); a text
 * (pasted table, Word / Excel text, voice-note transcript) goes as 'klinik-analiz' — also GÜÇLÜ. Model names never
 * appear here; lib/ai/cagir.ts picks the model and measures the call. The fixed instructions are one cached block.
 *
 * What the model sees: only the document itself (photos with their metadata stripped — donustur.ts). The doctor's
 * patient list is NEVER sent: matching happens on our server (eslesme.ts). The summary describes what the document
 * says; it is not a diagnosis, and the doctor decides what to do with it (hekim kilidi).
 *
 * Types are mapped onto the shared catalogue (lib/doktor/belgeTurleri.ts ORTAK_BELGE_TURLERI) — never onto a
 * branch-only type, so nothing specialty-specific can leak into another branş (brans-alan-sizmasi).
 */
import { aiCagir, yanitMetni, type AiIstemci, type AiMesaj } from '@/lib/ai/cagir'
import { ORTAK_BELGE_TURLERI } from '@/lib/doktor/belgeTurleri'
import { tarihNormalle } from './eslesme'
import type { Bicim, Okuma } from './tipler'

/** Map whatever the model (or an old label) said onto the shared catalogue. Unknown → 'Diğer'. */
export function turEsle(ham: string | null | undefined, bicim?: Bicim): string {
  const t = String(ham || '').toLocaleLowerCase('tr-TR').trim()
  const tam = (ORTAK_BELGE_TURLERI as readonly string[]).find((x) => x.toLocaleLowerCase('tr-TR') === t)
  if (tam) return tam
  if (/konsült|konsult|görüş raporu|gorus raporu|consult/.test(t)) return 'Konsültasyon raporu'
  if (/\bekg\b|elektrokardiyo|ecg|ritim şeridi/.test(t)) return 'EKG'
  if (/röntgen|rontgen|x-?ray|grafi|\bcxr\b/.test(t)) return 'Röntgen'
  if (/\bmr\b|\bmri\b|\bbt\b|tomografi|ultrason|\busg\b|\bus\b|mamograf|görüntüleme|goruntuleme|radyoloji|ekokardiyo|\beko\b|doppler/.test(t)) return 'Görüntüleme Raporu'
  // Pathology is not a lab table (the lab reader would find no rows) — it stays a plain document.
  if (/patoloji|biyopsi|sitoloji/.test(t)) return 'Diğer'
  if (/lab|tahlil|hemogram|biyokimya|kan sayımı|idrar|hormon|tiroid|lipid|hba1c|ferritin|vitamin|kültür|kultur|serolo/.test(t)) return 'Lab Sonucu'
  if (/epikriz|taburcu/.test(t)) return 'Epikriz'
  if (/reçete|recete|prescription/.test(t)) return 'Reçete'
  if (/sevk/.test(t)) return 'Sevk'
  if (/muayene (görüntüsü|fotoğrafı|fotografi)|klinik foto|lezyon foto|yara foto/.test(t)) return 'Muayene görüntüsü'
  if (/ses kaydı|ses kaydi/.test(t)) return 'Muayene ses kaydı'
  if (!t && bicim === 'excel') return 'Lab Sonucu'
  return 'Diğer'
}

const TURLER_METNI = ORTAK_BELGE_TURLERI.join(' | ')

/** Fixed, cacheable instructions — no patient data in here. */
export const OKUMA_TALIMATI = [
  'Bir hekimin muayenehanesine gelen tek bir belgeyi okuyorsun: laboratuvar sonucu, röntgen/EKG fotoğrafı, görüntüleme raporu,',
  'konsültasyon yanıtı, epikriz, reçete, sevk ya da bir hastanın sesli mesajının yazıya dökülmüş hali olabilir.',
  'Görevin yalnızca belgeyi TANIMAK: ne olduğunu, kime ait olduğunu ve bir satırlık özetini çıkar. Tanı koyma, tedavi önerme.',
  '',
  'Yalnızca şu JSON nesnesini döndür, başka hiçbir şey yazma:',
  '{"belge_turu": "<şunlardan biri: ' + TURLER_METNI + '>",',
  ' "ozet": "<en çok 60 karakter, sade Türkçe; ör. \\"Hemogram — Hb düşük\\", \\"Akciğer grafisi\\", \\"KBB konsültasyon yanıtı\\", \\"Sesli mesaj — ilaç sorusu\\">",',
  ' "hasta_ad_soyad": "<belgede yazan hasta adı soyadı ya da null>",',
  ' "hasta_dogum_tarihi": "<YYYY-AA-GG ya da null>",',
  ' "tc_kimlik": "<belgede 11 hanenin tamamı açıkça yazıyorsa o numara, yoksa null>",',
  ' "tc_son_haneler": "<TC maskeliyse görünen son haneler, yoksa null>",',
  ' "belge_tarihi": "<YYYY-AA-GG ya da null>",',
  ' "konsultasyon_yaniti": <meslektaştan gelen bir görüş/konsültasyon yanıtıysa true, değilse false>}',
  '',
  'Kurallar: Belgede yazmayan hiçbir bilgiyi uydurma; emin değilsen null yaz. Özette anormal değer varsa en önemlisini kısaca belirt',
  '("Hb düşük", "TSH yüksek"); anormal bir şey yoksa yalnızca belgenin adını yaz. Hekim, laboratuvar ya da hastane adını hasta adı sanma.',
].join('\n')

export type OkumaGirdisi =
  | { tip: 'pdf'; base64: string }
  | { tip: 'gorsel'; mime: string; base64: string }
  | { tip: 'metin'; metin: string; sesMi?: boolean }

function mesajKur(g: OkumaGirdisi): AiMesaj[] {
  if (g.tip === 'pdf') {
    return [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: g.base64 } }, { type: 'text', text: 'Bu belgeyi tanı ve JSON döndür.' }] }]
  }
  if (g.tip === 'gorsel') {
    return [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: g.mime, data: g.base64 } }, { type: 'text', text: 'Bu fotoğraftaki belgeyi tanı ve JSON döndür.' }] }]
  }
  const bas = g.sesMi ? 'Aşağıdaki metin bir sesli mesajın yazıya dökülmüş halidir.' : 'Aşağıdaki metin hekime gelen bir belgedir.'
  return [{ role: 'user', content: `${bas}\n\n"""\n${g.metin.slice(0, 20000)}\n"""\n\nBu belgeyi tanı ve JSON döndür.` }]
}

const temiz = (v: unknown, n: number): string | null => {
  if (typeof v !== 'string') return null
  const s = v.replace(/\s+/g, ' ').trim()
  return s && s.toLowerCase() !== 'null' ? s.slice(0, n) : null
}

/** Model text → Okuma. Tolerates prose around the JSON; never throws. */
export function okumaCoz(ham: string, bicim: Bicim, metin: string | null): Okuma {
  let j: Record<string, unknown> = {}
  const m = ham.match(/\{[\s\S]*\}/)
  if (m) { try { j = JSON.parse(m[0]) as Record<string, unknown> } catch { j = {} } }
  const okundu = Object.keys(j).length > 0
  const belgeTuru = turEsle(temiz(j.belge_turu, 80), bicim)
  const tc = temiz(j.tc_kimlik, 20)?.replace(/\D/g, '') || null
  return {
    ozet: temiz(j.ozet, 90) || yedekOzet(bicim, belgeTuru),
    belgeTuru,
    metin,
    kimlik: {
      ad: temiz(j.hasta_ad_soyad, 120),
      dogum: tarihNormalle(temiz(j.hasta_dogum_tarihi, 20)),
      tc: tc && tc.length === 11 ? tc : null,
      tcSon: temiz(j.tc_son_haneler, 11)?.replace(/\D/g, '') || null,
    },
    belgeTarihi: tarihNormalle(temiz(j.belge_tarihi, 20)),
    konsultasyonYaniti: j.konsultasyon_yaniti === true,
    okundu,
  }
}

/** When nothing could be read: a calm, honest line. */
export function yedekOzet(bicim: Bicim, belgeTuru?: string): string {
  if (belgeTuru && belgeTuru !== 'Diğer') return belgeTuru
  switch (bicim) {
    case 'ses': return 'Sesli mesaj'
    case 'gorsel': case 'heic': return 'Fotoğraf'
    case 'pdf': return 'PDF belge'
    case 'word': return 'Word belgesi'
    case 'excel': return 'Tablo'
    default: return 'Metin'
  }
}

export function bosOkuma(bicim: Bicim, metin: string | null): Okuma {
  return { ozet: yedekOzet(bicim), belgeTuru: bicim === 'ses' ? 'Diğer' : turEsle('', bicim), metin, kimlik: { ad: null, dogum: null, tc: null, tcSon: null }, belgeTarihi: null, konsultasyonYaniti: false, okundu: false }
}

export async function belgeyiOku(g: OkumaGirdisi, bicim: Bicim, o: { doctorId: string; istemci?: AiIstemci; metin?: string | null }): Promise<Okuma> {
  const metin = o.metin ?? (g.tip === 'metin' ? g.metin : null)
  try {
    const yanit = await aiCagir({
      gorev: g.tip === 'metin' ? 'klinik-analiz' : 'goruntu-inceleme',
      system: [{ metin: OKUMA_TALIMATI, onbellek: true }],
      messages: mesajKur(g),
      temperature: 0,
      istemci: o.istemci,
      doctorId: o.doctorId,
    })
    return okumaCoz(yanitMetni(yanit), bicim, metin)
  } catch (e) {
    console.error('[gelen-belgeler] okuma', e instanceof Error ? e.message.slice(0, 200) : e)
    return bosOkuma(bicim, metin)
  }
}
