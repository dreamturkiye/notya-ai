/**
 * ESNEK-MUAYENE-A — POST { noteId, index } → applies ONE proposed patient-file update from the visit's sources (allergy,
 * habit, chronic disease, regular medicine) — the doctor's explicit confirmation, one item at a time; appended to what the
 * file already holds, never overwriting it. Doctor only. HASTA-IZOLASYON: note by id AND doctor_id, patient via hastaSahibiMi.
 */
import { NextRequest } from 'next/server'
import { elNotuIstegi, json, uuidMu } from '@/lib/elNotu/rota'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { notesOzetGuncelle } from '@/lib/doktor/hastaOzetKayit'
import type { KaynakOzeti } from '@/lib/elNotu/derlemeServisi'
import type { DosyaOnerisi } from '@/core/elNotu/derleyici'

export const dynamic = 'force-dynamic'
const ALAN: Record<DosyaOnerisi['tur'], { govde: string; not: string }> = {
  alerji: { govde: 'alerjiler', not: 'alerjiler' }, aliskanlik: { govde: 'sigara_alkol', not: 'sigaraAlkol' },
  kronik: { govde: 'kronik_hastaliklar', not: 'kronikHastaliklar' }, surekli_ilac: { govde: 'surekli_ilaclar', not: 'suregenIlaclar' },
}

export async function POST(req: NextRequest) {
  const o = await elNotuIstegi(req, 'doktor')
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { noteId?: unknown; index?: unknown } | null
  if (!uuidMu(b?.noteId) || !Number.isInteger(b?.index)) return json({ error: 'Geçersiz istek.' }, 400)
  const { data: n } = await o.supabase.from('notes').select('id, kaynak_ozeti, sessions(patient_id)').eq('id', b!.noteId as string).eq('doctor_id', o.doktorId).maybeSingle()
  const hastaId = (n as { sessions?: { patient_id?: string } | null } | null)?.sessions?.patient_id
  if (!n || !hastaId || !(await hastaSahibiMi(o.supabase, o.doktorId, hastaId))) return json({ error: 'Not bulunamadı.' }, 404)
  const oz = (n.kaynak_ozeti || {}) as KaynakOzeti & { uygulananOneriler?: number[] }
  const oneri = (oz.dosyaOnerileri as DosyaOnerisi[] | undefined)?.[b!.index as number]
  if (!oneri || !ALAN[oneri.tur]) return json({ error: 'Öneri bulunamadı.' }, 404)
  if ((oz.uygulananOneriler || []).includes(b!.index as number)) return json({ ok: true, zaten: true })
  const { data: h } = await o.supabase.from('patients').select('notes_encrypted').eq('id', hastaId).eq('doctor_id', o.doktorId).maybeSingle()
  let notes: Record<string, unknown> = {}
  try { notes = JSON.parse(h?.notes_encrypted ? decrypt(String(h.notes_encrypted)) : '{}') } catch { notes = {} }
  const alan = ALAN[oneri.tur]
  const mevcut = notes[alan.not]
  const yeniDeger = oneri.tur === 'kronik'
    ? [...new Set([...(Array.isArray(mevcut) ? (mevcut as string[]) : []), oneri.metin])]
    : [String(mevcut || '').trim(), oneri.metin].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join('; ')
  const { notes: yeni } = notesOzetGuncelle(notes, { [alan.govde]: yeniDeger })
  const { error } = await o.supabase.from('patients').update({ notes_encrypted: encrypt(JSON.stringify(yeni)) }).eq('id', hastaId).eq('doctor_id', o.doktorId)
  if (error) return json({ error: 'Dosyaya eklenemedi.' }, 500)
  await o.supabase.from('notes').update({ kaynak_ozeti: { ...oz, uygulananOneriler: [...(oz.uygulananOneriler || []), b!.index as number] } }).eq('id', n.id).eq('doctor_id', o.doktorId)
  return json({ ok: true })
}
