/**
 * Sesli Ayşe'nin BİR turu — taşımadan bağımsız çekirdek.
 *
 * İki ağız aynı turu koşar:
 *   - ElevenLabs Custom LLM ucu (lib/asistan/sesLlm.ts, NOTYA-TEK-BEYIN) — cümleleri SSE delta olarak yollar;
 *   - Fish uçtan uca (app/api/asistan/fish-tur, NOTYA-SES-FISH-UCTAN-UCA-01) — cümleleri NDJSON satırı olarak yollar,
 *     tarayıcı onları Fish'e okutur. ElevenLabs'in istek/yanıt biçimi burada yok.
 *
 * Tur kuralları tek yerde: kendi selamı cevaplanmaz; "[devam]" / "devam" kesik turun kalanını modelsiz okur
 * (NOTYA-SES-DEVAM-01); sözlü Evet / Hayır model turu değildir (sesliOnay); aksi halde ayseCevapla (kanal: 'ses').
 * Bitmiş cümle hemen çıkar, yarım cümle tur bitene kadar kapıda bekler (SesYayKapisi). Ses turu sözlü sınırda ya da
 * SES_BEKCI_MS'de kapanır; ekran cevabı arka planda tamamlanır (NOTYA-SES-ERKEN-01).
 * Günlüğe klinik içerik yazılmaz — yalnız hata türü.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { ayseCevapla, type SesDevam } from '@/lib/asistan/ayseCevapla'
import { kendiSelamiMi } from '@/lib/asistan/acilis'
import { DEVAM_ISARETI, devamIstegiMi, dolguSec, SesAkisi } from '@/lib/asistan/konusma'
import { SesYayKapisi, sesEtiketTemizle } from '@/lib/asistan/sesYay'
import { eskiSesTaslaklariniCek, sesliKarariUygula } from '@/lib/asistan/sesliOnay'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { netSosyalMi } from '@/lib/ai/modeller'
import { iptalMi } from '@/lib/ai/cagir'

/** NOTYA-SES-ERKEN-01: the voice turn never runs longer than this; the screen answer is not bound by it. */
export const SES_BEKCI_MS = 22_000

/** Keep a background promise alive after the response closes (Vercel freezes the function otherwise). */
function arkaPlandaSurdur(p: Promise<unknown>): void {
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
    else void p
  } catch { void p /* yerel çalışma: söz zaten sürer */ }
}

const VEDA = /^(?:tamam\s+|peki\s+)?(?:(?:görüşmeyi|konuşmayı|aramayı)\s+(?:bitir|kapat|sonlandır)\w*|hoşça\s*kal\w*|görüşürüz|kapatabilirsin\w*|bitirelim)(?:\s+(?:hocam|ayşe|lütfen))*[.!]?$/i

export function vedaMi(mesaj: string): boolean {
  return VEDA.test(String(mesaj || '').trim().toLocaleLowerCase('tr-TR'))
}

export const VEDA_SOZU = 'Görüşmek üzere Hocam.'

/**
 * NOTYA-SES-DEVAM-01: take the unspoken remainder of the last cut voice turn (and clear it). Doctor-scoped read;
 * null when there is none. Clearing first means a duplicate [devam] cannot read the remainder twice.
 */
export async function sesDevamAl(supabase: SupabaseClient, doktorId: string, oturumId: string): Promise<string | null> {
  const { data } = await supabase.from('asistan_sessions').select('active_context').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
  const baglam = ((data as { active_context?: Record<string, unknown> } | null)?.active_context || null)
  const devam = baglam?.sesDevam as SesDevam | undefined
  if (!baglam || !devam) return null
  const { sesDevam: _alinan, ...kalanBaglam } = baglam
  await supabase.from('asistan_sessions').update({ active_context: kalanBaglam }).eq('id', oturumId).eq('doctor_id', doktorId)
  return typeof devam.kalan === 'string' && devam.kalan.trim() ? devam.kalan : null
}

