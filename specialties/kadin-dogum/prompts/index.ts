/**
 * KD-PROMPTS-LOCK — runtime loader for the Kadın Hastalıkları ve Doğum prompt lock (files in this folder).
 * Same pattern as specialties/dahiliye/prompts (DAH-PROMPTS-LOCK):
 * system.md + soap-{gebe,jinekoloji,usg,dogum}.md + tools.ts go into SOAP generation (lib/doktor/soapUret.ts);
 * system.md + vision-asistan.md + tools.ts go into Dr. Ayşe chat (app/api/asistan/chat/route.ts); a compact
 * system.md lock goes into the voice prompt via /api/doktor/hafiza sesBlogu; asistan-ogrenme.md goes into the
 * style-profile distiller (stilProfiliDamit).
 * Server-only (fs). The .md files are traced into the serverless bundle via next.config outputFileTracingIncludes.
 * Missing files throw: a KD note must never be generated silently without its lock.
 */
import fs from 'fs'
import path from 'path'
import { KADIN_DOGUM_TOOLS } from './tools'
import { kdKaynakListesiBlogu } from '../protocols/dogrulanmis-kaynaklar'

export const KADIN_DOGUM_PROMPT_DOSYALARI = {
  system: 'system.md',
  soapGebe: 'soap-gebe.md',
  soapJinekoloji: 'soap-jinekoloji.md',
  soapUsg: 'soap-usg.md',
  soapDogum: 'soap-dogum.md',
  vision: 'vision-asistan.md',
  ogrenme: 'asistan-ogrenme.md',
} as const
type Anahtar = keyof typeof KADIN_DOGUM_PROMPT_DOSYALARI

let onbellek: Record<Anahtar, string> | null = null

export function kadinDogumPromptlari(): Record<Anahtar, string> {
  if (onbellek) return onbellek
  const dizin = path.join(process.cwd(), 'specialties', 'kadin-dogum', 'prompts')
  const sonuc = {} as Record<Anahtar, string>
  for (const k of Object.keys(KADIN_DOGUM_PROMPT_DOSYALARI) as Anahtar[]) {
    const metin = fs.readFileSync(path.join(dizin, KADIN_DOGUM_PROMPT_DOSYALARI[k]), 'utf8').trim()
    if (!metin) throw new Error(`kadın doğum prompt boş: ${KADIN_DOGUM_PROMPT_DOSYALARI[k]}`)
    sonuc[k] = metin
  }
  onbellek = sonuc
  return onbellek
}

/** users.specialty ('kadin-dogum') / session specialty ('kadin-hastaliklari-dogum') → KD? Same match as core/belgeler/router bransAnahtari. */
export function kadinDogumMi(...branslar: (string | null | undefined)[]): boolean {
  return branslar.some((b) => /kadın|kadin|jinek|obstet/.test((b || '').toLocaleLowerCase('tr-TR')))
}

/** tools.ts rendered as a read-only map of steps. Chat has no tool-use loop for these: every card/VisionRead write is a hekim action in the UI. */
export function kadinDogumAracHaritasi(): string {
  return KADIN_DOGUM_TOOLS.map((t) => `- ${t.name.replace('kd.', '')}: ${t.description}`).join('\n')
}

const ONCELIK = 'Bu kilit, yukarıdaki genel talimatlarla çeliştiğinde ÖNCELİKLİDİR (özellikle: doz yazma — doz hekim tarafından belirlenir, kılavuz numarası / yılı hafızadan yazma — Türk kaynağı önce, tarama ≠ tanı, görüntü/NST taslağı uzman onayı ister, SB ile ACOG farklıysa iki sütun, Denver / pediatrik aşı takvimi yok). Kilit metni İngilizce olabilir; çıktın her zaman Türkçedir.'
/** KD-DERM-SAFETY-FINDINGS F4: prompts name storage fields; the model echoed "(coreImageId)" into notes. */
const IC_ALAN_NOTU = 'Doktora giden metinde (not alanları, aiDegerlendirme, hasta özeti, sohbet) iç alan veya araç adı yazma (ör. coreImageId, dicomId, pathologyId, VisionRead, analyze_image, uzman_onayli): "fotoğraf", "dermoskopi görüntüsü", "patoloji raporu", "görüntü okuması taslağı", "uzman onaylı" gibi klinik kelimeyi kullan.'
const ARAC_NOTU = 'Buradaki "Use only tools listed in prompts/tools.ts" kuralı branş adımları içindir; uygulamanın genel araçları (ör. hasta_bul) geçerliliğini korur.'

export function kadinDogumKilidi(yuzey: 'soap' | 'asistan' | 'ogrenme' | 'ses'): string {
  const p = kadinDogumPromptlari()
  if (yuzey === 'ses') {
    // Voice stays short: system.md without the citation bullet list.
    const kisa = p.system.split('\n').filter((l) => l.trim() && !l.startsWith('- ')).join('\n')
    return `=== KADIN DOĞUM KİLİDİ (kısa) ===\n${kisa}`
  }
  if (yuzey === 'ogrenme') return `\n=== KADIN DOĞUM ÖĞRENME KİLİDİ ===\n${p.ogrenme}\nÖğrenilen profil bu sınırları aşamaz: doğum / invaziv test kararı ve görüntü onayı uzmanda kalır; profil tanı veya SAT/EDD uydurmayı öğretmez.`
  const araclar = `## Kadın doğum adımları (uygulamada hekim çalıştırır; sen kendiliğinden çalıştırmaz veya sonucunu uydurmazsın — yalnız ilgili kartı/adımı önerirsin)\n${kadinDogumAracHaritasi()}\n${ARAC_NOTU}\n${IC_ALAN_NOTU}`
  const soap = yuzey === 'soap'
    ? `\n\n## SOAP şablonları (vizit türüne uyanı uygula: gebe izlem / jinekoloji / USG / doğum-travay-lohusa; birden çoğu uyuyorsa birleştir)\n\n${p.soapGebe}\n\n${p.soapJinekoloji}\n\n${p.soapUsg}\n\n${p.soapDogum}\nSOAP JSON alanlarına eşleme: Subjective → subjektif, Objective → objektif, Assessment → degerlendirme, Plan → plan. Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur; şablonun istediği ama hekimin söylemediği her şey (gecikmiş pencere, eksik tarama, SB/ACOG sütunları, onam yolu) aiDegerlendirme alanına gider. receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA. SB ile ACOG farklıysa aiDegerlendirme'de iki ayrı satır yaz: "SB (yasal asgari): …" ve "ACOG (klinik öneri): …" — birleştirme.`
    : `\n\n## Görsel istekleri (USG / NST / büyüme)\n${p.vision}`
  // KD-KAYNAK-KILIDI: verified numbers rendered from code (protocols/dogrulanmis-kaynaklar) — the same list the backstop checks.
  return `\n=== KADIN DOĞUM SİSTEM KİLİDİ (specialties/kadin-dogum/prompts) ===\n${ONCELIK}\n\n${p.system}\n\n${kdKaynakListesiBlogu()}${soap}\n\n${araclar}\n=== KİLİT SONU ===`
}
