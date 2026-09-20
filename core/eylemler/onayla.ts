/**
 * NOTYA-EYLEM — COMMIT. The only place in the system where an Ayşe-prepared record becomes real.
 *
 * Order is load-bearing:
 *   1. öneri loaded by id AND doctor_id                 → another doctor's taslak does not exist
 *   2. hasta ownership re-checked                       → HASTA-IZOLASYON-01, defence in depth
 *   3. 24h expiry                                       → docs §5, a stale card cannot be tapped
 *   4. GUARDED UPDATE taslak → onaylandi (one statement) → idempotency: a double tap / retried
 *      request loses the race and gets "zaten işlendi" instead of writing the row twice
 *   5. zod re-validation of the values the DOCTOR confirmed (model output is not trusted twice)
 *   6. zorunlu alanlar, makullük, mükerrer                → re-run at commit, not only at proposal:
 *      the world may have changed since the card was drawn, and the doctor may have edited it
 *   6b. ilaç güvenlik uyarıları (NOTYA-EYLEM-21)         → re-run too; a `ciddi` one does not block
 *      the hekim but costs an explicit second tap, and the acknowledgement is written down
 *   7. calistir()                                        → the shared write path
 *   8. eylem_kayitlari                                   → hazırlayan Ayşe, onaylayan hekim
 *   9. hafıza                                            → the approve route's own learning signal
 * If step 7 throws, the guard from step 4 is released back to `taslak` so the doctor can fix the
 * card and try again — a failed write must not consume the proposal.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { eylemBul } from './kayit'
import { veriNormalize, tarihAlanlariGecerliMi } from './sema'
import { hastaOzetiGetir } from './hasta'
import { bugunTRT, type EylemBaglami, type EylemOnerisi, type EylemSonucu } from './types'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { ciddiUyariVarMi, type IlacUyarisi } from './ilacUyari'

/** docs §5 — öneriler expire after 24h. */
export const ONERI_OMRU_MS = 24 * 3600e3

export type OnaySonucu =
  | { ok: true; kayitId: string; sonuc: EylemSonucu; etiket: string; uyarilar: IlacUyarisi[] }
  /** `uyarilar` is set when the refusal IS the warning gate — the card re-renders them and offers
   *  the second tap. Everything else refuses with a sentence only. */
  | { ok: false; durum: number; hata: string; uyarilar?: IlacUyarisi[]; uyariOnayiGerekli?: boolean }

export interface OnayGirdisi {
  supabase: SupabaseClient
  doktorId: string
  oneriId: string
  /** Fields the doctor edited on the card. Only known field keys are honoured. */
  duzeltmeler?: Record<string, unknown>
  brans: import('@/lib/asistan/turkishSpecialtyRefs').SpecialtyKey | null
  mesajId?: string | null
  /**
   * NOTYA-EYLEM-21 — the doctor's explicit second tap on "Uyarıyı gördüm, kaydet". A `ciddi`
   * warning never blocks him; it costs one deliberate acknowledgement, which is recorded.
   */
  uyariGoruldu?: boolean
}

