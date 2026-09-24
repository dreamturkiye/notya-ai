/**
 * NOTYA-EYLEM — model tool_use → `eylem_onerileri` row (a taslak, never a record).
 *
 * THE structural safety property of this file (docs §2): **an explicit `tahmin` value is never
 * stored as a value.** The field is emptied and listed in `eksik_alanlar`, so the card shows it
 * blank-yellow and the doctor types it. Dr. Gökhan's "tahminen Eylül 2026" class of error cannot
 * survive a tap, because there is nothing to tap past — the save button refuses while a required
 * field is empty.
 *
 * Missing alan_kaynaklari is softer: keep the value, mark `belirsiz`, warn on the card. Models
 * often forget the nested object; wiping Hep B name+date made an empty yellow form look like Ayşe
 * did nothing.
 *
 * hasta_id is resolved SERVER-SIDE by the caller and passed in. Nothing here reads a patient identity
 * out of model output; the chat route pseudonymises, so model output could not carry a real one anyway.
 */
import { randomUUID } from 'node:crypto'
import { eylemBul } from './kayit'
import { eylemUygunMu, type AracSuzgeci } from './araclar'
import { veriNormalize, tarihAlanlariGecerliMi } from './sema'
import { ayseNotuUyarisi, type IlacUyarisi } from './ilacUyari'
import type { AlanKaynagi, AlanKaynakKaydi, AlanTanimi, EylemBaglami, Yuzey } from './types'

export interface OneriGirdisi {
  ctx: EylemBaglami
  /** Tool name from the model. Unknown / T3 / not-gated-for-this-doctor → null, silently. */
  anahtar: string
  /** Raw tool input from the model, including `alan_kaynaklari`. */
  girdi: Record<string, unknown>
  yuzey: Yuzey
  /** Set when several cards belong to one batch ("epikrizdeki her şeyi işle"). */
  grupId?: string | null
  /** Chat message the tool_use came from, for the audit trail. */
  mesajId?: string | null
  /**
   * NOTYA-EYLEM-21 — the model's own safety sentence for this turn (`proactiveWarning`). Carried
   * onto the card labelled "Ayşe'nin notu", never as a deterministic verdict.
   */
  modelNotu?: string | null
  suzgec: AracSuzgeci
}

export interface HazirOneri {
  id: string
  eylem_anahtar: string
  etiket: string
  kademe: 'T1' | 'T2'
  veri: Record<string, unknown>
  alan_kaynaklari: Record<string, AlanKaynakKaydi>
  eksik_alanlar: string[]
  uyarilar: string[]
  uyari_detay: IlacUyarisi[]
  portalaYansir: boolean
  grup_id: string | null
  /** Field metadata + required keys travel WITH the proposal so the card is a pure renderer —
   *  the client never keeps its own copy of the labels that could drift from the schema. */
  alanlar: readonly AlanTanimi[]
  zorunlu: readonly string[]
  /** NOTYA-EYLEM-STALE-01 (Kaan, 2026-09-24): so the card can show how long ago this was proposed. */
  created_at?: string
}

const GECERLI_KAYNAK = new Set<AlanKaynagi>(['doktor_soyledi', 'dosyadan', 'tahmin'])

export function kaynaklariCoz(ham: unknown): Record<string, AlanKaynakKaydi> {
  const out: Record<string, AlanKaynakKaydi> = {}
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return out
  for (const [alan, deger] of Object.entries(ham as Record<string, unknown>)) {
    if (!deger || typeof deger !== 'object') continue
    const d = deger as Record<string, unknown>
    const k = String(d.kaynak || '') as AlanKaynagi
    if (!GECERLI_KAYNAK.has(k)) continue
    out[alan] = {
      kaynak: k,
      alinti: typeof d.alinti === 'string' ? d.alinti.slice(0, 400) : null,
      belgeId: typeof d.belgeId === 'string' ? d.belgeId : null,
      notId: typeof d.notId === 'string' ? d.notId : null,
    }
  }
  return out
}

/**
 * Drop only explicit `tahmin` values. Missing kaynak → keep value + mark `belirsiz` (card warns).
 * Mutates `kaynaklar` when stamping belirsiz so the stored öneri carries the flag for the card.
 */
