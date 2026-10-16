/**
 * MUAYENE-EKLERI-01 — rota ön koşulları (bayrak + oturum + sahiplik). Tüm muayene-ekleri rotaları aynı kapıdan geçer.
 * Bayrak kapalıysa 404 (özellik yokmuş gibi); istemci bunu "eski akış" olarak yorumlar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { muayeneEkleriAcikMi } from './bayrak'
import { baglamYukle, type EkBaglam } from './sunucu'

export type OnKosul = { hata: NextResponse } | { baglam: EkBaglam; doktorId: string }

export async function ekRotaOnKosul(req: NextRequest, sessionId: unknown, belgeId: unknown): Promise<OnKosul> {
  if (!muayeneEkleriAcikMi()) return { hata: NextResponse.json({ error: 'Kapalı.' }, { status: 404 }) }
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return { hata: oturum.hata }
  const yasak = sadeceDoktor(oturum)
  if (yasak) return { hata: yasak }
  if (typeof sessionId !== 'string' || typeof belgeId !== 'string' || !sessionId || !belgeId) {
    return { hata: NextResponse.json({ error: 'sessionId ve belgeId zorunludur.' }, { status: 400 }) }
  }
  const baglam = await baglamYukle(oturum.supabase, oturum.doktorId, sessionId, belgeId)
  if (!baglam) return { hata: NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 }) }
  return { baglam, doktorId: oturum.doktorId }
}
