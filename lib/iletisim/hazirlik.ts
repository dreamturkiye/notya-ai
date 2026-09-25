/**
 * NOTYA-ILETISIM-01 — server: turn "this patient + this message type (+ appointment / vaccine /
 * queue item)" into recipient, consent and prepared text. Shared by /api/doktor/iletisim/hazirla
 * and the Hazır mesajlar queue so both show exactly the same message.
 *
 * HASTA-IZOLASYON-01: every id arrives from outside. The queue item, appointment and vaccine rows
 * are read with id AND the doctor's column together; the patient is re-checked with the doctor
 * (hastaIletisimi → patients id + doctor_id). A foreign id answers exactly like a missing one.
 * Staff (sekreter) may only prepare PERSONEL_TURLERI — checked before any read.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/pratikOturum'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'
import { ensurePatientPortalUrl } from '@/lib/portal/notifyPatientEmail'
import { mesajHazirla, type HazirMesaj } from './sablonlar'
import { turIzinliMi } from './kuyruk'
import { hastaIletisimi, sonKanal, type HastaIletisimi } from './sunucu'
import { mesajTuruMu, type IletisimKanali, type MesajTuru } from './tipler'

export type HazirlikGirdisi = {
  tur?: unknown
  patientId?: unknown
  randevuId?: unknown
  asiId?: unknown
  kuyrukId?: unknown
  /** bilgi_formu / saglikim_baglanti: the link the page just created */
  link?: unknown
  /** serbest: the doctor's own text */
  metin?: unknown
}

export type Hazirlik = {
  tur: MesajTuru
  hasta: HastaIletisimi
  mesaj: HazirMesaj | null
  sonKanal: IletisimKanali | null
  randevuId: string | null
  asiId: string | null
  kuyrukId: string | null
}

export type HazirlikHatasi = { durum: 400 | 403 | 404; hata: string }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Only our own links go into a message (http/https, no spaces, sane length). */
function guvenliLink(v: unknown): string | null {
  const s = str(v)
  if (!s || s.length > 500 || /\s/.test(s)) return null
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

export async function iletisimHazirla(
  sb: SupabaseClient,
  oturum: { doktorId: string; rol: PratikRol },
  g: HazirlikGirdisi,
  secenek: { doktorAdi: string; doktorBransi: string | null },
): Promise<Hazirlik | HazirlikHatasi> {
  const { doktorId, rol } = oturum
  let tur: MesajTuru | null = mesajTuruMu(g.tur) ? g.tur : null
  let patientId = str(g.patientId)
  let randevuId = str(g.randevuId) || null
  let asiId = str(g.asiId) || null
  const kuyrukId = str(g.kuyrukId) || null

  if (kuyrukId) {
    const { data: k, error } = await sb.from('iletisim_kuyrugu')
      .select('id, patient_id, tur, randevu_id, asi_id')
      .eq('id', kuyrukId).eq('doctor_id', doktorId).maybeSingle()
    if (error || !k || !mesajTuruMu(k.tur)) return { durum: 404, hata: 'Mesaj bulunamadı.' }
    if (!turIzinliMi(rol, k.tur)) return { durum: 404, hata: 'Mesaj bulunamadı.' }
    tur = k.tur
    patientId = String(k.patient_id)
    randevuId = k.randevu_id ? String(k.randevu_id) : null
    asiId = k.asi_id ? String(k.asi_id) : null
  }
  if (!tur) return { durum: 400, hata: 'Mesaj türü geçersiz.' }
  if (!turIzinliMi(rol, tur)) return { durum: 403, hata: 'Bu mesajı yalnızca doktor hazırlayabilir.' }

  let randevuIso: string | null = null
  if (randevuId) {
    const { data: r } = await sb.from('randevular')
      .select('id, patient_id, baslangic').eq('id', randevuId).eq('doktor_id', doktorId).maybeSingle()
    if (!r) return { durum: 404, hata: 'Randevu bulunamadı.' }
    if (!r.patient_id) return { durum: 400, hata: 'Bu randevu bir hasta kaydına bağlı değil. Önce hastayı kaydedin; iletişim izni hasta kaydında tutulur.' }
    if (patientId && patientId !== String(r.patient_id)) return { durum: 404, hata: 'Randevu bulunamadı.' }
    patientId = String(r.patient_id)
    randevuIso = String(r.baslangic)
  }

  let asiTarih: string | null = null
  if (asiId) {
    const { data: a } = await arsivsizAsilar(sb, 'id, patient_id, sonraki_doz_tarihi').eq('id', asiId).eq('doktor_id', doktorId).maybeSingle()
    if (!a) return { durum: 404, hata: 'Aşı kaydı bulunamadı.' }
    if (patientId && patientId !== String(a.patient_id)) return { durum: 404, hata: 'Aşı kaydı bulunamadı.' }
    patientId = String(a.patient_id)
    asiTarih = String(a.sonraki_doz_tarihi || '').slice(0, 10) || null
  }

  if (!patientId) return { durum: 400, hata: 'Hasta seçilmedi.' }
  const hasta = await hastaIletisimi(sb, doktorId, patientId, secenek.doktorBransi)
  if (!hasta) return { durum: 404, hata: 'Hasta bulunamadı.' }

  let link = guvenliLink(g.link)
  if (tur === 'saglikim_yeni_mesaj') link = await ensurePatientPortalUrl(sb, doktorId, patientId)

  const mesaj = mesajHazirla(tur, {
    hastaAdi: hasta.ad,
    veliDili: hasta.veliDili,
    doktorAdi: secenek.doktorAdi,
    randevuIso,
    link,
    tarihIso: asiTarih,
    metin: tur === 'serbest' ? str(g.metin).slice(0, 1500) : null,
  })
  return { tur, hasta, mesaj, sonKanal: await sonKanal(sb, doktorId, patientId), randevuId, asiId, kuyrukId }
}

export function hataMi(x: Hazirlik | HazirlikHatasi): x is HazirlikHatasi {
  return 'hata' in x
}
