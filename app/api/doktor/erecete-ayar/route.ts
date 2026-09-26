/**
 * NOTYA-ERECETE-01 — e-Reçete ayarları API.
 * GET  → maskeli görünüm (TC maskeli, şifre var/yok, eksikler, son test, hazır mı)
 * PUT  {tesisKodu?, bransKodu?, doktorTc?, sifre?, ortam?, imzaYontemi?} → kaydet (şifre/TC yalnız verilirse değişir)
 * POST {islem:'test'} → gerçek ortamda salt-okunur ereceteSorgula('0') ile kimlik doğrulama; sonuç ayara yazılır.
 * Şifre ve TC sunucudan hiçbir zaman açık dönmez; e-imza PIN'i hiç geçmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { ayarBirlestir, ayarGoruntu, girdiDogrula, kimlikCoz, testSonucuYorumla, type EReceteAyar, type EReceteAyarGirdi } from '@/lib/medula/ayar'
import { ereceteSorgula } from '@/lib/medula/soapIstemci'
import { BRANS_SGK } from '@/lib/medula/brans'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function ayarOku(sb: { from: (t: string) => any }, doktorId: string): Promise<{ ayar: EReceteAyar | null; specialty: string }> {
  const { data } = await sb.from('users').select('erecete_ayar, specialty').eq('id', doktorId).maybeSingle()
  const a = data?.erecete_ayar
  return { ayar: a && typeof a === 'object' ? (a as EReceteAyar) : null, specialty: String(data?.specialty || '') }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { ayar, specialty } = await ayarOku(oturum.supabase, oturum.doktorId)
  const g = ayarGoruntu(ayar)
  return NextResponse.json({ ayar: g, varsayilanBransKodu: BRANS_SGK[specialty] ?? null, brans: specialty })
}

export async function PUT(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const body = await req.json().catch(() => ({})) as EReceteAyarGirdi
  const hatalar = girdiDogrula(body)
  if (hatalar.length) return NextResponse.json({ error: hatalar.join(' ') }, { status: 400 })
  const { ayar } = await ayarOku(oturum.supabase, oturum.doktorId)
  const yeni = ayarBirlestir(ayar, body)
  const { error } = await oturum.supabase.from('users').update({ erecete_ayar: yeni }).eq('id', oturum.doktorId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ayar: ayarGoruntu(yeni) })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const body = await req.json().catch(() => ({})) as { islem?: string }
  if (body.islem !== 'test') return NextResponse.json({ error: 'Geçersiz işlem: yalnızca test bağlantısı yapılabilir.' }, { status: 400 })
  const { ayar } = await ayarOku(oturum.supabase, oturum.doktorId)
  const kimlik = kimlikCoz(ayar)
  if (!kimlik) return NextResponse.json({ error: 'Önce TC, hekim şifresi ve tesis kodunu kaydedin.' }, { status: 400 })
  const ortam = ayar?.ortam === 'test' ? 'test' : 'gercek'
  let yorum: { durum: 'baglandi' | 'kimlik_hatali' | 'hata'; mesaj: string }
  try {
    const s = await ereceteSorgula(ortam, kimlik, '0') // salt-okunur: kayıt açmaz, imza istemez
    yorum = testSonucuYorumla(s)
  } catch (e) {
    yorum = { durum: 'hata', mesaj: `SGK'ya ulaşılamadı: ${e instanceof Error ? e.message : String(e)}` }
  }
  const yeni: EReceteAyar = { ...(ayar || {}), sonTest: { tarih: new Date().toISOString(), ...yorum } }
  await oturum.supabase.from('users').update({ erecete_ayar: yeni }).eq('id', oturum.doktorId)
  return NextResponse.json({ ortam, ...yorum, ayar: ayarGoruntu(yeni) })
}
