/** NOTYA-DAH-WOW — /api/doktor/dahiliye ortak sunucu yardımcıları (route.ts yalnız handler export edebilir). Lab = yalnız onaylı satır. */
import type { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import type { SgkLab } from '@/specialties/dahiliye/engines/sgkRapor'

export type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never
export type LabSatir = { canonical_key: string; kanonik_deger: number | null; value_text: string | null; numune_tarihi: string | null }

export async function labSerisi(sb: Sb, patientId: string): Promise<Map<string, LabSatir[]>> {
  const { data } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, value_text, numune_tarihi').eq('patient_id', patientId).eq('onayli', true).in('canonical_key', ['HbA1c', 'Glu', 'LDL', 'HDL', 'TG', 'TChol', 'Kre', 'eGFR', 'UACR', 'TSH', 'FT4', 'K', 'Na', 'Hb', 'WBC', 'Plt', 'MCV', 'ALT', 'AST', 'CK', 'Ferritin', 'B12', 'Folate', 'Retic', 'INR', 'Uric', 'Li', 'UA_protein', 'RBC', 'CRP', 'LDH', 'TBil', 'GGT', 'NTproBNP', 'BNP', 'Eo', 'HBsAg', 'AntiHBs', 'Fe']).not('numune_tarihi', 'is', null).order('numune_tarihi', { ascending: false }).limit(800)
  const m = new Map<string, LabSatir[]>()
  for (const r of data || []) { const k = String(r.canonical_key); if (!m.has(k)) m.set(k, []); m.get(k)!.push({ canonical_key: k, kanonik_deger: r.kanonik_deger == null ? null : Number(r.kanonik_deger), value_text: r.value_text, numune_tarihi: r.numune_tarihi ? String(r.numune_tarihi) : null }) }
  return m
}
export const son = (m: Map<string, LabSatir[]>, k: string) => m.get(k)?.[0] ?? null
export const sonDeger = (m: Map<string, LabSatir[]>, k: string) => son(m, k)?.kanonik_deger ?? null
export async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: { kod: string; ad: string; due?: string | null; kaynak: string }[]) {
  for (const x of g) { const { data } = await sb.from('dahiliye_gorevleri').select('id').eq('patient_id', patientId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle(); if (!data) await sb.from('dahiliye_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak }) }
}
export async function hastaBilgi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('patients').select('id, dob_encrypted, gender_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (!data) return null
  let yas: number | null = null, kadin = false
  try { if (data.dob_encrypted) { const d = new Date(decrypt(String(data.dob_encrypted))); const a = new Date(); yas = a.getFullYear() - d.getFullYear() - (a.getMonth() < d.getMonth() || (a.getMonth() === d.getMonth() && a.getDate() < d.getDate()) ? 1 : 0) } } catch { yas = null }
  try { kadin = data.gender_encrypted ? /^k|^f/i.test(decrypt(String(data.gender_encrypted))) : false } catch { kadin = false }
  return { id: data.id, yas, kadin }
}

export async function hastaAdi(sb: Sb, doctorId: string, patientId: string): Promise<string> {
  const { data } = await sb.from('patients').select('name_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
  try { if (data?.name_encrypted) { const p = JSON.parse(decrypt(String(data.name_encrypted))); return `${p.ad || ''} ${p.soyad || ''}`.trim() || 'Hasta' } } catch { /* varsayılan */ }
  return 'Hasta'
}
export async function hekimKimlik(sb: Sb, user: { id: string; user_metadata?: Record<string, unknown> }) {
  const [{ data: profil }, { data: medula }] = await Promise.all([sb.from('users').select('full_name, specialty').eq('id', user.id).maybeSingle(), sb.from('doctor_integrations').select('meta').eq('user_id', user.id).eq('provider', 'medula').eq('is_active', true).maybeSingle()])
  const meta = (medula?.meta || {}) as { tesisKodu?: string; sicilNo?: string; diplomaTescilNo?: string; saglikKurumu?: string; kurumAdi?: string }
  return { adSoyad: String(profil?.full_name || user.user_metadata?.full_name || ''), uzmanlik: String(profil?.specialty || user.user_metadata?.specialty || ''), diplomaTescilNo: meta.diplomaTescilNo || meta.sicilNo || '', saglikKurumu: meta.saglikKurumu || meta.kurumAdi || '', tesisKodu: meta.tesisKodu || '', medulaBagli: !!medula }
}
export const labKayit = (m: Map<string, LabSatir[]>): Record<string, SgkLab[]> => { const o: Record<string, SgkLab[]> = {}; for (const [k, arr] of m) o[k] = arr.filter((x) => x.kanonik_deger != null && x.numune_tarihi).map((x) => ({ ad: k, deger: x.kanonik_deger as number, tarih: x.numune_tarihi as string })); return o }

