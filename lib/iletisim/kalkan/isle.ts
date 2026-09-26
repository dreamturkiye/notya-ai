/**
 * NOTYA-KALKAN-01 — gelen + hekim yankısını deftere yazar, sabit cümleyle yanıtlar, taslak üretir.
 * Kart değişmez. Tablo yoksa veya Starter plandaysa hiçbir şey yapmadan döner.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import { whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'
import { graph } from '@/lib/iletisim/otomatik/whatsapp/graph'
import type { KalkanHam } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import { mesaiDisiMi, otomatikMetinMi, siniflandir, yanitMetni, type KalkanSinif } from './sinif'
import { hekimNiyeti, taslakSatiri, type KalkanEylem, type KalkanKapsam } from './niyet'

type Sb = SupabaseClient

export interface KalkanGonderici {
  (b: { phoneNumberId: string; token: string; kime: string; metin: string }): Promise<void>
}

async function varsayilanGonder(b: { phoneNumberId: string; token: string; kime: string; metin: string }): Promise<void> {
  if (!otomatikMetinMi(b.metin)) return
  const to = whatsappNumarasi(b.kime)
  if (!to) return
  await graph(`${b.phoneNumberId}/messages`, {
    method: 'POST',
    token: b.token,
    body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: b.metin } },
  })
}

function rakam(s: string): string {
  return whatsappNumarasi(s) || s.replace(/\D/g, '')
}

export function ilacSec(adlar: { id: string; ad: string }[], metin: string): { id: string; ad: string } | null {
  const k = metin.toLocaleLowerCase('tr-TR')
  const uyan = adlar.filter((a) => {
    const parca = a.ad.toLocaleLowerCase('tr-TR').split(/\s+/)[0]
    return parca.length >= 4 && k.includes(parca)
  })
  if (uyan.length === 1) return uyan[0]
  if (!uyan.length && adlar.length === 1 && /ilac|ilaç/.test(k)) return adlar[0]
  return null
}

export async function kalkanIsle(
  sb: Sb,
  olaylar: KalkanHam[],
  opt: { simdi?: Date; gonder?: KalkanGonderici } = {},
): Promise<{ yazilan: number; taslak: number }> {
  const simdi = opt.simdi || new Date()
  const gonder = opt.gonder || varsayilanGonder
  let yazilan = 0
  let taslak = 0
  for (const o of olaylar) {
    try {
      const r = await birOlay(sb, o, simdi, gonder)
      yazilan += r.yazildi ? 1 : 0
      taslak += r.taslak ? 1 : 0
    } catch (e) {
      if (!tabloYokMu(e)) console.error('[kalkan]', e instanceof Error ? e.message : 'bilinmeyen')
    }
  }
  return { yazilan, taslak }
}

async function birOlay(sb: Sb, o: KalkanHam, simdi: Date, gonder: KalkanGonderici): Promise<{ yazildi: boolean; taslak: boolean }> {
  const { data: bag, error: bagHata } = await sb
    .from('doktor_whatsapp_baglantilari')
    .select('doctor_id, phone_number_id, token_encrypted, durum')
    .eq('phone_number_id', o.phoneNumberId)
    .eq('durum', 'bagli')
    .maybeSingle()
  if (bagHata) {
    if (tabloYokMu(bagHata)) return { yazildi: false, taslak: false }
    throw bagHata
  }
  if (!bag?.doctor_id) return { yazildi: false, taslak: false }
  const doktorId = String(bag.doctor_id)

  const { data: plan } = await sb.from('users').select('subscription_tier').eq('id', doktorId).maybeSingle()
  if (plan && String(plan.subscription_tier || '') === 'starter') return { yazildi: false, taslak: false }

  const sinif = siniflandir({ metin: o.govde, tip: o.tip })
  if (o.yon === 'gelen' && sinif.sinif === 'spam_reklam') return { yazildi: false, taslak: false }
  const es = await hastalariBul(sb, doktorId, o.karsiNumara)
  const zaman = o.zaman || simdi.toISOString()
  const yon = o.yon === 'giden_hekim' ? 'giden_hekim' : 'gelen'

  const { data: konusma, error: kErr } = await sb.from('wa_konusma').upsert({
    doctor_id: doktorId,
    phone_number_id: o.phoneNumberId,
    from_e164: rakam(o.karsiNumara),
    hasta_id: es.hastaId,
    eslesme: es.eslesme,
    son_sinif: sinif.sinif,
    updated_at: simdi.toISOString(),
  }, { onConflict: 'doctor_id,phone_number_id,from_e164' }).select('id').maybeSingle()
  if (kErr) {
    if (tabloYokMu(kErr)) return { yazildi: false, taslak: false }
    throw kErr
  }

  const { data: varMi, error: vErr } = await sb.from('wa_satir').select('id').eq('doctor_id', doktorId).eq('wamid', o.wamid).maybeSingle()
  if (vErr) {
    if (tabloYokMu(vErr)) return { yazildi: false, taslak: false }
    throw vErr
  }
  if (varMi) return { yazildi: false, taslak: false }

  const { error: sErr } = await sb.from('wa_satir').insert({
    konusma_id: konusma?.id || null,
    doctor_id: doktorId,
    yon,
    wamid: o.wamid,
    from_e164: rakam(o.karsiNumara),
    phone_number_id: o.phoneNumberId,
    zaman,
    tip: o.tip,
    govde_encrypted: encryptPII(o.govde || ''),
    media_id: o.mediaId,
    sinif: sinif.sinif,
    sinif_kaynagi: sinif.kaynak,
    hasta_id: es.hastaId,
    eslesme: es.eslesme,
  })
  if (sErr) {
    if (tabloYokMu(sErr)) return { yazildi: false, taslak: false }
    if (String(sErr.code) === '23505' || /duplicate|unique/i.test(sErr.message || '')) return { yazildi: false, taslak: false }
    throw sErr
  }

  let taslakYazildi = false
  if (yon === 'giden_hekim' && es.hastaId && es.eslesme !== 'coklu') {
    const niyet = hekimNiyeti(o.govde)
    if (niyet) {
      taslakYazildi = await taslakYaz(sb, {
        doktorId, hastaId: es.hastaId, hastaAd: es.ad, metin: o.govde, niyet, zaman, wamid: o.wamid,
      })
    }
  }

  if (yon === 'gelen' && es.eslesme !== 'coklu') {
    const metin = yanitMetni(sinif.sinif, { mesaiDisi: mesaiDisiMi(simdi), link: Boolean(es.hastaId) })
    if (metin && bag.token_encrypted) {
      const { data: once } = await sb.from('wa_satir').select('id').eq('doctor_id', doktorId).eq('kaynak_wamid', o.wamid).eq('yon', 'giden_sistem').maybeSingle()
      if (!once) {
        let token = ''
        try { token = decryptPII(String(bag.token_encrypted)) } catch { token = '' }
        if (token) {
          try { await gonder({ phoneNumberId: o.phoneNumberId, token, kime: o.karsiNumara, metin }) } catch { /* gönderilemezse defter durur */ }
          await sb.from('wa_satir').insert({
            konusma_id: konusma?.id || null,
            doctor_id: doktorId,
            yon: 'giden_sistem',
            wamid: `sistem:${o.wamid}`,
            kaynak_wamid: o.wamid,
            from_e164: rakam(o.karsiNumara),
            phone_number_id: o.phoneNumberId,
            zaman: simdi.toISOString(),
            tip: 'text',
            govde_encrypted: encryptPII(metin),
            sinif: sinif.sinif,
            sinif_kaynagi: 'sabit',
            hasta_id: es.hastaId,
            eslesme: es.eslesme,
          })
        }
      }
    }
  }
  return { yazildi: true, taslak: taslakYazildi }
}

