/**
 * NOTYA-RANDEVU-V2 PR3 — "kontrol randevusu" proposal at note approval, through the EXISTING follow-up flow:
 * the approved plan says "2 hafta sonra kontrol" → Ayşe prepares a `kontrol_randevusu_olustur` card (taslak in
 * eylem_onerileri) with the date filled from the doctor's own sentence and the hour left empty (never guessed).
 * The doctor sees it in the patient's pending-cards tray and confirms with a tap — nothing is booked here.
 * Only while the doctor's 'Hasta Portalı Randevu' is ON; skipped when the patient already has an upcoming
 * appointment or an open kontrol card.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { planIfadeleriniCikar } from '@/lib/doktor/planIfadesi'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import { oneriHazirla } from '@/core/eylemler/oneri'
import { bugunTRT } from '@/core/eylemler/types'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { randevuV2Acik } from './ozellik'
import { gunEkle } from './zaman'

const SAYI: Record<string, number> = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10 }

/** "2 hafta sonra kontrol" / "kontrol: bir ay sonra" → the TRT date (from `bugun`) and the sentence. Pure. */
export function kontrolTarihi(plan: string | null | undefined, bugun: string): { tarih: string; cumle: string } | null {
  for (const p of planIfadeleriniCikar(plan)) {
    if (p.konu !== 'kontrol') continue
    const m = trAramaNormalize(p.cumle).match(/\b(\d{1,3}|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on) (gun|hafta|ay) sonra\b/)
    if (!m) continue
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : SAYI[m[1]]
    if (!n || n > 400) continue
    const gun = m[2] === 'hafta' ? n * 7 : m[2] === 'ay' ? n * 30 : n
    return { tarih: gunEkle(bugun, gun), cumle: p.cumle }
  }
  return null
}

export async function kontrolOnerisiHazirla(
  sb: SupabaseClient,
  g: { doktorId: string; patientId: string; notId: string; plan: string | null | undefined; brans: string | null | undefined },
): Promise<string | null> {
  try {
    if (!(await randevuV2Acik(sb, g.doktorId))) return null
    const bugun = bugunTRT()
    const k = kontrolTarihi(g.plan, bugun)
    if (!k) return null
    const [{ data: gelecek }, { data: acikKart }] = await Promise.all([
      sb.from('randevular').select('id').eq('doktor_id', g.doktorId).eq('patient_id', g.patientId)
        .not('durum', 'in', '("iptal","gelmedi","tamamlandi")').gt('baslangic', new Date().toISOString()).limit(1),
      sb.from('eylem_onerileri').select('id').eq('doctor_id', g.doktorId).eq('hasta_id', g.patientId)
        .eq('eylem_anahtar', 'kontrol_randevusu_olustur').eq('durum', 'taslak').limit(1),
    ])
    if (gelecek?.length || acikKart?.length) return null
    const hasta = await hastaOzetiGetir(sb, g.doktorId, g.patientId)
    if (!hasta) return null
    const brans = bransAnahtari(g.brans)
    const o = await oneriHazirla({
      ctx: { supabase: sb, doktorId: g.doktorId, hasta, brans, oneriId: '', bugun, saatDilimi: 'Europe/Istanbul' },
      anahtar: 'kontrol_randevusu_olustur',
      girdi: {
        tarih: k.tarih,
        tur: 'kontrol',
        alan_kaynaklari: {
          tarih: { kaynak: 'dosyadan', notId: g.notId, alinti: k.cumle },
          tur: { kaynak: 'dosyadan', notId: g.notId, alinti: k.cumle },
        },
      },
      yuzey: 'not',
      suzgec: { brans, hasta, randevuV2: true },
    })
    return o?.id ?? null
  } catch {
    return null
  }
}
