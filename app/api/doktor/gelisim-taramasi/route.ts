/**
 * NOTYA-GELISIM-01 — Gelişim taraması (GİDR) kayıt + AI yorumu.
 * "Denver II" değil; sabit skor ÜRETMEZ. AI'nin rolü: doktorun işaretlediği yapıyor/yapmıyor
 * paternini SOAP-stili bir yoruma çevirmek ve gerekiyorsa sevk önerisi sunmak — Kaan'ın
 * açık talimatı (2026-09-14): "never output a fake Denver II score".
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { ayFarki } from '@/lib/clinical/buyumeEgrisi'
import { gidrBasamakBul, GELISIM_ALAN_BASLIK, type GelisimYaniti } from '@/lib/clinical/gelisimTaramasi'
import { pseudonymize, restoreDeep, assertNoTckn } from '@/lib/security/pseudonymize'
import { groqChat } from '@/lib/dr-ayse/groq'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'

export const dynamic = 'force-dynamic'

function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId zorunludur.' }, { status: 400 })

  const { data, error } = await supabase
    .from('gelisim_taramalari').select('id, ay_yas, yas_basamak_etiket, ai_yorum, sevk_onerisi, created_at')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hastanın yaşına göre uygulanacak basamağı da döndür (istemci soruları göstermek için)
  const { data: hasta } = await supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  const dogumIso = guvenliCoz(hasta?.dob_encrypted) || null
  const mevcutYasAy = dogumIso ? ayFarki(dogumIso) : null
  const basamak = mevcutYasAy !== null ? gidrBasamakBul(mevcutYasAy) : null

  return NextResponse.json({ taramalar: data || [], mevcutYasAy, basamak })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const { supabase, doktorId } = oturum

  const body = await req.json().catch(() => ({})) as { patientId?: string; yanitlar?: GelisimYaniti[]; muayeneFormunaEkle?: boolean }
  const { patientId, yanitlar, muayeneFormunaEkle } = body
  if (!patientId || !yanitlar?.length) return NextResponse.json({ error: 'patientId ve yanıtlar zorunludur.' }, { status: 400 })

  const { data: hasta } = await supabase.from('patients').select('dob_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  const dogumIso = guvenliCoz(hasta?.dob_encrypted) || null
  const ayYas = dogumIso ? ayFarki(dogumIso) : null
  const basamak = ayYas !== null ? gidrBasamakBul(ayYas) : null
  const etiket = basamak?.etiket || 'bilinmiyor'

  const yapamadiklari = yanitlar.filter((y) => !y.yapiyor)
  const yapabildikleri = yanitlar.filter((y) => y.yapiyor)

  const sistemPrompt = `Sen bir pediatri uzmanısın. T.C. Sağlık Bakanlığı'nın Gelişimi İzleme ve Değerlendirme Rehberi'ne (GİDR) göre yapılan bir gelişim taramasının sonuçlarını yorumluyorsun.
KESİN KURAL: SAYISAL BİR SKOR ("Denver skoru", "gelişim puanı" gibi) ASLA ÜRETME — bu araçta öyle bir skor yok. Yalnız hangi alanlarda gecikme görüldüğünü, bunun klinik önemini ve gerekip gerekmediğini SOAP diline uygun, doktorun muayene notuna doğrudan eklenebilecek kısa (2-4 cümle) bir metinle özetle.
Yalnız JSON döndür: {"yorum":"...","sevkOnerisi":true|false}
"yorum": muayene notuna eklenecek metin — "GİDR ile gelişim tarandı, [yaş basamağı] için beklenen [alanlarda] gecikme/uyum saptandı" tarzında, hastaya değil doktora yazılan tıbbi dil.
"sevkOnerisi": birden fazla alanda ya da klinik açıdan önemli bir alanda (dil, ilişki) belirgin gecikme varsa true; yaşına uygun gelişim gösteriyorsa false.`
  const kullaniciMesaji = `Yaş basamağı: ${etiket}
Yapabildikleri (${yapabildikleri.length}): ${yapabildikleri.map((y) => `[${GELISIM_ALAN_BASLIK[y.alan]}] ${y.madde}`).join('; ') || 'yok'}
Yapamadıkları (${yapamadiklari.length}): ${yapamadiklari.map((y) => `[${GELISIM_ALAN_BASLIK[y.alan]}] ${y.madde}`).join('; ') || 'yok'}`

  const { text: guvenliMesaj, map } = pseudonymize(kullaniciMesaji)
  assertNoTckn(guvenliMesaj, 'gelisim-taramasi')

  let yorum = ''
  let sevkOnerisi = yapamadiklari.length >= 2
  try {
    const raw = await groqChat(
      [{ role: 'system', content: sistemPrompt }, { role: 'user', content: guvenliMesaj }],
      { temperature: 0.2, jsonMode: true, maxTokens: 600 }
    )
    const temiz = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = restoreDeep(JSON.parse(temiz), map) as { yorum?: string; sevkOnerisi?: boolean }
    if (parsed.yorum) yorum = parsed.yorum
    if (typeof parsed.sevkOnerisi === 'boolean') sevkOnerisi = parsed.sevkOnerisi
  } catch (e) {
    console.error('[gelisim-taramasi] AI yorum başarısız:', e)
    // Deterministik yedek — AI olmadan da doktor sonuçsuz kalmasın
    yorum = yapamadiklari.length === 0
      ? `GİDR ile gelişim tarandı (${etiket}), tüm alanlarda yaşına uygun.`
      : `GİDR ile gelişim tarandı (${etiket}); ${yapamadiklari.map((y) => GELISIM_ALAN_BASLIK[y.alan]).filter((v, i, a) => a.indexOf(v) === i).join(', ')} alan(lar)ında beklenen işlevlerde gecikme saptandı.`
  }

  const { data: kayit, error } = await supabase.from('gelisim_taramalari').insert({
    patient_id: patientId, doctor_id: doktorId, ay_yas: ayYas ?? 0, yas_basamak_etiket: etiket,
    yanitlar, ai_yorum: yorum, sevk_onerisi: sevkOnerisi,
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let notEkleme = null
  if (muayeneFormunaEkle) {
    notEkleme = await gununNotunaEkle(supabase, doktorId, patientId, yorum)
    if (notEkleme.notId) {
      await supabase.from('gelisim_taramalari').update({ not_id: notEkleme.notId }).eq('id', kayit.id).then(() => {}, () => {})
    }
  }

  return NextResponse.json({ taramaId: kayit.id, yorum, sevkOnerisi, etiket, notEkleme })
}
