/**
 * NOTYA-FISILTI-UNIVERSAL — GET /api/doktor/fisilti. The one endpoint Fısıltı's UI (and, later,
 * Ayşe's read tool) calls, regardless of the doctor's own branş.
 *
 * Deliberately reuses each branş's existing, already-correct kohort route via an internal
 * same-origin fetch rather than importing 29 different `_kohort.ts` functions with 29 different
 * signatures -- less code, and zero risk of subtly re-implementing clinical logic wrong.
 *
 * NOTYA-FISILTI-MESAJ (Kaan, 2026-09-24): also reuses the existing /api/doktor/mesajlar?unread=1
 * route the same way, for the same reason -- one more source, zero re-implemented logic. Clinical
 * and message candidates compete on the same "oldest first" rule the kohort engines already use;
 * whichever has been pending longer wins the single card shown.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { bransKohortRotasi, FISILTI_DESTEKLI_BRANSLAR, normalizeKohortSatiri, normalizeMesajOgesi, MESAJ_GECIKME_SAAT, type FisiltiItem } from '@/lib/doktor/fisiltiOrtak'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const auth = req.headers.get('authorization') || ''

  const { data: profil } = await supabase.from('users').select('specialty').eq('id', user.id).single()
  const bransHam = String(profil?.specialty || '')
  const brans = bransAnahtari(bransHam)
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
          .eq('doctor_id', user.id)
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

  const tumOgeler = [...klinikOgeleri, ...mesajOgeleri]
  if (!tumOgeler.length) return NextResponse.json({ item: null, toplam: 0, kapsamDisi: !bransDestekli && !mesajOgeleri.length })

  // En eski gecikme üstte -- klinik motorlarının kendi kuralıyla aynı; tarihi olmayan öğeler en sona düşer.
  tumOgeler.sort((a, b) => String(a.enErkenTarih || '9999').localeCompare(String(b.enErkenTarih || '9999')))

  const item = tumOgeler[0]
  item.toplamBekleyen = tumOgeler.length

  return NextResponse.json({ item, toplam: tumOgeler.length })
}
