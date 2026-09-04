import type { SupabaseClient } from '@supabase/supabase-js'
import type { MessageFolder, PortalMessage } from './types'

export { AUTO_ACK_TEXT, COMPOSE_DISCLAIMER } from './messageCopy'

export type PortalTokenRow = {
  patient_id: string
  doctor_id: string
  expires_at: string
  pin_hash: string | null
}

export async function resolvePortalToken(
  sb: SupabaseClient,
  token: string
): Promise<PortalTokenRow | null> {
  if (!token) return null
  const { data, error } = await sb
    .from('hasta_portal_tokens')
    .select('patient_id, doctor_id, expires_at, pin_hash')
    .eq('token_hash', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error || !data) return null
  return data as PortalTokenRow
}

type KonuRow = {
  id: string
  konu: string
  hasta_klasor: MessageFolder
  son_mesaj_at: string
  okundu_hasta: boolean
  created_at: string
}

type MsgRow = {
  id: string
  konu_id: string
  taraf: 'hasta' | 'doktor' | 'klinik'
  metin: string
  created_at: string
}

function kimdenFor(taraf: MsgRow['taraf']): string {
  if (taraf === 'hasta') return 'Siz'
  if (taraf === 'klinik') return 'Klinik'
  return 'Doktorunuz'
}

function gonderenFor(taraf: MsgRow['taraf']): string {
  if (taraf === 'hasta') return 'Siz'
  if (taraf === 'klinik') return 'Klinik'
  return 'Doktorunuz'
}

export async function loadPortalMessages(
  sb: SupabaseClient,
  patientId: string
): Promise<PortalMessage[]> {
  const { data: konular } = await sb
    .from('hasta_mesaj_konulari')
    .select('id, konu, hasta_klasor, son_mesaj_at, okundu_hasta, created_at')
    .eq('patient_id', patientId)
    .order('son_mesaj_at', { ascending: false })
    .limit(80)

  const list = (konular || []) as KonuRow[]
  if (!list.length) return []

  const ids = list.map((k) => k.id)
  const { data: msgs } = await sb
    .from('hasta_mesajlar')
    .select('id, konu_id, taraf, metin, created_at')
    .in('konu_id', ids)
    .order('created_at', { ascending: true })

  const byKonu = new Map<string, MsgRow[]>()
  for (const m of (msgs || []) as MsgRow[]) {
    const arr = byKonu.get(m.konu_id) || []
    arr.push(m)
    byKonu.set(m.konu_id, arr)
  }

  return list.map((k) => {
    const thread = byKonu.get(k.id) || []
    const last = thread[thread.length - 1]
    return {
      id: k.id,
      klasor: k.hasta_klasor,
      konu: k.konu,
      gonderen: last ? gonderenFor(last.taraf) : 'Klinik',
      ozet: last ? String(last.metin).slice(0, 140) : '',
      tarih: k.son_mesaj_at || k.created_at,
      okundu: Boolean(k.okundu_hasta),
      mesajlar: thread.map((m) => ({
        id: m.id,
        kimden: kimdenFor(m.taraf),
        metin: m.metin,
        tarih: m.created_at,
        taraf: m.taraf,
      })),
    }
  })
}
