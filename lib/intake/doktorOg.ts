/**
 * NOTYA-INTAKE-OG-01 — hasta bilgi formu WhatsApp / link önizlemesi doktor markalıdır
 * (koyu Notya "N" değil). Uygulama krem / çam renkleri (chromeTheme).
 */
import { createHash } from 'crypto'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'

export const INTAKE_OG_RENK = {
  cream: '#f4eee3',
  paper: '#faf6ee',
  ink: '#3b2e24',
  muted: '#8b7d70',
  pine: '#2f4334',
  gold: '#d4c196',
} as const

export type IntakeDoktorOg = {
  doktorAdi: string
  initials: string
  hastaAdi: string
  bransEtiket: string | null
}

function doktorAdiKur(u: { title?: string | null; first_name?: string | null; last_name?: string | null; full_name?: string | null } | null): string {
  if (!u) return 'Doktorunuz'
  const ad = [u.title, u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (ad && (u.first_name || u.last_name)) return ad
  const tam = String(u.full_name || '').trim()
  if (!tam) return 'Doktorunuz'
  return /^(dr|doç|prof|uzm)\.?\s/i.test(tam) ? tam : `Dr. ${tam}`
}

/** "Dr. Kaan Arıoğlu" → "KA" */
export function doktorBasHarfler(ad: string): string {
  const temiz = String(ad || '')
    .replace(/^(dr|doç|doc|prof|uzm)\.?\s+/i, '')
    .trim()
  const parcalar = temiz.split(/\s+/).filter(Boolean)
  if (parcalar.length === 0) return 'DR'
  if (parcalar.length === 1) return parcalar[0].slice(0, 2).toLocaleUpperCase('tr-TR')
  const ilk = parcalar[0][0] || ''
  const son = parcalar[parcalar.length - 1][0] || ''
  return `${ilk}${son}`.toLocaleUpperCase('tr-TR')
}

export async function intakeDoktorOg(token: string): Promise<IntakeDoktorOg | null> {
  if (!token) return null
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const supabase = servisSupabase()
  const { data: form } = await supabase
    .from('hasta_intake_formlari')
    .select('id, brans, patient_id, doktor_id, token_expires_at, durum')
    .eq('token_hash', tokenHash)
    .maybeSingle()
  if (!form) return null
  if (form.token_expires_at && new Date(form.token_expires_at) < new Date()) return null

  const [{ data: doktor }, { data: hasta }] = await Promise.all([
    supabase.from('users').select('first_name, last_name, title, full_name').eq('id', form.doktor_id).maybeSingle(),
    supabase.from('patients').select('name_encrypted').eq('id', form.patient_id).maybeSingle(),
  ])
  const doktorAdi = doktorAdiKur(doktor)
  let hastaAdi = ''
  try {
    if (hasta?.name_encrypted) hastaAdi = (JSON.parse(decrypt(hasta.name_encrypted)).ad || '').trim()
  } catch { /* leave blank */ }

  const { intakeBransEtiketi } = await import('@/lib/intake/formBransi')
  const bransEtiket = intakeBransEtiketi(form.brans)

  return {
    doktorAdi,
    initials: doktorBasHarfler(doktorAdi),
    hastaAdi,
    bransEtiket: bransEtiket ? String(bransEtiket) : null,
  }
}

export function intakeOgBaslik(d: IntakeDoktorOg): string {
  return d.doktorAdi
}

export function intakeOgAciklama(d: IntakeDoktorOg): string {
  const kim = d.hastaAdi ? `${d.hastaAdi} için ` : ''
  const brans = d.bransEtiket ? ` · ${d.bransEtiket}` : ''
  return `${kim}Hasta Bilgi Formu${brans}. Randevu öncesi kısa form — ${d.doktorAdi}.`
}
