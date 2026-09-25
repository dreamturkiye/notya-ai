/**
 * NOTYA-ILETISIM-01 — contact log (iletisim_kayitlari).
 *
 * GET  ?patientId=…  → that patient's last contacts (hasta profili); without patientId → the practice's last 50
 *                      (Hatırlatma tool). A secretary sees appointment types only.
 * POST { patientId, kanal, tur, kuyrukId?, randevuId? } → "opened in WhatsApp / mail" (durum acildi) → { id }.
 *      Refused unless the patient consented to that channel (lib/iletisim/izin.ts) — enforced here, not only in the UI.
 * PATCH { id?, patientId, tur, kuyrukId?, randevuId?, asiId? } → "Gönderildi mi? Evet": log → gonderildi, the queue item
 *      → gonderildi, and the source row is marked reminded (randevular / asilar .hatirlatma_gonderildi) so the same
 *      reminder is not prepared twice.
 *
 * The sender is logged: gonderen_user_id = who is logged in, gonderen_personel_id = the secretary's personel row.
 * Fails soft before migration 095 (no log, 200 with kaydedildi: false) — the message itself was already opened.
 * HASTA-IZOLASYON-01: patient via hastaSahibiMi; every row id together with doctor_id; side-effect rows with
 * doktor_id AND the same patient_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'
import { gonderilebilirMi } from '@/lib/iletisim/izin'
import { PERSONEL_TURLERI, turIzinliMi } from '@/lib/iletisim/kuyruk'
import { hastaAdiCoz, hastaIletisimi, tabloYokMu } from '@/lib/iletisim/sunucu'
import { kanalMi, mesajTuruMu } from '@/lib/iletisim/tipler'

export const dynamic = 'force-dynamic'

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (patientId && !(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  let q = supabase.from('iletisim_kayitlari')
    .select('id, patient_id, kanal, tur, durum, gonderen_personel_id, created_at')
    .eq('doctor_id', doktorId)
  if (patientId) q = q.eq('patient_id', patientId)
  if (rol !== 'doktor') q = q.in('tur', [...PERSONEL_TURLERI])
  const { data, error } = await q.order('created_at', { ascending: false }).limit(patientId ? 10 : 50)
  if (error) return NextResponse.json({ kayitlar: [], hazir: !tabloYokMu(error) })

  const ids = Array.from(new Set((data || []).map((r) => String(r.patient_id))))
  const personelIds = Array.from(new Set((data || []).map((r) => r.gonderen_personel_id).filter(Boolean).map(String)))
  const [{ data: hastalar }, { data: personel }] = await Promise.all([
    ids.length ? supabase.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', ids) : Promise.resolve({ data: [] as Array<{ id: string; name_encrypted: string }> }),
    personelIds.length ? supabase.from('personel').select('id, ad_soyad').eq('doktor_id', doktorId).in('id', personelIds) : Promise.resolve({ data: [] as Array<{ id: string; ad_soyad: string }> }),
  ])
  const ad = new Map((hastalar || []).map((p) => [String(p.id), hastaAdiCoz(p.name_encrypted)]))
  const personelAdi = new Map((personel || []).map((p) => [String(p.id), String(p.ad_soyad || '')]))
  const kayitlar = (data || [])
    // a row whose patient is not (or no longer) this doctor's is never resolved or shown
    .filter((r) => ad.has(String(r.patient_id)))
    .map((r) => ({
      id: String(r.id),
      patientId: String(r.patient_id),
      hastaAdi: ad.get(String(r.patient_id)) || 'Hasta',
      kanal: r.kanal,
      tur: r.tur,
      durum: r.durum,
      gonderen: r.gonderen_personel_id ? personelAdi.get(String(r.gonderen_personel_id)) || 'Sekreter' : 'Doktor',
      tarih: r.created_at,
    }))
  return NextResponse.json({ kayitlar, hazir: true })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user, personelId } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const patientId = str(b?.patientId)
  const kanal = b?.kanal
  const tur = b?.tur
  if (!patientId || !kanalMi(kanal) || !mesajTuruMu(tur)) return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 })
  if (!turIzinliMi(rol, tur)) return NextResponse.json({ error: 'Bu mesajı yalnızca doktor gönderebilir.' }, { status: 403 })

  const hasta = await hastaIletisimi(supabase, doktorId, patientId)
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  if (!gonderilebilirMi(hasta, kanal)) return NextResponse.json({ error: 'Hasta iletişim izni vermedi.' }, { status: 409 })

  const kuyrukId = str(b?.kuyrukId) || null
  if (kuyrukId) {
    const { data: k } = await supabase.from('iletisim_kuyrugu').select('id, tur').eq('id', kuyrukId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (!k || !mesajTuruMu(k.tur) || !turIzinliMi(rol, k.tur)) return NextResponse.json({ error: 'Mesaj bulunamadı.' }, { status: 404 })
  }
  const randevuId = str(b?.randevuId) || null
  if (randevuId) {
    const { data: r } = await supabase.from('randevular').select('id').eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (!r) return NextResponse.json({ error: 'Randevu bulunamadı.' }, { status: 404 })
  }

  const { data, error } = await supabase.from('iletisim_kayitlari').insert({
    doctor_id: doktorId,
    patient_id: patientId,
    kanal,
    tur,
    durum: 'acildi',
    gonderen_user_id: user.id,
    gonderen_personel_id: rol === 'sekreter' ? personelId ?? null : null,
    kuyruk_id: kuyrukId,
    randevu_id: randevuId,
  }).select('id').single()
  if (error || !data) return NextResponse.json({ id: null, kaydedildi: false })
  return NextResponse.json({ id: String(data.id), kaydedildi: true })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user, personelId } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const patientId = str(b?.patientId)
  const tur = b?.tur
  if (!patientId || !mesajTuruMu(tur)) return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 })
  if (!turIzinliMi(rol, tur)) return NextResponse.json({ error: 'Bu mesajı yalnızca doktor gönderebilir.' }, { status: 403 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const simdi = new Date().toISOString()

  const id = str(b?.id)
  let kayitGuncellendi = false
  if (id) {
    let q = supabase.from('iletisim_kayitlari').update({ durum: 'gonderildi', updated_at: simdi })
      .eq('id', id).eq('doctor_id', doktorId).eq('patient_id', patientId)
    if (rol !== 'doktor') q = q.in('tur', [...PERSONEL_TURLERI])
    const { data } = await q.select('id')
    kayitGuncellendi = !!data?.length
  }

  let kuyrukGuncellendi = false
  let asiId = str(b?.asiId) || null
  let randevuId = str(b?.randevuId) || null
  const kuyrukId = str(b?.kuyrukId)
  if (kuyrukId) {
    const { data: k } = await supabase.from('iletisim_kuyrugu').select('id, tur, asi_id, randevu_id')
      .eq('id', kuyrukId).eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    if (k && mesajTuruMu(k.tur) && turIzinliMi(rol, k.tur)) {
      const { data } = await supabase.from('iletisim_kuyrugu')
        .update({ durum: 'gonderildi', updated_at: simdi, isleyen_user_id: user.id, isleyen_personel_id: rol === 'sekreter' ? personelId ?? null : null })
        .eq('id', kuyrukId).eq('doctor_id', doktorId).select('id')
      kuyrukGuncellendi = !!data?.length
      asiId = asiId || (k.asi_id ? String(k.asi_id) : null)
      randevuId = randevuId || (k.randevu_id ? String(k.randevu_id) : null)
    }
  }

  // Source row: "reminded" — same flags the existing Sağlığım / cron paths set.
  if (tur === 'randevu_hatirlatma' && randevuId) {
    await supabase.from('randevular').update({ hatirlatma_gonderildi: true }).eq('id', randevuId).eq('doktor_id', doktorId).eq('patient_id', patientId)
  }
  if (tur === 'asi_hatirlatma' && asiId && rol === 'doktor') {
    const { data: a } = await arsivsizAsilar(supabase, 'id, patient_id').eq('id', asiId).eq('doktor_id', doktorId).maybeSingle()
    if (a && String(a.patient_id) === patientId) {
      await supabase.from('asilar').update({ hatirlatma_gonderildi: true }).eq('id', asiId).eq('doktor_id', doktorId).eq('patient_id', patientId)
    }
  }
  return NextResponse.json({ ok: true, kayitGuncellendi, kuyrukGuncellendi })
}
