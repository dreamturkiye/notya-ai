/**
 * DERM-PROMPTS-LOCK — runtime loader for the Deri ve Zührevi Hastalıklar prompt lock (files in this folder).
 * Same pattern as specialties/dahiliye/prompts (DAH-PROMPTS-LOCK) and specialties/kadin-dogum/prompts (KD-PROMPTS-LOCK):
 * system.md + soap-{derm,phototherapy,procedure}.md + tools.ts go into SOAP generation (lib/doktor/soapUret.ts);
 * system.md + vision-asistan.md + tools.ts go into Dr. Ayşe chat (app/api/asistan/chat/route.ts); a compact
 * system.md lock goes into the voice prompt via /api/doktor/hafiza sesBlogu; asistan-ogrenme.md goes into the
 * style-profile distiller (stilProfiliDamit).
 * Server-only (fs). The .md files are traced into the serverless bundle via next.config outputFileTracingIncludes.
 * Missing files throw: a dermatoloji note must never be generated silently without its lock.
 */
import fs from 'fs'
import path from 'path'
import { DERMATOLOJI_TOOLS } from './tools'

export const DERMATOLOJI_PROMPT_DOSYALARI = {
  system: 'system.md',
  soapDerm: 'soap-derm.md',
  soapFototerapi: 'soap-phototherapy.md',
  soapIslem: 'soap-procedure.md',
  vision: 'vision-asistan.md',
  ogrenme: 'asistan-ogrenme.md',
} as const
type Anahtar = keyof typeof DERMATOLOJI_PROMPT_DOSYALARI

let onbellek: Record<Anahtar, string> | null = null

export function dermatolojiPromptlari(): Record<Anahtar, string> {
  if (onbellek) return onbellek
  const dizin = path.join(process.cwd(), 'specialties', 'dermatoloji', 'prompts')
  const sonuc = {} as Record<Anahtar, string>
  for (const k of Object.keys(DERMATOLOJI_PROMPT_DOSYALARI) as Anahtar[]) {
    const metin = fs.readFileSync(path.join(dizin, DERMATOLOJI_PROMPT_DOSYALARI[k]), 'utf8').trim()
    if (!metin) throw new Error(`dermatoloji prompt boş: ${DERMATOLOJI_PROMPT_DOSYALARI[k]}`)
    sonuc[k] = metin
  }
  onbellek = sonuc
  return onbellek
}

/** users.specialty / session specialty → dermatoloji? core/belgeler/router bransAnahtari (/derma/) + the resmi unvan "Deri ve Zührevi". */
export function dermatolojiMi(...branslar: (string | null | undefined)[]): boolean {
  return branslar.some((b) => /derma|deri ve z/.test((b || '').toLocaleLowerCase('tr-TR')))
}

/** tools.ts rendered as a read-only map of steps. Chat has no tool-use loop for these: every image/VisionRead write is a hekim action in the UI. */
export function dermatolojiAracHaritasi(): string {
  return DERMATOLOJI_TOOLS.map((t) => `- ${t.name.replace('derm.', '')}: ${t.description}`).join('\n')
}

const ONCELIK = 'Bu kilit, yukarıdaki genel talimatlarla çeliştiğinde ÖNCELİKLİDİR (özellikle: görüntü okuması karar desteğidir, tanı değildir; taslak uzman onayı ister; Denver / SAT / EDD / pediatrik aşı takvimi yok; KETEM deri kanseri taraması değildir). Kilit metni İngilizce olabilir; çıktın her zaman Türkçedir.'
const ARAC_NOTU = 'Buradaki "Use only tools listed in prompts/tools.ts" kuralı branş adımları içindir; uygulamanın genel araçları (ör. hasta_bul) geçerliliğini korur.'

export function dermatolojiKilidi(yuzey: 'soap' | 'asistan' | 'ogrenme' | 'ses'): string {
  const p = dermatolojiPromptlari()
  if (yuzey === 'ses') {
    // Voice stays short: system.md without the citation bullet list.
    const kisa = p.system.split('\n').filter((l) => l.trim() && !l.startsWith('- ')).join('\n')
    return `=== DERMATOLOJİ KİLİDİ (kısa) ===\n${kisa}`
  }
  if (yuzey === 'ogrenme') return `\n=== DERMATOLOJİ ÖĞRENME KİLİDİ ===\n${p.ogrenme}\nÖğrenilen profil bu sınırları aşamaz: biyopsi / tedavi kararı ve görüntü onayı uzmanda kalır; profil görüntüden tanı koymayı öğretmez.`
  const araclar = `## Dermatoloji adımları (uygulamada hekim çalıştırır; sen kendiliğinden çalıştırmaz veya sonucunu uydurmazsın — yalnız ilgili kartı/adımı önerirsin)\n${dermatolojiAracHaritasi()}\n${ARAC_NOTU}`
  const soap = yuzey === 'soap'
    ? `\n\n## SOAP şablonları (vizit türüne uyanı uygula: genel poliklinik-yandal / fototerapi / işlem; birden çoğu uyuyorsa birleştir)\n\n${p.soapDerm}\n\n${p.soapFototerapi}\n\n${p.soapIslem}\nSOAP JSON alanlarına eşleme: Subjective → subjektif, Objective → objektif, Assessment → degerlendirme, Plan → plan. Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur; şablonun istediği ama hekimin söylemediği her şey (eksik dermoskopi/biyopsi/yama, sonraki foto tarihi, eksik J/cm2 veya kümülatif doz, SUT dışı işlem bayrağı) aiDegerlendirme alanına gider. Fotoğraf/dermoskopi kimliği (coreImageId) transkriptte yoksa uydurma.`
    : `\n\n## Görsel istekleri (klinik foto / dermoskopi / önce-sonra)\n${p.vision}`
  return `\n=== DERMATOLOJİ SİSTEM KİLİDİ (specialties/dermatoloji/prompts) ===\n${ONCELIK}\n\n${p.system}${soap}\n\n${araclar}\n=== KİLİT SONU ===`
}
