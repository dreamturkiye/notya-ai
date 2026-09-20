/**
 * NOTYA-EYLEM (docs §4, P2) — proactive gap offers: facts the DOCUMENTS state but the STRUCTURED
 * records do not have.
 *
 * The clinical value: a Hepatit B dose written in a doğum epikrizi is invisible to the aşı karnesi,
 * the reminder cron and the patient portal until someone types it in. Nobody types it in. So Ayşe
 * offers — ONCE.
 *
 * "Once, not nagging" is the whole design constraint, and it is why this is LLM-free and gated on
 * the first doctor turn of a conversation. An assistant that re-offers the same four gaps on every
 * message is an assistant doctors learn to ignore, which costs more than the gap did.
 *
 * Deliberately shallow: a keyword scan over the ALREADY-COMPILED dossier string
 * (hastaDosyaDerleyici, which includes document summaries). No extra model call, no extra cost, no
 * new failure mode. It decides only whether to NUDGE — every value still comes from a tool call
 * that goes through the same tahmin-dropping path, and the doctor still taps.
 */

export type BoslukTuru = 'asi' | 'ilac' | 'alerji' | 'olcum'

/** What the structured side already has. Counts, never content. */
export interface YapilandirilmisSayim {
  asi: number
  ilac: number
  alerjiVar: boolean
  olcumVar: boolean
}

const IPUCLARI: Record<BoslukTuru, RegExp> = {
  // "hepatit b", "bcg", "kkk", "aşı", "doz yapıldı" — the words a Turkish epikriz actually uses
  asi: /\ba[şs]ı(?:sı|ları|lama)?\b|hepatit\s*b|\bbcg\b|\bkkk\b|\bdabt\b|\bopa\b|\bkpa\b|rotavir[üu]s|suçiçeği/i,
  ilac: /\bila[çc](?:lar[ıi]|ı)?\b|\bmg\b\s*\d|\btablet\b|\bşurup\b|\bdamla\b|reçete|tedaviye ba[şs]land/i,
  alerji: /alerji|aler[jg]ik|anafilaksi|intolerans/i,
  olcum: /\bboy\b|\bkilo\b|\bba[şs] [çc]evresi\b|\bvücut a[ğg]ırl/i,
}

const ETIKET: Record<BoslukTuru, string> = {
  asi: 'aşı',
  ilac: 'ilaç',
  alerji: 'alerji',
  olcum: 'ölçüm',
}

/** Which categories the documents talk about while the structured records stay empty. */
export function bosluklariBul(dosyaMetni: string, sayim: YapilandirilmisSayim): BoslukTuru[] {
  const metin = String(dosyaMetni || '')
  if (!metin.trim()) return []
  const bos: Record<BoslukTuru, boolean> = {
    asi: sayim.asi === 0,
    ilac: sayim.ilac === 0,
    alerji: !sayim.alerjiVar,
    olcum: !sayim.olcumVar,
  }
  return (Object.keys(IPUCLARI) as BoslukTuru[]).filter((t) => bos[t] && IPUCLARI[t].test(metin))
}

/**
 * The nudge, or ''. Emitted on the FIRST doctor turn only — `dokturTurSayisi` is how many messages
 * the doctor has sent in this conversation, so on turn 2 onward this is silent even if the gap
 * persists (the doctor has already seen the offer and decided).
 */
export function boslukBlogu(bosluklar: BoslukTuru[], doktorTurSayisi: number): string {
  if (!bosluklar.length || doktorTurSayisi > 1) return ''
  const liste = bosluklar.map((t) => ETIKET[t]).join(', ')
  return `

[SİSTEM — DOSYA BOŞLUĞU, BİR KEZ SÖYLE: Bu hastanın belgelerinde ${liste} bilgisi geçiyor ama yapılandırılmış kayıtlarda yok. Cevabının SONUNA tek cümlelik bir teklif ekle: "${liste.charAt(0).toLocaleUpperCase('tr-TR')}${liste.slice(1)} bilgileri belgelerde var ama dosyada kayıtlı değil — isterseniz toplu kart hazırlayayım Hocam." Hekim isterse ilgili araçları çağır. Hekim şimdi başka bir şey soruyorsa ısrar etme, bir daha açma.]`
}
