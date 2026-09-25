/**
 * NOTYA-GELEN-BELGELER — one inbox item.
 *
 * PATCH { islem: 'dosyala', patientId, belgeTuru? } → files it into the patient's document vault + hasta_belgeler,
 *        marks the item filed with who / when / source, writes the audit entry → { belgeId, patientId, belgeTuru }
 * PATCH { islem: 'sil' }                            → deletes the file; the row keeps only who / when
 *
 * Access: gelenBelgeOturum (doctor; secretary only with the doctor's switch on).
 * HASTA-IZOLASYON-01: item by id AND doctor_id AND durum 'yeni' (a foreign or already-filed id = 404); patientId via
 * hastaSahibiMi before anything is read or written; the vault re-checks the patient (assertPatientOwned).
 */
import { NextRequest, NextResponse } from 'next/server'
import { gelenBelgeOturum } from '@/lib/gelenBelgeler/yetki'
import { dosyala, sil } from '@/lib/gelenBelgeler/sunucu'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const o = await gelenBelgeOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const isleyen = { userId: o.user.id, personelId: o.rol === 'sekreter' ? o.personelId ?? null : null, rol: o.rol }

  if (b?.islem === 'sil') {
    const s = await sil(o.supabase, { doktorId: o.doktorId, id: params.id, isleyen })
    return s.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 })
  }
  if (b?.islem !== 'dosyala') return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })

  const { data: doktor } = await o.supabase.from('users').select('specialty').eq('id', o.doktorId).maybeSingle()
  const s = await dosyala(o.supabase, {
    doktorId: o.doktorId, id: params.id, patientId: b.patientId, belgeTuru: b.belgeTuru, isleyen,
    brans: doktor?.specialty ? String(doktor.specialty) : null,
  })
  if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
  return NextResponse.json({ ok: true, belgeId: s.belgeId, patientId: s.patientId, belgeTuru: s.belgeTuru })
}
