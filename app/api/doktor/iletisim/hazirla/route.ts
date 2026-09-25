/**
 * NOTYA-ILETISIM-01 — POST: prepare one patient message for the send button (GonderDugmesi).
 *
 * Body: { tur, patientId? , randevuId?, asiId?, kuyrukId?, link?, metin? }
 * → { hasta: { ad, telefon, eposta, izinWhatsapp, izinEposta, izinKaydedilebilir }, mesaj: { konu, metin } | null,
 *     sonKanal, epostaAcilis }
 *
 * Nothing is sent here: the browser opens the sender's own WhatsApp / mail with the prepared text.
 * With kuyrukId (NOTYA-ILETISIM-04): opening a queue item claims it for people, so the automatic sender never
 * sends it too; if the automatic sender got there first the answer is 410 "Bu mesaj kendiliğinden gönderildi."
 * and the flow moves on.
 * Doctor and secretary (pratikOturum); a secretary only for appointment types (PERSONEL_TURLERI), checked
 * on the server. Every id is ownership-checked in lib/iletisim/hazirlik.ts (HASTA-IZOLASYON-01).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { iletisimHazirla, hataMi } from '@/lib/iletisim/hazirlik'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { elleSahiplen } from '@/lib/iletisim/otomatikGonderim'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })

  const ayar = await doktorIletisimAyari(supabase, doktorId)
  const h = await iletisimHazirla(supabase, { doktorId, rol }, body, { doktorAdi: ayar.doktorAdi, doktorBransi: ayar.brans })
  if (hataMi(h)) return NextResponse.json({ error: h.hata }, { status: h.durum })
  // Only after the ownership / staff checks above: the queue item is this caller's to open.
  if (h.kuyrukId && (await elleSahiplen(supabase, doktorId, h.kuyrukId)) === 'otomatik') {
    return NextResponse.json({ error: 'Bu mesaj kendiliğinden gönderildi.', kendiliginden: true }, { status: 410 })
  }

  return NextResponse.json({
    tur: h.tur,
    hasta: {
      id: h.hasta.id,
      ad: h.hasta.ad,
      telefon: h.hasta.telefon,
      eposta: h.hasta.eposta,
      izinWhatsapp: h.hasta.izinWhatsapp,
      izinEposta: h.hasta.izinEposta,
      izinKaydedilebilir: h.hasta.izinKaydedilebilir,
    },
    mesaj: h.mesaj,
    sonKanal: h.sonKanal,
    randevuId: h.randevuId,
    asiId: h.asiId,
    kuyrukId: h.kuyrukId,
    epostaAcilis: ayar.epostaAcilis,
  })
}
