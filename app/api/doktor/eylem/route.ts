/**
 * NOTYA-EYLEM — the commit endpoint. Everything Ayşe prepares becomes real (or does not) here.
 *
 * POST { adim: 'onayla' | 'vazgec' | 'geri_al' | 'toplu_onayla' }
 * GET  ?hastaId=…  → this doctor's pending taslaklar for that patient
 *
 * AUTH: `doktorOturum` (NOTYA-AUTH-01), deliberately NOT `pratikOturum`. These are clinical records
 * — a sekreter may book a randevu on the shared calendar but may not approve a vaccine, a drug or a
 * chronic diagnosis into a patient's file. The convention's own rule: use doktorOturum for anything
 * a sekreter must never reach.
 *
 * HASTA-IZOLASYON-01: every id on this route is attacker-controlled. The öneri and the kayıt are
 * both loaded `.eq('doctor_id', user.id)`, and the patient they name is re-proved with
 * `hastaSahibiMi` inside core/eylemler/{onayla,geriAl}.ts before any write. A foreign id answers 404,
 * indistinguishable from one that never existed. Covered by lib/security/hasta-izolasyon.test.ts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { eylemOnayla, eylemVazgec, suresiDolduMu } from '@/core/eylemler/onayla'
import { eylemGeriAl } from '@/core/eylemler/geriAl'
import { eylemBul } from '@/core/eylemler/kayit'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { hastaOzetiGetir } from '@/core/eylemler/hasta'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const dynamic = 'force-dynamic'

/** The doctor's branch drives specialty gating; a missing/unknown value simply gates nothing extra. */
async function hekimBransi(supabase: Parameters<typeof hastaSahibiMi>[0], doktorId: string): Promise<SpecialtyKey | null> {
  const { data } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return bransAnahtari((data as { specialty?: string } | null)?.specialty)
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const hastaId = new URL(req.url).searchParams.get('hastaId')
  if (!hastaId) return NextResponse.json({ error: 'hastaId zorunludur.' }, { status: 400 })
  // The card header (hasta adı + doğum tarihi) is the wrong-patient guard, so it is resolved here,
  // server-side and doctor-scoped — never assembled on the client.
  const hasta = await hastaOzetiGetir(supabase, user.id, hastaId)
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const { data } = await supabase
    .from('eylem_onerileri')
    .select('id, eylem_anahtar, veri, alan_kaynaklari, eksik_alanlar, uyarilar, uyari_detay, kademe, grup_id, yuzey, created_at')
    .eq('doctor_id', user.id)
    .eq('hasta_id', hastaId)
    .eq('durum', 'taslak')
    .order('created_at', { ascending: false })
    .limit(20)

  // NOTYA-EYLEM-STALE-02 (Kaan, 2026-09-24): a draft older than the 24h window (ONERI_OMRU_MS,
  // suresiDolduMu) was only ever refused at APPROVE time -- this listing still returned it as
  // "bekleyen", so an expired test/investigation artifact kept resurfacing on every page load
  // indefinitely until someone happened to click it. Filtered here too, so the two surfaces agree.
  const oneriler = (data || [])
    .filter((o) => !suresiDolduMu(o as { created_at: string }))
    .map((o) => {
      const e = eylemBul(String(o.eylem_anahtar))
      return { ...o, etiket: e?.etiket || o.eylem_anahtar, alanlar: e?.alanlar || [], zorunlu: e?.zorunlu || [], portalaYansir: Boolean(e?.portalaYansir) }
    })
  return NextResponse.json({ oneriler, hasta: { ad: hasta.ad, dogumTarihi: hasta.dogumTarihi } })
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const govde = await req.json().catch(() => ({}))
  const adim = String((govde as { adim?: string }).adim || '')
  const brans = await hekimBransi(supabase, user.id)

  if (adim === 'onayla') {
    const { oneriId, duzeltmeler, mesajId, uyariGoruldu } = govde as { oneriId?: string; duzeltmeler?: Record<string, unknown>; mesajId?: string; uyariGoruldu?: boolean }
    if (!oneriId) return NextResponse.json({ error: 'oneriId zorunludur.' }, { status: 400 })
    const s = await eylemOnayla({ supabase, doktorId: user.id, oneriId, duzeltmeler, brans, mesajId, uyariGoruldu: Boolean(uyariGoruldu) })
    // NOTYA-EYLEM-21: the warning gate answers with the warnings themselves, so the card can print
    // the CURRENT ones (the med list may have changed since it was drawn) and offer the second tap.
    if (!s.ok) return NextResponse.json({ error: s.hata, uyarilar: s.uyarilar ?? null, uyariOnayiGerekli: Boolean(s.uyariOnayiGerekli) }, { status: s.durum })
    return NextResponse.json({ ok: true, kayitId: s.kayitId, etiket: s.etiket, ilgiliSekme: s.sonuc.ilgiliSekme ?? null })
  }

  if (adim === 'toplu_onayla') {
    const { oneriIdler, duzeltmeler, uyariGoruldu } = govde as { oneriIdler?: string[]; duzeltmeler?: Record<string, Record<string, unknown>>; uyariGoruldu?: Record<string, boolean> }
    if (!Array.isArray(oneriIdler) || !oneriIdler.length) return NextResponse.json({ error: 'oneriIdler zorunludur.' }, { status: 400 })
    // Sequential, not Promise.all: each commit re-runs its mükerrer check, and two rows from the
    // same batch can be duplicates of each other. Running them in parallel would let both pass.
    const sonuclar: { oneriId: string; ok: boolean; hata?: string; kayitId?: string }[] = []
    for (const id of oneriIdler.slice(0, 25)) {
      // A batch row carrying a `ciddi` warning is NOT swept along: its acknowledgement is per row,
      // so an unacknowledged one refuses here exactly as it would on its own card.
      const s = await eylemOnayla({ supabase, doktorId: user.id, oneriId: String(id), duzeltmeler: duzeltmeler?.[String(id)], brans, uyariGoruldu: Boolean(uyariGoruldu?.[String(id)]) })
      sonuclar.push(s.ok ? { oneriId: String(id), ok: true, kayitId: s.kayitId } : { oneriId: String(id), ok: false, hata: s.hata })
    }
    return NextResponse.json({ ok: sonuclar.every((s) => s.ok), sonuclar })
  }

  if (adim === 'vazgec') {
    const { oneriId } = govde as { oneriId?: string }
    if (!oneriId) return NextResponse.json({ error: 'oneriId zorunludur.' }, { status: 400 })
    const oldu = await eylemVazgec(supabase, user.id, oneriId)
    if (!oldu) return NextResponse.json({ error: 'Öneri bulunamadı.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  if (adim === 'geri_al') {
    const { kayitId } = govde as { kayitId?: string }
    if (!kayitId) return NextResponse.json({ error: 'kayitId zorunludur.' }, { status: 400 })
    const s = await eylemGeriAl(supabase, user.id, kayitId, brans)
    if (!s.ok) return NextResponse.json({ error: s.hata }, { status: s.durum })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Geçersiz adım.' }, { status: 400 })
}
