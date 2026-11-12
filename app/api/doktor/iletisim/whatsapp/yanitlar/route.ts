/**
 * WHATSAPP-API-01 — "Gelen Yanıtlar": the doctor's inbox of patient replies that arrived on the connected WhatsApp number.
 * Doctor-only (doktorOturum): replies may be clinical questions, so a secretary account never reaches this route.
 *
 * HASTA-IZOLASYON-01: rows are read with doctor_id = the session's doctor; patient names are resolved with a second query
 * that is ALSO doctor-scoped and limited to ids drawn from the first. Bodies are decrypted only here, only for this doctor.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decryptPII } from '@/lib/security/encryption'
import { hastaAdiCoz, tabloYokMu } from '@/lib/iletisim/sunucu'
import { NIYET_ETIKETI, type Niyet } from '@/lib/iletisim/whatsapp/niyet'
import { AKTIF_ON_BURO } from '@/lib/iletisim/onburo/dil/aktif'
import type { BilgiAlani } from '@/lib/iletisim/onburo/dil/tipler'

export const dynamic = 'force-dynamic'

const coz = (v: unknown) => { try { return decryptPII(String(v || '')) } catch { return '' } }
const maske = (n: string) => (n.length > 4 ? `••••${n.slice(-4)}` : '••••')

/** The front-desk part of a card: only what the card kind needs, decrypted for the session's doctor. */
function onBuroOzeti(r: Record<string, any>): { yanit: string | null; alanlar: string[]; kaynak: string | null; ad: string | null; eylemler: string[] } {
  const d = (r.on_buro && typeof r.on_buro === 'object' ? r.on_buro : {}) as { yanit?: string; alanlar?: unknown; kaynak?: string; ad?: string }
  const tur = String(r.otomatik_eylem || '')
  const acik = r.durum !== 'islendi'
  const eylemler = !acik ? [] : tur === 'ob_talep' || tur === 'ob_yeni_hasta_talebi' ? ['ob_onayla', 'ob_reddet'] : tur === 'ob_otomatik_randevu' ? ['ob_geri_al'] : []
  const alanlar = Array.isArray(d.alanlar) ? d.alanlar.map((a) => (String(a).startsWith('sss.') ? 'Sık sorulanlar' : AKTIF_ON_BURO.alanEtiketi[String(a) as BilgiAlani] || String(a))) : []
  return { yanit: d.yanit ? coz(d.yanit) || null : null, alanlar, kaynak: d.kaynak || null, ad: tur === 'ob_yeni_hasta_talebi' && d.ad ? coz(d.ad) || null : null, eylemler }
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum
  const ALANLAR = 'id, patient_id, randevu_id, niyet, niyet_kaynagi, eslesme, durum, otomatik_eylem, eylem_sonucu, onerilen_slotlar, secilen_slot, tip, govde_encrypted, karsi_taraf_encrypted, created_at, islendi_at'
  const oku = (alanlar: string) => supabase.from('whatsapp_yanitlar').select(alanlar).eq('doctor_id', user.id).order('created_at', { ascending: false }).limit(60)
  // WHATSAPP-ONBURO-01: `on_buro` exists after migration 195; before it the inbox reads exactly the columns it always did.
  let { data, error } = await oku(`${ALANLAR}, on_buro`)
  if (error) ({ data, error } = await oku(ALANLAR))
  if (error) {
    // Migration 169 not applied yet → an empty inbox, not an error page.
    if (tabloYokMu(error)) return NextResponse.json({ yanitlar: [], yeni: 0 })
    return NextResponse.json({ error: 'Yanıtlar şu an okunamadı.' }, { status: 500 })
  }
  const satirlar = (data || []) as unknown as Array<Record<string, any>>
  const ids = Array.from(new Set(satirlar.map((r) => r.patient_id).filter(Boolean).map(String)))
  const adlar = new Map<string, string>()
  if (ids.length) {
    const { data: hastalar } = await supabase.from('patients').select('id, name_encrypted').eq('doctor_id', user.id).in('id', ids)
    for (const h of hastalar || []) adlar.set(String(h.id), hastaAdiCoz(h.name_encrypted) || 'Hasta')
  }
  const yanitlar = satirlar.map((r) => ({
    id: String(r.id),
    hasta: r.patient_id ? adlar.get(String(r.patient_id)) || 'Hasta' : null,
    numara: r.patient_id ? null : maske(coz(r.karsi_taraf_encrypted)),
    niyet: r.niyet as Niyet,
    niyetEtiketi: NIYET_ETIKETI[r.niyet as Niyet] || 'Diğer',
    niyetKaynagi: r.niyet_kaynagi,
    eslesme: r.eslesme,
    durum: r.durum,
    otomatikEylem: r.otomatik_eylem,
    eylemSonucu: r.eylem_sonucu,
    onerilenSlotlar: Array.isArray(r.onerilen_slotlar) ? r.onerilen_slotlar : null,
    secilenSlot: r.secilen_slot,
    metin: r.tip && r.tip !== 'text' && !r.govde_encrypted ? `(${r.tip})` : coz(r.govde_encrypted),
    zaman: r.created_at,
    // one-tap actions only make sense for exactly one matched patient with an appointment behind the reply
    eylemYapilabilir: !!r.patient_id && !String(r.otomatik_eylem || '').startsWith('ob_'),
    // WHATSAPP-ONBURO-01 — what Ayşe did on this card: her answer (decrypted for this doctor only) and its sheet fields,
    // the name an unknown sender gave, and the one-tap actions this card kind offers.
    onBuro: String(r.otomatik_eylem || '').startsWith('ob_') ? onBuroOzeti(r) : null,
    yanitlanabilir: !!r.karsi_taraf_encrypted,
  }))
  return NextResponse.json({ yanitlar, yeni: yanitlar.filter((y) => y.durum === 'yeni').length })
}
