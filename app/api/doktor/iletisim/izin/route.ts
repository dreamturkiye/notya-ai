/**
 * NOTYA-ILETISIM-01 — patient contact consent (KVKK açık rıza, randevu + bilgilendirme messages).
 *
 * GET  ?patientId → { whatsapp, eposta, guncelleme, kaydedilebilir, telefon, gelenBelge, gelenBelgeKaydedilebilir } (null = unknown)
 * POST { patientId, kanal, izin: boolean, kaynak: 'hasta_profili' | 'gonder_dugmesi' } → sets the current value on
 *      patients and appends a history row (who: the logged-in user + personel row, when: now).
 *
 * Doctor and secretary (the secretary marks consent the patient gave at the desk; the history says it was them).
 * The intake form writes consent itself (app/api/intake/[token], kaynak 'bilgi_formu').
 * HASTA-IZOLASYON-01: hastaSahibiMi before any read or write; updates carry id AND doctor_id.
 * Before migration 095: GET → unknown + kaydedilebilir false; POST → 503 with a plain sentence.
 *
 * NOTYA-GELEN-BELGELER: a third consent, kanal 'gelen_belge' — "Gönderdiği belgeler, fotoğraflar ve sesli mesajlar
 * dosyasına eklenebilir" (patients.gelen_belge_izni, migration 099). Read separately so the two contact consents keep
 * working before 099: GET → gelenBelge null + gelenBelgeKaydedilebilir false; POST → 503.
 */
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { kanalMi } from '@/lib/iletisim/tipler'
import { decrypt } from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'

const HAZIR_DEGIL = 'İletişim izni şu an kaydedilemiyor. Lütfen biraz sonra yeniden deneyin.'

async function gelenBelgeIzni(supabase: SupabaseClient, doktorId: string, patientId: string) {
  const { data, error } = await supabase.from('patients').select('gelen_belge_izni').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (error) return { gelenBelge: null, gelenBelgeKaydedilebilir: false }
  return { gelenBelge: typeof data?.gelen_belge_izni === 'boolean' ? data.gelen_belge_izni : null, gelenBelgeKaydedilebilir: true }
}

export async function GET(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
  // NOTYA-BETA-0925: randevu penceresi "Cep telefonu"nu hasta kaydından doldurur (sekreter de) — yalnız bu
  // pratiğin hastası (hastaSahibiMi yukarıda), şifre sunucuda çözülür.
  const { data: tel } = await supabase.from('patients')
    .select('phone_encrypted').eq('id', String(patientId)).eq('doctor_id', doktorId).maybeSingle()
  let telefon = ''
  try { telefon = tel?.phone_encrypted ? decrypt(String(tel.phone_encrypted)) : '' } catch { telefon = '' }
  const [{ data, error }, gelen] = await Promise.all([
    supabase.from('patients')
      .select('iletisim_izni_whatsapp, iletisim_izni_eposta, iletisim_izni_guncelleme')
      .eq('id', String(patientId)).eq('doctor_id', doktorId).maybeSingle(),
    gelenBelgeIzni(supabase, doktorId, String(patientId)),
  ])
  if (error) return NextResponse.json({ whatsapp: null, eposta: null, guncelleme: null, kaydedilebilir: false, telefon, ...gelen })
  const deger = (v: unknown) => (typeof v === 'boolean' ? v : null)
  return NextResponse.json({
    whatsapp: deger(data?.iletisim_izni_whatsapp),
    eposta: deger(data?.iletisim_izni_eposta),
    guncelleme: data?.iletisim_izni_guncelleme ?? null,
    kaydedilebilir: true,
    telefon,
    ...gelen,
  })
}

export async function POST(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { supabase, doktorId, rol, user, personelId } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const patientId = typeof b?.patientId === 'string' ? b.patientId : ''
  const kanal = b?.kanal
  const gelenBelge = kanal === 'gelen_belge'
  const izin = b?.izin
  const kaynak = b?.kaynak === 'hasta_profili' ? 'hasta_profili' : 'gonder_dugmesi'
  if (!patientId || !(kanalMi(kanal) || gelenBelge) || typeof izin !== 'boolean') return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 })
  if (!(await hastaSahibiMi(supabase, doktorId, patientId))) return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })

  const simdi = new Date().toISOString()
  const guncelleme = gelenBelge
    ? { gelen_belge_izni: izin, gelen_belge_izni_guncelleme: simdi, gelen_belge_izni_guncelleyen: user.id }
    : { [kanal === 'whatsapp' ? 'iletisim_izni_whatsapp' : 'iletisim_izni_eposta']: izin, iletisim_izni_guncelleme: simdi, iletisim_izni_guncelleyen: user.id }
  const { error } = await supabase.from('patients')
    .update(guncelleme)
    .eq('id', patientId).eq('doctor_id', doktorId)
  if (error) return NextResponse.json({ error: HAZIR_DEGIL }, { status: 503 })

  await supabase.from('iletisim_izin_kayitlari').insert({
    doctor_id: doktorId,
    patient_id: patientId,
    kanal,
    izin,
    kaynak,
    kaydeden_user_id: user.id,
    kaydeden_personel_id: rol === 'sekreter' ? personelId ?? null : null,
  })
  return NextResponse.json({ ok: true, kanal, izin, guncelleme: simdi })
}
