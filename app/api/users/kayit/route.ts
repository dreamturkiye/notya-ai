import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { adSoyadTemiz, kayitBransiNorm } from '@/lib/doktor/kayitBrans'

export const dynamic = 'force-dynamic'

/**
 * Hesap açılır açılmaz ad ve branşı yazar. users.specialty ve onboarding_completed
 * dokunulmaz — sihirbaz unvan, klinik ve hitabı sormaya devam eder.
 * signup_specialty sütunu henüz yoksa (göç uygulanmadıysa) ad yine yazılır;
 * branş auth metadata'da durur.
 */
export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const ad = adSoyadTemiz(String(body.full_name || meta.full_name || ''))
  const brans = kayitBransiNorm(String(body.signup_specialty || meta.signup_specialty || ''))
  if (!ad || !brans) {
    return NextResponse.json({ error: 'Ad soyad ve branş gerekli.' }, { status: 400 })
  }

  const oncekiOnay = meta.kvkk_onay === true || meta.kvkk_onay === 'true'
  const kvkkTarih = typeof meta.kvkk_onay_tarihi === 'string' ? meta.kvkk_onay_tarihi : new Date().toISOString()
  const kvkkVersiyon = typeof meta.kvkk_metin_versiyonu === 'string' ? meta.kvkk_metin_versiyonu : null

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      full_name: ad,
      signup_specialty: brans,
    },
  })

  const { data: kayit } = await supabase
    .from('users')
    .select('id, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (kayit?.onboarding_completed === true) {
    return NextResponse.json({ success: true, already: true })
  }

  const satir: Record<string, unknown> = {
    full_name: ad,
    signup_specialty: brans,
    onboarding_completed: false,
    profession_type: null,
    kvkk_consent_at: oncekiOnay ? kvkkTarih : null,
    kvkk_consent_version: kvkkVersiyon,
    updated_at: new Date().toISOString(),
  }

  let yazildi = false
  for (let deneme = 0; deneme < 5; deneme++) {
    const sonuc = kayit
      ? await supabase.from('users').update(satir).eq('id', user.id)
      : await supabase.from('users').insert({ id: user.id, email: user.email || '', ...satir })
    if (!sonuc.error) {
      yazildi = true
      break
    }
    // Yalnız henüz eklenmemiş sütunları düşür. NOT NULL ihlalinde sütunu silmek
    // varsayılan profession_type='doktor' yazdırır ve sihirbazı atlatır.
    const mesaj = sonuc.error.message || ''
    const eksik = mesaj.match(/could not find the '([^']+)' column/i)?.[1]
    if (eksik && eksik !== 'full_name' && Object.prototype.hasOwnProperty.call(satir, eksik)) {
      delete satir[eksik]
      continue
    }
    break
  }

  return NextResponse.json({ success: true, profil: yazildi })
}
