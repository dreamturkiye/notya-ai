/**
 * NOTYA-ILETISIM-01 — Ayarlar › İletişim: the doctor's OWN WhatsApp number and email, and where emails open.
 *
 * GET → { whatsapp, eposta, epostaAcilis, kaydedilebilir } pre-filled from the profile (users.whatsapp_number /
 *       users.email) until the doctor saves their own values. Nothing to set up before the first send.
 * PUT { whatsapp?, eposta?, epostaAcilis? } → saves on the doctor's own users row.
 *
 * Doctor only (a secretary never edits the practice's accounts). No patient data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { epostaAdresi, whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import { epostaAcilisMi } from '@/lib/iletisim/tipler'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const a = await doktorIletisimAyari(oturum.supabase, oturum.doktorId)
  return NextResponse.json({ whatsapp: a.whatsapp, eposta: a.eposta, epostaAcilis: a.epostaAcilis, kaydedilebilir: a.kaydedilebilir })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const g: Record<string, string | null> = {}
  if ('whatsapp' in b) {
    const ham = String(b.whatsapp || '').trim()
    if (ham && !whatsappNumarasi(ham)) return NextResponse.json({ error: 'WhatsApp numarası anlaşılamadı. Örnek: 0532 123 45 67' }, { status: 400 })
    g.iletisim_whatsapp = ham || null
  }
  if ('eposta' in b) {
    const ham = String(b.eposta || '').trim()
    if (ham && !epostaAdresi(ham)) return NextResponse.json({ error: 'E-posta adresi anlaşılamadı.' }, { status: 400 })
    g.iletisim_eposta = ham || null
  }
  if ('epostaAcilis' in b) {
    if (!epostaAcilisMi(b.epostaAcilis)) return NextResponse.json({ error: 'Geçersiz seçim.' }, { status: 400 })
    g.iletisim_eposta_acilis = b.epostaAcilis
  }
  if (!Object.keys(g).length) return NextResponse.json({ ok: true })

  const { error } = await oturum.supabase.from('users').update(g).eq('id', oturum.doktorId)
  if (error) return NextResponse.json({ error: 'Ayarlar şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.' }, { status: 503 })
  return NextResponse.json({ ok: true })
}
