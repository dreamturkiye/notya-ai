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

// Kaan (2026-09-10): 30 branş — SGK kodu kılavuzda doğrulanmış olanlar; diğerleri null → Medula'da doktor seçer
const BRANS_SGK: Record<string, number> = {
  pediatri: SGK_BRANS_KODU['cocuk-sagligi'],
  'aile-hekimligi': SGK_BRANS_KODU['aile-hekimligi'],
  dermatoloji: SGK_BRANS_KODU['deri-zuhrevi'],
  psikiyatri: SGK_BRANS_KODU['ruh-sagligi'],
  'enfeksiyon-hastaliklari': SGK_BRANS_KODU['enfeksiyon'],
}

async function taslakUret(supabase: ReturnType<typeof Object>, doktorId: string, noteId: string) {
  const sb = supabase as any
  const { data: not } = await sb.from('notes').select('id, icd10_codes, created_at, approved_at, content_ilaclar, recete_onerisi, sessions!inner(patient_id)').eq('id', noteId).eq('doctor_id', doktorId).maybeSingle()
  if (!not) return null
  const pid = Array.isArray(not.sessions) ? not.sessions[0]?.patient_id : not.sessions?.patient_id
  const [{ data: ilaclar }, { data: hasta }, { data: doktor }] = await Promise.all([
    sb.from('hasta_ilaclar').select('ilac_adi, etken_madde, doz, kullanim_sikli, notlar, baslangic_tarihi, bitis_tarihi').eq('kaynak_note_id', noteId).eq('onay_durumu', 'onayli'),
    pid ? sb.from('patients').select('name_encrypted, dob_encrypted, gender_encrypted').eq('id', pid).maybeSingle() : Promise.resolve({ data: null }),
    sb.from('users').select('first_name, last_name, full_name, specialty, title, clinic_name, recete_baslik').eq('id', doktorId).maybeSingle(),
  ])
  // Kaan (2026-09-10): not henüz onaylanmadıysa ilaç satırları hasta_ilaclar'da yoktur → nottaki
  // reçete taslağını (content_ilaclar + recete_onerisi) göster; onaylanınca gerçek satırlar gelir.
  const onayli = !!not.approved_at && Array.isArray(ilaclar) && ilaclar.length > 0
  let ilacKaynagi: typeof ilaclar = ilaclar || []
  let taslakMi = false
  if (!onayli) {
    const { nottanIlaclariCikar } = await import('@/lib/doktor/receteAktarim')
    const cikan = nottanIlaclariCikar({ content_ilaclar: not.content_ilaclar, recete_onerisi: not.recete_onerisi })
    if (cikan.length) { ilacKaynagi = cikan.map((c) => ({ ilac_adi: c.ilac_adi, etken_madde: c.etken_madde, doz: c.doz, kullanim_sikli: c.kullanim_sikli, notlar: c.notlar, baslangic_tarihi: null, bitis_tarihi: null })); taslakMi = true }
  }
  let ad = '', soyad = ''
  try { const n = JSON.parse(coz(hasta?.name_encrypted)); ad = n.ad || ''; soyad = n.soyad || '' } catch { /* ad yok */ }
  const cins = coz(hasta?.gender_encrypted)
  const kodlar = Array.isArray(not.icd10_codes) ? not.icd10_codes : []
  const taslak = medulaTaslagiHazirla({
    ilaclar: ilacKaynagi,
    tanilar: kodlar,
    hasta: { ad, soyad, dogumTarihi: coz(hasta?.dob_encrypted) || null, cinsiyet: cins === 'male' || cins === 'female' ? cins : null },
    doktor: { ad: doktor?.first_name || '', soyad: doktor?.last_name || '', bransKodu: BRANS_SGK[String(doktor?.specialty || '')] ?? null },
    protokolNo: `NOTYA-${String(noteId).slice(0, 8).toUpperCase()}`,
    receteTarihi: new Date(not.created_at),
  })
  // Kâğıt reçete başlığı için (NOTYA-MEDULA P1b)
  const UNVAN = /^(?:prof|doç|doc|uzm|op|dr|dt)\.?$/i
  const adSoyad = `${doktor?.first_name || ''} ${doktor?.last_name || ''}`.trim()
    || String(doktor?.full_name || '').trim().split(/\s+/).filter((x: string) => !UNVAN.test(x)).join(' ')
  const rb = (doktor?.recete_baslik && typeof doktor.recete_baslik === 'object' ? doktor.recete_baslik : {}) as { satirlar?: string[]; diplomaNo?: string; logoDataUrl?: string }
  const baslik = {
    doktor: { unvan: doktor?.title || 'Dr.', ad: adSoyad, brans: doktor?.specialty || '', klinik: doktor?.clinic_name || '' },
    ozel: { satirlar: Array.isArray(rb.satirlar) ? rb.satirlar.map(String) : [], diplomaNo: String(rb.diplomaNo || ''), logoDataUrl: String(rb.logoDataUrl || '') },
    taslakMi,
    hasta: { ad: `${ad} ${soyad}`.trim(), dogum: coz(hasta?.dob_encrypted) || null, cinsiyet: cins || null },
    tarih: not.created_at,
  }
  return { ...taslak, baslik }
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
  return NextResponse.json({ metin: t.metin, uyarilar: t.uyarilar, eksikler: t.eksikler, satirlar: t.satirlar, tanilar: t.erecete.ereceteTaniBilgisi, baslik: t.baslik, xml: ereceteXml(t.erecete), ortam: medulaOrtami() })
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
