/**
 * NOTYA-MUAYENE-KALICI-SIL (Kaan, 2026-09-23) — POST .../sessions/[sessionId]/kalici-sil
 * Tier 2 of the muayene delete capability. Tier 1 (sessions.archived_at, .../arsivle) is soft
 * and reversible; this is the real, irreversible permanent delete. Deliberately only reachable
 * for an ALREADY-ARCHIVED session — the archive step is the safety gate, not a separate check
 * invented here: you must have already hidden it before this offers to destroy it.
 *
 * Deletion order below is NOT guessed -- it was computed by walking the real Postgres FK graph
 * (pg_constraint, the same algorithm scripts/hasta-kalici-sil.mjs uses for a whole doctor) rooted
 * at `sessions`, then hand-reviewed. Tables with `ON DELETE CASCADE` or `SET NULL` are left alone
 * -- Postgres handles those automatically the moment the parent row is deleted. Only the `NO
 * ACTION` edges are handled explicitly here, in dependency order, because Postgres would otherwise
 * refuse the parent delete outright:
 *   belge_analizleri.note_id -> notes            (NO ACTION)
 *   lab_paneller.analiz_id -> belge_analizleri    (NO ACTION -- lab_satirlar CASCADEs from lab_paneller)
 *   gebelik_gorevleri.analiz_id -> belge_analizleri (NO ACTION)
 *   dahiliye_checkup.analiz_id -> belge_analizleri  (NO ACTION)
 *   cihaz_olcumleri.note_id -> notes              (NO ACTION)
 *   jine_vizitler.not_id -> notes                 (NO ACTION)
 *   dahiliye_ht.not_id -> notes                   (NO ACTION)
 * Deliberately NOT touched (SET NULL on delete, left as independent records): medical_documents
 * (loses its visit_id link, the file itself stays), sevkler (a referral is a real event -- loses
 * its note_id link, the referral record stays), hasta_ilaclar / gebelik_izlemleri / mchat_testleri
 * / gelisim_taramalari / lohusa_izlemleri / pedi_taramalar / genetik_taramalar (each just loses
 * its note reference, the underlying clinical record is not destroyed by deleting a muayene note).
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; sessionId: string } }) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const { data: seans } = await supabase
    .from('sessions')
    .select('id, archived_at')
    .eq('id', params.sessionId)
    .eq('doctor_id', user.id)
    .eq('patient_id', params.id)
    .maybeSingle()
  if (!seans) return NextResponse.json({ error: 'Muayene bulunamadı' }, { status: 404 })
  if (!seans.archived_at) return NextResponse.json({ error: 'Önce arşivleyin -- kalıcı silme yalnız arşivlenmiş bir muayene için kullanılabilir.' }, { status: 409 })

  const { data: not } = await supabase.from('notes').select('id').eq('session_id', params.sessionId).eq('doctor_id', user.id).maybeSingle()

  if (not) {
    const { data: analizler } = await supabase.from('belge_analizleri').select('id').eq('note_id', not.id).eq('doctor_id', user.id)
    const analizIds = (analizler || []).map((a) => a.id)
    if (analizIds.length) {
      await supabase.from('lab_paneller').delete().in('analiz_id', analizIds)
      await supabase.from('gebelik_gorevleri').delete().in('analiz_id', analizIds)
      await supabase.from('dahiliye_checkup').delete().in('analiz_id', analizIds)
      const { error: eAnaliz } = await supabase.from('belge_analizleri').delete().in('id', analizIds)
      if (eAnaliz) return NextResponse.json({ error: 'Silinemedi (belge değerlendirmeleri): ' + eAnaliz.message }, { status: 500 })
    }
    const { error: eCihaz } = await supabase.from('cihaz_olcumleri').delete().eq('note_id', not.id)
    if (eCihaz) return NextResponse.json({ error: 'Silinemedi (cihaz ölçümleri): ' + eCihaz.message }, { status: 500 })
    const { error: eJine } = await supabase.from('jine_vizitler').delete().eq('not_id', not.id)
    if (eJine) return NextResponse.json({ error: 'Silinemedi (jinekoloji vizit): ' + eJine.message }, { status: 500 })
    const { error: eDah } = await supabase.from('dahiliye_ht').delete().eq('not_id', not.id)
    if (eDah) return NextResponse.json({ error: 'Silinemedi (dahiliye HT): ' + eDah.message }, { status: 500 })

    const { error: eNot } = await supabase.from('notes').delete().eq('id', not.id).eq('doctor_id', user.id)
    if (eNot) return NextResponse.json({ error: 'Muayene notu silinemedi: ' + eNot.message }, { status: 500 })
  }

  const { error: eSeans } = await supabase.from('sessions').delete().eq('id', params.sessionId).eq('doctor_id', user.id)
  if (eSeans) return NextResponse.json({ error: 'Muayene silinemedi: ' + eSeans.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
