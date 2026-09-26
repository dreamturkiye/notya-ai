/**
 * NOTYA-FISILTI-UNIVERSAL — every Fısıltı candidate for the signed-in doctor, oldest first.
 * Moved out of app/api/doktor/fisilti/route.ts (NOTYA-FISILTI-GIZLE-01) so the gizle route builds the
 * exact same list: a doctor can only hide an item that is in their own current list.
 *
 * Deliberately reuses each branş's existing, already-correct kohort route via an internal
 * same-origin fetch rather than importing 29 different `_kohort.ts` functions with 29 different
 * signatures -- less code, and zero risk of subtly re-implementing clinical logic wrong.
 *
 * NOTYA-FISILTI-MESAJ (Kaan, 2026-09-24): also reuses the existing /api/doktor/mesajlar?unread=1
 * route the same way, for the same reason -- one more source, zero re-implemented logic. Clinical
 * and message candidates compete on the same "oldest first" rule the kohort engines already use.
 */
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { bransKohortRotasi, FISILTI_DESTEKLI_BRANSLAR, normalizeKohortSatiri, normalizeMesajOgesi, MESAJ_GECIKME_SAAT, type FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

export async function fisiltiOgeleri(req: NextRequest, supabase: SupabaseClient, doktorId: string): Promise<{ ogeler: FisiltiItem[]; bransDestekli: boolean }> {
  const auth = req.headers.get('authorization') || ''

  const { data: profil } = await supabase.from('users').select('specialty').eq('id', doktorId).single()
  const brans = bransAnahtari(String(profil?.specialty || ''))
  const bransDestekli = Boolean(brans) && FISILTI_DESTEKLI_BRANSLAR.has(String(brans))

  // ─── Klinik adayları (branş kohort route'u üzerinden) ────────────────────────────────────
  let klinikOgeleri: FisiltiItem[] = []
  if (bransDestekli && brans) {
    const rota = bransKohortRotasi(brans)
    try {
      const iç = await fetch(new URL(`/api/doktor/${rota}/kohort`, req.url), { headers: { Authorization: auth }, cache: 'no-store' })
      if (iç.ok) {
        const j = await iç.json()
        const satirlar: Record<string, unknown>[] = Array.isArray(j?.satirlar) ? j.satirlar : []
        const { data: sessizler } = await supabase
          .from('fisilti_sessizler')
          .select('patient_id')
          .eq('doctor_id', doktorId)
          .eq('brans', brans)
          .is('kaldirildi_at', null)
        const susturulmus = new Set((sessizler || []).map((s) => String(s.patient_id)))
        klinikOgeleri = satirlar
          .filter((s) => {
            const pid = String(s.patientId || s.patient_id || '')
            return pid && !susturulmus.has(pid)
          })
          .map((s) => normalizeKohortSatiri(s, brans))
          .filter((x): x is FisiltiItem => x !== null)
      }
    } catch {
      // Fısıltı kritik değil -- branş rotası geçici hata verse bile mesaj adayları yine denenir.
    }
  }

  // ─── Mesaj adayları (yanıtı bekleyen, MESAJ_GECIKME_SAAT'ten uzun süredir okunmamış) ─────
  let mesajOgeleri: FisiltiItem[] = []
  try {
    const iç = await fetch(new URL('/api/doktor/mesajlar?unread=1', req.url), { headers: { Authorization: auth }, cache: 'no-store' })
    if (iç.ok) {
      const j = await iç.json()
      const esik = Date.now() - MESAJ_GECIKME_SAAT * 3600_000
      const threads: Array<{ id: string; patientId: string; hastaAdi: string; ozet: string; sonMesajAt: string }> = Array.isArray(j?.threads) ? j.threads : []
      mesajOgeleri = threads
        .filter((t) => new Date(t.sonMesajAt).getTime() <= esik)
        .map((t) => normalizeMesajOgesi(t))
    }
  } catch {
    // Fısıltı kritik değil.
  }

  let kalkanOgeleri: FisiltiItem[] = []
  try {
    const { data, error } = await supabase.from('wa_taslak').select('id, patient_id, metin, emin, ilac_id, eylem, zaman').eq('doctor_id', doktorId).eq('durum', 'bekliyor').order('zaman', { ascending: true })
    if (!error && data?.length) {
      kalkanOgeleri = data.map((t) => ({
        id: `kalkan:${t.id}`,
        brans: brans || '',
        patientId: String(t.patient_id),
        ad: String(t.metin || '').split('\n')[0] || 'Hasta',
        baslik: 'Hekim onayı bekliyor',
        detay: [String(t.metin || '')],
        enErkenTarih: t.zaman ? String(t.zaman) : null,
        hedefYol: `/dashboard/doktor/hastalar/${t.patient_id}`,
        toplamBekleyen: 0,
        kaynak: 'kalkan' as const,
        kalkanTaslakId: String(t.id),
        kalkanOnaylanabilir: Boolean(t.emin) && (String(t.eylem) !== 'ilac_durdur' || Boolean(t.ilac_id)),
      }))
    }
  } catch {
    // Tablo yoksa Kalkan kapalı; diğer fısıltılar durur.
  }

  const ogeler = [...kalkanOgeleri, ...klinikOgeleri, ...mesajOgeleri]
  // En eski gecikme üstte -- klinik motorlarının kendi kuralıyla aynı; tarihi olmayan öğeler en sona düşer.
  ogeler.sort((a, b) => String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')))
  ogeler.sort((a, b) => Number(a.kaynak !== 'kalkan') - Number(b.kaynak !== 'kalkan'))
  return { ogeler, bransDestekli }
}

/** Active (not restored) hides of this doctor. Expiry and facts-hash are decided in fisiltiAyir. */
export async function fisiltiGizlemeleri(supabase: SupabaseClient, doktorId: string) {
  const { data } = await supabase
    .from('fisilti_gizlenen')
    .select('id, patient_id, tur, icerik_ozeti, until, created_at')
    .eq('doctor_id', doktorId)
    .is('kaldirildi_at', null)
    .order('created_at', { ascending: false })
    .limit(2000)
  return (data || []).map((k) => ({ ...k, id: String(k.id), patient_id: String(k.patient_id) }))
}
