/**
 * NOTYA-GUN-02 — Günün Programı ("kahve + takvim" görünümü).
 *
 * Kaan direktifi (2026-09-09): "Bugün 14 randevu var" yetmez — doktor sabah kahvesiyle
 * takvime bakıp KİM, KAÇTA, NEDEN geliyor görmek ister. Bu uç bugünün randevularını,
 * her biri için Ayşe'nin tek satırlık brifingiyle döndürür:
 *   • kontrol → son vizit tarihi + tanı + planın özü ("neyi kontrol edeceğim")
 *   • ilk muayene → "ilk kez geliyor" + intake formu doldurdu mu + alerji (formdan)
 *   • ek işaretler: aktif ilaç sayısı, okunmamış mesajı var mı
 * Yeni ekran yok — dashboard "Bugün" görünümü bu listeyi gösterir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const TZ = 'Europe/Istanbul'

function trtGunSinirlari(): { bas: string; son: string } {
  const simdi = new Date()
  const bugun = simdi.toLocaleDateString('en-CA', { timeZone: TZ })
  const offsetMs = new Date(simdi.toLocaleString('en-US', { timeZone: TZ })).getTime() - new Date(simdi.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const bas = new Date(new Date(`${bugun}T00:00:00Z`).getTime() - offsetMs)
  return { bas: bas.toISOString(), son: new Date(bas.getTime() + 86400000).toISOString() }
}
function trTarih(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long' })
}
function ilkCumle(metin: string | null | undefined, maks = 110): string {
  // Numaralı/madde işaretlerini sök ("1. Amoksisilin..." → "Amoksisilin..."), sonra ilk cümle
  const t = String(metin || '').replace(/(^|\s)(\d+[.)]|[-•*])\s+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(?:[A-ZÇĞİÖŞÜ]{3,}[\s\/:]*){1,4}(?=[A-ZÇĞİÖŞÜ]?[a-zçğıöşü])/, '') // "TEDAVİ / İLAÇLAR " gibi başlık önekini at
    .trim()
  if (!t) return ''
  const c = t.split(/(?<=[.!?])\s/)[0] || t
  return c.length > maks ? `${c.slice(0, maks - 1)}…` : c
}
function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

interface ProgramSatiri {
  id: string
  baslangic: string
  bitis: string
  tur: string
  durum: string
  hastaAdi: string
  patientId: string | null
  yeniHasta: boolean
  brifing: string          // Ayşe'nin tek satırı
  isaretler: string[]      // "3 aktif ilaç", "okunmamış mesajı var", "alerji: penisilin"
  sonVizit: { tarih: string | null; tani: string; plan: string } | null
}

type NotSatiri = { created_at: string; content_degerlendirme: string | null; content_plan: string | null; icd10_codes: unknown; sessions: { patient_id: string } | { patient_id: string }[] | null }

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const { bas, son } = trtGunSinirlari()

  const { data: randevular, error } = await supabase
    .from('randevular')
    .select('id, baslangic, bitis, tur, durum, patient_id, hasta_adi_serbest, notlar')
    .eq('doktor_id', doktorId).gte('baslangic', bas).lt('baslangic', son)
    .neq('durum', 'iptal').order('baslangic', { ascending: true }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const satirlar = (randevular || []) as { id: string; baslangic: string; bitis: string; tur: string; durum: string; patient_id: string | null; hasta_adi_serbest: string | null; notlar: string | null }[]
  const hastaIdler = [...new Set(satirlar.map((r) => r.patient_id).filter(Boolean))] as string[]

  // Toplu sorgular — randevu başına değil, gün başına (ekonomi)
  const bos = { data: [] as unknown[] }
  const [hastalarQ, notlarQ, ilaclarQ, mesajQ, intakeQ] = hastaIdler.length
    ? await Promise.all([
        supabase.from('patients').select('id, name_encrypted').in('id', hastaIdler),
        supabase.from('notes').select('created_at, content_degerlendirme, content_plan, icd10_codes, sessions!inner(patient_id)')
          .eq('doctor_id', doktorId).not('approved_at', 'is', null).in('sessions.patient_id', hastaIdler)
          .order('created_at', { ascending: false }).limit(400),
        supabase.from('hasta_ilaclar').select('patient_id').in('patient_id', hastaIdler).eq('aktif', true),
        supabase.from('hasta_mesaj_konulari').select('patient_id').eq('doctor_id', doktorId).in('patient_id', hastaIdler).eq('okundu_pratik', false).eq('pratik_arsiv', false),
        supabase.from('hasta_intake_formlari').select('patient_id, durum, form_data_encrypted, created_at').in('patient_id', hastaIdler).order('created_at', { ascending: false }),
      ])
    : [bos, bos, bos, bos, bos]

  const adlar = new Map<string, string>()
  for (const p of (hastalarQ.data || []) as { id: string; name_encrypted: string | null }[]) {
    try { adlar.set(p.id, (JSON.parse(guvenliCoz(p.name_encrypted)).ad || '').trim()) } catch { /* ad yok */ }
  }
  const sonNot = new Map<string, NotSatiri>()
  const notSayisi = new Map<string, number>()
  for (const n of (notlarQ.data || []) as NotSatiri[]) {
    const pid = Array.isArray(n.sessions) ? n.sessions[0]?.patient_id : n.sessions?.patient_id
    if (!pid) continue
    notSayisi.set(pid, (notSayisi.get(pid) || 0) + 1)
    if (!sonNot.has(pid)) sonNot.set(pid, n)
  }
  const ilacSayisi = new Map<string, number>()
  for (const i of (ilaclarQ.data || []) as { patient_id: string }[]) ilacSayisi.set(i.patient_id, (ilacSayisi.get(i.patient_id) || 0) + 1)
  const mesajVar = new Set(((mesajQ.data || []) as { patient_id: string }[]).map((m) => m.patient_id))
  const intake = new Map<string, { durum: string; alerji: string }>()
  for (const f of (intakeQ.data || []) as { patient_id: string; durum: string; form_data_encrypted: string | null }[]) {
    if (intake.has(f.patient_id)) continue
    let alerji = ''
    if (f.durum !== 'gonderildi' && f.form_data_encrypted) {
      try {
        const y = JSON.parse(guvenliCoz(f.form_data_encrypted)) as Record<string, unknown>
        if (String(y.alerjiVarMi || '').includes('var')) alerji = String(y.alerjiAciklama || 'belirtilmiş').trim()
      } catch { /* form okunamadı */ }
    }
    intake.set(f.patient_id, { durum: f.durum, alerji })
  }

  const program: ProgramSatiri[] = satirlar.map((r) => {
    const pid = r.patient_id
    const ad = (pid && adlar.get(pid)) || r.hasta_adi_serbest || 'İsimsiz'
    const not = pid ? sonNot.get(pid) : undefined
    const vizitSayisi = pid ? notSayisi.get(pid) || 0 : 0
    const yeniHasta = vizitSayisi === 0
    const form = pid ? intake.get(pid) : undefined
    const isaretler: string[] = []
    let brifing = ''

    if (not) {
      const kodlar = Array.isArray(not.icd10_codes) ? (not.icd10_codes as { code?: string; description?: string; is_primary?: boolean }[]) : []
      const birincil = kodlar.find((k) => k.is_primary) || kodlar[0]
      const tani = birincil?.description || ilkCumle(not.content_degerlendirme, 80)
      const plan = ilkCumle(not.content_plan)
      const ne = r.tur === 'kontrol' ? 'Kontrol' : `${vizitSayisi + 1}. vizit`
      brifing = `${ne} — son vizit ${trTarih(not.created_at)}${tani ? `, ${tani}` : ''}.${plan ? ` Plan: ${plan}` : ''}`
    } else if (yeniHasta) {
      const formDurum = !pid ? 'kayıt yok' : form ? (form.durum === 'gonderildi' ? 'form gönderildi, henüz doldurulmadı' : 'ön bilgi formu dolduruldu') : 'form gönderilmedi'
      brifing = `İlk kez geliyor — ${formDurum}.${r.notlar ? ` Randevu notu: ${ilkCumle(r.notlar, 90)}` : ''}`
    } else {
      brifing = r.notlar ? `Randevu notu: ${ilkCumle(r.notlar, 100)}` : ''
    }

    if (form?.alerji) isaretler.push(`alerji: ${form.alerji.slice(0, 40)}`)
    const ilac = pid ? ilacSayisi.get(pid) || 0 : 0
    if (ilac > 0) isaretler.push(`${ilac} aktif ilaç`)
    if (pid && mesajVar.has(pid)) isaretler.push('okunmamış mesajı var')

    return {
      id: r.id, baslangic: r.baslangic, bitis: r.bitis, tur: r.tur, durum: r.durum,
      hastaAdi: ad, patientId: pid, yeniHasta, brifing, isaretler,
      sonVizit: not ? { tarih: not.created_at, tani: ilkCumle(not.content_degerlendirme, 120), plan: ilkCumle(not.content_plan, 160) } : null,
    }
  })

  return NextResponse.json({
    program,
    ozet: { toplam: program.length, kontrol: program.filter((p) => p.tur === 'kontrol').length, yeni: program.filter((p) => p.yeniHasta).length },
  })
}
