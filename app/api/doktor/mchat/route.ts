/**
 * NOTYA-MCHAT-01 — M-CHAT-R/F kayıt + deterministik puanlama.
 * GET: hastanın geçmiş uygulamaları. POST: yeni uygulama kaydeder, puanlar, isteğe bağlı
 * olarak bugünkü muayene formuna sonucu ekler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { mchatPuanla, MCHAT_R_SORULARI } from '@/lib/clinical/mchatR'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data, error } = await supabase
    .from('mchat_testleri').select('id, toplam_puan, risk_seviyesi, sonuc_metni, created_at')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ testler: data || [] })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({})) as { patientId?: string; cevaplar?: Record<string, boolean>; muayeneFormunaEkle?: boolean }
  const { patientId, cevaplar, muayeneFormunaEkle } = body
  if (!patientId || !cevaplar) return NextResponse.json({ error: 'patientId ve cevaplar zorunludur.' }, { status: 400 })

  const eksik = MCHAT_R_SORULARI.filter((s) => cevaplar[String(s.no)] === undefined)
  if (eksik.length) return NextResponse.json({ error: `${eksik.length} soru yanıtlanmamış.` }, { status: 400 })

  const cevaplarNo: Record<number, boolean> = {}
  for (const s of MCHAT_R_SORULARI) cevaplarNo[s.no] = !!cevaplar[String(s.no)]
  const sonuc = mchatPuanla(cevaplarNo)

  const { data: kayit, error } = await supabase.from('mchat_testleri').insert({
    patient_id: patientId, doctor_id: doktorId, cevaplar: cevaplarNo,
    toplam_puan: sonuc.toplamPuan, risk_seviyesi: sonuc.riskSeviyesi, sonuc_metni: sonuc.sonucMetni,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let notEkleme = null
  if (muayeneFormunaEkle) {
    const satir = `M-CHAT-R/F otizm tarama testi uygulandı: ${sonuc.toplamPuan}/20 puan (${sonuc.riskEtiket}) — ${sonuc.sonucMetni}.`
    notEkleme = await gununNotunaEkle(supabase, doktorId, patientId, satir)
    if (notEkleme.notId) {
      await supabase.from('mchat_testleri').update({ not_id: notEkleme.notId }).eq('id', kayit.id).then(() => {}, () => {})
    }
  }

  return NextResponse.json({ testId: kayit.id, ...sonuc, notEkleme })
}