export function tahminleriAyikla(
  veri: Record<string, unknown>,
  kaynaklar: Record<string, AlanKaynakKaydi>
): { veri: Record<string, unknown>; dusen: string[]; belirsiz: string[] } {
  const temiz: Record<string, unknown> = {}
  const dusen: string[] = []
  const belirsiz: string[] = []
  for (const [alan, deger] of Object.entries(veri)) {
    const k = kaynaklar[alan]?.kaynak
    if (k === 'doktor_soyledi' || k === 'dosyadan') temiz[alan] = deger
    else if (k === 'tahmin') dusen.push(alan)
    else {
      temiz[alan] = deger
      belirsiz.push(alan)
      kaynaklar[alan] = {
        kaynak: 'belirsiz',
        alinti: kaynaklar[alan]?.alinti ?? null,
        belgeId: kaynaklar[alan]?.belgeId ?? null,
        notId: kaynaklar[alan]?.notId ?? null,
      }
    }
  }
  return { veri: temiz, dusen, belirsiz }
}

/**
 * Doctor asked Ayşe to prepare a dosya write — Turkish is informal and varied.
 * "sen yazıver" is the canonical ask; Gökhan also said "rica ediyorum … giriş benim
 * sorumluluğumda" and got the old "yapamam" refusal when only the narrow verbs matched.
 * Still a PROPOSAL only: tool_choice forces the card; the tap is the commit.
 */
export function kayitNiyetiMi(metin: string): boolean {
  return /kaydet|yaz[ıi]ver|dosyaya\s*(gir|yaz|ekle)|kayda\s*(ge[çc]|al|ge[çc]ir)|sen\s+(yaz|gir|ekle|hazırla|yap)|geçir|sorumlulu[gğ]umda|rica\s+ediyorum|giriş\s+(benim|hekimin)|aşıy[ıi]\s*(gir|yaz|ekle|kaydet)|hazırla\.?\s*$/i.test(
    String(metin || '')
  )
}

