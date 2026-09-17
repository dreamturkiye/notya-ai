/**
 * GOZ-PROMPTS-LOCK — runtime loader for the Göz Hastalıkları prompt lock (files in this folder).
 * Same pattern as specialties/dermatoloji/prompts (DERM-PROMPTS-LOCK) and specialties/dahiliye/prompts (DAH-PROMPTS-LOCK):
 * system.md + soap-goz.md + tools.ts go into SOAP generation (lib/doktor/soapUret.ts); system.md + tools.ts go into
 * Dr. Ayşe chat (app/api/asistan/chat/route.ts); a compact lock goes into the voice prompt via /api/doktor/hafiza sesBlogu;
 * asistan-ogrenme.md goes into the style-profile distiller (stilProfiliDamit).
 * Server-only (fs). The .md files are traced into the serverless bundle via next.config outputFileTracingIncludes.
 * Missing files throw: a göz note must never be generated silently without its lock.
 */
import fs from 'fs'
import path from 'path'
import { GOZ_TOOLS } from './tools'
import { receteDozsuz } from '../../../lib/doktor/dozKilidi'

export const GOZ_PROMPT_DOSYALARI = { system: 'system.md', soap: 'soap-goz.md', ogrenme: 'asistan-ogrenme.md' } as const
type Anahtar = keyof typeof GOZ_PROMPT_DOSYALARI

let onbellek: Record<Anahtar, string> | null = null

export function gozPromptlari(): Record<Anahtar, string> {
  if (onbellek) return onbellek
  const dizin = path.join(process.cwd(), 'specialties', 'goz-hastaliklari', 'prompts')
  const sonuc = {} as Record<Anahtar, string>
  for (const k of Object.keys(GOZ_PROMPT_DOSYALARI) as Anahtar[]) {
    const metin = fs.readFileSync(path.join(dizin, GOZ_PROMPT_DOSYALARI[k]), 'utf8').trim()
    if (!metin) throw new Error(`göz prompt boş: ${GOZ_PROMPT_DOSYALARI[k]}`)
    sonuc[k] = metin
  }
  onbellek = sonuc
  return onbellek
}

/** users.specialty / session specialty → göz? "göz"/"goz" as a whole word (not gözlem, gözetim…) or oftalm*. */
export function gozMi(...branslar: (string | null | undefined)[]): boolean {
  return branslar.some((b) => /(^|[^a-zçğıöşü])g[öo]z(?![a-zçğıöşü])|oftalm/.test((b || '').toLocaleLowerCase('tr-TR')))
}

/** tools.ts rendered as a read-only map of steps. Chat has no tool-use loop for these: every write is a hekim action in the UI. */
export function gozAracHaritasi(): string {
  return GOZ_TOOLS.map((t) => `- ${t.name.replace('goz.', '')}: ${t.description}`).join('\n')
}

const ONCELIK = 'Bu kilit, yukarıdaki genel talimatlarla çeliştiğinde ÖNCELİKLİDİR (özellikle: doz yazma — intravitreal dahil; tanı / DR evresi / hedef GİB yalnız hekim kilitler; görüntü okuması tanı değildir, uzman onayı gerekir; VA / GİB uydurma, OD/OS karıştırma; acil bayrakta gecikmesiz 112 / acil).'
const IC_ALAN_NOTU = 'Doktora giden metinde (not alanları, aiDegerlendirme, hasta özeti, sohbet) iç alan veya araç adı yazma (ör. goz_muayeneler, evre_sag, taslak_yazan, sutYanit, goruntu_okuma): "göz muayenesi", "DR evresi", "görüntü okuması taslağı", "uzman onaylı" gibi klinik kelimeyi kullan.'

/** One `## ` section of system.md (heading line excluded). */
function bolum(baslik: string): string {
  const parca = gozPromptlari().system.split(/^## /m).find((b) => b.startsWith(baslik))
  if (!parca) throw new Error(`göz system.md bölümü yok: ${baslik}`)
  return parca.slice(parca.indexOf('\n') + 1).trim()
}

export function gozKilidi(yuzey: 'soap' | 'asistan' | 'ogrenme' | 'ses'): string {
  const p = gozPromptlari()
  if (yuzey === 'ses') {
    // Voice stays short: role + kırılmaz kurallar 1-5 (doz, evre, görüntü, VA/GİB, acil) + SGK in one line.
    const kurallar = bolum('Kırılmaz kurallar').split('\n').filter((l) => /^[1-5]\. /.test(l)).join('\n')
    return `=== GÖZ HASTALIKLARI KİLİDİ (kısa) ===\n${p.system.split(/^## /m)[0].split('\n').slice(1).join(' ').trim()}\nKırılmaz kurallar:\n${kurallar}\nSGK / kılavuz numarası hafızadan söylenmez; muayenehane SGK basamağı değildir.`
  }
  if (yuzey === 'ogrenme') return `\n=== GÖZ HASTALIKLARI ÖĞRENME KİLİDİ ===\n${p.ogrenme}\nKlinik tercihlerde bile doz / enjeksiyon aralığı / evre kalıbı profile yazılmaz; yalnız etken madde / sınıf ve üslup düzeyi.`
  const araclar = `## Göz adımları (uygulamada hekim çalıştırır; sen kendiliğinden çalıştırmaz veya sonucunu uydurmazsın — yalnız ilgili kartı/adımı önerirsin)\n${gozAracHaritasi()}\n${IC_ALAN_NOTU}`
  const soap = yuzey === 'soap' ? `\n\n${p.soap}\nSOAP JSON alanlarına eşleme: S → subjektif, O → objektif, A → degerlendirme, P → plan. Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur; şablonun istediği ama hekimin söylemediği her şey (eksik VA/GİB, dilatasyon, evre, kontrol tarihi, SGK rapor eksiği) aiDegerlendirme alanına gider. receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA (intravitreal dahil).` : ''
  return `\n=== GÖZ HASTALIKLARI SİSTEM KİLİDİ (specialties/goz-hastaliklari/prompts) ===\n${ONCELIK}\n\n${p.system}${soap}\n\n${araclar}\n=== KİLİT SONU ===`
}

/** Locked safety for göz: etken madde / sınıf only — strip model-written doses from reçete önerisi (lib/doktor/dozKilidi). */
export const gozReceteDozsuz = receteDozsuz