async function hastalariBul(sb: Sb, doktorId: string, numara: string): Promise<{ hastaId: string | null; eslesme: string; ad: string }> {
  const hedef = rakam(numara)
  const { data, error } = await sb.from('patients').select('id, phone_encrypted, name_encrypted, dob_encrypted, is_active').eq('doctor_id', doktorId).eq('is_active', true).limit(2000)
  if (error || !data) return { hastaId: null, eslesme: 'bilinmeyen', ad: '' }
  const uyan: { id: string; ad: string; cocuk: boolean }[] = []
  for (const p of data) {
    let tel = ''
    try { tel = decryptPII(String(p.phone_encrypted || '')) } catch { tel = '' }
    if (!tel || rakam(tel) !== hedef) continue
    let ad = ''
    try {
      const j = JSON.parse(decryptPII(String(p.name_encrypted || '')) || '{}') as { ad?: string; soyad?: string }
      ad = `${j.ad || ''} ${j.soyad || ''}`.replace(/\s+/g, ' ').trim()
    } catch { ad = '' }
    let cocuk = false
    try {
      const dob = decryptPII(String(p.dob_encrypted || '')).slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const yas = (Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)
        cocuk = yas < 18
      }
    } catch { /* yaş yok */ }
    uyan.push({ id: String(p.id), ad, cocuk })
  }
  if (uyan.length === 0) return { hastaId: null, eslesme: 'bilinmeyen', ad: '' }
  if (uyan.length > 1) return { hastaId: null, eslesme: 'coklu', ad: '' }
  return { hastaId: uyan[0].id, eslesme: uyan[0].cocuk ? 'veli' : 'bilinen_hasta', ad: uyan[0].ad || 'Hasta' }
}

async function taslakYaz(sb: Sb, g: {
  doktorId: string
  hastaId: string
  hastaAd: string
  metin: string
  niyet: { eylem: KalkanEylem; kapsam: KalkanKapsam | null; emin: boolean }
  zaman: string
  wamid: string
}): Promise<boolean> {
  const { data: ilaclar } = await arsivsizIlaclar(sb, 'id, ilac_adi, aktif').eq('doctor_id', g.doktorId).eq('patient_id', g.hastaId).eq('aktif', true)
  const acik = (ilaclar || []).map((i) => ({ id: String(i.id), ad: String(i.ilac_adi || '') }))
  const sec = ilacSec(acik, g.metin)
  const emin = g.niyet.emin && (g.niyet.eylem !== 'ilac_durdur' || Boolean(sec))
  const metin = taslakSatiri({
    hastaAd: g.hastaAd,
    ilacAd: sec?.ad || null,
    eylem: g.niyet.eylem,
    kapsam: g.niyet.kapsam,
    zamanIso: g.zaman,
  })
  const { error } = await sb.from('wa_taslak').insert({
    doctor_id: g.doktorId,
    patient_id: g.hastaId,
    ilac_id: sec?.id || null,
    eylem: g.niyet.eylem,
    kapsam: g.niyet.kapsam,
    emin,
    metin,
    durum: 'bekliyor',
    kaynak_wamid: g.wamid,
    zaman: g.zaman,
  })
  if (error) {
    if (tabloYokMu(error) || String(error.code) === '23505') return false
    throw error
  }
  return true
}

export type { KalkanSinif }
