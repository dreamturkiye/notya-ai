/**
 * NOTYA-EYLEM — the appointment overlap predicate, in one place.
 *
 * The same interval test (`existing.baslangic < yeni.bitis AND existing.bitis > yeni.baslangic`,
 * ignoring cancelled rows) was written out by hand in the create route and again in the update
 * route. The action layer needs it a third time, and the standing rule for this build is that an
 * action must go through the SAME path the UI form uses rather than open a second one — so the
 * predicate moved here and all three callers use it.
 *
 * Errors are not swallowed: a failed overlap query must not read as "no overlap" and double-book
 * a doctor's morning. `{ hata: true }` makes the caller answer 500, exactly as before.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const CAKISMA_MESAJI = 'Bu saat aralığında zaten bir randevu var. Lütfen başka bir saat seçin.'
export const CAKISMA_KONTROL_HATASI = 'Çakışma kontrolü yapılamadı.'

export interface CakismaSonucu {
  /** Query failed — the caller must answer 500, never treat this as "free". */
  hata: boolean
  cakisiyor: boolean
}

export async function randevuCakismasiVarMi(
  supabase: SupabaseClient,
  doktorId: string,
  baslangic: string,
  bitis: string,
  haricId?: string | null
): Promise<CakismaSonucu> {
  let q = supabase
    .from('randevular')
    .select('id')
    .eq('doktor_id', doktorId)
    .neq('durum', 'iptal')
    .lt('baslangic', bitis)
    .gt('bitis', baslangic)
  if (haricId) q = q.neq('id', haricId)
  const { data, error } = await q.limit(1)
  if (error) return { hata: true, cakisiyor: false }
  return { hata: false, cakisiyor: Boolean(data && data.length > 0) }
}