async function oneriYukle(sb: SupabaseClient, doktorId: string, oneriId: string): Promise<EylemOnerisi | null> {
  const { data } = await sb
    .from('eylem_onerileri')
    .select('*')
    .eq('id', oneriId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  return (data as EylemOnerisi | null) ?? null
}

export function suresiDolduMu(o: { created_at: string }, simdi = Date.now()): boolean {
  const t = new Date(o.created_at).getTime()
  return Number.isFinite(t) && simdi - t > ONERI_OMRU_MS
}

export async function eylemOnayla(g: OnayGirdisi): Promise<OnaySonucu> {
  const { supabase: sb, doktorId } = g
  const oneri = await oneriYukle(sb, doktorId, g.oneriId)
  if (!oneri) return { ok: false, durum: 404, hata: 'Öneri bulunamadı.' }
  if (oneri.durum === 'onaylandi') return { ok: false, durum: 409, hata: 'Bu öneri zaten kaydedildi.' }
  if (oneri.durum !== 'taslak') return { ok: false, durum: 409, hata: 'Bu öneri artık geçerli değil.' }

  // HASTA-IZOLASYON-01: the öneri row names a hasta_id; prove it is still this doctor's patient
  // before writing anything with it. A stale row from a transferred/deleted patient fails closed.
  if (!(await hastaSahibiMi(sb, doktorId, oneri.hasta_id))) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }

  if (suresiDolduMu(oneri)) {
    await sb.from('eylem_onerileri').update({ durum: 'suresi_doldu', karar_at: new Date().toISOString() }).eq('id', oneri.id).eq('doctor_id', doktorId).eq('durum', 'taslak')
    return { ok: false, durum: 410, hata: 'Bu öneri 24 saati geçtiği için düştü. Ayşe\'ye tekrar sorun.' }
  }

  const eylem = eylemBul(oneri.eylem_anahtar)
  if (!eylem) return { ok: false, durum: 400, hata: 'Bu eylem artık tanımlı değil.' }

  const hasta = await hastaOzetiGetir(sb, doktorId, oneri.hasta_id)
  if (!hasta) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }

  // Merge the doctor's edits over the proposal, honouring only known field keys.
  const birlesik: Record<string, unknown> = { ...(oneri.veri || {}) }
  for (const a of eylem.alanlar) {
    const d = g.duzeltmeler?.[a.anahtar]
    if (d !== undefined) birlesik[a.anahtar] = d
  }
  const veri = veriNormalize(eylem.alanlar, birlesik)

  const tarihHatasi = tarihAlanlariGecerliMi(eylem.alanlar, veri)
  if (tarihHatasi) return { ok: false, durum: 400, hata: tarihHatasi }

  const dogrulama = eylem.sema.safeParse(veri)
  if (!dogrulama.success) {
    const ilk = dogrulama.error.issues[0]
    const alan = eylem.alanlar.find((a) => a.anahtar === ilk?.path?.[0])
    return { ok: false, durum: 400, hata: `${alan?.etiket || 'Alan'} geçersiz.` }
  }

  const eksik = eylem.zorunlu.filter((k) => veri[k] === undefined || veri[k] === null || veri[k] === '')
  if (eksik.length) {
    const etiketler = eksik.map((k) => eylem.alanlar.find((a) => a.anahtar === k)?.etiket || k)
    return { ok: false, durum: 400, hata: `Şu alanlar boş: ${etiketler.join(', ')}. Doldurup tekrar kaydedin.` }
  }

  const ctx: EylemBaglami = { supabase: sb, doktorId, hasta, brans: g.brans, oneriId: oneri.id, bugunTRT: bugunTRT() }

  const makul = eylem.makullukKontrol?.(ctx, veri as never)
  if (makul) return { ok: false, durum: 400, hata: makul }

  // NOTYA-EYLEM-21: re-run the drug check HERE, not only when the card was drawn. The patient's
  // active med list may have changed since — a card prepared an hour ago is not a statement about
  // now. The model's own note (`ayse_notu`) cannot be recomputed, so it is carried from the taslak.
  let uyarilar: IlacUyarisi[] = []
  if (eylem.uyariKontrol) {
    try {
      uyarilar = await eylem.uyariKontrol(ctx, veri as never)
    } catch (e) {
      console.error('[eylem] onayda uyarı kontrolü çalışmadı', e)
      return { ok: false, durum: 503, hata: 'İlaç güvenlik kontrolü şu an çalıştırılamadı; lütfen tekrar deneyin.' }
    }
    const ayse = (oneri.uyari_detay || []).filter((u) => u.tur === 'ayse_notu')
    uyarilar = [...uyarilar, ...ayse]
    // The hekim is the authority — this does not block, it asks for one deliberate second tap.
    if (ciddiUyariVarMi(uyarilar) && !g.uyariGoruldu) {
      return { ok: false, durum: 409, hata: 'Ciddi bir ilaç uyarısı var. Uyarıyı okuyup "Uyarıyı gördüm, kaydet" ile onaylayın.', uyarilar, uyariOnayiGerekli: true }
    }
  }

  // Idempotency: one guarded statement flips taslak → onaylandi. Two concurrent taps mean exactly
  // one row comes back here; the loser sees "zaten işlendi" and no second write happens.
  const { data: kilit } = await sb
    .from('eylem_onerileri')
    .update({ durum: 'onaylandi', veri, karar_at: new Date().toISOString() })
    .eq('id', oneri.id)
    .eq('doctor_id', doktorId)
    .eq('durum', 'taslak')
    .select('id')
  if (!kilit || kilit.length === 0) return { ok: false, durum: 409, hata: 'Bu öneri zaten işlendi.' }

  const serbestBirak = async () => {
    await sb.from('eylem_onerileri').update({ durum: 'taslak', karar_at: null }).eq('id', oneri.id).eq('doctor_id', doktorId)
  }

  let sonuc: EylemSonucu
  try {
    sonuc = await eylem.calistir(ctx, veri as never)
  } catch (e) {
    await serbestBirak()
    return { ok: false, durum: 400, hata: e instanceof Error ? e.message : 'Kaydedilemedi.' }
  }

  const { data: kayit, error: kayitHatasi } = await sb
    .from('eylem_kayitlari')
    .insert({
      oneri_id: oneri.id,
      doctor_id: doktorId,
      hasta_id: hasta.id,
      eylem_anahtar: eylem.anahtar,
      hedef_tablo: sonuc.hedefTablo,
      hedef_id: sonuc.hedefId,
      once: sonuc.once ?? null,
      sonra: sonuc.sonra,
      kaynak: 'ayse_oneri',
      mesaj_id: g.mesajId ?? null,
      // Denetim: hekim uyarıyı gördü mü, hangi uyarıyı gördü (migration 086).
      uyari_onayi: uyarilar.length
        ? { uyarilar, ciddi: ciddiUyariVarMi(uyarilar), goruldu: Boolean(g.uyariGoruldu), onaylayan: doktorId, at: new Date().toISOString() }
        : null,
    })
    .select('id')
    .single()
  // The clinical write already landed. A missing audit row is a defect worth logging loudly, but
  // failing the request here would tell the doctor "kaydedilmedi" about a record that exists.
  if (kayitHatasi) console.error('[eylem] denetim satırı yazılamadı', kayitHatasi.message)

  return { ok: true, kayitId: String(kayit?.id || ''), sonuc, etiket: eylem.etiket, uyarilar }
}

export async function eylemVazgec(sb: SupabaseClient, doktorId: string, oneriId: string): Promise<boolean> {
  const { data } = await sb
    .from('eylem_onerileri')
    .update({ durum: 'vazgecildi', karar_at: new Date().toISOString() })
    .eq('id', oneriId)
    .eq('doctor_id', doktorId)
    .eq('durum', 'taslak')
    .select('id')
  return Boolean(data && data.length)
}
