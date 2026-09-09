/**
 * NOTYA-MEDULA — GET: nota bağlı onaylı reçeteyi Medula'ya hazır taslak olarak döndürür (P1).
 *                POST {noteId, test:true}: yalnız MEDULA_ORTAM=test iken SGK test ortamına imzasız
 *                ereceteGiris sözleşme denemesi (P3 transport kanıtı; sentetik kimlikler, gerçek TC yok).
 * Notya hastanın TC'sini tutmaz; gerçek gönderim (P3) doktorun e-imzasıyla cihazında yapılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { medulaTaslagiHazirla, ereceteXml } from '@/lib/medula/receteHazirla'
import { medulaOrtami, ereceteGiris } from '@/lib/medula/soapIstemci'
import { TEST_ORTAMI, SGK_BRANS_KODU } from '@/lib/medula/tipler'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function coz(v: string | null | undefined): string { if (!v) return ''; try { return decrypt(v) } catch { return '' } }

async function taslakUret(supabase: ReturnType<typeof Object>, doktorId: string, noteId: string) {
  const sb = supabase as any
  const { data: not } = await sb.from('notes').select('id, icd10_codes, created_at, sessions!inner(patient_id)').eq('id', noteId).eq('doctor_id', doktorId).maybeSingle()
  if (!not) return null
  const pid = Array.isArray(not.sessions) ? not.sessions[0]?.patient_id : not.sessions?.patient_id
  const [{ data: ilaclar }, { data: hasta }, { data: doktor }] = await Promise.all([
    sb.from('hasta_ilaclar').select('ilac_adi, etken_madde, doz, kullanim_sikli, notlar, baslangic_tarihi, bitis_tarihi').eq('kaynak_note_id', noteId).eq('onay_durumu', 'onayli'),
    pid ? sb.from('patients').select('name_encrypted, dob_encrypted, gender_encrypted').eq('id', pid).maybeSingle() : Promise.resolve({ data: null }),
    sb.from('users').select('first_name, last_name, specialty').eq('id', doktorId).maybeSingle(),
  ])
  let ad = '', soyad = ''
  try { const n = JSON.parse(coz(hasta?.name_encrypted)); ad = n.ad || ''; soyad = n.soyad || '' } catch { /* ad yok */ }
  const cins = coz(hasta?.gender_encrypted)
  const kodlar = Array.isArray(not.icd10_codes) ? not.icd10_codes : []
  return medulaTaslagiHazirla({
    ilaclar: ilaclar || [],
    tanilar: kodlar,
    hasta: { ad, soyad, dogumTarihi: coz(hasta?.dob_encrypted) || null, cinsiyet: cins === 'male' || cins === 'female' ? cins : null },
    doktor: { ad: doktor?.first_name || '', soyad: doktor?.last_name || '', bransKodu: doktor?.specialty === 'pediatri' ? SGK_BRANS_KODU['cocuk-sagligi'] : null },
    protokolNo: `NOTYA-${String(noteId).slice(0, 8).toUpperCase()}`,
    receteTarihi: new Date(not.created_at),
  })
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  const noteId = new URL(req.url).searchParams.get('noteId')
  if (!noteId) return NextResponse.json({ error: 'noteId zorunludur.' }, { status: 400 })
  const t = await taslakUret(oturum.supabase, oturum.doktorId, noteId)
  if (!t) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })
  return NextResponse.json({ metin: t.metin, uyarilar: t.uyarilar, eksikler: t.eksikler, satirlar: t.satirlar, xml: ereceteXml(t.erecete), ortam: medulaOrtami() })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const engel = sadeceDoktor(oturum)
  if (engel) return engel
  if (medulaOrtami() !== 'test') return NextResponse.json({ error: 'Medula gönderimi bu ortamda kapalı (MEDULA_ORTAM=test değil).' }, { status: 403 })
  const body = await req.json().catch(() => ({})) as { noteId?: string }
  if (!body.noteId) return NextResponse.json({ error: 'noteId zorunludur.' }, { status: 400 })
  const t = await taslakUret(oturum.supabase, oturum.doktorId, body.noteId)
  if (!t) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 })
  t.erecete.tcKimlikNo = TEST_ORTAMI.hastaTc
  const sonuc = await ereceteGiris('test', { kullanici: TEST_ORTAMI.kullanici, sifre: TEST_ORTAMI.sifre, tesisKodu: TEST_ORTAMI.tesisKodu, doktorTc: TEST_ORTAMI.doktorTc }, t.erecete)
  return NextResponse.json({ ortam: 'test', sonucKodu: sonuc.sonucKodu, sonucMesaji: sonuc.sonucMesaji, uyariMesaji: sonuc.uyariMesaji, ereceteNo: sonuc.ereceteNo })
}
