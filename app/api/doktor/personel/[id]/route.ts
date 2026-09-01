/** NOTYA-RANDEVU-01 — tekil personel: aktif/pasif yap, sil. Doktor hesabından erişilir. */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({}))
  const { aktif } = body as { aktif?: boolean }
  if (typeof aktif !== 'boolean') return NextResponse.json({ error: 'aktif alanı zorunludur.' }, { status: 400 })

  const { data, error } = await supabase
    .from('personel')
    .update({ aktif })
    .eq('id', params.id)
    .eq('doktor_id', doktorId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Personel güncellenemedi.' }, { status: 500 })
  return NextResponse.json({ personel: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const { error } = await supabase.from('personel').delete().eq('id', params.id).eq('doktor_id', doktorId)
  if (error) return NextResponse.json({ error: 'Personel silinemedi.' }, { status: 500 })
  return NextResponse.json({ silindi: true })
}
