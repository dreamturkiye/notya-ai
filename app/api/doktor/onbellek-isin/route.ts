/**
 * NOTYA-MESLEKTAS-V2 Faz 3 — giriş / hasta sayfası: kirli paketi arka planda derle.
 * İstek yolunda derive yok.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { arkaPlandaSurdur } from '@/lib/doktor/ogrenme/arkaPlandaOgren'
import { onbellekIsin } from '@/lib/doktor/ogrenme/dosyaOnbellek'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const body = await req.json().catch(() => ({})) as { patientId?: string; bugun?: boolean }
  if (body.patientId) {
    if (!(await hastaSahibiMi(supabase, doktorId, body.patientId))) {
      return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
    }
    arkaPlandaSurdur(onbellekIsin(supabase, doktorId, body.patientId).catch(() => 'yok'))
    return NextResponse.json({ ok: true })
  }
  if (body.bugun) {
    const gun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
    arkaPlandaSurdur((async () => {
      const { data } = await supabase
        .from('randevular')
        .select('patient_id')
        .eq('doktor_id', doktorId)
        .gte('baslangic', `${gun}T00:00:00+03:00`)
        .lte('baslangic', `${gun}T23:59:59+03:00`)
        .neq('durum', 'iptal')
        .not('patient_id', 'is', null)
        .limit(20)
      const idler = [...new Set((data || []).map((r) => String((r as { patient_id: string }).patient_id)))]
      for (const id of idler) await onbellekIsin(supabase, doktorId, id).catch(() => 'yok')
      const { data: u } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
      const { soapOnekIsin } = await import('@/lib/doktor/ogrenme/dosyaOnbellek')
      await soapOnekIsin(doktorId, String((u as { specialty?: string } | null)?.specialty || 'dahiliye')).catch(() => { /* ısınma */ })
    })())
  }
  return NextResponse.json({ ok: true })
}
