/**
 * HASTA-PORTALI-GUNLUK — the patient file's "Ev verisi" card (core: every branş).
 *   GET   → charts (28 days), adherence (7 / 30 days, per medicine), alerts, thresholds (effective + defaults + the
 *           doctor's overrides), dose plans, the latest Kontrol Öncesi Özet, the patient's open questions. Without the
 *           patient's KVKK consent: only that fact + the doctor's own settings.
 *   PATCH { ayarlar } | { plan: { planId, kritik?, minAralikSaat? } } | { modul: { anahtar, durum: 'acik'|'kapali'|'otomatik' } }
 *         → per-patient thresholds / kritik flag / HASTA-MODULLERI module switch (doctor's choice wins)
 *   POST  { islem: 'gordum' | 'ozet' } → acknowledge alerts (clears the Fısıltı) / build the summary now
 * HASTA-IZOLASYON: pratikOturum → doktorId; hastaSahibiMi(doktorId, id) before anything else (404 for a foreign id);
 * every query in lib/saglikEvi/hekimSunucu.ts carries doctor_id + patient_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { evVerisiKarti, hekimAyarKaydet, hekimModulKaydet, kontrolOzetiOlustur, planHekimAyari, uyarilariGordum } from '@/lib/saglikEvi/hekimSunucu'

export const dynamic = 'force-dynamic'

async function kapi(req: NextRequest, id: string) {
  const o = await pratikOturum(req)
  if ('hata' in o) return { hata: o.hata }
  if (!(await hastaSahibiMi(o.supabase, o.doktorId, id))) return { hata: NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 }) }
  return { o }
}

const yanit = (r: { ok: boolean; status?: number; hata?: string; [k: string]: unknown }) => (r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.hata }, { status: r.status || 400 }))

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const k = await kapi(req, params.id)
  if ('hata' in k) return k.hata
  try {
    return NextResponse.json(await evVerisiKarti(k.o.supabase, k.o.doktorId, params.id))
  } catch (e) {
    console.error('[ev-verisi]', (e as Error).message)
    return NextResponse.json({ error: 'Ev verisi yüklenemedi.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const k = await kapi(req, params.id)
  if ('hata' in k) return k.hata
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  if (b.plan && typeof b.plan === 'object') return yanit(await planHekimAyari(k.o.supabase, k.o.doktorId, params.id, b.plan as Record<string, unknown>))
  if (b.modul && typeof b.modul === 'object') return yanit(await hekimModulKaydet(k.o.supabase, k.o.doktorId, params.id, b.modul as Record<string, unknown>, k.o.user.id))
  if ('ayarlar' in b) return yanit(await hekimAyarKaydet(k.o.supabase, k.o.doktorId, params.id, b.ayarlar, k.o.user.id))
  return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const k = await kapi(req, params.id)
  if ('hata' in k) return k.hata
  const b = (await req.json().catch(() => null)) as { islem?: unknown } | null
  if (b?.islem === 'gordum') return yanit(await uyarilariGordum(k.o.supabase, k.o.doktorId, params.id))
  if (b?.islem === 'ozet') return yanit(await kontrolOzetiOlustur(k.o.supabase, k.o.doktorId, params.id, null))
  return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}
