/**
 * NOTYA-ASI-ONAM-01 — fallback flow: a parent signs the printable paper form instead of the
 * digital one. This route uploads the scan/photo of the SIGNED paper and writes the immutable
 * consent record in the same request, so a scan is never left floating without the record that
 * explains what it is (and vice versa).
 *
 * Reuses the existing private patient-document storage bucket (`hasta-belgeler`, already used by
 * app/api/doktor/belgeler/ingest/route.ts) and its ownership pattern — no new bucket, no AI
 * analysis of the scan (unlike belgeler/ingest: this is a signed legal document, not a lab result
 * to summarize).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { decrypt } from '@/lib/security/encryption'
import { asiOnamIstegiHazirla, asiOnamOnayEdenGecerliMi, type AsiOnamOnayEden } from '@/lib/asi/onam/asiOnamMotoru'
import { VARSAYILAN_ONAM_DILI } from '@/lib/asi/onam/dil'

export const dynamic = 'force-dynamic'

const KAGIT_IZINLI_TIPLER = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const KAGIT_AZAMI_BAYT = 20 * 1024 * 1024

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  if (oturum.rol !== 'doktor') return NextResponse.json({ error: 'Bu işlem yalnız hekim tarafından yapılabilir.' }, { status: 403 })
  const { supabase, doktorId, user } = oturum

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Geçersiz form.' }, { status: 400 })

  const file = form.get('file') as File | null
  const patientId = String(form.get('patientId') || '')
  const sessionId = String(form.get('sessionId') || '') || null
  const durum = String(form.get('durum') || '') === 'reddedildi' ? 'reddedildi' : 'alindi'
  const onayEdenAdi = String(form.get('onayEdenAdi') || '').trim()
  const onayEdenYakinlik = String(form.get('onayEdenYakinlik') || '').trim() || null
  const onayEdenTelefon = String(form.get('onayEdenTelefon') || '').trim() || null
  let asilar: unknown = []
  // NOTYA-ASI-NOT-01: this form-field key is named asiAdlari (not "asilar") on purpose — the
  // arsiv.test.ts guard's regex flags any literal `('asilar'` call as a possible raw read of the
  // asilar DB TABLE; this is a multipart form field holding the chosen vaccine NAMES, unrelated.
  try { asilar = JSON.parse(String(form.get('asiAdlari') || '[]')) } catch { asilar = [] }

  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  if (sessionId) {
    const seans = await seansSahibi(supabase, doktorId, sessionId)
    if (!seans) return NextResponse.json({ error: 'Muayene bulunamadı.' }, { status: 404 })
    if (seans.patient_id && seans.patient_id !== patientId) return NextResponse.json({ error: 'Muayene bu hastaya ait değil.' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: 'İmzalı kağıt formun taraması/fotoğrafı zorunludur.' }, { status: 400 })
  if (!KAGIT_IZINLI_TIPLER.has(file.type)) return NextResponse.json({ error: 'Desteklenmeyen dosya türü — yalnız fotoğraf veya PDF.' }, { status: 400 })
  if (file.size > KAGIT_AZAMI_BAYT) return NextResponse.json({ error: `Dosya ${Math.round(KAGIT_AZAMI_BAYT / 1024 / 1024)} MB sınırını aşıyor.` }, { status: 400 })
  const onayEden: AsiOnamOnayEden = { ad: onayEdenAdi, yakinlik: onayEdenYakinlik, telefon: onayEdenTelefon }
  if (!asiOnamOnayEdenGecerliMi(onayEden)) return NextResponse.json({ error: 'Onayı veren kişinin adı zorunludur.' }, { status: 400 })

  const istek = asiOnamIstegiHazirla(asilar, VARSAYILAN_ONAM_DILI)
  if (!istek.ok) return NextResponse.json({ error: istek.hata }, { status: 400 })

  const ext = (file.name || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (file.type === 'application/pdf' ? 'pdf' : 'jpg')
  const yol = `${doktorId}/${patientId}/asi-onam/${Date.now()}.${ext}`
  const { error: yuklemeHata } = await supabase.storage.from('hasta-belgeler').upload(yol, Buffer.from(await file.arrayBuffer()), { contentType: file.type })
  if (yuklemeHata) return NextResponse.json({ error: 'Dosya yüklenemedi.' }, { status: 500 })
  const kagitDosyaUrl = `hasta-belgeler/${yol}`

  const { data: hasta } = await supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  let dogumTarihi: string | null = null
  try { dogumTarihi = hasta?.dob_encrypted ? decrypt(String(hasta.dob_encrypted)) : null } catch { dogumTarihi = null }

  const { data, error } = await supabase
    .from('asi_onam_kayitlari')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      session_id: sessionId,
      asilar: istek.asilar,
      icerik_anlik_goruntu: istek.icerikAnlikGoruntu,
      dil: VARSAYILAN_ONAM_DILI,
      yontem: 'kagit',
      durum,
      onay_eden_adi: onayEden.ad.trim(),
      onay_eden_yakinlik: onayEden.yakinlik,
      onay_eden_telefon: onayEden.telefon,
      hasta_dogum_tarihi_anlik: dogumTarihi,
      kagit_dosya_url: kagitDosyaUrl,
      created_by: user.id,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: 'Onam kaydı oluşturulamadı.' }, { status: 500 })
  return NextResponse.json({ kayit: data })
}
