/**
 * ASI-KARNESI-01 (C) — dijital aşı karnesinin sunucu tarafı veri toplayıcısı. Sağlığım bundle'ı, portal PDF'i ve hekim
 * PDF'i AYNI fonksiyondan beslenir (tek içerik — lib/asi/karneBelgesi.ts).
 *
 * HASTA-IZOLASYON-01: çağıran (doctorId, patientId) çiftini ÖNCE doğrulamış olmalı (portal: token satırı; hekim:
 * hastaSahibiMi). Burada her okuma yine İKİ kimlikle daraltılır — başka hekimin bu hastaya iliştirdiği satır karneye girmez.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { asiKarnesiOlustur, type AsiKarnesi, type AsiKaydiSatiri } from './karneBelgesi'

const coz = (v: unknown): string | null => {
  if (!v) return null
  try { return decrypt(String(v)) } catch { return null }
}

/** Türkiye takvim günü (UTC+3). */
export const bugunTrIso = (): string => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

export async function asiKarnesiVerisi(sb: SupabaseClient, doctorId: string, patientId: string, bugunIso = bugunTrIso()): Promise<AsiKarnesi> {
  const [asiQ, hastaQ, hekimQ] = await Promise.all([
    // select('*'): 084 kolonları (belge_id) uygulanmamış ortamda da sorgu düşmesin.
    sb.from('asilar').select('*').eq('doktor_id', doctorId).eq('patient_id', patientId).limit(300),
    sb.from('patients').select('name_encrypted, dob_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle(),
    sb.from('users').select('full_name, recete_baslik').eq('id', doctorId).maybeSingle(),
  ])
  let adSoyad: string | null = null
  try {
    const j = JSON.parse(coz(hastaQ.data?.name_encrypted) || '{}') as { ad?: string; soyad?: string }
    adSoyad = `${j.ad || ''} ${j.soyad || ''}`.trim() || null
  } catch { adSoyad = null }
  const baslik = (hekimQ.data?.recete_baslik || null) as { satirlar?: unknown } | null
  const satirlar = Array.isArray(baslik?.satirlar) ? (baslik!.satirlar as unknown[]).map((x) => String(x || '').trim()).filter(Boolean) : []
  return asiKarnesiOlustur({
    asilar: (asiQ.data || []) as AsiKaydiSatiri[],
    hasta: { adSoyad, dogumTarihi: (coz(hastaQ.data?.dob_encrypted) || '').slice(0, 10) || null },
    hekim: { ad: String(hekimQ.data?.full_name || '').trim() || null, klinik: satirlar.slice(0, 2).join(' · ') || null },
    bugunIso,
  })
}