export async function oneriHazirla(g: OneriGirdisi): Promise<HazirOneri | null> {
  const eylem = eylemBul(g.anahtar)
  if (!eylem) return null
  if (!eylemUygunMu(eylem, g.suzgec)) return null

  const kaynaklar = kaynaklariCoz(g.girdi.alan_kaynaklari)
  const alanAnahtarlari = new Set(eylem.alanlar.map((a) => a.anahtar))
  const ham: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(g.girdi)) if (alanAnahtarlari.has(k)) ham[k] = v

  const { veri: kaynakli, dusen, belirsiz } = tahminleriAyikla(ham, kaynaklar)
  const veri = veriNormalize(eylem.alanlar, kaynakli)

  // A date that came back malformed is worth no more than a guess.
  const tarihHatasi = tarihAlanlariGecerliMi(eylem.alanlar, veri)
  if (tarihHatasi) {
    for (const a of eylem.alanlar) if (a.tip === 'tarih') { delete veri[a.anahtar]; if (!dusen.includes(a.anahtar)) dusen.push(a.anahtar) }
  }

  const eksik = [
    ...eylem.zorunlu.filter((a) => veri[a] === undefined || veri[a] === null || veri[a] === ''),
    ...dusen.filter((a) => eylem.zorunlu.includes(a) === false && alanAnahtarlari.has(a)),
  ]

  const uyarilar: string[] = []
  const makul = eylem.makullukKontrol?.(g.ctx, veri as never)
  if (makul) uyarilar.push(makul)
  // Soft: past next-dose is a catch-up reality for neonates — warn on the card, never hard-fail commit.
  if (eylem.anahtar === 'asi_kaydi_ekle') {
    const sonraki = veri.sonraki_doz_tarihi
    if (sonraki && String(sonraki) < g.ctx.bugunTRT) {
      uyarilar.push(`Sonraki doz tarihi (${sonraki}) geçmişte — kontrol edin.`)
    }
  }
  for (const a of belirsiz) {
    const etiket = eylem.alanlar.find((x) => x.anahtar === a)?.etiket || a
    uyarilar.push(`${etiket}: kaynak belirtilmedi — kontrol edin.`)
  }
  try {
    const mukerrer = await eylem.mukerrerKontrol?.(g.ctx, veri as never)
    if (mukerrer) uyarilar.push(mukerrer)
  } catch { /* a duplicate check that fails must not swallow the proposal — the commit re-runs it */ }

  // NOTYA-EYLEM-21: drug safety, on the card, before the tap. Deterministic — it reads the table and
  // the patient's own records, never hafıza and never the model's opinion (that goes in as a
  // separate, labelled `ayse_notu` and is never `ciddi`).
  const uyariDetay: IlacUyarisi[] = []
  if (eylem.uyariKontrol) {
    try {
      uyariDetay.push(...(await eylem.uyariKontrol(g.ctx, veri as never)))
    } catch (e) {
      // A check that cannot run must SAY so — silence would read as "no interaction".
      console.error('[eylem] uyarı kontrolü çalışmadı', e)
      uyariDetay.push({ tur: 'kapsam_disi', siddet: 'bilgi', baslik: 'Uyarı kontrolü yapılamadı', metin: 'İlaç güvenlik kontrolü bu kart için çalıştırılamadı; kaydetmeden önce elle değerlendirin.', kaynak: 'Notya' })
    }
    const ayse = ayseNotuUyarisi(g.modelNotu)
    if (ayse) uyariDetay.push(ayse)
  }

  const { data, error } = await g.ctx.supabase
    .from('eylem_onerileri')
    .insert({
      doctor_id: g.ctx.doktorId,
      hasta_id: g.ctx.hasta.id,
      eylem_anahtar: eylem.anahtar,
      veri,
      alan_kaynaklari: kaynaklar,
      eksik_alanlar: [...new Set(eksik)],
      kademe: eylem.kademe,
      durum: 'taslak',
      uyari_detay: uyariDetay,
      grup_id: g.grupId || null,
      yuzey: g.yuzey,
      uyarilar,
      mesaj_id: g.mesajId || null,
    })
    .select('id, created_at')
    .single()
  if (error || !data) return null

  return {
    id: String(data.id),
    eylem_anahtar: eylem.anahtar,
    etiket: eylem.etiket,
    kademe: eylem.kademe,
    veri,
    alan_kaynaklari: kaynaklar,
    eksik_alanlar: [...new Set(eksik)],
    uyarilar,
    uyari_detay: uyariDetay,
    portalaYansir: Boolean(eylem.portalaYansir),
    grup_id: g.grupId || null,
    alanlar: eylem.alanlar,
    zorunlu: eylem.zorunlu,
    created_at: data.created_at ? String(data.created_at) : undefined,
  }
}

/**
 * Model yanıtındaki tool_use blokları → taslak öneriler. HİÇBİR ŞEY YAZILMAZ.
 *
 * Shared by every surface (Danış, yazılı sohbet, not içi kutu, ses) so the "a tool call is a
 * proposal" rule has exactly one implementation. Several tool calls in one turn are ONE batch
 * card (docs §4 P2), which is why they get a shared grup_id.
 *
 * No tool_result round-trip is sent back to the model: the card IS the result. A second call would
 * only let Ayşe narrate an outcome she must not claim until the doctor has tapped.
 */
export async function toolUseOnerileri(
  yanit: { content?: unknown },
  ctx: EylemBaglami,
  yuzey: Yuzey,
  suzgec: AracSuzgeci,
  modelNotu?: string | null
): Promise<HazirOneri[]> {
  const bloklar = (Array.isArray(yanit?.content) ? yanit.content : []) as { type?: string; name?: string; input?: unknown; id?: string }[]
  const kullanimlar = bloklar.filter((b) => b?.type === 'tool_use')
  if (!kullanimlar.length) return []
  const grupId = kullanimlar.length > 1 ? randomUUID() : null
  const cikti: HazirOneri[] = []
  for (const k of kullanimlar) {
    const o = await oneriHazirla({
      ctx,
      anahtar: String(k.name || ''),
      girdi: (k.input && typeof k.input === 'object' ? k.input : {}) as Record<string, unknown>,
      yuzey,
      grupId,
      mesajId: k.id || null,
      modelNotu,
      suzgec,
    })
    if (o) cikti.push(o)
  }
  return cikti
}