export interface SesTuruGirdisi {
  /** Lazily created: the no-model branches (veda, kendi selamı) never open a client. */
  supabase: () => SupabaseClient
  doktorId: string
  /** asistan_sessions.id — already scoped to doktorId by the caller. */
  oturumId: string
  specialty: string
  patientId: string | null
  personaId: string | null
  /** The doctor's line (null / empty = nothing to answer). */
  mesaj: string | null
  /** One finished sentence (or the turn's tail) — already through the gate, tags stripped. */
  yay: (t: string) => void
  /** Given → a goodbye line is said and this runs right after it (ElevenLabs end_call / Fish closes the call). */
  veda?: (() => void) | null
  /** NOTYA-SES-FISH-UCTAN-UCA-01: the caller dropped the turn (barge-in). The model stream stops, nothing more is said. */
  iptal?: AbortSignal
}

export async function sesTurunuYurut(g: SesTuruGirdisi): Promise<{ veda: boolean; iptal: boolean }> {
  const mesaj = g.mesaj
  let birakildi = Boolean(g.iptal?.aborted)
  // A finished sentence is sent as soon as it exists. Holding it for a
  // breath, or until this function returns, is the gap before Ayşe speaks.
  const kapi = new SesYayKapisi((t) => { if (!t || birakildi) return; g.yay(t) })
  const yaz = (t: string, hemen = false) => kapi.ekle(t, hemen)
  let cevapSoylendi = false
  // NOTYA-SES-DEVAM-01: what actually reached the speaker before the voice turn closed (the continuation starts after it).
  let turKapandi = false
  let soylenen = ''
  const cevapYaz = (t: string) => {
    const temiz = sesEtiketTemizle(t)
    if (!temiz.trim()) return
    cevapSoylendi = true
    if (!turKapandi) soylenen += temiz
    yaz(temiz)
  }
  /**
   * NOTYA-SES-DEVAM-01: the rest of the cut turn, uncapped, sentence by sentence — no model call, no new screen
   * bubble (the screen already holds the full answer). A hidden [devam] with nothing left (already read, or the
   * doctor moved on) is not a question: nothing is said. A spoken "devam" with nothing left is a normal turn.
   */
  const devamiOku = async (m: string): Promise<boolean> => {
    const kalan = await sesDevamAl(g.supabase(), g.doktorId, g.oturumId).catch(() => null)
    if (!kalan) return m === DEVAM_ISARETI
    const akis = new SesAkisi(cevapYaz, undefined, undefined, Number.POSITIVE_INFINITY)
    akis.ekle(kalan)
    akis.bitir()
    return true
  }
  let veda = false
  try {
    if (mesaj && g.veda && vedaMi(mesaj)) {
      yaz(VEDA_SOZU, true)
      g.veda()
      veda = true
    } else if (mesaj && kendiSelamiMi(mesaj)) {
      // Açılış cümlesi mikrofon (ya da ElevenLabs) tarafından doktora ait sanıldı. Cevap yok.
    } else if (mesaj && devamIstegiMi(mesaj) && (await devamiOku(mesaj))) {
      // okundu (ya da söylenecek bir şey kalmadı)
    } else if (mesaj) {
      yaz(dolguSec(mesaj, { onay: sesOnayMetniGecerliMi(mesaj), vazgec: sesVazgecMetniMi(mesaj), sosyal: netSosyalMi(mesaj) }), true)
      const supabase = g.supabase()
      // Sözlü onay / ret bir model turu değildir: bekleyen kart varsa dokunuşun omurgasından geçer, model çağrılmaz.
      const karar = await sesliKarariUygula(supabase, g.doktorId, g.oturumId, mesaj)
      if (karar) {
        cevapYaz(karar.soz)
        await sesDevamAl(supabase, g.doktorId, g.oturumId).catch(() => null) // yeni gerçek tur: önceki turun kalanı düşer
      } else {
        // NOTYA-SES-ERKEN-01 (Dr. Gökhan, 2026-09-26 — "Bağlantı kurulamadı"): ElevenLabs drops a Custom LLM
        // stream that runs ~30 s (LLM Cascade TimeoutError). Long file answers (özet, aşı, açık işler) take
        // longer than that on the screen. So the VOICE turn ends at the spoken cap or at the guard timer,
        // whichever comes first; the screen answer keeps generating in the background.
        // NOTYA-SES-DEVAM-01: a cut turn is no longer the end of the answer — ayseCevapla stores the unspoken rest
        // and the /asistan page asks for it with a hidden [devam] turn as soon as the screen answer is ready.
        let sesSinirCoz: () => void = () => {}
        let sinirGeldi = false
        const sesSiniri = new Promise<void>((r) => { sesSinirCoz = r })
        const sonucSozu = ayseCevapla({
          supabase, doktorId: g.doktorId, oturumId: g.oturumId, mesaj, kanal: 'ses',
          specialty: g.specialty, patientId: g.patientId, personaId: g.personaId, sozParcasi: cevapYaz,
          sesSiniri: () => { sinirGeldi = true; sesSinirCoz() },
          sesDurumu: () => ({ kesildi: sinirGeldi || turKapandi, soylenen }),
          ...(g.iptal ? { iptal: g.iptal } : {}),
        })
        const sonrasi = sonucSozu.then(async (sonuc) => {
          if (!sonuc.ok) { cevapYaz(sonuc.soz); return }
          if (!cevapSoylendi) cevapYaz(sonuc.cevap.konusma || 'Ekranınıza yazdım Hocam.')
          if (sonuc.cevap.kartlar.length) await eskiSesTaslaklariniCek(supabase, g.doktorId, sonuc.cevap.oncekiBekleyen || [], sonuc.cevap.kartlar, sonuc.cevap.kartHastaId ?? null)
        }).catch((e) => {
          if (iptalMi(e)) return // doktor sözü kesti — hata değil
          console.error('[ses-turu/arka]', e instanceof Error ? e.name : 'hata')
        })
        let bekciZamani: ReturnType<typeof setTimeout> | undefined
        const bekci = new Promise<'bekci'>((r) => { bekciZamani = setTimeout(() => r('bekci'), SES_BEKCI_MS) })
        const birakis = new Promise<'iptal'>((r) => {
          if (!g.iptal) return
          if (g.iptal.aborted) r('iptal')
          else g.iptal.addEventListener('abort', () => r('iptal'), { once: true })
        })
        const kim = await Promise.race([sonrasi.then(() => 'bitti' as const), sesSiniri.then(() => 'sinir' as const), bekci, birakis])
        clearTimeout(bekciZamani)
        if (kim === 'iptal') {
          birakildi = true
          arkaPlandaSurdur(sonrasi)
        } else if (kim !== 'bitti') {
          // Nothing extra at a cut: the pause is the gap before the continuation. Only a turn that said nothing yet
          // gets a holding sentence (the continuation then reads the whole answer).
          // Close the gate BEFORE turKapandi so a sentence still in the breath is sent and counted,
          // and anything the background generates after the cut cannot sneak into this turn.
          if (kim === 'bekci' && !cevapSoylendi) cevapYaz('Dosyayı inceliyorum Hocam, cevabı ekranınıza yazıyorum.')
          kapi.bitir()
          turKapandi = true
          arkaPlandaSurdur(sonrasi)
        }
      }
    }
  } catch (e) {
    console.error('[ses-turu]', e instanceof Error ? e.name : 'hata')
    cevapYaz('Şu an dosyaya ulaşamadım Hocam, bir daha söyler misiniz?')
  }
  if (g.iptal?.aborted) birakildi = true
  // Flush the breath still held in the gate BEFORE the caller closes its stream, including on a cut,
  // so the sentences already counted in `soylenen` actually reach the speaker.
  kapi.bitir()
  return { veda, iptal: birakildi }
}
