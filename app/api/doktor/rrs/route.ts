/**
 * NOTYA-RRS-01 — Renkli Reçete Sistemi iş akışı kayıtları (entegrasyonsuz).
 * GET  ?noteId=…  → o notun rrs kayıtları (renk başına 1)
 * GET  (parametresiz) → doktorun bekleyen RRS kayıtları (araç sayfası listesi), hasta adı çözülmüş
 * POST {noteId, renk, satirlar} → kayıt aç/güncelle (bekliyor); not → seans → hasta doktora ait olmalı
 * PATCH {id, rrsReceteNo} → numara girildi = duzenlendi; boş = bekliyor'a döner
 * TC hiçbir yerde tutulmaz/taşınmaz (Notya hash-only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

const RENKLER = new Set(['kirmizi', 'yesil'])
const SECIM = 'id, note_id, patient_id, renk, satirlar, rrs_recete_no, durum, duzenlenme, created_at'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const sb = oturum.supabase
  const noteId = new URL(req.url).searchParams.get('noteId')
  if (noteId) {
    const { data, error } = await sb.from('rrs_receteler').select(SECIM).eq('doctor_id', oturum.doktorId).eq('note_id', noteId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ kayitlar: data || [] })
  }
  const { data, error } = await sb.from('rrs_receteler').select(SECIM).eq('doctor_id', oturum.doktorId).eq('durum', 'bekliyor').order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = Array.from(new Set((data || []).map((r) => r.patient_id).filter(Boolean))) as string[]
  const adlar: Record<string, string> = {}
  if (ids.length) {
    const { data: hastalar } = await sb.from('patients').select('id, name_encrypted').eq('doctor_id', oturum.doktorId).in('id', ids)
    for (const h of hastalar || []) {
      // name_encrypted is {"ad","soyad"} JSON (hastalar route); the card printed that JSON raw. Plain-text names (HL7 import) still pass through.
      try {
        const duz = decrypt(String(h.name_encrypted || ''))
        let ad = duz
        try { const n = JSON.parse(duz) as { ad?: string; soyad?: string }; if (n && typeof n === 'object') ad = [n.ad, n.soyad].map((x) => (x || '').trim()).filter(Boolean).join(' ') } catch { /* düz metin ad */ }
        adlar[h.id] = ad || 'Hasta'
      } catch { adlar[h.id] = 'Hasta' }
    }
  }
  return NextResponse.json({ kayitlar: (data || []).map((r) => ({ ...r, hastaAd: adlar[r.patient_id as string] || 'Hasta' })) })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const sb = oturum.supabase
  const body = await req.json().catch(() => ({})) as { noteId?: string; renk?: string; satirlar?: unknown[] }
  if (!body.noteId || !body.renk || !RENKLER.has(body.renk)) return NextResponse.json({ error: 'noteId ve renk (kirmizi|yesil) zorunludur.' }, { status: 400 })
  const satirlar = Array.isArray(body.satirlar) ? body.satirlar.slice(0, 30) : []
  if (satirlar.some((s) => JSON.stringify(s).match(/\b\d{11}\b/))) return NextResponse.json({ error: 'Satırlarda TC olamaz.' }, { status: 400 })

  const { data: not } = await sb.from('notes').select('id, sessions(patient_id)').eq('id', body.noteId).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (!not) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })
  const s = (not as { sessions?: { patient_id?: string } | { patient_id?: string }[] }).sessions
  const pid = Array.isArray(s) ? s[0]?.patient_id : s?.patient_id
  if (!pid) return NextResponse.json({ error: 'Notun hastası çözülemedi.' }, { status: 404 })
  const { data: hasta } = await sb.from('patients').select('id').eq('id', pid).eq('doctor_id', oturum.doktorId).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bu doktora ait değil.' }, { status: 403 })

  const { data: mevcut } = await sb.from('rrs_receteler').select(SECIM).eq('note_id', body.noteId).eq('renk', body.renk).maybeSingle()
  if (mevcut) {
    if (mevcut.durum === 'bekliyor') {
      const { data, error } = await sb.from('rrs_receteler').update({ satirlar, updated_at: new Date().toISOString() }).eq('id', mevcut.id).select(SECIM).single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ kayit: data })
    }
    return NextResponse.json({ kayit: mevcut })
  }
  const { data, error } = await sb.from('rrs_receteler').insert({ doctor_id: oturum.doktorId, note_id: body.noteId, patient_id: pid, renk: body.renk, satirlar }).select(SECIM).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ kayit: data })
}

export async function PATCH(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const sb = oturum.supabase
  const body = await req.json().catch(() => ({})) as { id?: string; rrsReceteNo?: string }
  if (!body.id) return NextResponse.json({ error: 'id zorunludur.' }, { status: 400 })
  const no = String(body.rrsReceteNo || '').trim().slice(0, 40)
  const guncelle = no
    ? { rrs_recete_no: no, durum: 'duzenlendi', duzenlenme: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { rrs_recete_no: null, durum: 'bekliyor', duzenlenme: null, updated_at: new Date().toISOString() }
  const { data, error } = await sb.from('rrs_receteler').update(guncelle).eq('id', body.id).eq('doctor_id', oturum.doktorId).select(SECIM).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ kayit: data })
}
