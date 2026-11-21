/**
 * NOTYA-INTAKE-01 — hasta bilgi formunu doldurma (PUBLIC — token kimlik doğrulamadır, oturum
 * gerektirmez, /davet/personel/[token] ile aynı desen).
 *
 * GET: token doğrula, doldurulacak şemayı (çekirdek + branşa özel sorular) ve karşılama için
 * hasta adını döndür.
 * POST: yanıtları TEK şifreli JSON blob olarak kaydet, durum='dolduruldu'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { coreBolumlerIcin } from '@/lib/intake/coreAlanlar'
import { intakeGorunmeyenYanitlariAyikla, intakeSunucuHataMetni } from '@/lib/intake/dogrula'
import { intakeBransBolumu, intakeBransEtiketi } from '@/lib/intake/formBransi'
import { intakeGelenBelgeIzni, intakeIzinleri } from '@/lib/iletisim/izinMetni'

export const dynamic = 'force-dynamic'

type Sb = ReturnType<typeof servisSupabase>

/** The doctor's display name exactly as the form and its thank-you screen show it. */
async function doktorAdiAl(supabase: Sb, doktorId: string): Promise<string> {
  const { data: doktor } = await supabase.from('users').select('first_name, last_name, title').eq('id', doktorId).maybeSingle()
  return doktor ? [doktor.title, doktor.first_name, doktor.last_name].filter(Boolean).join(' ') : ''
}

/**
 * NOTYA-INTAKE-ALINDI-01 (Kaan, 2026-11-20) — the patient's Sağlığım link, only when a PIN-protected, unexpired portal
 * link already exists for THIS form's doctor AND patient (both columns in the same query — hasta-izolasyon). The PIN
 * still guards the portal; nothing is minted here.
 */
async function portalYoluAl(supabase: Sb, doktorId: string, hastaId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('hasta_portal_tokens')
      .select('token_hash, pin_hash, expires_at')
      .eq('doctor_id', doktorId)
      .eq('patient_id', hastaId)
      .not('pin_hash', 'is', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.token_hash ? `/portal/hasta/${encodeURIComponent(String(data.token_hash))}` : null
  } catch {
    return null
  }
}

