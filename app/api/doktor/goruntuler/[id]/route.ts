/**
 * Tek çalışma: detay + aynı tip+bölge son 3 prior + paylaşım.
 * HASTA-IZOLASYON: satır id VE doctor_id aynı sorguda.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { portaldaGorunurMu, type GoruntuOnay } from '@/lib/doktor/goruntuCalisma'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const { data: row } = await supabase
    .from('goruntu_calisma')
    .select('id, patient_id, tip, modalite, bolge, tarih, kaynak, belge_id, calisma_id, dicom_var, asistan_analiz_id, onay_durum, seans_id, hekim_yorum, hastane_link, created_at')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: 'Görüntü bulunamadı.' }, { status: 404 })

  let priorQ = supabase
    .from('goruntu_calisma')
    .select('id, tip, bolge, tarih, belge_id, created_at')
    .eq('doctor_id', user.id)
    .eq('patient_id', row.patient_id)
    .eq('tip', row.tip)
    .neq('id', row.id)
    .order('tarih', { ascending: false, nullsFirst: false })
    .limit(3)
  priorQ = row.bolge ? priorQ.eq('bolge', row.bolge) : priorQ.is('bolge', null)
  const { data: ayni } = await priorQ

  const { data: seriler } = await supabase
    .from('goruntu_calisma')
    .select('id, belge_id, bolge, created_at')
    .eq('doctor_id', user.id)
    .eq('calisma_id', row.calisma_id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    calisma: row,
    oncekiler: ayni || [],
    seri: seriler || [],
    urlTtlSn: 15 * 60,
  })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const body = await req.json().catch(() => null) as {
    onay_durum?: GoruntuOnay
    hekim_yorum?: string
    asistan_analiz_id?: string | null
    bolge?: string
  } | null
  if (!body) return NextResponse.json({ error: 'Gövde gerekli' }, { status: 400 })

  const { data: row } = await supabase
    .from('goruntu_calisma')
    .select('id, tip, modalite, onay_durum, hekim_yorum')
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: 'Görüntü bulunamadı.' }, { status: 404 })

  const guncelle: Record<string, unknown> = {}
  if (body.hekim_yorum !== undefined) guncelle.hekim_yorum = String(body.hekim_yorum || '').slice(0, 2000)
  if (body.asistan_analiz_id !== undefined) guncelle.asistan_analiz_id = body.asistan_analiz_id
  if (body.bolge !== undefined) guncelle.bolge = String(body.bolge || '').slice(0, 80) || null
  if (body.onay_durum) {
    if (body.onay_durum === 'hasta_paylas') {
      const aday = { ...row, onay_durum: 'hasta_paylas', hekim_yorum: body.hekim_yorum ?? row.hekim_yorum }
      if (!portaldaGorunurMu(aday)) {
        return NextResponse.json({
          error: row.tip === 'mg'
            ? 'Mamografiyi paylaşmadan önce hekim yorumu gerekli.'
            : row.tip === 'goz'
              ? 'Portala yalnız onaylı fundus karesi gider — ham OCT/AI yok.'
              : 'Paylaşım için hekim onayı gerekli.',
        }, { status: 400 })
      }
    }
    guncelle.onay_durum = body.onay_durum
  }
  if (!Object.keys(guncelle).length) return NextResponse.json({ error: 'Değişiklik yok' }, { status: 400 })

  const { data, error } = await supabase
    .from('goruntu_calisma')
    .update(guncelle)
    .eq('id', row.id)
    .eq('doctor_id', user.id)
    .select('id, onay_durum, hekim_yorum, asistan_analiz_id')
    .single()
  if (error) return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  return NextResponse.json({ calisma: data })
}
