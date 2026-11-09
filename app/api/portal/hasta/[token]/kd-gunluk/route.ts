/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — Sağlığım › Semptom günlüğü (PMS/PMDD prospektif günlük). PIN kilidi zorunlu.
 * Uygunluk: token'ın doktoru Kadın Hastalıkları ve Doğum (kdTaramaBransi) VE bu hasta için açık bir günlük açmış. Başka
 * hiçbir branşın token'ında görünmez (brans-alan-sizmasi).
 *   GET  → { uygun, alanlar, islevAlanlari, olcek, sonGunler }   (yalnız hastanın kendi puanları; yorum/tanı yok)
 *   POST { tarih, adet, puan, islev } → { ok }   tarih yalnız BUGÜN veya DÜN (prospektif kayıt: geriye dönük doldurma yok)
 * HASTA-IZOLASYON: token → (patient_id, doctor_id); her okuma/yazma ikisiyle kapsanır.
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resolvePortalToken } from '@/lib/portal/messages'
import { requirePortalUnlock } from '@/lib/portal/requireUnlock'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { acikGunluk, bugunTr, gunlukGunuYaz, kdTaramaBransi, T_GUNLUK } from '@/lib/doktor/kdTaramaSunucu'
import { PMDD_ALANLARI, PMDD_ISLEV_ALANLARI, PMDD_PUAN_EN_AZ, PMDD_PUAN_EN_COK, gunEkle } from '@/lib/clinical/kdTaramalar'

export const dynamic = 'force-dynamic'

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) }, auth: { persistSession: false } })
}

async function hazirla(req: NextRequest, token: string) {
  const client = sb()
  if (!client) return { hata: NextResponse.json({ error: 'Portal yapılandırılmamış.' }, { status: 500 }) }
  const tok = await resolvePortalToken(client, token)
  if (!tok) return { hata: NextResponse.json({ error: 'Token bulunamadı veya süresi dolmuş' }, { status: 404 }) }
  const locked = requirePortalUnlock(req, token, tok)
  if (locked) return { hata: locked }
  const kd = kdTaramaBransi(await hekimBransi(client, tok.doctor_id))
  const gunluk = kd ? await acikGunluk(client, tok.doctor_id, tok.patient_id) : null
  return { client, tok, gunluk }
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const h = await hazirla(req, params.token)
  if ('hata' in h) return h.hata
  if (!h.gunluk) return NextResponse.json({ uygun: false })
  const { data } = await h.client.from(T_GUNLUK).select('tarih, adet, puan').eq('patient_id', h.tok.patient_id).eq('doctor_id', h.tok.doctor_id).eq('gunluk_id', h.gunluk.id).gte('tarih', gunEkle(bugunTr(), -13)).order('tarih', { ascending: false })
  return NextResponse.json({ uygun: true, alanlar: PMDD_ALANLARI, islevAlanlari: PMDD_ISLEV_ALANLARI, olcek: [PMDD_PUAN_EN_AZ, PMDD_PUAN_EN_COK], bugun: bugunTr(), sonGunler: data || [] })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const h = await hazirla(req, params.token)
  if ('hata' in h) return h.hata
  if (!h.gunluk) return NextResponse.json({ error: 'Açık bir semptom günlüğünüz yok.' }, { status: 404 })
  const ham = (await req.json().catch(() => null)) as { tarih?: unknown } | null
  const bugun = bugunTr()
  if (!ham || (ham.tarih !== bugun && ham.tarih !== gunEkle(bugun, -1))) return NextResponse.json({ error: 'Günlük yalnız bugün veya dün için doldurulur.' }, { status: 422 })
  const r = await gunlukGunuYaz(h.client, { doktorId: h.tok.doctor_id, patientId: h.tok.patient_id, gunlukId: h.gunluk.id, gun: ham, kaynak: 'portal' })
  if (!r.ok) return NextResponse.json({ error: r.hata === 'gun_bos' ? 'En az bir puan ya da adet işareti girin.' : 'Kaydedilemedi.' }, { status: r.status })
  return NextResponse.json({ ok: true })
}
