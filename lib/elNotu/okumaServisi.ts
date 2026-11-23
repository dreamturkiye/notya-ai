/**
 * ESNEK-MUAYENE-A — reading one page of a source on the server: validate the device's MASKED package, keep the masked
 * page in the vault (Doğrula crops are drawn from it), read it with the doctor's own lexicon / memory / vocabulary,
 * merge the page into the source, open the Doğrula questions. The vault original was uploaded separately by the device
 * (the doctor sees it in Belgeler); it is never read here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { sayfayiOku, kaynakMetni, okumaIstatistigi, type ModelKapisi, type SayfaPaketi, type SayfaSonucu, type GorselBlok } from '@/core/elNotu/okuyucu'
import { sozlukKur } from '@/core/elNotu/sozluk'
import { benzerOrnekler } from '@/core/elNotu/hafiza'
import { kelimeAnahtari } from '@/core/elNotu/uzlastir'
import type { KaynakOkuma, Kutu, HafizaOrnegi } from '@/core/elNotu/tipler'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import { tohumlarTr } from '@/core/elNotu/tohum'
import { PAKET_AZAMI_KARAKTER, paketBoyutu } from '@/core/elNotu/sayfaPaketi'
import { ilacEslesmesi } from './ilac'
import { dagarcikYukle, hafizaYukle, ornekGorselleri, sablonlarYukle, sorulmusKisaltmalar, sozlukYukle, vaultaYaz, type KaynakSatiri } from './sunucu'

const MIME = /^image\/(jpeg|png|webp)$/
const kutuMu = (k: unknown): k is Kutu => !!k && typeof k === 'object' && ['x0', 'y0', 'x1', 'y1'].every((a) => { const v = (k as Record<string, number>)[a]; return Number.isFinite(v) && v >= -0.01 && v <= 1.01 })
const gorselMu = (g: unknown): g is GorselBlok => !!g && typeof g === 'object' && typeof (g as GorselBlok).base64 === 'string' && (g as GorselBlok).base64.length > 20 && (g as GorselBlok).base64.length < 600_000 && MIME.test(String((g as GorselBlok).mime))

/** Request body → package, or null (anything malformed is refused, never "partially read"). */
export function paketCoz(x: unknown): SayfaPaketi | null {
  const p = x as SayfaPaketi
  if (!p || typeof p !== 'object' || !Number.isInteger(p.sayfa) || p.sayfa < 1 || p.sayfa > 40) return null
  if (!Array.isArray(p.satirlar) || p.satirlar.length > 90 || !Array.isArray(p.bolgeler) || p.bolgeler.length > 24) return null
  for (const s of p.satirlar) {
    if (!Number.isInteger(s?.no) || !kutuMu(s.kutu) || !gorselMu(s.gorselA) || !gorselMu(s.gorselB)) return null
    if (!Array.isArray(s.kelimeler) || !s.kelimeler.every(kutuMu) || !Array.isArray(s.tanimlar) || s.tanimlar.length !== s.kelimeler.length) return null
    for (const t of s.tanimlar) if (t !== null && (!Array.isArray(t.v) || t.v.length > 512 || !t.v.every(Number.isFinite) || !Number.isFinite(t.enBoy))) return null
  }
  for (const b of p.bolgeler) if (!b || typeof b.id !== 'string' || !kutuMu(b.kutu) || (b.gorsel != null && !gorselMu(b.gorsel)) || !Number.isFinite(b.murekkep)) return null
  return {
    sayfa: p.sayfa, sablonId: typeof p.sablonId === 'string' ? p.sablonId : null, kalite: p.kalite,
    satirlar: p.satirlar.map((s) => ({ no: s.no, kutu: s.kutu, kelimeler: s.kelimeler, tanimlar: s.tanimlar, gorselA: s.gorselA, gorselB: s.gorselB, bolgeId: typeof s.bolgeId === 'string' ? s.bolgeId : null })),
    bolgeler: p.bolgeler.map((b) => ({ id: b.id, anatomi: String(b.anatomi || ''), etiket: String(b.etiket || '').slice(0, 60), taraf: b.taraf === 'sag' || b.taraf === 'sol' || b.taraf === 'iki' ? b.taraf : null, kutu: b.kutu, murekkep: b.murekkep, gorsel: b.gorsel ?? null })),
  }
}

