// app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { bransDegistirebilir } from '@/lib/auth/superuserBranslar'
import { hekimProfilDusur } from '@/lib/doktor/hekimProfilOnbellek'
import { cepTelefonuKolonuYokMu, profilGovdesiDogrula } from '@/lib/onboarding/profilDogrula'
import { kvkkKayitliMi, kvkkMetaDamgasi, kvkkSatirDamgasi } from '@/lib/onboarding/kvkkOnay'

export const dynamic = 'force-dynamic'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } }
)

const OTURUM_YOK = 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'

async function oturum(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user } } = await getSupabase().auth.getUser(authHeader.split(' ')[1])
  if (!user?.id) return null
  return { userId: user.id, userEmail: user.email || null, existingMeta: (user.user_metadata as Record<string, unknown>) || {} }
}

/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding 3. adımının sunucudan öğrendiği iki şey:
 *  • hesabın giriş e-postası (salt okunur gösterilir; değiştirme akışı yok),
 *  • KVKK onay kutusu gösterilmeli mi. Bu kararı SUNUCU verir: kayıtlı rıza yoksa (ne users.kvkk_consent_at
 *    ne metadata kvkk_onay) true. POST aynı kararı kendi başına yeniden verir; bu yanıta güvenmez.
 */
export async function GET(req: NextRequest) {
  try {
    const o = await oturum(req)
    if (!o) return NextResponse.json({ error: OTURUM_YOK }, { status: 401 })
    const { data: kayit } = await getSupabase().from('users').select('kvkk_consent_at').eq('id', o.userId).maybeSingle()
    return NextResponse.json({
      success: true,
      data: { email: o.userEmail || '', kvkk_onay_gerekli: !kvkkKayitliMi(kayit?.kvkk_consent_at, o.existingMeta) },
    })
  } catch (error) {
    console.error('[profile] GET', error)
    return NextResponse.json({ error: 'Hesap bilgileri okunamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const o = await oturum(req)
    if (!o) return NextResponse.json({ error: OTURUM_YOK }, { status: 401 })
    const { userId, userEmail, existingMeta } = o

    const body = await req.json().catch(() => null)
    const { profession_type, unvan, büro_adi, uzmanlik_alani, sehir, full_name,
            gender, addressing_preference, title, specialty, hospital, baro, uzmanlik, yil,
            addressingPreference } = (body && typeof body === 'object' ? body : {}) as Record<string, any>

    const { data: kayit } = await getSupabase().from('users').select('id, specialty, onboarding_completed, kvkk_consent_at').eq('id', userId).maybeSingle()
    const bransYazilabilir = !kayit?.onboarding_completed || bransDegistirebilir(userId)

    // NOTYA-ONBOARDING-01: sunucu tarafı doğrulama. Onboarding'i İLK KEZ bitiren hesapta her alan zorunludur;
    // onboarding'i bitmiş hesabın çağrısında (önceki davranış) yalnız gönderilen alan doğrulanır.
    const dogrulama = profilGovdesiDogrula(body, {
      ilkKayit: !kayit?.onboarding_completed,
      kvkkKayitli: kvkkKayitliMi(kayit?.kvkk_consent_at, existingMeta),
    })
    if (!dogrulama.ok) {
      return NextResponse.json({ error: dogrulama.hata, alan: dogrulama.alan, ...(dogrulama.kod ? { kod: dogrulama.kod } : {}) }, { status: 400 })
    }
    const v = dogrulama.deger
    const simdi = new Date().toISOString()

    // Plan ve deneme süresi istemciden yazılmaz. Deneme yalnız PUT /api/users/trial ile başlar.
    const updatePayload: Record<string, unknown> = {
      updated_at: simdi,
      onboarding_completed: true,
    }
    if (profession_type) updatePayload.profession_type = profession_type
    if (full_name) updatePayload.full_name = full_name
    // users.full_name bugüne kadarki gibi "Ad Soyad" (unvansız) — okuyan her yer (hekimUnvanli, toAddressableUser,
    // avatar baş harfleri) buna göre yazıldı. first_name / last_name / title AYRICA yazılır: onları okuyan
    // yerler (e-reçete, hasta bilgi formu, personel daveti, konsültasyon, iletişim) bugüne kadar boş buluyordu.
    if (v.firstName || v.lastName) updatePayload.full_name = [v.firstName, v.lastName].filter(Boolean).join(' ') || full_name
    if (v.firstName) updatePayload.first_name = v.firstName
    if (v.lastName) updatePayload.last_name = v.lastName
    if (v.title) updatePayload.title = v.title
    if (v.hospital) updatePayload.hospital = v.hospital
    if (v.gender) updatePayload.gender = v.gender
    if (v.addressingPreference) updatePayload.addressing_preference = v.addressingPreference
    if (v.cepTelefonu) updatePayload.cep_telefonu = v.cepTelefonu
    if (v.kvkkDamgala) Object.assign(updatePayload, kvkkSatirDamgasi(simdi))
    if (unvan) updatePayload.unvan = unvan
    if (büro_adi) updatePayload.büro_adi = büro_adi
    if (sehir) updatePayload.sehir = sehir
    if (bransYazilabilir) {
      if (uzmanlik_alani) updatePayload.specialty = uzmanlik_alani
      if (specialty && profession_type === 'doktor') updatePayload.specialty = specialty
      if (specialty && (profession_type === 'klinik-uzman' || profession_type === 'saglik-uzmani' || profession_type === 'mali' || profession_type === 'psikolog')) {
        const { klinikUzmanlikNorm } = await import('@/lib/specialties/klinikDikey')
        updatePayload.specialty = (profession_type === 'klinik-uzman' || profession_type === 'saglik-uzmani' || profession_type === 'psikolog')
          ? klinikUzmanlikNorm(specialty)
          : specialty
      }
      if (uzmanlik && profession_type === 'avukat') updatePayload.specialty = uzmanlik
    }

    const uzmanlikMetin = bransYazilabilir
      ? (specialty || uzmanlik || existingMeta.specialty || null)
      : (kayit?.specialty || existingMeta.specialty || null)

    // Önce users satırı, sonra auth metadata. (Eskiden sıra tersti: satır yazılamazsa metadata hesabı
    // "onboarding bitti" diye işaretlemiş oluyor, hekime bir daha sorulmuyor ve yanıtları kayboluyordu.)
    const existing = kayit
    const yaz = (yuk: Record<string, unknown>) => existing
      ? getSupabase().from('users').update(yuk).eq('id', userId).select().single()
      : getSupabase().from('users').insert({ id: userId, email: userEmail || '', ...yuk }).select().single()

    let telefonKaydedildi: boolean | undefined = 'cep_telefonu' in updatePayload ? true : undefined
    let { data: result, error } = await yaz(updatePayload)
    if (error && 'cep_telefonu' in updatePayload && cepTelefonuKolonuYokMu(error)) {
      // Migration 150 (users.cep_telefonu) henüz uygulanmamış: hekimin diğer yanıtları kaybolmasın.
      // Numaranın kendisi günlüğe yazılmaz.
      console.error('[profile] users.cep_telefonu kolonu yok (migration 150 uygulanmamış) — cep telefonu KAYDEDİLMEDİ, diğer alanlar kaydediliyor', { userId })
      const kalan = { ...updatePayload }
      delete kalan.cep_telefonu
      telefonKaydedildi = false
      ;({ data: result, error } = await yaz(kalan))
    }
    if (error) throw error

    // Always stamp auth metadata so login redirects don't bounce to onboarding again.
    const { error: metaHatasi } = await getSupabase().auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        gender: gender || existingMeta.gender || null,
        addressing_preference:
          addressing_preference ||
          addressingPreference ||
          existingMeta.addressing_preference ||
          null,
        title: title || existingMeta.title || null,
        baro: baro || existingMeta.baro || null,
        yil: yil || existingMeta.yil || null,
        hospital: hospital || existingMeta.hospital || null,
        specialty: uzmanlikMetin,
        profession_type: profession_type || existingMeta.profession_type || null,
        onboarding_completed: true,
        // KVKK: yalnız kayıtlı rıza yokken VE hekim kutuyu işaretlediyse — /kayit'in yazdığı anahtarların aynısı.
        ...(v.kvkkDamgala ? kvkkMetaDamgasi(simdi) : {}),
      },
    })
    if (metaHatasi) console.error('[profile] auth metadata yazılamadı', { userId, hata: metaHatasi.message })

    hekimProfilDusur(userId)
    return NextResponse.json({
      success: true,
      data: { ...result, onboarding_completed: true },
      ...(telefonKaydedildi === undefined ? {} : { telefon_kaydedildi: telefonKaydedildi }),
    })
  } catch (error) {
    console.error('[profile]', error)
    return NextResponse.json({ error: 'Profil kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
