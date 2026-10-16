/**
 * NOTYA-HASTA-ILETISIMI-01 — the one send action. UNIVERSAL (doktor + personel, pratikOturum, no
 * sadeceDoktor). Requires an explicit `onay: true` from the body — never triggered implicitly; the
 * compose screen only sends this after the human has seen the preview and pressed confirm.
 *
 * POST { filtre, kanal, konu?, govde, sablonAnahtari?, idempotencyKey, tetikleyici?, asiStokLotId?, onay }
 * → { kampanyaId, hedefSayisi, sonuclar, smsManuelListesi? }
 *
 * Idempotent end-to-end: the same idempotencyKey resent (network retry, double submit) returns the
 * same campaign and does not message anyone a second time (lib/iletisim/toplu/kampanya.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { kampanyaOlustur, kampanyaGonder, smsManuelListesi, KampanyaHatasi } from '@/lib/iletisim/toplu/kampanya'
import type { KampanyaOlusturGirdisi } from '@/lib/iletisim/toplu/tipler'

export const dynamic = 'force-dynamic'

type Govde = Omit<KampanyaOlusturGirdisi, 'filtre'> & { filtre?: KampanyaOlusturGirdisi['filtre']; onay?: boolean }

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, user, rol, personelId } = oturum

  const body = (await req.json().catch(() => null)) as Govde | null
  if (!body) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (body.onay !== true) {
    return NextResponse.json({ error: 'Gönderim için onay gereklidir — önce önizlemeyi kontrol edin.' }, { status: 400 })
  }
  if (!body.kanal || !['sms', 'eposta', 'ikisi'].includes(body.kanal)) {
    return NextResponse.json({ error: 'Geçersiz kanal.' }, { status: 400 })
  }

  try {
    const { kampanyaId } = await kampanyaOlustur(supabase, doktorId, { userId: user.id, personelId: personelId || null, rol }, {
      filtre: body.filtre || {},
      kanal: body.kanal,
      konu: body.konu || null,
      govde: body.govde,
      sablonAnahtari: body.sablonAnahtari || null,
      tetikleyici: body.tetikleyici || 'manuel',
      asiStokLotId: body.asiStokLotId || null,
      idempotencyKey: body.idempotencyKey,
    })
    const sonuc = await kampanyaGonder(supabase, doktorId, kampanyaId)

    let manuelListe: { ad: string; telefon: string }[] | undefined
    if (body.kanal !== 'eposta') {
      const smsAtlanan = sonuc.sonuclar.some((s) => s.kanal === 'sms' && s.sebep === 'gonderici_yok')
      if (smsAtlanan) manuelListe = await smsManuelListesi(supabase, doktorId, body.filtre || {}, body.govde)
    }

    return NextResponse.json({ ...sonuc, smsManuelListesi: manuelListe })
  } catch (e) {
    if (e instanceof KampanyaHatasi) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[hasta-iletisimi/toplu/gonder]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Gönderim yapılamadı.' }, { status: 500 })
  }
}
