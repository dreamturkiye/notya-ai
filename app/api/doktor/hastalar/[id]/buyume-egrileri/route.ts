/**
 * NOTYA-BUYUME-EGRISI-02 — Büyüme Eğrileri sekmesi verisi (Kaan 2026-09-14).
 * Neyzi standart persentil çizgileri (lib/clinical/buyumeEgrisi.ts) + hastanın kendi
 * ölçümleri (onaylı notların vitaller alanından, muayene tarihindeki yaşıyla) aynı payload'ta.
 * Türetilmiş veri — saklanmaz, her açılışta yeniden hesaplanır (notlar değişirse otomatik günceldir).
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { persentilEgrileri, ayFarki, type Cinsiyet } from '@/lib/clinical/buyumeEgrisi'
import { cmCoz, kiloCoz } from '@/lib/clinical/olcumCoz'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'

export const dynamic = 'force-dynamic'

function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}
function sayi(x: unknown, tur: 'kilo' | 'cm'): number | null {
  if (x == null || x === '') return null
  return tur === 'kilo' ? kiloCoz(x as string | number) : cmCoz(x as string | number)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const { id: patientId } = await params

  const { data: hasta } = await supabase.from('patients').select('id, dob_encrypted, gender_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const dogumIso = guvenliCoz(hasta.dob_encrypted) || null
  const cinsiyetHam = guvenliCoz(hasta.gender_encrypted)
  const cinsiyet: Cinsiyet | null = cinsiyetHam === 'male' || cinsiyetHam === 'female' ? (cinsiyetHam as Cinsiyet) : null
  if (!dogumIso || !cinsiyet) {
    return NextResponse.json({ dogumBilinmiyor: true, mevcutYasAy: null, cinsiyet: null, parametreler: {} })
  }

  const mevcutYasAy = ayFarki(dogumIso) ?? 0

  // Onaylı notlardan vitaller + tarih — hastanın kendi büyüme noktaları
  // NOTYA-ARSIV-01: arşivlenmiş muayenenin ölçümü eğriye nokta olarak girmez.
  const { data: notlar } = await arsivsizNotlar(supabase, 'created_at, vitaller, sessions!inner(patient_id)')
    .eq('sessions.patient_id', patientId).not('approved_at', 'is', null).not('vitaller', 'is', null)
    .order('created_at', { ascending: true }).limit(200)

  const noktalar: Record<'kilo' | 'boy' | 'basCevresi' | 'vki', { ay: number; deger: number; tarih: string }[]> = { kilo: [], boy: [], basCevresi: [], vki: [] }
  for (const n of (notlar || []) as { created_at: string; vitaller: unknown }[]) {
    const ay = ayFarki(dogumIso, n.created_at)
    if (ay === null) continue
    const v = (n.vitaller || {}) as Record<string, unknown>
    const kilo = sayi(v.kilo, 'kilo'), boy = sayi(v.boy, 'cm'), bas = sayi(v.basCevresi, 'cm')
    if (kilo != null) noktalar.kilo.push({ ay, deger: kilo, tarih: n.created_at })
    if (boy != null) noktalar.boy.push({ ay, deger: boy, tarih: n.created_at })
    if (bas != null) noktalar.basCevresi.push({ ay, deger: bas, tarih: n.created_at })
    if (kilo != null && boy != null && ay >= 24) {
      const vki = Math.round((kilo / Math.pow(boy / 100, 2)) * 100) / 100
      noktalar.vki.push({ ay, deger: vki, tarih: n.created_at })
    }
  }

  const tampon = 6 // eğri, hastanın yaşının biraz ötesine kadar çizilsin
  const ustSinir = Math.max(24, mevcutYasAy + tampon)

  const parametreler = {
    kilo: { birim: 'kg', egriler: persentilEgrileri('kilo', cinsiyet, ustSinir), noktalar: noktalar.kilo },
    boy: { birim: 'cm', egriler: persentilEgrileri('boy', cinsiyet, ustSinir), noktalar: noktalar.boy },
    basCevresi: { birim: 'cm', egriler: persentilEgrileri('basCevresi', cinsiyet, ustSinir), noktalar: noktalar.basCevresi },
    // VKİ eğrisi yalnız 2 yaş ve üzeri anlamlıdır (Kaan 2026-09-14)
    vki: mevcutYasAy >= 24 || noktalar.vki.length > 0
      ? { birim: 'kg/m²', egriler: persentilEgrileri('vki', cinsiyet, ustSinir).map((s) => ({ ...s, noktalar: s.noktalar.filter((n) => n.ay >= 24) })), noktalar: noktalar.vki }
      : null,
  }

  return NextResponse.json({ dogumBilinmiyor: false, mevcutYasAy, cinsiyet, parametreler })
}
