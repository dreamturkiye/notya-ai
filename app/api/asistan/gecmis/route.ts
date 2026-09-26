/**
 * NOTYA-ASISTAN-AKICI-01 (Kaan, 2026-09-26) — Asistana sor'a dönünce sohbet sıfırlanmasın.
 * Sohbet geçmişi zaten asistan_actions'ta kayıtlı (öğrenme günlüğü); bu uç son alışverişleri
 * doktora geri verir, sayfa açılışında balonlar yeniden çizilir. Yeni tablo yok, yalnız okuma.
 * Yetki: yalnız doktorun kendi kayıtları (doctor_id = oturum sahibi).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const { data, error } = await supabase
    .from('asistan_actions')
    .select('input_text, ai_response, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return NextResponse.json({ mesajlar: [] })
  const mesajlar = (data || []).reverse().flatMap((k, i) => {
    const cikti: { rol: 'doktor' | 'asistan'; metin: string; zaman: string }[] = []
    if (k.input_text) cikti.push({ rol: 'doktor', metin: String(k.input_text), zaman: k.created_at })
    if (k.ai_response) cikti.push({ rol: 'asistan', metin: String(k.ai_response), zaman: k.created_at })
    return cikti
  })
  return NextResponse.json({ mesajlar })
}
