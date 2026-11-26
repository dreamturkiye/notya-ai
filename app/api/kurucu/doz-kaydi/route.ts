/**
 * DOZ-KAYDI-ISTEGE-BAGLI (Kaan, 2026-11-26) — GET /api/kurucu/doz-kaydi: the 2-week usage check for optional dose logging
 * and optional reminders (docs/OPEN-COMMITMENTS.md DOZ-KAYDI-KULLANIM).
 *
 *   200 DozKaydiKullanimi   only for a session whose e-mail is on FOUNDER_EMAILS (lib/kurucu/erisim.ts)
 *   404                     everyone else — the same answer as no route at all
 *
 * Read-only, counts only: how many patients chose each option, how many log, reminders off (global / per medicine /
 * kritik), doses marked per week and a per-patient bucket histogram. No name, no id, no drug, no reading leaves
 * (lib/saglikEvi/dozKaydi.ts › dozKaydiKullanimiHesapla drops every id). Takes no id from the request.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { dozKaydiKullanimiHesapla } from '@/lib/saglikEvi/dozKaydi'
import { GUN_MS } from '@/lib/saglikEvi/zaman'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = servisSupabase()
  const kurucu = await kurucuOturumu(req, supabase)
  if (!kurucu) return yokCevabi()
  const simdiMs = Date.now()
  const [planlar, tercihler, kayitlar, ilk] = await Promise.all([
    supabase.from('ev_ilac_planlari').select('doctor_id, patient_id, kritik, kayit_tutma, hatirlatma_acik').eq('aktif', true).eq('gerektikce', false).limit(20000),
    supabase.from('ev_tercihler').select('doctor_id, patient_id, doz_kaydi, doz_secimi, hatirlatma_acik').limit(20000),
    supabase.from('ev_doz_kayitlari').select('doctor_id, patient_id, durum, kayit_at').gte('kayit_at', new Date(simdiMs - 29 * GUN_MS).toISOString()).limit(50000),
    supabase.from('ev_doz_kayitlari').select('kayit_at').order('kayit_at', { ascending: true }).limit(1).maybeSingle(),
  ])
  if (planlar.error || tercihler.error || kayitlar.error) return NextResponse.json({ error: 'Okunamadı' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  const veri = dozKaydiKullanimiHesapla({
    planlar: (planlar.data || []) as never,
    tercihler: (tercihler.data || []) as never,
    kayitlar: (kayitlar.data || []) as never,
    ilkKayit: (ilk.data as { kayit_at?: string } | null)?.kayit_at ?? null,
    simdiMs,
  })
  return NextResponse.json(veri, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}
