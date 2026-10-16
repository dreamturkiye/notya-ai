/**
 * NOTYA-ASI-ONAM-01 — Sağlığım › Aşı Onamı (Pediatri only — lib/asi/onam/asiOnamBransKapisi.ts).
 *
 * GET  → the pending remote request (if any) with its content snapshot, built fresh from the
 *        live reference dataset (lib/asi/onam/asiOnamIcerigi.ts) — not yet frozen, since nothing
 *        has been confirmed. Also the patient's past consent records (read-only).
 * POST → the parent (or the patient themself, if ≥18) confirms or declines. This is the ONE
 *        moment the immutable record is written for a remote consent: the content shown here is
 *        frozen into icerik_anlik_goruntu at this instant, exactly as the doctor's screen would
 *        freeze it in clinic.
 *
 * Isolation: resolvePortalToken fixes BOTH doctor and patient from the PIN-unlocked token — never
 * trust a patientId/doctorId from the request body (same convention as randevu/route.ts).
 * Branş gate: a token whose doctor is not Pediatri gets 404 here, same as any other
 * Pediatri-only module would if it were reachable by URL guess.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { asiOnamBransUygunMu } from '@/lib/asi/onam/asiOnamBransKapisi'
import { asiOnamIstegiHazirla, asiOnamOnayEdenGecerliMi, type AsiOnamOnayEden } from '@/lib/asi/onam/asiOnamMotoru'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

async function oturum(req: NextRequest, token: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { hata: NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 }) }
  }
  const sb = servisSupabase()
  const tok = await resolvePortalToken(sb, token)
  if (!tok) return { hata: NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 }) }
  const kilit = requirePortalUnlock(req, token, tok)
  if (kilit) return { hata: kilit }
  const doktorId = String(tok.doctor_id)
  const patientId = String(tok.patient_id)
  const brans = bransAnahtari(await hekimBransi(sb, doktorId))
  if (!asiOnamBransUygunMu(brans)) {
    return { hata: NextResponse.json({ error: 'Bu bölüm bulunamadı.' }, { status: 404 }) }
  }
  return { sb, doktorId, patientId }
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const o = await oturum(req, params.token)
  if ('hata' in o) return o.hata
  const { sb, doktorId, patientId } = o

  const [talepQ, kayitlarQ] = await Promise.all([
    sb.from('asi_onam_talepleri').select('*').eq('doktor_id', doktorId).eq('patient_id', patientId).eq('durum', 'gonderildi').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('asi_onam_kayitlari').select('id, asilar, yontem, durum, created_at').eq('doktor_id', doktorId).eq('patient_id', patientId).order('created_at', { ascending: false }),
  ])
  const talep = talepQ.data || null
  let icerikOnizleme = null
  if (talep) {
    const istek = asiOnamIstegiHazirla(talep.asilar, talep.dil || 'tr')
    icerikOnizleme = istek.ok ? istek.icerikAnlikGoruntu : null
  }
  return NextResponse.json({ talep, icerikOnizleme, kayitlar: kayitlarQ.data || [] })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const o = await oturum(req, params.token)
  if ('hata' in o) return o.hata
  const { sb, doktorId, patientId } = o

  const body = await req.json().catch(() => ({}))
  const { talepId, durum, onayEden } = body as { talepId?: string; durum?: string; onayEden?: unknown }
  if (!talepId) return NextResponse.json({ error: 'talepId zorunludur.' }, { status: 400 })
  if (!asiOnamOnayEdenGecerliMi(onayEden)) {
    return NextResponse.json({ error: 'Onayı veren kişinin adı zorunludur (veli/yasal temsilci veya hastanın kendisi).' }, { status: 400 })
  }
  const onay = onayEden as AsiOnamOnayEden

  const { data: talep } = await sb.from('asi_onam_talepleri').select('*').eq('id', talepId).eq('doktor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  if (!talep) return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 })
  if (talep.durum !== 'gonderildi') return NextResponse.json({ error: 'Bu talep zaten yanıtlanmış.' }, { status: 409 })

  const istek = asiOnamIstegiHazirla(talep.asilar, talep.dil || 'tr')
  if (!istek.ok) return NextResponse.json({ error: istek.hata }, { status: 400 })
  const durumGecerli = durum === 'reddedildi' ? 'reddedildi' : 'alindi'

  const yontem = talep.bildirim_kanali === 'eposta' ? 'uzaktan-eposta' : talep.bildirim_kanali === 'whatsapp' ? 'uzaktan-whatsapp' : 'uzaktan-portal'

  const { data: hasta } = await sb.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  let dogumTarihi: string | null = null
  try { dogumTarihi = hasta?.dob_encrypted ? decrypt(String(hasta.dob_encrypted)) : null } catch { dogumTarihi = null }

  const { data: kayit, error } = await sb
    .from('asi_onam_kayitlari')
    .insert({
      doktor_id: doktorId,
      patient_id: patientId,
      session_id: talep.session_id,
      randevu_id: talep.randevu_id,
      talep_id: talep.id,
      asilar: istek.asilar,
      icerik_anlik_goruntu: istek.icerikAnlikGoruntu,
      dil: talep.dil || 'tr',
      yontem,
      durum: durumGecerli,
      onay_eden_adi: onay.ad.trim(),
      onay_eden_yakinlik: onay.yakinlik?.trim() || null,
      onay_eden_telefon: onay.telefon?.trim() || null,
      hasta_dogum_tarihi_anlik: dogumTarihi,
      // NOTYA-ASI-ONAM-01: a remote consent has no doctor/secretary "recorder" — the parent IS the
      // actor. created_by still needs a value (NOT NULL); the token's own doctor is used, matching
      // how the doctor remains accountable for the request that was sent.
      created_by: doktorId,
    })
    .select()
    .single()
  if (error || !kayit) return NextResponse.json({ error: 'Onam kaydı oluşturulamadı.' }, { status: 500 })

  await sb.from('asi_onam_talepleri').update({ durum: 'tamamlandi', onam_kaydi_id: kayit.id, completed_at: new Date().toISOString() }).eq('id', talep.id)

  return NextResponse.json({ kayit })
}
