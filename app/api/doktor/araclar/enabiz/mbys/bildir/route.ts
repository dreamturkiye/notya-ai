/**
 * MBYS-BILDIR-01 — "Muayeneyi Bildir": one click on an approved muayene, behind a mandatory doctor confirmation.
 * Doctor only (the muayene part of MBYS is the physician's; a secretary gets 403).
 *
 *   GET  ?notId=…                                  → preview: the record the doctor will confirm + its fingerprint
 *   POST { islem: 'onayla', notId, onay, ozet }    → gate (approved note, no missing data, patient allows e-Nabız,
 *                                                    explicit confirmation of THIS fingerprint) → audit row → record
 *   POST { islem: 'sonuc', onayId, sonuc }         → the browser reports the hand-over (helper / clipboard / failed)
 *
 * NOT a submission: there is no Ministry API in this repo. The server-side adapter is a stub that reports
 * `gonderildi: false`; the record is handed to the doctor's own browser helper, which fills MBYS fields (see
 * docs/MBYS-YARDIMCI.md). No request to any Ministry address leaves Notya from here.
 *
 * HASTA-IZOLASYON: the note is read by id AND doctor_id, its session through seansSahibi (notKaydiHazirla), and the
 * audit row an 'onayId' refers to must carry this doctor's id.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { notKaydiHazirla } from '@/lib/enabiz/mbys/sunucu'
import { adaptorSec, devirSonucuCoz, type GunlukSatiri } from '@/lib/enabiz/mbys/bildir'
import { bildirimOnayla, bildirimOnizle, devirKaydet, type BildirimDeposu } from '@/lib/enabiz/mbys/bildirAkis'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function depoKur(supabase: SupabaseClient): BildirimDeposu {
  return {
    async notKaydi(doktorId, notId) {
      const r = await notKaydiHazirla(supabase, doktorId, notId, true)
      return r && { hastaId: r.hastaId, hastaAd: r.hastaAd, onayli: r.onayli, kilit: r.kilit, eksikler: r.eksikler, kayit: r.kayit }
    },
    async gunlukEkle(satir: GunlukSatiri) {
      const { data, error } = await supabase.from('mbys_bildirim_gunlugu').insert(satir).select('id').single()
      return error || !data ? null : { id: String((data as { id: string }).id) }
    },
    async onayBul(doktorId, onayId) {
      const { data } = await supabase
        .from('mbys_bildirim_gunlugu')
        .select('id, note_id, patient_id, payload_hash')
        .eq('id', onayId)
        .eq('doctor_id', doktorId)
        .eq('olay', 'onaylandi')
        .maybeSingle()
      return (data as { id: string; note_id: string; patient_id: string; payload_hash: string } | null) ?? null
    },
    async aktarildiIsaretle(doktorId, hastaId, notId) {
      const { data: mevcut } = await supabase.from('mbys_aktarimlar').select('durum').eq('doctor_id', doktorId).eq('note_id', notId).maybeSingle()
      if ((mevcut as { durum?: string } | null)?.durum === 'kaydedildi') return // never downgrade the doctor's own "Kaydettim"
      const simdi = new Date().toISOString()
      await supabase
        .from('mbys_aktarimlar')
        .upsert({ doctor_id: doktorId, patient_id: hastaId, note_id: notId, durum: 'aktarildi', aktarildi_at: simdi, updated_at: simdi }, { onConflict: 'doctor_id,note_id' })
    },
  }
}

const hata = (h: { durum: number; mesaj: string; kod?: string }) => NextResponse.json({ error: h.mesaj, kod: h.kod }, { status: h.durum })

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  if (rol !== 'doktor') return hata({ durum: 403, mesaj: 'Muayeneyi yalnız hekim bildirebilir.' })
  const notId = String(req.nextUrl.searchParams.get('notId') || '').trim()
  if (!UUID.test(notId)) return hata({ durum: 400, mesaj: 'Geçersiz not.' })
  const r = await bildirimOnizle(depoKur(supabase), { doktorId, notId })
  if (!r.ok) return hata(r)
  // Recent audit rows of this visit (ids and outcomes only).
  const { data: gecmis } = await supabase
    .from('mbys_bildirim_gunlugu')
    .select('olay, kanal, created_at')
    .eq('doctor_id', doktorId)
    .eq('note_id', notId)
    .order('created_at', { ascending: false })
    .limit(10)
  const ad = adaptorSec()
  return NextResponse.json({
    notId,
    hastaAd: r.hastaAd,
    onayli: r.onayli,
    kilit: r.kilit,
    eksikler: r.eksikler,
    kayit: r.kayit,
    metin: r.metin,
    ozet: r.ozet,
    adaptor: { ad: ad.ad, gercek: ad.gercek },
    gecmis: gecmis || [],
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const govde = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const islem = String(govde.islem || '')
  const depo = depoKur(supabase)

  if (islem === 'onayla') {
    const notId = String(govde.notId || '').trim()
    if (!UUID.test(notId)) return hata({ durum: 400, mesaj: 'Geçersiz not.' })
    const r = await bildirimOnayla(depo, { doktorId, rol, notId, onay: govde.onay === true, gonderilenOzet: String(govde.ozet || '') })
    if (!r.ok) return hata(r)
    return NextResponse.json({ ok: true, onayId: r.onayId, hastaAd: r.hastaAd, kayit: r.kayit, metin: r.metin, adaptor: r.adaptor })
  }

  if (islem === 'sonuc') {
    const onayId = String(govde.onayId || '').trim()
    const sonuc = devirSonucuCoz(govde.sonuc)
    if (!UUID.test(onayId) || !sonuc) return hata({ durum: 400, mesaj: 'Geçersiz istek.' })
    const r = await devirKaydet(depo, { doktorId, rol, onayId, sonuc })
    if (!r.ok) return hata(r)
    return NextResponse.json({ ok: true, durum: r.durum })
  }

  return hata({ durum: 400, mesaj: 'Bilinmeyen işlem.' })
}