export type SayfaOkutGirdisi = {
  doktorId: string
  kaynak: KaynakSatiri
  paket: SayfaPaketi
  maskeliSayfa: GorselBlok & { w: number; h: number }
  orijinalBelgeId: string | null
  aktor: { userId: string; rol: PratikRol }
  model: ModelKapisi
  metin: ElNotuMetinleri
  brans: string | null
  bransAdi: string
}

export async function sayfaOkut(sb: SupabaseClient, g: SayfaOkutGirdisi): Promise<{ sayfa: SayfaSonucu; okuma: KaynakOkuma; acik: number; korumaliAcik: number } | { hata: string; durum: number }> {
  if (!gorselMu(g.maskeliSayfa)) return { hata: 'Sayfa görüntüsü geçersiz.', durum: 400 }
  if (paketBoyutu(g.paket, g.maskeliSayfa) > PAKET_AZAMI_KARAKTER) return { hata: 'Sayfa çok büyük.', durum: 413 }
  if (!g.kaynak.patient_id) return { hata: 'Kaynak bir hastaya bağlı değil.', durum: 400 }
  const patientId = g.kaynak.patient_id

  const maskeliId = await vaultaYaz(sb, { doktorId: g.doktorId, patientId, sessionId: g.kaynak.session_id, ad: `el-notu-s${g.paket.sayfa}-maskeli.jpg`, mime: g.maskeliSayfa.mime, base64: g.maskeliSayfa.base64, kategori: 'el_notu_maskeli', yukleyen: g.aktor.userId })
  await sb.from('muayene_kaynaklari').update({ durum: 'okunuyor', updated_at: new Date().toISOString() }).eq('id', g.kaynak.id).eq('doctor_id', g.doktorId)

  const [hekimSozluk, hafiza, dagarcik, sorulmus, sablonlar] = await Promise.all([
    sozlukYukle(sb, g.doktorId), hafizaYukle(sb, g.doktorId), dagarcikYukle(sb, g.doktorId), sorulmusKisaltmalar(sb, g.doktorId), sablonlarYukle(sb, g.doktorId),
  ])
  const tohum = tohumlarTr(g.brans)
  const sozluk = sozlukKur(hekimSozluk, tohum.brans, tohum.genel)
  // the doctor's most similar confirmed crops → in-context examples (only these few crops are read from the vault)
  const tanimlar = g.paket.satirlar.flatMap((s) => s.tanimlar.filter(Boolean) as { v: number[]; enBoy: number }[])
  const secilen = await ornekGorselleri(sb, g.doktorId, benzerOrnekler(tanimlar, hafiza, 12))
  const secilenId = new Set(secilen.map((o) => o.id))
  const hafizaTum: HafizaOrnegi[] = [...secilen, ...hafiza.filter((o) => !secilenId.has(o.id))]
  const anlamSozcukleri = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))

  let sayfa: SayfaSonucu
  try {
    sayfa = await sayfayiOku(g.paket, {
      bransAdi: g.bransAdi, dil: g.metin.dil, sozluk, hafiza: hafizaTum, dagarcik, ilac: ilacEslesmesi, sorulmusKisaltmalar: sorulmus,
      sozcukMu: (t) => (dagarcik.get(kelimeAnahtari(t)) || 0) >= 2 || anlamSozcukleri.has(kelimeAnahtari(t)),
    }, g.model)
  } catch (e) {
    await sb.from('muayene_kaynaklari').update({ durum: 'hata', hata_kodu: e instanceof Error ? e.name : 'Hata', updated_at: new Date().toISOString() }).eq('id', g.kaynak.id).eq('doctor_id', g.doktorId)
    return { hata: 'El yazısı okunamadı; tekrar deneyin.', durum: 502 }
  }

  // the page's masked picture (vault id) travels with the page: the Doğrula viewer cuts crops from it
  sayfa.maskeliBelgeId = maskeliId
  // merge the page into the source (same page number replaced: a retake overwrites its page, idempotent)
  const { data: guncel } = await sb.from('muayene_kaynaklari').select('okuma, maskeli_belge_ids, orijinal_belge_ids').eq('id', g.kaynak.id).eq('doctor_id', g.doktorId).maybeSingle()
  const onceki = (guncel?.okuma as { sayfalar?: SayfaSonucu[] } | null)?.sayfalar || []
  const sayfalar = [...onceki.filter((s) => s.sayfa !== sayfa.sayfa), sayfa].sort((a, b) => a.sayfa - b.sayfa)
  const sablon = sablonlar.find((s) => s.id === g.paket.sablonId)
  const bolgeEtiketi = (id: string) => sablon?.cizimBolgeleri.find((b) => b.id === id)?.etiket || g.paket.bolgeler.find((b) => b.id === id)?.etiket || id
  const okuma: KaynakOkuma = { surum: 1, sayfalar, metin: kaynakMetni(sayfalar, g.metin.dil, bolgeEtiketi), istatistik: okumaIstatistigi(sayfalar) }

  // Doğrula questions of this page (re-reading a page replaces its open questions; answered ones stay answered)
  await sb.from('okuma_dogrulamalari').delete().eq('doctor_id', g.doktorId).eq('kaynak_id', g.kaynak.id).eq('sayfa', sayfa.sayfa).eq('durum', 'acik')
  if (sayfa.dogrula.length) {
    await sb.from('okuma_dogrulamalari').upsert(sayfa.dogrula.map((d) => ({
      doctor_id: g.doktorId, patient_id: patientId, kaynak_id: g.kaynak.id, soru_anahtari: d.anahtar, sinif: d.sinif, korumali_tur: d.korumaliTur ?? null,
      okunan: d.okunan.slice(0, 400), adaylar: d.adaylar.slice(0, 6), sayfa: d.sayfa, kutu: d.kutu, durum: 'acik',
    })), { onConflict: 'doctor_id,kaynak_id,soru_anahtari', ignoreDuplicates: true })
  }
  const { data: aciklar } = await sb.from('okuma_dogrulamalari').select('sinif').eq('doctor_id', g.doktorId).eq('kaynak_id', g.kaynak.id).eq('durum', 'acik')
  const acik = (aciklar || []).length, korumaliAcik = (aciklar || []).filter((r) => r.sinif === 'korumali').length

  const maskeli = [...new Set([...((guncel?.maskeli_belge_ids as string[]) || []), maskeliId])]
  const orijinal = [...new Set([...((guncel?.orijinal_belge_ids as string[]) || []), ...(g.orijinalBelgeId ? [g.orijinalBelgeId] : [])])]
  await sb.from('muayene_kaynaklari').update({
    okuma, metin: okuma.metin, durum: acik ? 'dogrulama' : 'okundu', hata_kodu: null, sayfa_sayisi: sayfalar.length,
    maskeli_belge_ids: maskeli, orijinal_belge_ids: orijinal, sablon_id: g.paket.sablonId, acik_dogrula: acik, korumali_acik: korumaliAcik,
    updated_at: new Date().toISOString(),
  }).eq('id', g.kaynak.id).eq('doctor_id', g.doktorId)
  if (sablon) {
    const { data: sr } = await sb.from('el_notu_sablonlari').select('kullanim').eq('id', sablon.id).eq('doctor_id', g.doktorId).maybeSingle()
    await sb.from('el_notu_sablonlari').update({ kullanim: Number(sr?.kullanim || 0) + 1, updated_at: new Date().toISOString() }).eq('id', sablon.id).eq('doctor_id', g.doktorId)
  }
  return { sayfa, okuma, acik, korumaliAcik }
}
