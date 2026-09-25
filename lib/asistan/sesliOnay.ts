/**
 * NOTYA-TEK-BEYIN — sesli "Evet / Onaylıyorum / Hayır" (Kaan, 2026-09-25).
 *
 * Bir model turu DEĞİLDİR: /api/asistan/ses-llm, doktorun cümlesi net bir onay ya da ret ise (sesKapilari —
 * tek kelime, belirsizse asla) ve bu oturumda bekleyen bir kart varsa buraya gelir; model hiç çağrılmaz. Kayıt
 * dokunuşla AYNI omurgadan geçer (core/eylemler/onayla.ts), ses kapıları önce: ciddi ilaç uyarısı ya da boş zorunlu
 * alan sesle onaylanamaz. Bu modül bilerek ayseCevapla'dan ayrı durur — model turunun koştuğu kod onay yoluna
 * erişemez (core/eylemler/tests/sessizYol.test.ts).
 *
 * HASTA-IZOLASYON-01: oturum id + doctor_id; öneriler doctor_id ile okunur, hastası hastaSahibiMi ile yeniden
 * doğrulanır; öneri kimlikleri yalnız sunucunun kendi yazdığı oturum bağlamından (bekleyenOneriler) gelir.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { SOHBET_SAKLANAN_MESAJ } from '@/lib/ai/modeller'
import { eylemBul } from '@/core/eylemler/kayit'
import { eylemOnayla, eylemVazgec } from '@/core/eylemler/onayla'
import { sesCiddiUyariEngeli, sesEksikAlanEngeli, sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import type { IlacUyarisi } from '@/core/eylemler/ilacUyari'
import type { HazirOneri } from '@/core/eylemler/oneri'
import type { OturumMesaji } from '@/lib/asistan/ayseCevapla'

function kimlikListesi(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, 10) : []
}

/** Net sözlü onay / ret mi? (Değilse cümle normal sohbete gider.) */
export function sesliKararCumlesiMi(mesaj: string): boolean {
  return sesOnayMetniGecerliMi(mesaj) || sesVazgecMetniMi(mesaj)
}

/**
 * Bekleyen kart varsa kararı uygular, turu ortak oturuma yazar ve söylenecek cümleyi döner.
 * Bekleyen kart yoksa null — çağıran cümleyi ayseCevapla'ya verir.
 */
export async function sesliKarariUygula(supabase: SupabaseClient, doktorId: string, oturumId: string, mesaj: string): Promise<{ soz: string } | null> {
  if (!sesliKararCumlesiMi(mesaj)) return null
  const { data: oturum } = await supabase
    .from('asistan_sessions')
    .select('id, messages, active_context')
    .eq('id', oturumId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (!oturum) return null
  const baglam = ((oturum as { active_context?: Record<string, unknown> }).active_context || {})
  const ids = kimlikListesi(baglam.bekleyenOneriler)
  if (!ids.length) return null
  const { data } = await supabase
    .from('eylem_onerileri')
    .select('id, doctor_id, hasta_id, eylem_anahtar, veri, eksik_alanlar, uyari_detay, durum')
    .in('id', ids)
    .eq('doctor_id', doktorId)
    .eq('durum', 'taslak')
  const taslaklar = (data || []) as { id: string; hasta_id: string; eylem_anahtar: string; veri: Record<string, unknown> | null; uyari_detay: IlacUyarisi[] | null }[]
  if (!taslaklar.length) return null

  const karar = await uygula(supabase, doktorId, taslaklar, sesOnayMetniGecerliMi(mesaj))
  const zaman = new Date().toISOString()
  const mesajlar = ((oturum as { messages?: OturumMesaji[] }).messages || [])
  await supabase.from('asistan_sessions').update({
    messages: [
      ...mesajlar,
      { role: 'user', content: mesaj, kanal: 'ses', zaman },
      { role: 'assistant', content: karar.soz, kanal: 'ses', zaman },
    ].slice(-SOHBET_SAKLANAN_MESAJ),
    active_context: { ...baglam, bekleyenOneriler: karar.kalan },
  }).eq('id', oturumId).eq('doctor_id', doktorId)
  return { soz: karar.soz }
}

async function uygula(
  supabase: SupabaseClient,
  doktorId: string,
  taslaklar: { id: string; hasta_id: string; eylem_anahtar: string; veri: Record<string, unknown> | null; uyari_detay: IlacUyarisi[] | null }[],
  onay: boolean,
): Promise<{ soz: string; kalan: string[] }> {
  if (!onay) {
    for (const t of taslaklar) await eylemVazgec(supabase, doktorId, t.id)
    return { soz: 'Tamam, vazgeçtim — dosyaya hiçbir şey yazılmadı.', kalan: [] }
  }
  if (taslaklar.length > 1) {
    return { soz: 'Birden fazla bekleyen kart var. Ekrandaki kartlardan onaylayın Hocam.', kalan: taslaklar.map((t) => t.id) }
  }
  const t = taslaklar[0]
  if (!(await hastaSahibiMi(supabase, doktorId, t.hasta_id))) return { soz: 'Hasta bulunamadı.', kalan: [] }
  const eylem = eylemBul(String(t.eylem_anahtar))
  if (!eylem) return { soz: 'Bu eylem artık tanımlı değil.', kalan: [] }
  const ciddi = sesCiddiUyariEngeli(t.uyari_detay || [])
  if (ciddi) return { soz: ciddi, kalan: [t.id] }
  const eksik = sesEksikAlanEngeli(eylem.zorunlu, (t.veri || {}) as Record<string, unknown>, eylem.alanlar)
  if (eksik) return { soz: eksik, kalan: [t.id] }
  const { data: u } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const s = await eylemOnayla({
    supabase,
    doktorId,
    oneriId: t.id,
    brans: bransAnahtari((u as { specialty?: string } | null)?.specialty),
    // Spoken Evet is the deliberate ack for voice; serious warnings already blocked above.
    uyariGoruldu: false,
  })
  if (!s.ok) return { soz: s.hata, kalan: [t.id] }
  return { soz: `Kaydedildi Hocam — ${s.etiket}.`, kalan: [] }
}

/**
 * NOTYA-SES-KART-GUNCELLE-01 (Dr. Gökhan, 2026-09-23): sesle aynı hasta + aynı eylem için yeni kart hazırlandıysa
 * önceki bekleyen taslak geri çekilir — ekranda ve "Evet"te tek, güncel kart kalır.
 */
export async function eskiSesTaslaklariniCek(supabase: SupabaseClient, doktorId: string, onceki: string[], yeniler: HazirOneri[], hastaId: string | null): Promise<void> {
  const ids = onceki.filter((id) => !yeniler.some((o) => o.id === id))
  if (!ids.length || !hastaId) return
  try {
    const { data } = await supabase.from('eylem_onerileri').select('id, eylem_anahtar, hasta_id')
      .in('id', ids).eq('doctor_id', doktorId).eq('durum', 'taslak')
    for (const r of (data || []) as { id: string; eylem_anahtar: string; hasta_id: string }[]) {
      if (r.hasta_id === hastaId && yeniler.some((o) => o.eylem_anahtar === r.eylem_anahtar)) await eylemVazgec(supabase, doktorId, r.id)
    }
  } catch { /* eski kart taslak olarak kalır — 24 saatte düşer */ }
}
