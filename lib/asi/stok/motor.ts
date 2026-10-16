/**
 * NOTYA-ASI-STOK-BARKOD-01 — çekirdek motor: stok ekleme, listeleme, barkod tarama, tek-aksiyon
 * uygulama (stok düş + muayeneye/karneye yaz + e-Nabız'a hazırla + isteğe bağlı faturaya ekle).
 *
 * HASTA-IZOLASYON-01: her fonksiyon doktor_id'yi aynı sorguda zorunlu kılar; dışarıdan gelen
 * patientId/sessionId/lotId hiçbir okuma/yazmadan önce bu doktora ait olduğu kanıtlanmadan kullanılmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'
import { barkodBilgisi } from './barkod'
import { sktDurumu, type AsiStokLotu, type AsiTaramaSonucu, type AsiUygulamaGirdisi, type AsiUygulamaSonucu } from './tipler'

function bugunTr(): string {
  return new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
}

function rowToLot(r: Record<string, any>): AsiStokLotu {
  return {
    id: r.id,
    doktorId: r.doktor_id,
    asiAdi: r.asi_adi,
    barkod: r.barkod,
    lotNo: r.lot_no ?? null,
    miktar: r.miktar,
    sonKullanmaTarihi: r.son_kullanma_tarihi ?? null,
    birimFiyatKurus: r.birim_fiyat_kurus ?? null,
    varsayilanUygulamaBolgesi: r.varsayilan_uygulama_bolgesi ?? null,
    notlar: r.notlar ?? null,
    aktif: r.aktif !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export class AsiStokHatasi extends Error {}

export async function lotlariListele(supabase: SupabaseClient, doktorId: string): Promise<AsiStokLotu[]> {
  const { data, error } = await supabase
    .from('asi_stok_lotlari')
    .select('*')
    .eq('doktor_id', doktorId)
    .order('asi_adi', { ascending: true })
  if (error) throw new AsiStokHatasi('Stok listesi okunamadı.')
  return (data || []).map(rowToLot)
}

/** Yeni lot açar ya da aynı barkod varsa miktarını artırır (yeni/mevcut lota ekleme). */
export async function stokEkle(
  supabase: SupabaseClient,
  doktorId: string,
  girdi: {
    asiAdi: string
    barkod: string
    lotNo?: string | null
    miktar: number
    sonKullanmaTarihi?: string | null
    birimFiyatKurus?: number | null
    varsayilanUygulamaBolgesi?: string | null
    notlar?: string | null
  },
): Promise<AsiStokLotu> {
  const asiAdi = String(girdi.asiAdi || '').trim()
  const barkod = String(girdi.barkod || '').trim()
  const miktar = Number(girdi.miktar)
  if (!asiAdi) throw new AsiStokHatasi('Aşı adı zorunludur.')
  if (!barkod) throw new AsiStokHatasi('Barkod / lot numarası zorunludur.')
  if (!Number.isFinite(miktar) || miktar <= 0) throw new AsiStokHatasi('Miktar pozitif bir sayı olmalıdır.')

  const { data: mevcut } = await supabase
    .from('asi_stok_lotlari')
    .select('*')
    .eq('doktor_id', doktorId)
    .eq('barkod', barkod)
    .maybeSingle()

  let lot: Record<string, any>
  if (mevcut) {
    const { data, error } = await supabase
      .from('asi_stok_lotlari')
      .update({
        miktar: mevcut.miktar + miktar,
        son_kullanma_tarihi: girdi.sonKullanmaTarihi ?? mevcut.son_kullanma_tarihi,
        birim_fiyat_kurus: girdi.birimFiyatKurus ?? mevcut.birim_fiyat_kurus,
        varsayilan_uygulama_bolgesi: girdi.varsayilanUygulamaBolgesi ?? mevcut.varsayilan_uygulama_bolgesi,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mevcut.id)
      .eq('doktor_id', doktorId)
      .select()
      .single()
    if (error || !data) throw new AsiStokHatasi('Stok güncellenemedi.')
    lot = data
  } else {
    const { data, error } = await supabase
      .from('asi_stok_lotlari')
      .insert({
        doktor_id: doktorId,
        asi_adi: asiAdi,
        barkod,
        lot_no: girdi.lotNo || null,
        miktar,
        son_kullanma_tarihi: girdi.sonKullanmaTarihi || null,
        birim_fiyat_kurus: girdi.birimFiyatKurus ?? null,
        varsayilan_uygulama_bolgesi: girdi.varsayilanUygulamaBolgesi || null,
        notlar: girdi.notlar || null,
      })
      .select()
      .single()
    if (error || !data) throw new AsiStokHatasi('Stok oluşturulamadı.')
    lot = data
  }

  await supabase.from('asi_stok_hareketleri').insert({
    lot_id: lot.id,
    doktor_id: doktorId,
    tur: 'ekleme',
    miktar_degisim: miktar,
  })
  return rowToLot(lot)
}

/** Barkod tarama: lotu bulur, SKT durumunu ve engellenip engellenmeyeceğini döner. Stok yazmaz. */
export async function barkodTara(supabase: SupabaseClient, doktorId: string, hamBarkod: string): Promise<AsiTaramaSonucu> {
  const bilgi = barkodBilgisi(hamBarkod)
  // Önce tam eşleşme (doktorun kendi barkod alanı = taranan ham kod), sonra GS1'den çıkan GTIN+LOT anahtarıyla dene.
  let { data } = await supabase.from('asi_stok_lotlari').select('*').eq('doktor_id', doktorId).eq('barkod', bilgi.ham).maybeSingle()
  if (!data && bilgi.anahtar !== bilgi.ham) {
    const r2 = await supabase.from('asi_stok_lotlari').select('*').eq('doktor_id', doktorId).eq('barkod', bilgi.anahtar).maybeSingle()
    data = r2.data
  }
  if (!data) return { bulundu: false, barkod: bilgi.ham }

  const lot = rowToLot(data)
  const durum = sktDurumu(lot.sonKullanmaTarihi, bugunTr())
  return {
    bulundu: true,
    lot,
    sktDurumu: durum,
    stokVarMi: lot.miktar > 0,
    // Varsayılan: süresi geçmiş lot HER ZAMAN engellenir (brief: "default to blocking expired lots").
    engellenir: durum === 'gecti',
  }
}

/**
 * Tek-aksiyon uygulama: atomik stok düşümü (RPC asi_stok_dekrement — Postgres satır kilidi) →
 * `asilar`a lot bağlantılı satır (muayene/aşı karnesi hem tek tablo) → e-Nabız hazır (asilar satırı
 * var olmak kendisi yeterli; bkz. lib/enabiz/paket.ts enabizAsiUygulama) → isteğe bağlı fatura satırı.
 */
export async function asiUygula(
  supabase: SupabaseClient,
  doktorId: string,
  girdi: AsiUygulamaGirdisi,
): Promise<AsiUygulamaSonucu> {
  if (!(await hastaSahibiMi(supabase, doktorId, girdi.patientId))) throw new AsiStokHatasi('Hasta bulunamadı.')

  let sessionId: string | null = null
  if (girdi.sessionId) {
    const seans = await seansSahibi(supabase, doktorId, girdi.sessionId)
    if (!seans || seans.patient_id !== girdi.patientId) throw new AsiStokHatasi('Muayene bulunamadı.')
    sessionId = girdi.sessionId
  }

  let lotId = girdi.lotId
  if (!lotId && girdi.barkod) {
    const tarama = await barkodTara(supabase, doktorId, girdi.barkod)
    if (!tarama.bulundu) throw new AsiStokHatasi('Barkod stokta bulunamadı.')
    lotId = tarama.lot.id
  }
  if (!lotId) throw new AsiStokHatasi('lotId ya da barkod zorunludur.')

  // Ön kontrol: SKT geçmişse hiç denemeden reddet (RPC de miktarı korur ama burada net bir mesaj verelim).
  const { data: lotOncesi } = await supabase.from('asi_stok_lotlari').select('*').eq('id', lotId).eq('doktor_id', doktorId).maybeSingle()
  if (!lotOncesi) throw new AsiStokHatasi('Lot bulunamadı.')
  if (sktDurumu(lotOncesi.son_kullanma_tarihi, bugunTr()) === 'gecti') {
    throw new AsiStokHatasi('Bu lotun son kullanma tarihi geçmiş — uygulama kaydedilemez.')
  }

  // ATOMİK DÜŞÜM — tek UPDATE...RETURNING, Postgres satır kilidi. 0 satır = eşzamanlı başka bir
  // tarama stoğu tüketti (ya da zaten 0'dı); burada hiçbir ikinci düşüş hiçbir koşulda olmaz.
  const { data: dusumSonuc, error: dusumHata } = await supabase.rpc('asi_stok_dekrement', { p_lot_id: lotId, p_doktor_id: doktorId })
  const dusenLot = Array.isArray(dusumSonuc) ? dusumSonuc[0] : dusumSonuc
  if (dusumHata || !dusenLot) throw new AsiStokHatasi('Stok tükendi — bu lottan uygulanacak doz kalmadı.')

  const uygulamaBolgesi = girdi.uygulamaBolgesi || lotOncesi.varsayilan_uygulama_bolgesi || null
  const bugun = bugunTr()
  const { data: asilarRow, error: asilarHata } = await supabase
    .from('asilar')
    .insert({
      doktor_id: doktorId,
      patient_id: girdi.patientId,
      asi_adi: lotOncesi.asi_adi,
      kategori: 'yetiskin',
      uygulama_tarihi: bugun,
      kaynak: 'kayit',
      lot_id: lotId,
      lot_barkod_anlik: lotOncesi.barkod,
      lot_no_anlik: lotOncesi.lot_no,
      uygulama_bolgesi: uygulamaBolgesi,
      session_id: sessionId,
      notlar: 'Aşı Stok ve Barkod Sistemi ile kaydedildi.',
    })
    .select()
    .single()
  if (asilarHata || !asilarRow) {
    // Telafi: stok satırı yazılamazsa düşümü geri al — hastaya kayıt yok, stok da haksız yere düşmesin.
    await supabase.from('asi_stok_lotlari').update({ miktar: dusenLot.miktar + 1, updated_at: new Date().toISOString() }).eq('id', lotId).eq('doktor_id', doktorId)
    throw new AsiStokHatasi('Uygulama kaydedilemedi — stok geri alındı.')
  }

  await supabase.from('asi_stok_hareketleri').insert({
    lot_id: lotId,
    doktor_id: doktorId,
    tur: 'uygulama',
    miktar_degisim: -1,
    patient_id: girdi.patientId,
    session_id: sessionId,
    asilar_id: asilarRow.id,
  })

  const fatura = girdi.faturayaEkle ? await faturayaEkle(supabase, doktorId, { ...rowToLot(dusenLot), birimFiyatKurus: lotOncesi.birim_fiyat_kurus }, girdi.patientId, sessionId, asilarRow.id) : { eklendi: false as const }

  return {
    asilarId: asilarRow.id,
    lot: rowToLot({ ...lotOncesi, ...dusenLot }),
    kalanMiktar: dusenLot.miktar,
    eNabizHazir: true,
    fatura,
  }
}

async function faturayaEkle(
  supabase: SupabaseClient,
  doktorId: string,
  lot: AsiStokLotu,
  patientId: string,
  sessionId: string | null,
  asilarId: string,
): Promise<{ eklendi: boolean; faturaId?: string; sebep?: string }> {
  try {
    const { isAccountingEnabled, getModuleSettings } = await import('@/lib/accounting/module')
    if (!(await isAccountingEnabled(supabase, doktorId))) return { eklendi: false, sebep: 'Faturalama & Tahsilat modülü kapalı.' }

    const { data: hizmet } = await supabase
      .from('accounting_services')
      .select('id, name, price_kurus, kdv_rate_bp')
      .eq('doctor_id', doktorId)
      .eq('active', true)
      .eq('kind', 'asi')
      .ilike('name', lot.asiAdi)
      .maybeSingle()

    const ayarlar = await getModuleSettings(supabase, doktorId)
    const unitPriceKurus = hizmet?.price_kurus ?? lot.birimFiyatKurus
    if (unitPriceKurus == null) return { eklendi: false, sebep: `"${lot.asiAdi}" için katalogda fiyat ya da lot birim fiyatı yok.` }
    const kdvRateBp = hizmet?.kdv_rate_bp ?? ayarlar.defaultKdvRateBp

    const { createDraftInvoice } = await import('@/lib/accounting/invoices/engine')
    const fatura = await createDraftInvoice(supabase, { userId: doktorId, doktorId, role: 'doktor' }, {
      patientId,
      encounterId: sessionId,
      lines: [
        {
          serviceId: hizmet?.id,
          description: hizmet?.name || `${lot.asiAdi} (lot ${lot.lotNo || lot.barkod})`,
          quantity: 1,
          unitPriceKurus,
          kdvRateBp,
        },
      ],
    })
    return { eklendi: true, faturaId: fatura.id }
  } catch (e) {
    // Fatura isteğe bağlıdır — uygulama kaydını hiçbir koşulda bu adım geriye almaz/bloklamaz.
    return { eklendi: false, sebep: e instanceof Error ? e.message : 'Fatura satırı eklenemedi.' }
  }
}
