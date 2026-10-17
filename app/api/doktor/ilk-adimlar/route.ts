/**
 * YENI-DOKTOR-UX-2026-10 — İlk adımlar (first-run checklist) verisi, tek istekte.
 *
 * Ana Sayfa'daki kurulum kartı bu uçtan beslenir: hangi adımlar tamam, hesap "yeni" mi.
 * hasta-izolasyon: Hiçbir hasta-türevi kimlik dışarıdan GELMEZ; tüm sayımlar yalnız
 * kimliği doğrulanmış doktora (.eq doctor_id / doktor_id) kapsanır ve yalnız SAYI döner —
 * satır içeriği, ad, kimlik dönmez. Sekreter/asistan rolleri bu kartı görmez (sadeceDoktor).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { yeniHesapMi, type IlkAdimlar } from '@/lib/doktor/ilkAdimlar'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const yasak = sadeceDoktor(oturum)
  if (yasak) return yasak
  const { supabase, doktorId } = oturum

  const [profil, hasta, randevu, not, katalog] = await Promise.all([
    supabase
      .from('users')
      .select('specialty, iletisim_whatsapp, iletisim_eposta')
      .eq('id', doktorId)
      .maybeSingle(),
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId),
    supabase.from('randevular').select('id', { count: 'exact', head: true }).eq('doktor_id', doktorId),
    // NOTYA-ARSIV-01: an archived (mistaken) muayene does not count as the first visit.
    arsivsizNotlar(supabase, 'id', { count: 'exact', head: true }).eq('doctor_id', doktorId),
    supabase.from('accounting_services').select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId),
  ])

  // Sayım hatası (ör. tablo henüz yok) adımı "tamamlanmamış" DEĞİL "tamamlanmış" sayar:
  // kart kolaylıktır — belirsizlikte doktoru dürtmek yerine susar.
  const sayi = (r: { count: number | null; error: unknown }): number =>
    r.error ? Number.MAX_SAFE_INTEGER : Number(r.count ?? 0)

  const notSayisi = not.error ? Number.MAX_SAFE_INTEGER : Number(not.count ?? 0)
  const u = (profil.data || {}) as { specialty?: string | null; iletisim_whatsapp?: string | null; iletisim_eposta?: string | null }

  const adimlar: IlkAdimlar = {
    profil: Boolean(String(u.specialty || '').trim()),
    hasta: sayi(hasta) > 0,
    randevu: sayi(randevu) > 0,
    muayene: notSayisi > 0,
    katalog: sayi(katalog) > 0,
    iletisim: Boolean(String(u.iletisim_whatsapp || '').trim() || String(u.iletisim_eposta || '').trim()),
  }

  return NextResponse.json({ adimlar, yeniHesap: yeniHesapMi(notSayisi) })
}
