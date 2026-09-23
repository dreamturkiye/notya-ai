/**
 * NOTYA-CEK-DOGRULA-02 — çek listesinin tek sunucu kaynağı: not üretimi (sessions/[id]/end), not sayfası
 * (GET /api/notes/[id]), onay (notes/[id]/approve) ve veri düzeltmesi aynı fonksiyonu kullanır.
 *
 * Girdiler: maddeler (branş + yaş bandı + pediatride hastanın tarama / M-CHAT / GİDR kayıtları — kohort ve Gelişim
 * paneliyle AYNI yükleyici) ve 'dosya' kapsamındaki maddelerden dosyanın başka bir yerinde karşılananlar (önceki
 * onaylı notlar, ilk kayıt formu, ilaç listesi, tarama / aşı kayıtları). Durum hesabı saftır (cekListeDogrula):
 * notun GÜNCEL alanları + bu girdiler. LLM bu bloğu yazmaz.
 *
 * HASTA-IZOLASYON: patientId çağıranın doktor kapsamlı not / seans satırından gelir; buradaki her sorgu yine
 * doctor_id / doktor_id ile daraltılır. Arşivlenmiş muayenenin notu ve yazdığı ilaçlar dosya sayılmaz (arsivsiz*).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizIlaclar, arsivsizNotlar } from '@/lib/doktor/arsiv'
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { taramaNotSatiri } from '@/specialties/pediatri/engines/gelisimPlan'
import type { SaglamCocukKayitlari } from '@/specialties/pediatri/engines/saglamCocukCek'
import {
  cekHekimIsaretleri,
  cekListeDogrula,
  cekListeDogrulamaMetni,
  cekNotMetni,
  cekOncekiKarsilanan,
  muayeneCekListesi,
  type CekDogrulamaSatir,
  type CekMadde,
} from '@/lib/doktor/muayeneCekListesi'

export interface CekListeVerisi {
  maddeler: CekMadde[]
  /** 'dosya' kapsamındaki maddelerden dosyanın başka bir kaydında karşılananlar. */
  oncekiIdler: string[]
}

export interface CekListeSunucuGirdisi {
  doktorId: string
  patientId: string | null
  seansBransi: string | null
  doktorBransi: string | null
  hastaDogumIso: string | null
  /** Vizit tarihi (notun created_at'i ya da geçmiş tarihli muayene) — yaş bandı ve "önceki" sınırı. */
  referansIso: string | null
  /** Değerlendirilen notun kendisi önceki kayıt sayılmaz. */
  haricNotId?: string | null
}

// Kimlik / iletişim alanları dosya metnine girmez ("Asiye" adı "aşı" sayılmasın, doğum yeri "doğum öyküsü" sayılmasın).
const INTAKE_DISI = new Set([
  'tcKimlik', 'tcKimlikNo', 'ad', 'soyad', 'telefon', 'eposta', 'adres', 'il', 'ilce', 'acilKisiAdi', 'acilKisiTelefon', 'acilKisiYakinlik',
  'policeNo', 'kurumAdi', 'veliAd', 'veliSoyad', 'veliTelefon', 'veliDigerAdSoyad', 'veliKimlikTeyidi', 'veliYakinligi', 'babaAdi', 'anneAdi',
  'dogumTarihi', 'dogumYeri', 'cinsiyet', 'medeniDurum', 'sigortaTuru', 'kvkkOnay', 'iletisimOnay', 'basvuruNedeniPed', 'basvuruNedeni',
])

const NOT_ALANLARI = 'id, created_at, basvuru_yakinmasi, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_anamnez, content_fizik_muayene, content_tani, content_tedavi, content_ilaclar, sessions!inner(patient_id, doctor_id)'

async function pediKayitlariYukle(sb: SupabaseClient, doktorId: string, patientId: string): Promise<{ kayit: SaglamCocukKayitlari; satirlar: string[] } | null> {
  // Kohort / Gelişim paneliyle aynı yükleyici (bebek kartı işitmesi dahil) — kopya sorgu yok.
  const { pediKohortGirdileri } = await import('@/app/api/doktor/pediatri/_kohort')
  const bugun = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { girdiler } = await pediKohortGirdileri(sb, doktorId, bugun, [patientId])
  const g = girdiler[0]
  if (!g) return null
  const satirlar = [
    ...g.taramalar.map((t) => taramaNotSatiri(t.tur, t.sonuc, t.tarih)),
    ...g.asilar.map((a) => `Aşı: ${a.ad}${a.dozNo ? ` ${a.dozNo}. doz` : ''}${a.tarih ? ` (${a.tarih})` : ''}`),
    ...g.mchat.map((x) => `M-CHAT-R/F (${x.tarih})`),
    ...g.gidr.map((x) => `GİDR gelişim değerlendirmesi (${x.tarih})`),
  ]
  return {
    kayit: { taramalar: g.taramalar, mchat: g.mchat, gidr: g.gidr, seanslar: g.seanslar, gebelikHaftasi: g.gebelikHaftasi, dogumKiloGr: g.dogumKiloGr },
    satirlar,
  }
}