/** Practice name + phone for a link that can no longer be used (optional columns; absent = no contact line). */
async function klinikIletisimAl(supabase: Sb, doktorId: string): Promise<{ ad: string; telefon: string } | null> {
  try {
    const { data } = await supabase.from('users').select('clinic_name, iletisim_telefon_muayenehane').eq('id', doktorId).maybeSingle()
    const ad = String(data?.clinic_name || '').trim()
    const telefon = String(data?.iletisim_telefon_muayenehane || '').trim()
    return ad || telefon ? { ad, telefon } : null
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const supabase = servisSupabase()

  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('id, brans, durum, patient_id, token_expires_at, doktor_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!form) return NextResponse.json({ durum: 'gecersiz', error: 'Bu form bağlantısı geçerli değil. Bağlantıyı size gönderen kliniğe danışabilirsiniz.' }, { status: 404 })
  // NOTYA-INTAKE-ALINDI-01: an already-submitted form is a confirmation, not an error (no dead end, no "Form Kullanılamıyor").
  if (form.durum !== 'gonderildi') {
    const [doktorAdi, portalYolu] = await Promise.all([doktorAdiAl(supabase, form.doktor_id), portalYoluAl(supabase, form.doktor_id, form.patient_id)])
    return NextResponse.json({ durum: 'dolduruldu', doktorAdi, portalYolu, error: 'Bu form zaten dolduruldu.' }, { status: 409 })
  }
  if (form.token_expires_at && new Date(form.token_expires_at) < new Date()) {
    const iletisim = await klinikIletisimAl(supabase, form.doktor_id)
    return NextResponse.json({ durum: 'suresi_doldu', iletisim, error: 'Bu form bağlantısının süresi dolmuş. Yeni bir bağlantı için kliniğinizle iletişime geçebilirsiniz.' }, { status: 400 })
  }

  const { data: hasta } = await supabase
    .from('patients')
    .select('name_encrypted')
    .eq('id', form.patient_id)
    .maybeSingle()
  let hastaAdi = ''
  try { if (hasta?.name_encrypted) hastaAdi = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim() } catch { /* leave blank */ }

  const doktorAdi = await doktorAdiAl(supabase, form.doktor_id)

  const bransBolumu = intakeBransBolumu(form.brans)
  const bransEtiket = intakeBransEtiketi(form.brans)

  return NextResponse.json({
    hastaAdi,
    doktorAdi,
    coreBolumler: coreBolumlerIcin(form.brans),
    bransBolumu,
    bransEtiket,
  })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const supabase = servisSupabase()

  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('id, durum, token_expires_at, patient_id, brans, doktor_id')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!form) return NextResponse.json({ error: 'Form bulunamad\u0131.' }, { status: 404 })
  if (form.token_expires_at && new Date(form.token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Bu form linkinin s\u00fcresi dolmu\u015f.' }, { status: 400 })
  }
  if (form.durum !== 'gonderildi') {
    return NextResponse.json({ error: 'Bu form zaten dolduruldu.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const { yanitlar } = body as { yanitlar?: Record<string, unknown> }
  if (!yanitlar || typeof yanitlar !== 'object') {
    return NextResponse.json({ error: 'Yan\u0131tlar zorunludur.' }, { status: 400 })
  }
  if (yanitlar.kvkkOnay !== 'Kabul ediyorum') {
    return NextResponse.json({ error: 'KVKK onay\u0131 olmadan form g\u00f6nderilemez.' }, { status: 400 })
  }

  // Kaan (2026-09-13): istemci dogrulamasi atlanabilir (dogrudan API cagrisi) - zorunlu ve desen
  // kurallari sunucuda da uygulanir. TC kimlik: tam 11 hane.
  // NOTYA-INTAKE-08: kural govdesi lib/intake/dogrula.ts'e tasindi - testler ayni kodu kosuyor.
  const coreBolumler = coreBolumlerIcin(form.brans)
  {
    const hata = intakeSunucuHataMetni(coreBolumler, yanitlar)
    if (hata) return NextResponse.json({ error: hata }, { status: 400 })
  }
  // VELI-YASAL-ONAM: görünmeyen bölümün yanıtı kaydedilmez — erişkin hastanın formunda veli bilgisi kalmaz
  // (istemci doğum tarihini sonradan erişkine çevirse ya da doğrudan API çağrısı veli alanı gönderse bile).
  // Veli ve acil durum kişisi bilgisi de formun geri kalanı gibi tek şifreli blobda (form_data_encrypted).
  const kayitYanitlari = intakeGorunmeyenYanitlariAyikla(coreBolumler, yanitlar)

  const { error } = await supabase
    .from('hasta_intake_formlari')
    .update({
      form_data_encrypted: encrypt(JSON.stringify(kayitYanitlari)),
      durum: 'dolduruldu',
      dolduruldu_at: new Date().toISOString(),
    })
    .eq('id', form.id)

  if (error) return NextResponse.json({ error: 'Form kaydedilemedi.' }, { status: 500 })
  // NOTYA-INTAKE-06 (Kaan 2026-09-10): form cevapları hasta kaydındaki boş alanlara da yazılsın — Özet sekmesi dolsun.
  if (form.patient_id) {
    // NOTYA-FORM-KART-01: scoped by the form row's own doktor_id as well as its patient_id (both NOT NULL, migration 009).
    if (form.doktor_id) {
      try {
        const { intakeYanitlariniHastayaAktar } = await import('@/lib/intake/hastaKaydinaAktar')
        await intakeYanitlariniHastayaAktar(supabase, form.doktor_id, form.patient_id, kayitYanitlari)
      } catch (e) { console.error('[intake→hasta]', e) }
    }
    // NOTYA-ILETISIM-01 / NOTYA-HASTA-ILETISIMI-01: the patient's WhatsApp / e-posta / SMS consent
    // from the three Onay lines (unticked = no) — SMS added 2026-10-16 so every new patient is
    // asked at intake, not only at bulk-send time. Scoped by the form row's own patient_id AND
    // doktor_id; fails soft before migration 095/166.
    if (form.doktor_id) {
      try {
        const izin = intakeIzinleri(kayitYanitlari)
        const simdi = new Date().toISOString()
        const { error: izinHata } = await supabase.from('patients')
          .update({ iletisim_izni_whatsapp: izin.whatsapp, iletisim_izni_eposta: izin.eposta, iletisim_izni_sms: izin.sms, iletisim_izni_guncelleme: simdi, iletisim_izni_guncelleyen: null })
          .eq('id', form.patient_id).eq('doctor_id', form.doktor_id)
        if (!izinHata) {
          await supabase.from('iletisim_izin_kayitlari').insert((['whatsapp', 'eposta', 'sms'] as const).map((kanal) => ({
            doctor_id: form.doktor_id, patient_id: form.patient_id, kanal, izin: izin[kanal], kaynak: 'bilgi_formu',
            kaydeden_user_id: null, kaydeden_personel_id: null,
          })))
        }
      } catch (e) { console.error('[intake→iletişim izni]', e) }
      // NOTYA-GELEN-BELGELER: "Gönderdiğiniz belgeler, fotoğraflar ve sesli mesajlar dosyanıza eklenebilir." — separate
      // write so that before migration 099 the contact consents above still land.
      try {
        const izin = intakeGelenBelgeIzni(kayitYanitlari)
        const { error: gbHata } = await supabase.from('patients')
          .update({ gelen_belge_izni: izin, gelen_belge_izni_guncelleme: new Date().toISOString(), gelen_belge_izni_guncelleyen: null })
          .eq('id', form.patient_id).eq('doctor_id', form.doktor_id)
        if (!gbHata) {
          await supabase.from('iletisim_izin_kayitlari').insert({
            doctor_id: form.doktor_id, patient_id: form.patient_id, kanal: 'gelen_belge', izin, kaynak: 'bilgi_formu',
            kaydeden_user_id: null, kaydeden_personel_id: null,
          })
        }
      } catch (e) { console.error('[intake→gelen belge izni]', e) }
    }
  }
  return NextResponse.json({ basarili: true })
}
