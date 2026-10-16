/**
 * NOTYA-ASI-STOK-BARKOD-01 — modül açık/kapalı çözümü.
 *
 * .cursor/skills/specialty-doktor-araclari/SKILL.md'nin klasik ikilisine (base / branş-only)
 * UYMUYOR: bu modül 5 isimli branş için VARSAYILAN AÇIK, diğer ~25 branş için VARSAYILAN KAPALI
 * ama hekim bazında elle açılabilir. Bu yüzden klasik ORTAK_DOKTOR_ARACLARI / BRANS_DOKTOR_ARACLARI
 * listesine (branslar: SpecialtyKey[] | null ikilisi) eklenmedi — o tip yalnız "herkes" ya da
 * "sadece şu branşlar" ifade edebiliyor, "varsayılan şu branşlarda açık ama HERKES açabilir" ifade
 * edemiyor. Aynı ürün ailesindeki Faturalama & Tahsilat modülünün (lib/accounting/module.ts)
 * hekim-bazlı aç/kapa deseni genişletildi: oradaki tek `enabled` bayrağına ek olarak burada bir de
 * "branş varsayılanı" katmanı var. aktif_override NULL ise branş varsayılanı geçerli; dolu ise
 * (true/false) hekimin kendi seçimi branş varsayılanının üzerine geçer.
 *
 * Kapalıyken: HİÇBİR stok/barkod arayüzü görünmez (muayene ekranındaki tarama bileşeni, Entegrasyonlar
 * kartındaki stok listesi) — branş alan sızması kuralına (.cursor/skills/brans-alan-sizmasi) eşdeğer
 * bir ciddiyetle: açık olmayan bir hekime/branşa modül UI'ı asla sızmaz, "görünür ama devre dışı"
 * kontrol de yok.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { portalBransAnahtari } from '@/lib/portal/moduller'

/** Jinekoloji ürün kataloğunda "Kadın Hastalıkları ve Doğum" anahtarı ile var (lib/asistan/turkishSpecialtyRefs.ts) — ayrı bir 'jinekoloji' SpecialtyKey yok. */
export const ASI_STOK_VARSAYILAN_ACIK_BRANSLAR: readonly SpecialtyKey[] = [
  'pediatri',
  'aile-hekimligi',
  'enfeksiyon-hastaliklari',
  'kadin-hastaliklari-dogum',
  'dahiliye',
]

export type AsiStokModulAyari = {
  doktorId: string
  aktifOverride: boolean | null
  faturaVarsayilan: boolean
}

export async function getAsiStokModulAyari(supabase: SupabaseClient, doktorId: string): Promise<AsiStokModulAyari> {
  const { data } = await supabase
    .from('asi_stok_modul_ayarlari')
    .select('doktor_id, aktif_override, fatura_varsayilan')
    .eq('doktor_id', doktorId)
    .maybeSingle()
  if (!data) return { doktorId, aktifOverride: null, faturaVarsayilan: false }
  return {
    doktorId,
    aktifOverride: data.aktif_override === null || data.aktif_override === undefined ? null : !!data.aktif_override,
    faturaVarsayilan: !!data.fatura_varsayilan,
  }
}

export async function setAsiStokModulAyari(
  supabase: SupabaseClient,
  doktorId: string,
  patch: { aktifOverride?: boolean | null; faturaVarsayilan?: boolean },
): Promise<AsiStokModulAyari> {
  const current = await getAsiStokModulAyari(supabase, doktorId)
  const next: AsiStokModulAyari = {
    doktorId,
    aktifOverride: patch.aktifOverride === undefined ? current.aktifOverride : patch.aktifOverride,
    faturaVarsayilan: patch.faturaVarsayilan === undefined ? current.faturaVarsayilan : patch.faturaVarsayilan,
  }
  await supabase
    .from('asi_stok_modul_ayarlari')
    .upsert(
      { doktor_id: doktorId, aktif_override: next.aktifOverride, fatura_varsayilan: next.faturaVarsayilan, updated_at: new Date().toISOString() },
      { onConflict: 'doktor_id' },
    )
  return next
}

/** Branş serbest metin → SpecialtyKey (users.specialty aynı çözümleyici — portalBransAnahtari). */
export function asiStokBransAnahtari(hamBrans: string | null | undefined): SpecialtyKey | null {
  return portalBransAnahtari(hamBrans)
}

export function asiStokBransVarsayilaniAcikMi(hamBrans: string | null | undefined): boolean {
  const key = asiStokBransAnahtari(hamBrans)
  return !!key && ASI_STOK_VARSAYILAN_ACIK_BRANSLAR.includes(key)
}

/** Etkin açık/kapalı: override varsa o, yoksa branş varsayılanı. */
export function asiStokEtkinDurum(ayar: AsiStokModulAyari, hamBrans: string | null | undefined): boolean {
  if (ayar.aktifOverride !== null) return ayar.aktifOverride
  return asiStokBransVarsayilaniAcikMi(hamBrans)
}

export async function asiStokModuluAktifMi(
  supabase: SupabaseClient,
  doktorId: string,
  hamBrans: string | null | undefined,
): Promise<boolean> {
  const ayar = await getAsiStokModulAyari(supabase, doktorId)
  return asiStokEtkinDurum(ayar, hamBrans)
}

/** Yardımcı: doktorun branşını kendisi okuyup modülün etkin durumunu döner — her rotada tekrarlamamak için. */
export async function asiStokModuluAktifMiDoktor(supabase: SupabaseClient, doktorId: string): Promise<boolean> {
  const { data } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  return asiStokModuluAktifMi(supabase, doktorId, data?.specialty ?? null)
}
