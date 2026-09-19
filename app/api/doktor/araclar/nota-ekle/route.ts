/**
 * ARACLAR-CILA-01 Faz 2 — POST /api/doktor/araclar/nota-ekle
 * "Bugünkü muayene formuna ekle": her Doktor Aracının ortak, TEK yolu.
 *
 * Yeni bir mekanizma icat edilmedi — M-CHAT-R/F, gelişim taraması ve /api/doktor/pediatri/tarama
 * ile AYNI yazma yolu kullanılır (lib/doktor/gununNotunaEkle). Metni lib/doktor/aracNotu kurar.
 *
 * HASTA-IZOLASYON-01: gövdedeki patientId saldırgan kontrolündedir — hastaSahibiMi() ile hekimin
 * kendi hastası olduğu doğrulanmadan HİÇBİR okuma/yazma yapılmaz; yabancı kimlik 404 (yok) döner.
 *
 * Hekim kilidi: yalnız hekim düğmeye bastığında çağrılır; sunucu kendiliğinden hiçbir şey yazmaz.
 * Yanıt şekli lib/doktor/muayeneFormuYolu.eklenenNotId'nin "düz şekli"dir: { ok, notId }.
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aracNotBlogu, aracNotuBugun, ARAC_NOT_ALANLARI, type AracNotAlani } from '@/lib/doktor/aracNotu'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase } = oturum

  const govde = (await req.json().catch(() => null)) as
    | { patientId?: string; arac?: string; satirlar?: unknown; alan?: string }
    | null

  const patientId = String(govde?.patientId || '')
  // HASTA-IZOLASYON: kimlik önce hekimin kendi hastası olarak doğrulanır — yabancı kimlik = yok (404).
  if (!(await hastaSahibiMi(supabase, user.id, patientId))) {
    return NextResponse.json({ ok: false, error: 'Hasta bulunamadı.' }, { status: 404 })
  }

  const blok = aracNotBlogu(govde?.arac, govde?.satirlar, aracNotuBugun())
  if (!blok) return NextResponse.json({ ok: false, error: 'Eklenecek bir sonuç yok.' }, { status: 400 })

  const alan = (ARAC_NOT_ALANLARI as readonly string[]).includes(String(govde?.alan))
    ? (govde!.alan as AracNotAlani)
    : 'content_degerlendirme'

  const sonuc = await gununNotunaEkle(supabase, user.id, patientId, blok, alan)
  if (!sonuc.eklendi) {
    return NextResponse.json({ ok: false, error: sonuc.sebep || 'Bugünkü muayene formu bulunamadı.' }, { status: 200 })
  }
  return NextResponse.json({ ok: true, notId: sonuc.notId })
}
