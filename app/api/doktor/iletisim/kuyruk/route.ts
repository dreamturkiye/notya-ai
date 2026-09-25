/**
 * NOTYA-ILETISIM-01 — Hazır mesajlar (iletisim_kuyrugu).
 *
 * GET [?sayi=1] → today's waiting items, oldest first, "Sonra" ones last: { ogeler: [{ id, tur, patientId, hastaAdi }] }
 *                 or just { sayi }. The full message for one item comes from POST /api/doktor/iletisim/hazirla
 *                 { kuyrukId } — the flow shows one patient at a time.
 *                 For the doctor, due vaccine reminders are (re)built here first — deliberately not in a cron
 *                 (lib/asi/hatirlatma.test.ts: no cron touches asilar).
 *                 Items whose source is gone (appointment cancelled / past, vaccine already reminded) are closed
 *                 as atlandi instead of being shown.
 * PATCH { id, islem: 'atla' | 'sonra' | 'gonderildi' }
 *
 * A secretary sees and works appointment items only (PERSONEL_TURLERI) — filtered in the query and re-checked
 * on PATCH (a foreign or clinical item answers 404). Fails soft before migration 095: empty queue.
 * HASTA-IZOLASYON-01: every query .eq(doctor_id); names resolved only for the doctor's own patients.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'
import { bugunTrIso } from '@/lib/iletisim/sablonlar'
import { PERSONEL_TURLERI, bugunGosterilecekler, kuyrukGuncellemesi, kuyrukIslemiMi, turIzinliMi } from '@/lib/iletisim/kuyruk'
import { asiKuyrukAdaylari, hastaAdiCoz, kuyrugaEkle } from '@/lib/iletisim/sunucu'
import { mesajTuruMu, type MesajTuru, type KuyrukDurumu } from '@/lib/iletisim/tipler'

export const dynamic = 'force-dynamic'

type Satir = {
  id: string; patient_id: string; tur: MesajTuru; durum: KuyrukDurumu; planlanan_gun: string
  randevu_id: string | null; asi_id: string | null; ertelendi_at: string | null; created_at: string | null
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol } = oturum
  const bugun = bugunTrIso()
  const sadeceSayi = req.nextUrl.searchParams.get('sayi') === '1'

  if (rol === 'doktor') {
    try { await kuyrugaEkle(supabase, await asiKuyrukAdaylari(supabase, doktorId, bugun)) } catch { /* the queue still shows what exists */ }
  }

  let q = supabase.from('iletisim_kuyrugu')
    .select('id, patient_id, tur, durum, planlanan_gun, randevu_id, asi_id, ertelendi_at, created_at')
    .eq('doctor_id', doktorId)
    .eq('durum', 'bekliyor')
    .lte('planlanan_gun', bugun)
  if (rol !== 'doktor') q = q.in('tur', [...PERSONEL_TURLERI])
  const { data, error } = await q.limit(200)
  if (error) return NextResponse.json(sadeceSayi ? { sayi: 0 } : { ogeler: [] })

  let satirlar = bugunGosterilecekler(
    (data || []).filter((s) => mesajTuruMu(s.tur)).map((s) => ({ ...s, id: String(s.id), patient_id: String(s.patient_id) }) as Satir),
    rol, bugun,
  )

  // Close items whose source no longer needs a message.
  const kapat: string[] = []
  const randevuIds = satirlar.map((s) => s.randevu_id).filter(Boolean) as string[]
  if (randevuIds.length) {
    const { data: r } = await supabase.from('randevular').select('id, durum, baslangic, patient_id').eq('doktor_id', doktorId).in('id', randevuIds)
    const gecerli = new Map((r || []).map((x) => [String(x.id), x]))
    for (const s of satirlar) {
      if (!s.randevu_id) continue
      const x = gecerli.get(s.randevu_id)
      if (!x || !['planlandi', 'onaylandi'].includes(String(x.durum)) || Date.parse(String(x.baslangic)) < Date.now() || String(x.patient_id) !== s.patient_id) kapat.push(s.id)
    }
  }
  const asiIds = satirlar.map((s) => s.asi_id).filter(Boolean) as string[]
  if (asiIds.length) {
    // archived with its muayene (NOTYA-ASI-NOT-01) → not returned → the item closes
    const { data: a } = await arsivsizAsilar(supabase, 'id, hatirlatma_gonderildi').eq('doktor_id', doktorId).in('id', asiIds)
    const gonderilmis = new Set((a || []).filter((x) => x.hatirlatma_gonderildi === true).map((x) => String(x.id)))
    const var_ = new Set((a || []).map((x) => String(x.id)))
    for (const s of satirlar) if (s.asi_id && (gonderilmis.has(s.asi_id) || !var_.has(s.asi_id))) kapat.push(s.id)
  }
  if (kapat.length) {
    await supabase.from('iletisim_kuyrugu').update({ durum: 'atlandi', updated_at: new Date().toISOString() }).eq('doctor_id', doktorId).in('id', kapat)
    satirlar = satirlar.filter((s) => !kapat.includes(s.id))
  }

  // Names only for this doctor's own patients; an item whose patient is not theirs is never shown.
  const ids = Array.from(new Set(satirlar.map((s) => s.patient_id)))
  const { data: hastalar } = ids.length
    ? await supabase.from('patients').select('id, name_encrypted, is_active').eq('doctor_id', doktorId).in('id', ids)
    : { data: [] as Array<{ id: string; name_encrypted: string; is_active: boolean | null }> }
  const ad = new Map((hastalar || []).filter((p) => p.is_active !== false).map((p) => [String(p.id), hastaAdiCoz(p.name_encrypted) || 'Hasta']))
  const ogeler = satirlar
    .filter((s) => ad.has(s.patient_id))
    .map((s) => ({ id: s.id, tur: s.tur, patientId: s.patient_id, hastaAdi: ad.get(s.patient_id) as string, ertelendi: !!s.ertelendi_at }))

  return NextResponse.json(sadeceSayi ? { sayi: ogeler.length } : { ogeler })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user, personelId } = oturum
  const b = (await req.json().catch(() => null)) as { id?: unknown; islem?: unknown } | null
  const id = typeof b?.id === 'string' ? b.id : ''
  if (!id || !kuyrukIslemiMi(b?.islem)) return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 })

  const { data: k } = await supabase.from('iletisim_kuyrugu').select('id, tur').eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  if (!k || !mesajTuruMu(k.tur) || !turIzinliMi(rol, k.tur)) return NextResponse.json({ error: 'Mesaj bulunamadı.' }, { status: 404 })

  const guncelleme = kuyrukGuncellemesi(b.islem, new Date().toISOString(), { userId: user.id, personelId: rol === 'sekreter' ? personelId : null })
  const { error } = await supabase.from('iletisim_kuyrugu').update(guncelleme).eq('id', id).eq('doctor_id', doktorId)
  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
