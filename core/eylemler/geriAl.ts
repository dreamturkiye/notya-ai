/**
 * NOTYA-EYLEM — undo, within 24h, T1 only (docs §2, §3).
 *
 * T1 is defined as "additive and reversible", so undo is a soft revert through the action's own
 * `geriAl` — the action knows whether reversing means deleting the row it inserted or putting the
 * previous JSON back. T2 is deliberately NOT undoable here: it already showed the doctor an
 * önce → sonra diff before the tap, and a second automatic reversal of a considered edit is more
 * likely to surprise than to help. The doctor edits a T2 on the screen that owns it.
 *
 * Undo is itself logged (`geri_alindi_at`), never silent — the audit must read
 * "prepared by Ayşe, approved by the doctor, undone by the doctor at 14:52", not go blank.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { eylemBul } from './kayit'
import { hastaOzetiGetir } from './hasta'
import { bugunTRT, type EylemBaglami } from './types'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const GERI_AL_PENCERESI_MS = 24 * 3600e3

export type GeriAlSonucu = { ok: true } | { ok: false; durum: number; hata: string }

export async function eylemGeriAl(
  sb: SupabaseClient,
  doktorId: string,
  kayitId: string,
  brans: SpecialtyKey | null
): Promise<GeriAlSonucu> {
  const { data: kayit } = await sb
    .from('eylem_kayitlari')
    .select('*')
    .eq('id', kayitId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!kayit) return { ok: false, durum: 404, hata: 'Kayıt bulunamadı.' }
  if (kayit.geri_alindi_at) return { ok: false, durum: 409, hata: 'Bu kayıt zaten geri alındı.' }

  const yas = Date.now() - new Date(String(kayit.created_at)).getTime()
  if (!Number.isFinite(yas) || yas > GERI_AL_PENCERESI_MS) {
    return { ok: false, durum: 410, hata: 'Geri alma süresi (24 saat) doldu. Kaydı ilgili ekrandan düzenleyin.' }
  }

  // HASTA-IZOLASYON-01: the target row is reached through the patient, so prove the patient first.
  if (!(await hastaSahibiMi(sb, doktorId, String(kayit.hasta_id)))) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }

  const eylem = eylemBul(String(kayit.eylem_anahtar))
  if (!eylem) return { ok: false, durum: 400, hata: 'Bu eylem artık tanımlı değil.' }
  if (eylem.kademe !== 'T1' || !eylem.geriAl) {
    return { ok: false, durum: 400, hata: 'Bu eylem geri alınamaz; ilgili ekrandan düzenleyin.' }
  }

  const hasta = await hastaOzetiGetir(sb, doktorId, String(kayit.hasta_id))
  if (!hasta) return { ok: false, durum: 404, hata: 'Hasta bulunamadı.' }

  // Mark first, in one guarded statement: two taps on "Geri al" must not run the revert twice.
  const { data: kilit } = await sb
    .from('eylem_kayitlari')
    .update({ geri_alindi_at: new Date().toISOString() })
    .eq('id', kayitId)
    .eq('doctor_id', doktorId)
    .is('geri_alindi_at', null)
    .select('id')
  if (!kilit || kilit.length === 0) return { ok: false, durum: 409, hata: 'Bu kayıt zaten geri alındı.' }

  const ctx: EylemBaglami = { supabase: sb, doktorId, hasta, brans, oneriId: String(kayit.oneri_id), bugunTRT: bugunTRT() }
  try {
    await eylem.geriAl(ctx, {
      hedefTablo: String(kayit.hedef_tablo),
      hedefId: String(kayit.hedef_id),
      once: (kayit.once as Record<string, unknown> | null) ?? null,
      sonra: (kayit.sonra as Record<string, unknown> | null) ?? null,
    })
  } catch (e) {
    await sb.from('eylem_kayitlari').update({ geri_alindi_at: null }).eq('id', kayitId).eq('doctor_id', doktorId)
    return { ok: false, durum: 400, hata: e instanceof Error ? e.message : 'Geri alınamadı.' }
  }
  return { ok: true }
}