/** Hastanın dosyası (bu not hariç) tek metin: önceki onaylı notlar, ilk kayıt formu, ilaç listesi. */
async function dosyaMetniYukle(sb: SupabaseClient, g: CekListeSunucuGirdisi, ek: string[]): Promise<string> {
  if (!g.patientId) return ek.join('\n')
  const sinir = g.referansIso || new Date().toISOString()
  let nq = arsivsizNotlar(sb, NOT_ALANLARI)
    .eq('doctor_id', g.doktorId)
    .eq('sessions.doctor_id', g.doktorId)
    .eq('sessions.patient_id', g.patientId)
    .not('approved_at', 'is', null)
    .lt('created_at', sinir)
  if (g.haricNotId) nq = nq.neq('id', g.haricNotId)
  const [notQ, ilacQ, intakeQ] = await Promise.all([
    nq.order('created_at', { ascending: false }).limit(30),
    arsivsizIlaclar(sb, 'ilac_adi, etken_madde').eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).limit(200),
    sb.from('hasta_intake_formlari').select('form_data_encrypted').eq('patient_id', g.patientId).eq('doktor_id', g.doktorId).order('created_at', { ascending: false }).limit(1),
  ])
  const p: string[] = [...ek]
  for (const n of (notQ.data || []) as Record<string, unknown>[]) {
    p.push(cekNotMetni({
      basvuruYakinmasi: n.basvuru_yakinmasi as string, subjektif: n.content_subjektif as string, objektif: n.content_objektif as string,
      degerlendirme: n.content_degerlendirme as string, plan: n.content_plan as string, anamnez: n.content_anamnez as string,
      fizikMuayene: n.content_fizik_muayene as string, tani: n.content_tani as string, tedavi: n.content_tedavi as string, ilaclar: n.content_ilaclar,
    }))
  }
  for (const i of (ilacQ.data || []) as { ilac_adi?: string | null; etken_madde?: string | null }[]) {
    p.push(`İlaç: ${[i.ilac_adi, i.etken_madde].filter(Boolean).join(' ')}`)
  }
  const form = (intakeQ.data?.[0] as { form_data_encrypted?: string } | undefined)?.form_data_encrypted
  if (form) {
    try {
      const y = JSON.parse(decrypt(form)) as Record<string, unknown>
      for (const [k, v] of Object.entries(y)) {
        if (INTAKE_DISI.has(k) || v == null || v === '') continue
        const d = Array.isArray(v) ? v.join(', ') : String(v)
        if (d.trim()) p.push(`${k}: ${d}`)
      }
    } catch { /* form çözülemedi — dosya metni eksik kalır, madde "eksik" görünür (uydurma yok) */ }
  }
  return p.join('\n')
}

/** Maddeler + dosyada karşılananlar. Hata olursa dosya kısmı boş kalır (madde eksik görünür, uydurulmaz). */
export async function cekListeVerisiYukle(sb: SupabaseClient, g: CekListeSunucuGirdisi): Promise<CekListeVerisi> {
  const ped = !!g.patientId && !!g.hastaDogumIso && pediatrikBaglamMi({ seansBransi: g.seansBransi, doktorBransi: g.doktorBransi, hastaDogumIso: g.hastaDogumIso })
  let pedi: Awaited<ReturnType<typeof pediKayitlariYukle>> = null
  if (ped) {
    try { pedi = await pediKayitlariYukle(sb, g.doktorId, g.patientId!) } catch (e) { console.error('[cek-liste] pedi kayıtları', e) }
  }
  const maddeler = muayeneCekListesi({
    seansBransi: g.seansBransi,
    doktorBransi: g.doktorBransi,
    hastaDogumIso: g.hastaDogumIso,
    referansIso: g.referansIso,
    pediKayitlari: pedi?.kayit ?? null,
  })
  let oncekiIdler: string[] = []
  if (maddeler.some((m) => m.kapsam === 'dosya')) {
    try { oncekiIdler = cekOncekiKarsilanan(maddeler, await dosyaMetniYukle(sb, g, pedi?.satirlar ?? [])) } catch (e) { console.error('[cek-liste] dosya', e) }
  }
  return { maddeler, oncekiIdler }
}

/** Deterministik blok: notun güncel metni + hekim işaretleri + dosya. */
export function cekListeHesapla(
  veri: CekListeVerisi,
  notMetni: string,
  isaretler: Record<string, boolean>,
): { satirlar: CekDogrulamaSatir[]; metin: string } {
  const satirlar = cekListeDogrula(veri.maddeler, { soap: notMetni, isaretler, oncekiIdler: veri.oncekiIdler })
  return { satirlar, metin: cekListeDogrulamaMetni(satirlar) }
}

/** Kayıtlı bloktan hekim işaretlerini geri oku (not sayfasında işaret arayüzü yok; seansta verilen işaret korunur). */
export function kayitliHekimIsaretleri(aiDegerlendirme: string | null | undefined, veri: CekListeVerisi): Record<string, boolean> {
  return cekHekimIsaretleri(aiDegerlendirme, veri.maddeler)
}
