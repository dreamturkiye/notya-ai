/**
 * NOTYA-KHD-03 — Kadın sağlığı: KETEM tarama durumu, kontrasepsiyon, menstrüel/menopoz kaydı.
 * GET ?patientId → kayıt + hesaplanmış tarama durumları (yaşa göre). POST → upsert.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { taramaDurumlari, KONTRASEPSIYON_YONTEMLERI, MENOPOZ_DEGERLENDIRME } from '@/lib/clinical/lohusaVeJinekoloji'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'

export const dynamic = 'force-dynamic'

function yasHesapla(dobIso: string | null): number | null {
  if (!dobIso) return null
  const d = new Date(dobIso); if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86_400_000))
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const [{ data: kayit }, { data: hasta }] = await Promise.all([
    supabase.from('kadin_sagligi').select('*').eq('patient_id', patientId).eq('doctor_id', doktorId).maybeSingle(),
    supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
  ])
  let dob: string | null = null
  try { dob = hasta?.dob_encrypted ? decrypt(hasta.dob_encrypted) : null } catch { dob = null }
  const yas = yasHesapla(dob)
  const taramalar = taramaDurumlari(yas, { serviks: kayit?.son_serviks_tarama, meme: kayit?.son_mamografi, kolorektal: kayit?.son_kolorektal })
  return NextResponse.json({ kayit: kayit || null, yas, taramalar, yontemler: KONTRASEPSIYON_YONTEMLERI, menopozBasliklari: MENOPOZ_DEGERLENDIRME })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum); if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const patientId = String(body.patientId || '')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })
  // HASTA-IZOLASYON-01: patientId must be this doctor's own patient before anything is written for it.
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  const t = (k: string) => (body[k] === undefined || body[k] === '' ? null : body[k])
  const { error } = await supabase.from('kadin_sagligi').upsert({
    patient_id: patientId, doctor_id: doktorId,
    son_serviks_tarama: t('sonServiksTarama'), son_serviks_sonuc: t('sonServiksSonuc'),
    son_mamografi: t('sonMamografi'), son_mamografi_sonuc: t('sonMamografiSonuc'), son_kolorektal: t('sonKolorektal'),
    kontrasepsiyon_yontemi: t('kontrasepsiyonYontemi'), kontrasepsiyon_baslangic: t('kontrasepsiyonBaslangic'),
    menarş_yasi: t('menarsYasi'), adet_duzeni: t('adetDuzeni'), son_adet_tarihi: t('sonAdetTarihi'),
    menopoz_durumu: t('menopozDurumu'), menopoz_yasi: t('menopozYasi'), notlar: t('notlar'),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'patient_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
