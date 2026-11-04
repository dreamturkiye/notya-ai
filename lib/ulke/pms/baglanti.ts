/**
 * AU-PMS — encrypted PMS credential vault (mirror of payment connections).
 * Client never receives the secret — only saglayici, baglantiDurum, sonDort.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkeTablosu } from '@/lib/ulke/uygulama/tablolar'
import { pmsDogrula } from './adapter'
import { pmsSaglayiciMi, type PmsBaglantiDurum, type PmsBaglantiOzet, type PmsRetKodu, type PmsSaglayici } from './tipler'

type Satir = {
  saglayici: PmsSaglayici
  baglanti_durum: PmsBaglantiDurum
  kimlik_encrypted: string
  son_dort: string | null
}

function alan(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function pmsBaglantilariListele(supabase: SupabaseClient, doktorId: string): Promise<PmsBaglantiOzet[]> {
  const { data } = await ulkeTablosu(supabase, 'ulke_pms_baglantilari')
    .select('saglayici, baglanti_durum, son_dort')
    .eq('doctor_id', doktorId)
  return ((data ?? []) as Array<{ saglayici: PmsSaglayici; baglanti_durum: PmsBaglantiDurum; son_dort: string | null }>).map((s) => ({
    saglayici: s.saglayici,
    baglantiDurum: s.baglanti_durum,
    sonDort: s.son_dort,
  }))
}

export async function pmsKimlikOku(
  supabase: SupabaseClient,
  doktorId: string,
  saglayici: PmsSaglayici,
): Promise<Record<string, unknown> | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_pms_baglantilari')
    .select('kimlik_encrypted')
    .eq('doctor_id', doktorId)
    .eq('saglayici', saglayici)
    .maybeSingle()
  const s = data as { kimlik_encrypted?: string } | null
  if (!s?.kimlik_encrypted) return null
  try { return JSON.parse(decrypt(s.kimlik_encrypted)) as Record<string, unknown> } catch { return null }
}

export async function pmsBaglantiKaydet(
  supabase: SupabaseClient,
  doktorId: string,
  g: Record<string, unknown>,
): Promise<{ tamam: true; ozet: PmsBaglantiOzet } | { tamam: false; kod: PmsRetKodu }> {
  if (!pmsSaglayiciMi(g.saglayici)) return { tamam: false, kod: 'GECERSIZ' }
  const anahtar = alan(g.anahtar, 2000)
  const etiket = alan(g.etiket, 80)
  if (anahtar.length < 8) return { tamam: false, kod: 'GECERSIZ' }

  const kimlik: Record<string, unknown> = {
    etiket: etiket || g.saglayici,
    anahtar,
  }
  // Magentus OAuth fields (Genie / Gentu). Optional Cliniko hastaId / shard overrides.
  for (const k of ['clientId', 'clientSecret', 'tokenUrl', 'apiUrl', 'scopes', 'hastaId', 'shard'] as const) {
    const v = alan(g[k], 2000)
    if (v) kimlik[k] = v
  }

  const dogrula = await pmsDogrula(g.saglayici, kimlik)
  const baglantiDurum: PmsBaglantiDurum = dogrula.tamam
    ? 'kimlik-kayitli'
    : dogrula.kod === 'PARTNER_YOK'
      ? 'partner-bekleniyor'
      : 'dogrulanamadi'
  const sonDort = anahtar.slice(-4)
  const { error } = await ulkeTablosu(supabase, 'ulke_pms_baglantilari').upsert({
    doctor_id: doktorId,
    saglayici: g.saglayici,
    baglanti_durum: baglantiDurum,
    kimlik_encrypted: encrypt(JSON.stringify(kimlik)),
    son_dort: sonDort,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'ulke,doctor_id,saglayici' })
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true, ozet: { saglayici: g.saglayici, baglantiDurum, sonDort } }
}

export async function pmsBaglantiSil(
  supabase: SupabaseClient,
  doktorId: string,
  saglayici: unknown,
): Promise<{ tamam: true } | { tamam: false; kod: PmsRetKodu }> {
  if (!pmsSaglayiciMi(saglayici)) return { tamam: false, kod: 'GECERSIZ' }
  const { error } = await ulkeTablosu(supabase, 'ulke_pms_baglantilari')
    .delete()
    .eq('doctor_id', doktorId)
    .eq('saglayici', saglayici)
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return { tamam: true }
}

/** Internal: load raw row for the outbox worker (includes encrypted blob). */
export async function pmsBaglantiSatiri(
  supabase: SupabaseClient,
  doktorId: string,
  saglayici: PmsSaglayici,
): Promise<Satir | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_pms_baglantilari')
    .select('saglayici, baglanti_durum, kimlik_encrypted, son_dort')
    .eq('doctor_id', doktorId)
    .eq('saglayici', saglayici)
    .maybeSingle()
  return (data as Satir | null) ?? null
}
