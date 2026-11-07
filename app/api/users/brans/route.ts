/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — POST /api/users/brans: the "Branşınızı seçin" step of the doctor application
 * (components/doktor/BransSecimKapisi.tsx). An account that has no branch the app can read — an older account, one
 * that left onboarding through "Diğer", one that went from /kayit straight into Stripe Checkout, one made through the
 * auth service's public sign-up without the form — records its branch here, once, before it may use the app.
 *
 *   Body: { specialty: '<one of the 40 canonical keys>' }
 *   200 { success: true, specialty }
 *   400 { error, alan: 'specialty' }   missing, or not one of the 40 keys (lib/onboarding/kayitBransi.ts)
 *   401                                 no session
 *   409 { error }                       a branch is already on record — this is not a branch switch (the two
 *                                       verified superusers keep /api/users/superuser-brans for that)
 *
 * Writes only the caller's own users row (id = the authenticated account) and its auth metadata — the same two places
 * /api/users/superuser-brans writes. Nothing is guessed: the value is exactly what the doctor chose. No id is read
 * from the request; no other account's data is touched.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hekimProfilDusur } from '@/lib/doktor/hekimProfilOnbellek'
import { bransDegistirebilir } from '@/lib/auth/superuserBranslar'
import { KAYIT_BRANS_MESAJ, kayitBransiMi } from '@/lib/onboarding/kayitBransi'
import { bransSecimiGerekli, etkinBrans } from '@/lib/onboarding/bransKapisi'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const govde = (await req.json().catch(() => null)) as { specialty?: unknown } | null
  const ham = govde && typeof govde === 'object' ? govde.specialty : undefined
  if (typeof ham !== 'string' || !ham.trim()) return NextResponse.json({ error: KAYIT_BRANS_MESAJ.gerekli, alan: 'specialty' }, { status: 400 })
  if (!kayitBransiMi(ham)) return NextResponse.json({ error: KAYIT_BRANS_MESAJ.gecersiz, alan: 'specialty' }, { status: 400 })

  try {
    const meta = (user.user_metadata || {}) as Record<string, unknown>
    const { data: satir, error: okumaHatasi } = await supabase.from('users').select('id, specialty, profession_type').eq('id', user.id).maybeSingle()
    if (okumaHatasi) throw okumaHatasi
    const gerekli = bransSecimiGerekli({
      specialty: etkinBrans(satir?.specialty, meta.specialty),
      profession_type: satir?.profession_type || meta.profession_type,
      personel: meta.personel === true,
    })
    if (!gerekli && !bransDegistirebilir(user.id)) return NextResponse.json({ error: KAYIT_BRANS_MESAJ.zatenKayitli }, { status: 409 })

    const simdi = new Date().toISOString()
    const { error: yazmaHatasi } = satir
      ? await supabase.from('users').update({ specialty: ham, updated_at: simdi }).eq('id', user.id)
      : await supabase.from('users').insert({ id: user.id, email: user.email || '', specialty: ham, updated_at: simdi })
    if (yazmaHatasi) throw yazmaHatasi
    hekimProfilDusur(user.id)

    const { error: metaHatasi } = await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...meta, specialty: ham } })
    if (metaHatasi) console.error('[users/brans] auth metadata could not be written', { userId: user.id, hata: metaHatasi.message })

    return NextResponse.json({ success: true, specialty: ham })
  } catch (e) {
    console.error('[users/brans]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Branş kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
